using System.ComponentModel.DataAnnotations;

namespace TravelKanjanuburi.Model.MPlaces
{
    public class PlaceCategory
    {
        [Key]
        public int CategoryId { get; set; }
        [MaxLength(150)]
        public string CategoryName { get; set; } = null!;
        public string? CategoryDescription { get; set; }
    }

}
