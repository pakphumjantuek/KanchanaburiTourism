namespace KanjanaburiTravel.Dtos.Auth
{
    public class RegisterRequest
    {
        public string Email { get; set; } = null!;
        public string? PhoneNumber { get; set; }
        public string Password { get; set; } = null!;
        public string DisplayName { get; set; } = null!;

        // ถ้าใส่ BusinessName = สมัครเป็นผู้ประกอบการด้วย (รอแอดมินอนุมัติ)
        public string? BusinessName { get; set; }
        public string? BusinessDescription { get; set; }
    }
}
