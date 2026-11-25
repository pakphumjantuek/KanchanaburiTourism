namespace TravelKanjanuburi.Dtos.Users
{
    public class UserProfileDto
    {
        public int UserId { get; set; }
        public string Email { get; set; } = null!;
        public string? PhoneNumber { get; set; }
        public string DisplayName { get; set; } = null!;
        public string? AvatarUrl { get; set; }
        public string RoleName { get; set; } = null!;
    }

}
