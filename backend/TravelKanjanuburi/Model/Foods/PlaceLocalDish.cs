using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TravelKanjanuburi.Model.Foods
{
    public class PlaceLocalDish
    {
        [Key]
        public int Id { get; set; }

        public int PlaceId { get; set; }
        [ForeignKey(nameof(PlaceId))]
        public Place Place { get; set; } = null!;

        public int DishId { get; set; }
        [ForeignKey(nameof(DishId))]
        public LocalDish LocalDish { get; set; } = null!;

        // optional
        public decimal? Price { get; set; }          // ราคาที่ร้านนี้ขาย
        public bool IsAvailable { get; set; } = true;
    }
}
