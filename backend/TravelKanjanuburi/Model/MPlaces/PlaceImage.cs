using System.ComponentModel.DataAnnotations;

namespace TravelKanjanuburi.Model.MPlaces
{
    public class PlaceImage
    {
        [Key]
        public int ImageId { get; set; }
        public int PlaceId { get; set; }
        public Place Place { get; set; } = null!;

        [MaxLength(500)]
        public string ImageUrl { get; set; } = null!; // เช่น "/uploads/places/xxx.jpg"
        public bool IsCover { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

}
