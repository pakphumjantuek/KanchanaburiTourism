
using TravelKanjanuburi.Dtos.Users;

namespace KanjanaburiTravel.Dtos.Auth
{
    public class AuthResponse
    {
        public string AccessToken { get; set; } = null!;
        public DateTime ExpiresAt { get; set; }
        public UserProfileDto User { get; set; } = null!;
    }
}
