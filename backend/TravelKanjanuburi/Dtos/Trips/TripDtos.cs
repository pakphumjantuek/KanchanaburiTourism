namespace TravelKanjanuburi.Dtos.Trips
{
    public class TripDto
    {
        public int TripId { get; set; }
        public int UserId { get; set; }

        public string Title { get; set; } = null!;
        public string? Description { get; set; }

        public DateTime StartDateTime { get; set; }
        public DateTime EndDateTime { get; set; }

        public double? StartLat { get; set; }
        public double? StartLng { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class TripDetailDto : TripDto
    {
        public List<TripItemDto> Items { get; set; } = new();
        public List<TripSegmentDto> Segments { get; set; } = new();
    }

    public class CreateTripRequest
    {
        public string Title { get; set; } = null!;
        public string? Description { get; set; }

        public DateTime StartDateTime { get; set; }
        public DateTime EndDateTime { get; set; }

        public double? StartLat { get; set; }
        public double? StartLng { get; set; }
    }
}
