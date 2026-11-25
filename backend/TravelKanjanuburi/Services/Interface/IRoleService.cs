using TravelKanjanuburi.Dtos.Users;
using static TravelKanjanuburi.Model.Paged;

namespace TravelKanjanuburi.Services.Interface
{
    public interface IRoleService
    {
        Task<PagedResult<RoleDto>> GetAllAsync(PagedQuery query, CancellationToken ct);
        Task<RoleDto> CreateRoleAsync(RoleDto roledto, CancellationToken ct = default);
        Task<RoleDto> UpdateRoleAsync(int id, RoleDto roledto, CancellationToken ct = default);
        Task DeleteRoleAsync(int id, CancellationToken ct = default);
    }
}
