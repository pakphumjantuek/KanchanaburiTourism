using AutoMapper.QueryableExtensions;
using TravelKanjanuburi.Dtos.Users;
using TravelKanjanuburi.Services.Interface;
using static TravelKanjanuburi.Model.Paged;

public class UserService : IUserService
{
    private readonly ApplicationDbContext _db;
    private readonly IMapper _mapper;
    private readonly IFileStorage _fileStorage;

    public UserService(ApplicationDbContext db, IMapper mapper, IFileStorage fileStorage)
    {
        _db = db;
        _mapper = mapper;
        _fileStorage = fileStorage;
    }

    public async Task<PagedResult<UserProfileDto>> GetAllAsync(PagedQuery query, CancellationToken ct)
    {
        var q = _db.Users.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim();
            q = q.Where(x => x.DisplayName.Contains(term) || x.Email.Contains(term));
        }

        var total = await q.LongCountAsync(ct);

        var items = await q
            .OrderBy(x => x.UserId)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ProjectTo<UserProfileDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);

        return new PagedResult<UserProfileDto>(items, query.Page, query.PageSize, total);
    }

    public async Task<UserProfileDto> GetProfileAsync(int userId, CancellationToken ct)
    {
        var user = await _db.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null)
            throw new KeyNotFoundException("ไม่พบบัญชีผู้ใช้");

        return _mapper.Map<UserProfileDto>(user);
    }

    public async Task UpdateProfileAsync(int userId, UpdateProfileRequest request, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == userId, ct);
        if (user == null)
            throw new KeyNotFoundException("ไม่พบบัญชีผู้ใช้");

        user.DisplayName = request.DisplayName;
        user.PhoneNumber = request.PhoneNumber;

        if (request.Avatar != null && request.Avatar.Length > 0)
        {
            _fileStorage.DeleteByRelativeUrl(user.AvatarUrl);

            user.AvatarUrl = await _fileStorage.SaveImageAsync(request.Avatar, "uploads/avatars", ct);
        }

        await _db.SaveChangesAsync(ct);
    }

}
