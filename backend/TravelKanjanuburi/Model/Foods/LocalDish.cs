using System.ComponentModel.DataAnnotations;

namespace TravelKanjanuburi.Model.Foods
{
    public class LocalDish
    {
        [Key]
        public int DishId { get; set; }

        [MaxLength(200)]
        public string NameTH { get; set; } = null!;

        [MaxLength(200)]
        public string? NameEN { get; set; }

        [MaxLength(4000)]
        public string? Description { get; set; }

        // เช่น "มอญ", "กะเหรี่ยง", "กาญจนบุรี", "ภาคกลาง"
        [MaxLength(100)]
        public string? Origin { get; set; }

        // 0-5
        public int SpicyLevel { get; set; } = 0;

        public bool IsHalal { get; set; } = false;
        public bool IsVegetarian { get; set; } = false;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // เจ้าของเมนู (ผู้ประกอบการ) — null = แอดมินเป็นคนลงเอง
        public int? OwnerId { get; set; }
        public ICollection<LocalDishImage> LocalDishImages { get; set; } = new List<LocalDishImage>();
        public ICollection<PlaceLocalDish> PlaceLocalDishes { get; set; }
    = new List<PlaceLocalDish>();

    }
}
