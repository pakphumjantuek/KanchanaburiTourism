using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TravelKanjanuburi.Model.MPlaces
{
    public class PlaceReview
    {
        public int PlaceReviewId { get; set; }

        public int PlaceId { get; set; }
        [ForeignKey(nameof(PlaceId))]
        public Place Place { get; set; } = null!;

        // ผูกกับผู้ใช้ของคุณ (ถ้าใช้ Identity มักเป็น string)
        [MaxLength(450)]
        public int UserId { get; set; }
        public User User { get; set; } = null!;

        [Range(1, 5)]
        public int Rating { get; set; }   // 1-5 ดาว

        [MaxLength(4000)]
        public string? Comment { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public bool IsDeleted { get; set; } = false; // soft delete (แนะนำ)
    }
}
