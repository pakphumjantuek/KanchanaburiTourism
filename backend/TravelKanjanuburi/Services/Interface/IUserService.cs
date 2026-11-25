using TravelKanjanuburi.Dtos.Users;
using static TravelKanjanuburi.Model.Paged;

namespace TravelKanjanuburi.Services.Interface
{
    public interface IUserService
    {
        Task<UserProfileDto> GetProfileAsync(int userId, CancellationToken ct);
        Task <PagedResult<UserProfileDto>> GetAllAsync(PagedQuery query, CancellationToken ct);
        Task UpdateProfileAsync(int userId, UpdateProfileRequest request, CancellationToken ct = default);
    }
}
