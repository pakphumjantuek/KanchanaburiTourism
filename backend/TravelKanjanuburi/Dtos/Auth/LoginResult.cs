namespace KanjanaburiTravel.Dtos.Auth
{
    public class LoginResult
    {
        public AuthResponse Auth { get; set; } = null!;
        public string RefreshToken { get; set; } = null!;
    }
}
