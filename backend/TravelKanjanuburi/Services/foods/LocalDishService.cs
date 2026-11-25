using AutoMapper.QueryableExtensions;
using TravelKanjanuburi.Dtos.Food;
using TravelKanjanuburi.Model.Foods;
using TravelKanjanuburi.Services.Images;
using static TravelKanjanuburi.Model.Paged;

namespace TravelKanjanuburi.Services.foods
{
    public class LocalDishService
    {
        private readonly ApplicationDbContext _db;
        private readonly IMapper _mapper;
        private readonly IImageService _imageService;

        public LocalDishService(ApplicationDbContext db,IMapper mapper, IImageService imageService)
        {
            _db = db;
            _mapper = mapper;
            _imageService = imageService;
        }

        public async Task EnsureCanManageAsync(int dishId, int? userId, bool isAdmin, CancellationToken ct = default)
        {
            if (isAdmin) return;
            var dish = await _db.LocalDishes.AsNoTracking().Where(d => d.DishId == dishId).Select(d => new { d.OwnerId }).FirstOrDefaultAsync(ct);
            if (dish == null) throw new KeyNotFoundException($"LocalDish {dishId} not found.");
            if (userId == null || dish.OwnerId != userId) throw new UnauthorizedAccessException("คุณไม่มีสิทธิ์จัดการเมนูนี้");
        }

        public async Task<PagedResult<LocalDishDto>> GetAllAsync(PagedQuery query, CancellationToken ct, int? ownerId = null)
        {
            var page = query.Page < 1 ? 1 : query.Page;
            var pageSize = query.PageSize is < 1 or > 200 ? 20 : query.PageSize;

            var q = _db.LocalDishes.Include(p => p.LocalDishImages).AsNoTracking();
            if (ownerId.HasValue) q = q.Where(x => x.OwnerId == ownerId.Value);

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var term = query.Search.Trim();
                q = q.Where(x => EF.Functions.Like(x.NameTH, $"%{term}%"));
            }

            var total = await q.LongCountAsync(ct);

            var items = await q
                .OrderByDescending(x => x.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ProjectTo<LocalDishDto>(_mapper.ConfigurationProvider)
                .ToListAsync(ct);

            return new PagedResult<LocalDishDto>(items, page, pageSize, total);
        }

        public async Task<LocalDishDto> GetLocalDishByIdAsync(int id, CancellationToken ct = default)
        {
            var localDishdish = await _db.LocalDishes
                .AsNoTracking()
                .Include(p => p.LocalDishImages)
                .FirstOrDefaultAsync(x => x.DishId == id, ct);

            if (localDishdish == null)
                throw new KeyNotFoundException($"localDishdish with ID {id} not found.");

            return _mapper.Map<LocalDishDto>(localDishdish);
        }

        public async Task<CreateLocalDishRequest> CreateLocalDishAsync(CreateLocalDishRequest req, CancellationToken ct = default, int? ownerId = null)
        {
            if (req == null)
                throw new ArgumentNullException(nameof(req), "localDish cannot be null.");

            var localDishDto = _mapper.Map<LocalDish>(req);

            localDishDto.CreatedAt = DateTime.UtcNow;
            localDishDto.OwnerId = ownerId;

            await _db.LocalDishes.AddAsync(localDishDto, ct);
            await _db.SaveChangesAsync(ct);

            return _mapper.Map<CreateLocalDishRequest>(localDishDto);
        }

        public async Task<LocalDishDto> UpdateLocalDishAsync(int id, CreateLocalDishRequest req, CancellationToken ct = default)
        {
            var localDish = await _db.LocalDishes
                .FirstOrDefaultAsync(p => p.DishId == id, ct);

            if (localDish == null) throw new KeyNotFoundException($"LocalDish {id} not found.");

            _mapper.Map(req, localDish);

            await _db.SaveChangesAsync(ct);
            return _mapper.Map<LocalDishDto>(localDish);
        }

        public async Task DeleteLocalDishAsync(int id, CancellationToken ct = default)
        {
            var dish = await _db.LocalDishes
                .Include(x => x.LocalDishImages)
                .FirstOrDefaultAsync(p => p.DishId == id, ct);

            if (dish == null)
                throw new KeyNotFoundException("ไม่พบ DishId");

            foreach (var img in dish.LocalDishImages)
            {
                _imageService.DeletePhysical(img.ImageUrl);
            }

            _db.LocalDishes.Remove(dish);
            await _db.SaveChangesAsync(ct);
        }


        public async Task<List<PlaceForDishDto>> GetPlacesByDishIdAsync(int dishId, CancellationToken ct = default)
        {
            var exists = await _db.LocalDishes.AsNoTracking().AnyAsync(x => x.DishId == dishId, ct);
            if (!exists) throw new KeyNotFoundException($"DishId {dishId} not found.");

            var places = await _db.PlaceLocalDishes
                .AsNoTracking()
                .Where(x => x.DishId == dishId && x.IsAvailable)
                .Where(x => !x.Place.IsEvent ||
                            ((x.Place.EventStartAt == null || x.Place.EventStartAt <= DateTime.UtcNow) &&
                             (x.Place.EventEndAt == null || x.Place.EventEndAt > DateTime.UtcNow)))
                .Select(x => new PlaceForDishDto
                {
                    PlaceId = x.PlaceId,
                    Name = x.Place.Name,
                    Address = x.Place.Address,
                    Latitude = x.Place.Latitude,
                    Longitude = x.Place.Longitude,
                    AverageRating = x.Place.AverageRating,
                    ReviewCount = x.Place.ReviewCount,

                    Price = x.Price,
                    IsAvailable = x.IsAvailable,

                    CoverImageUrl = x.Place.Images
                        .OrderByDescending(i => i.IsCover)
                        .ThenByDescending(i => i.CreatedAt)
                        .Select(i => i.ImageUrl)
                        .FirstOrDefault()
                })
                .ToListAsync(ct);

            return places;
        }


        public async Task UploadImagesAsync(int dishId,List<IFormFile> files,int coverIndex = 0, bool replaceOld = false,CancellationToken ct = default)
        {
            var dish = await _db.LocalDishes
                .Include(x => x.LocalDishImages)
                .FirstOrDefaultAsync(x => x.DishId == dishId, ct);

            if (dish == null) throw new KeyNotFoundException("ไม่พบเมนู");
            if (files == null || files.Count == 0) throw new InvalidOperationException("ไม่มีไฟล์");
    
            if (replaceOld)
            {
                foreach (var old in dish.LocalDishImages.ToList())
                {
                    _imageService.DeletePhysical(old.ImageUrl);
                    _db.LocalDishesImage.Remove(old);
                }
            }

            foreach (var img in dish.LocalDishImages) img.IsCover = false;

            var urls = await _imageService.UploadAsync(
                files,
                "uploads/localDish",
                ct
            );

            if (coverIndex < 0 || coverIndex >= urls.Count) coverIndex = 0;

            for (int i = 0; i < urls.Count; i++)
            {
                dish.LocalDishImages.Add(new LocalDishImage
                {
                    ImageUrl = urls[i],
                    IsCover = i == coverIndex
                });
            }

            await _db.SaveChangesAsync(ct);
        }

        public async Task DeleteImageAsync(int dishId, int imageId, CancellationToken ct = default)
        {
            var img = await _db.LocalDishesImage
                .FirstOrDefaultAsync(x => x.ImageId == imageId && x.DishId == dishId, ct);

            if (img == null) throw new KeyNotFoundException("ไม่พบรูปภาพ");

            _imageService.DeletePhysical(img.ImageUrl);

            _db.LocalDishesImage.Remove(img);
            await _db.SaveChangesAsync(ct);
        }


    }
}
