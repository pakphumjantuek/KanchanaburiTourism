using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TravelKanjanuburi.Model.Foods
{
    public class LocalDishImage
    {
        [Key]
        public int ImageId { get; set; }
        public int DishId { get; set; }
        [ForeignKey(nameof(DishId))]
        public LocalDish LocalDish { get; set; } = null!;
        [MaxLength(500)]
        public string ImageUrl { get; set; } = null!; // เช่น "/uploads/places/xxx.jpg"
        public bool IsCover { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
