public class UpdateProfileRequest
{
    public string DisplayName { get; set; } = null!;
    public string? PhoneNumber { get; set; }
    public IFormFile? Avatar { get; set; } // ✅ รับไฟล์
}
