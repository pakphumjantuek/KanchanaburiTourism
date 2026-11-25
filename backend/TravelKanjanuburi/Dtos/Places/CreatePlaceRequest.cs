
namespace TravelKanjanuburi.Dtos.Places
{
    public class CreatePlaceRequest
    {
        public int? PlaceId { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string? Address { get; set; }
        public TimeOnly? OpenTime { get; set; }
        public TimeOnly? CloseTime { get; set; }
        public int? CategoryId { get; set; }

        public int? AvgVisitMinutes { get; set; }
        public int? PriceRange { get; set; }
        public bool? IsActive { get; set; }
        public bool IsEvent { get; set; }
        public DateTime? EventStartAt { get; set; }
        public DateTime? EventEndAt { get; set; }
        public List<int>? TagIds { get; set; } 

    }

    public class UpdatePlaceRequest
    {
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        //public PlaceType PlaceType { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string? Address { get; set; }
        public TimeOnly? OpenTime { get; set; }
        public TimeOnly? CloseTime { get; set; }
        public int? CategoryId { get; set; }

        public int? AvgVisitMinutes { get; set; }
        public int? PriceRange { get; set; }
        public bool? IsActive { get; set; }
        public bool IsEvent { get; set; }
        public DateTime? EventStartAt { get; set; }
        public DateTime? EventEndAt { get; set; }
        public List<int>? TagIds { get; set; }      // ✅ many-to-many

    }
}
