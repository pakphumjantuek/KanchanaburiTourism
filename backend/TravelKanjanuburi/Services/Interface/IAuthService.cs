using KanjanaburiTravel.Dtos.Auth;

namespace TravelKanjanuburi.Services.Interface
{
    public interface IAuthService
    {
        Task<AuthResponse> RegisterAsync(RegisterRequest request);
        Task<LoginResult> LoginAsync(LoginRequest request);
        Task<LoginResult> RefreshAsync(string refreshToken);
        Task RevokeRefreshTokenAsync(string refreshToken);

    }
}
