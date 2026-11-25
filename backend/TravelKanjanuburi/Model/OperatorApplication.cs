using System.ComponentModel.DataAnnotations;

namespace TravelKanjanuburi.Model
{
    public static class OperatorStatus
    {
        public const string Pending = "Pending";
        public const string Approved = "Approved";
        public const string Rejected = "Rejected";
    }

    /// <summary>คำขอสมัครเป็นผู้ประกอบการ — แอดมินอนุมัติแล้ว user จะได้ Role = Operator</summary>
    public class OperatorApplication
    {
        public int OperatorApplicationId { get; set; }

        public int UserId { get; set; }
        public User User { get; set; } = null!;

        [MaxLength(200)]
        public string BusinessName { get; set; } = null!;

        [MaxLength(50)]
        public string? ContactPhone { get; set; }

        [MaxLength(1000)]
        public string? Description { get; set; }

        [MaxLength(20)]
        public string Status { get; set; } = OperatorStatus.Pending;

        [MaxLength(500)]
        public string? RejectReason { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ReviewedAt { get; set; }
        public int? ReviewedByUserId { get; set; }
    }
}
