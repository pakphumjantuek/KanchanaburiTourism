namespace TravelKanjanuburi.Model.MPlaces
{
    public class PlaceTag
    {
        public int PlaceId { get; set; }
        public Place Place { get; set; } = null!;
        public int TagId { get; set; }
        public Tag Tag { get; set; } = null!;
    }
}
