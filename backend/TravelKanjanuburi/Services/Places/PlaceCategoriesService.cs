using AutoMapper.QueryableExtensions;
using TravelKanjanuburi.Dtos.Places;
using TravelKanjanuburi.Model.MPlaces;
using static TravelKanjanuburi.Model.Paged;

namespace TravelKanjanuburi.Services.Places
{
    public class PlaceCategoriesService
    {
        private readonly ApplicationDbContext _db;
        private readonly IMapper _mapper;
        public PlaceCategoriesService(ApplicationDbContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }
        public async Task<PagedResult<PlaceCategoriesDto>> GetAllAsync(PagedQuery query, CancellationToken ct)
        {
            var page = query.Page < 1 ? 1 : query.Page;
            var pageSize = query.PageSize is < 1 or > 200 ? 20 : query.PageSize;

            var q = _db.PlaceCategories.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var term = query.Search.Trim();
                q = q.Where(x => EF.Functions.Like(x.CategoryName, $"%{term}%"));
            }

            var total = await q.LongCountAsync(ct);

            var items = await q
                .OrderByDescending(x => x.CategoryId)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ProjectTo<PlaceCategoriesDto>(_mapper.ConfigurationProvider)
                .ToListAsync(ct);

            return new PagedResult<PlaceCategoriesDto>(items, page, pageSize, total);
        }

        public async Task<PlaceCategoriesDto> GetPlaceCatagoryIdAsync(int id, CancellationToken ct = default)
        {
            var placesCategory = await _db.PlaceCategories
                .AsNoTracking()
                .FirstOrDefaultAsync(y => y.CategoryId == id, ct);

            if (placesCategory == null)
                throw new KeyNotFoundException($"PlaceCategories with ID {id} not found.");

            return _mapper.Map<PlaceCategoriesDto>(placesCategory);
        }

        public async Task<PlaceCategoriesDto> CreatePlaceCatagoryAsync(PlaceCategoriesDto placeCategoriesDto, CancellationToken ct = default)
        {
            if (placeCategoriesDto == null)
                throw new ArgumentNullException(nameof(placeCategoriesDto), "PlaceCategoriesDto cannot be null.");

            var placesCategory = _mapper.Map<PlaceCategory>(placeCategoriesDto);

            await _db.PlaceCategories.AddAsync(placesCategory, ct);
            await _db.SaveChangesAsync(ct);

            return _mapper.Map<PlaceCategoriesDto>(placesCategory);
        }

        public async Task<PlaceCategoriesDto> UpdatePlaceCatagoryAsync(int id, PlaceCategoriesDto updatePlace, CancellationToken ct = default)
        {
            if (updatePlace == null)
                throw new ArgumentNullException(nameof(updatePlace), "UpdatePlace cannot be null.");

            var updatePlaceCategoryToUpdate = await _db.PlaceCategories.FirstOrDefaultAsync(y => y.CategoryId == id, ct);
            if (updatePlaceCategoryToUpdate == null)
                throw new KeyNotFoundException($"updatePlaceCategory with ID {id} not found.");

            _mapper.Map(updatePlace, updatePlaceCategoryToUpdate);

            await _db.SaveChangesAsync(ct);
            return _mapper.Map<PlaceCategoriesDto>(updatePlaceCategoryToUpdate);
        }

        public async Task DeletePlaceAsync(int id, CancellationToken ct = default)
        {
            var placesCategory = await _db.PlaceCategories.FirstOrDefaultAsync(y => y.CategoryId == id, ct);
            if (placesCategory == null)
                throw new KeyNotFoundException("ไม่พบไอดีRole");

            _db.PlaceCategories.Remove(placesCategory);
            await _db.SaveChangesAsync(ct);
        }
    }
}
