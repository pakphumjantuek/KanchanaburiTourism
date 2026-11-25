using System.ComponentModel.DataAnnotations;

namespace TravelKanjanuburi.Model.MPlaces
{
    public class Tag
    {
        public int TagId { get; set; }
        [MaxLength(150)]
        public string TagName { get; set; } = null!;
        public string? TagDescription { get; set; } = null!;
        public ICollection<PlaceTag> PlaceTags { get; set; } = new List<PlaceTag>();
    }
}
