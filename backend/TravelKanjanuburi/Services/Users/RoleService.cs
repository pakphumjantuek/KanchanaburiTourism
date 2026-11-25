using AutoMapper.QueryableExtensions;
using TravelKanjanuburi.Dtos.Users;
using TravelKanjanuburi.Services.Interface;
using static TravelKanjanuburi.Model.Paged;

namespace TravelKanjanuburi.Services.Users
{
    public class RoleService : IRoleService
    {
        private readonly ApplicationDbContext _db;
        private readonly IMapper _mapper;

        public RoleService(ApplicationDbContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }

        public async Task<PagedResult<RoleDto>> GetAllAsync(PagedQuery query, CancellationToken ct)
        {
            var q = _db.Roles.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var term = query.Search.Trim();
                q = q.Where(x => x.RoleName.Contains(term));
            }

            var total = await q.LongCountAsync(ct);
            var items = await q
                .OrderBy(x => x.RoleId)
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize)
                .ProjectTo<RoleDto>(_mapper.ConfigurationProvider)
                .ToListAsync(ct);

            return new PagedResult<RoleDto>(items, query.Page, query.PageSize, total);
        }

        public async Task<RoleDto> CreateRoleAsync(RoleDto roledto, CancellationToken ct = default)
        {
            if (roledto == null)
                throw new ArgumentNullException(nameof(roledto), "roledto cannot be null.");

            var year = _mapper.Map<Role>(roledto);

            await _db.Roles.AddAsync(year, ct);
            await _db.SaveChangesAsync(ct);

            return _mapper.Map<RoleDto>(year);
        }

        public async Task<RoleDto> UpdateRoleAsync(int id, RoleDto roledto, CancellationToken ct = default)
        {
            if (roledto == null)
                throw new ArgumentNullException(nameof(roledto), "Roledto cannot be null.");

            var roleToUpdate = await _db.Roles.FirstOrDefaultAsync(y => y.RoleId == id, ct);
            if (roleToUpdate == null)
                throw new KeyNotFoundException($"Role with ID {id} not found.");

            _mapper.Map(roledto, roleToUpdate);

            await _db.SaveChangesAsync(ct);
            return _mapper.Map<RoleDto>(roleToUpdate);
        }

        public async Task DeleteRoleAsync(int id, CancellationToken ct = default)
        {
            var year = await _db.Roles.FirstOrDefaultAsync(y => y.RoleId == id, ct);
            if (year == null)
                throw new KeyNotFoundException("ไม่พบไอดีRole");

            _db.Roles.Remove(year);
            await _db.SaveChangesAsync(ct);
        }
    
    }
}
