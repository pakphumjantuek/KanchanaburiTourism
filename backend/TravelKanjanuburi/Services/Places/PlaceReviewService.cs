using TravelKanjanuburi.Model.MPlaces;
using TravelKanjanuburi.Model.MPlaces.Reviews;

namespace TravelKanjanuburi.Services.Places
{
    public class PlaceReviewService
    {
        private readonly ApplicationDbContext _db;
        private readonly IMapper _mapper;

        public PlaceReviewService(ApplicationDbContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }

        // 1) รีวิวของฉันในสถานที่นั้น
        public async Task<PlaceReviewDto?> GetMyReviewAsync(int placeId, int userId, CancellationToken ct = default)
        {
            var entity = await _db.PlaceReviews
                .AsNoTracking()
               .Include(r => r.User) 
                .FirstOrDefaultAsync(r => r.PlaceId == placeId && r.UserId == userId && !r.IsDeleted, ct);

            return entity == null ? null : _mapper.Map<PlaceReviewDto>(entity);
        }

        // 2) ดึงรีวิวของสถานที่ (pagination)
        public async Task<List<PlaceReviewDto>> GetByPlaceIdAsync(
            int placeId,
            int skip = 0,
            int take = 20,
            CancellationToken ct = default)
        {
            if (take <= 0) take = 20;
            if (take > 100) take = 100;
            if (skip < 0) skip = 0;

            var entities = await _db.PlaceReviews
                .AsNoTracking()
                .Include(r => r.User)
                .Where(r => r.PlaceId == placeId && !r.IsDeleted)
                .OrderByDescending(r => r.CreatedAt)
                .Skip(skip)
                .Take(take)
                .ToListAsync(ct);

            return _mapper.Map<List<PlaceReviewDto>>(entities);
        }

        // 3) Add/Update รีวิว (1 user ต่อ 1 place)
        public async Task<PlaceReviewDto> AddOrUpdateAsync(
            int placeId,
            int userId,
            int rating,
            string? comment,
            CancellationToken ct = default)
        {
            if (rating < 1 || rating > 5)
                throw new ArgumentOutOfRangeException(nameof(rating), "Rating must be between 1 and 5.");

            var place = await _db.Places.FirstOrDefaultAsync(p => p.PlaceId == placeId && p.IsActive, ct);
            if (place == null)
                throw new KeyNotFoundException("Place not found.");

            if (place.OwnerId == userId)
                throw new UnauthorizedAccessException("เจ้าของสถานที่รีวิวสถานที่ของตัวเองไม่ได้");

            var review = await _db.PlaceReviews
                .FirstOrDefaultAsync(r => r.PlaceId == placeId && r.UserId == userId, ct);

            if (review == null)
            {
                review = new PlaceReview
                {
                    PlaceId = placeId,
                    UserId = userId,
                    Rating = rating,
                    Comment = comment,
                    CreatedAt = DateTime.UtcNow,
                    IsDeleted = false
                };
                _db.PlaceReviews.Add(review);
            }
            else
            {
                // เคยลบไว้แล้วกลับมารีวิวใหม่ => คืนชีพ
                review.IsDeleted = false;

                review.Rating = rating;
                review.Comment = comment;
                review.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync(ct);
            await RecalculatePlaceRatingAsync(placeId, ct);

            var saved = await _db.PlaceReviews
            .AsNoTracking()
            .Include(r => r.User)
            .FirstAsync(r => r.PlaceId == placeId && r.UserId == userId, ct);

            return _mapper.Map<PlaceReviewDto>(saved);
        }

        // 4) Soft delete รีวิวของ user
        public async Task DeleteAsync(int placeId, int userId, CancellationToken ct = default)
        {
            var place = await _db.Places.FirstOrDefaultAsync(p => p.PlaceId == placeId && p.IsActive, ct);
            if (place == null)
                throw new KeyNotFoundException("Place not found.");

            var review = await _db.PlaceReviews
                .FirstOrDefaultAsync(r => r.PlaceId == placeId && r.UserId == userId && !r.IsDeleted, ct);

            if (review == null)
                return;

            review.IsDeleted = true;
            review.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync(ct);
            await RecalculatePlaceRatingAsync(placeId, ct);
        }

        // 5) อัปเดต AverageRating + ReviewCount ใน Place
        private async Task RecalculatePlaceRatingAsync(int placeId, CancellationToken ct)
        {
            var agg = await _db.PlaceReviews
                .AsNoTracking()
                .Where(r => r.PlaceId == placeId && !r.IsDeleted)
                .GroupBy(r => r.PlaceId)
                .Select(g => new { Count = g.Count(), Avg = g.Average(x => x.Rating) })
                .FirstOrDefaultAsync(ct);

            var place = await _db.Places.FirstOrDefaultAsync(p => p.PlaceId == placeId, ct);
            if (place == null) return;

            place.ReviewCount = agg?.Count ?? 0;
            place.AverageRating = agg == null ? 0 : Math.Round(agg.Avg, 1);

            await _db.SaveChangesAsync(ct);
        }
    }
}
