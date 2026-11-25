namespace TravelKanjanuburi.Model
{
    public class User
    {
        public int UserId { get; set; } // PK
        public string Email { get; set; } = null!;
        public string? PhoneNumber { get; set; }
        public string PasswordHash { get; set; } = null!;
        public string DisplayName { get; set; } = null!;
        public string? AvatarUrl { get; set; }
        public int RoleId { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Role Role { get; set; } = null!;
        public ICollection<UserInterest> UserInterests { get; set; } = new List<UserInterest>();
    }
}
