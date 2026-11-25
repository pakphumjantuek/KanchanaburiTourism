using AutoMapper.QueryableExtensions;
using TravelKanjanuburi.Dtos.Places;
using TravelKanjanuburi.Model.MPlaces;
using static TravelKanjanuburi.Model.Paged;

namespace TravelKanjanuburi.Services.Places
{
    public class PlaceTagService
    {
        private readonly ApplicationDbContext _db;
        private readonly IMapper _mapper;
        public PlaceTagService(ApplicationDbContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }
        public async Task<PagedResult<TagDto>> GetAllAsync(PagedQuery query, CancellationToken ct)
        {
            var page = query.Page < 1 ? 1 : query.Page;
            var pageSize = query.PageSize is < 1 or > 200 ? 20 : query.PageSize;

            var q = _db.Tags.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var term = query.Search.Trim();
                q = q.Where(x => EF.Functions.Like(x.TagName, $"%{term}%"));
            }

            var total = await q.LongCountAsync(ct);

            var items = await q
                .OrderByDescending(x => x.TagId)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ProjectTo<TagDto>(_mapper.ConfigurationProvider)
                .ToListAsync(ct);

            return new PagedResult<TagDto>(items, page, pageSize, total);
        }

        public async Task<TagDto> GetTagsIdAsync(int id, CancellationToken ct = default)
        {
            var Tags = await _db.Tags
                .AsNoTracking()
                .FirstOrDefaultAsync(y => y.TagId == id, ct);

            if (Tags == null)
                throw new KeyNotFoundException($"Tags with ID {id} not found.");

            return _mapper.Map<TagDto>(Tags);
        }

        public async Task<TagDto> CreateTagsAsync(TagDto tagDto, CancellationToken ct = default)
        {
            if (tagDto == null)
                throw new ArgumentNullException(nameof(tagDto), "Tags cannot be null.");

            var tag = _mapper.Map<Tag>(tagDto);

            await _db.Tags.AddAsync(tag, ct);
            await _db.SaveChangesAsync(ct);

            return _mapper.Map<TagDto>(tag);
        }

        public async Task<TagDto> UpdateTagsAsync(int id, TagDto tagDto, CancellationToken ct = default)
        {
            if (tagDto == null)
                throw new ArgumentNullException(nameof(tagDto), "Tags cannot be null.");

            var tagToUpdate = await _db.Tags.FirstOrDefaultAsync(y => y.TagId == id, ct);
            if (tagToUpdate == null)
                throw new KeyNotFoundException($"Tags with ID {id} not found.");

            _mapper.Map(tagDto, tagToUpdate);

            await _db.SaveChangesAsync(ct);
            return _mapper.Map<TagDto>(tagToUpdate);
        }

        public async Task DeleteTagsAsync(int id, CancellationToken ct = default)
        {
            var tags = await _db.Tags.FirstOrDefaultAsync(y => y.TagId == id, ct);
            if (tags == null)
                throw new KeyNotFoundException($"Tags Not Found {id}");

            _db.Tags.Remove(tags);
            await _db.SaveChangesAsync(ct);
        }
    }
}
