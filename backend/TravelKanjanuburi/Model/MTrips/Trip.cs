using System.ComponentModel.DataAnnotations;

namespace TravelKanjanuburi.Model.MTrips
{
    public class Trip
    {
        public int TripId { get; set; }

        public int UserId { get; set; } // เจ้าของทริป

        [MaxLength(200)]
        public string Title { get; set; } = null!;

        [MaxLength(2000)]
        public string? Description { get; set; }

        public DateTime StartDateTime { get; set; }
        public DateTime EndDateTime { get; set; }

        public double? StartLat { get; set; }
        public double? StartLng { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public List<TripItem> Items { get; set; } = new();
        public List<TripSegment> Segments { get; set; } = new();
    }
}
