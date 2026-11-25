using System.ComponentModel.DataAnnotations;

namespace TravelKanjanuburi.Model.MTrips
{
    public class TripItem
    {
        public int TripItemId { get; set; }

        public int TripId { get; set; }
        public Trip Trip { get; set; } = null!;

        public int PlaceId { get; set; } // FK ไป Place (ระบบที่ 2)

        public int DayIndex { get; set; }        // วันที 1,2,3...
        public int OrderIndex { get; set; }      // ลำดับในวันนั้น

        public DateTime? PlannedArrivalTime { get; set; } // เวลาไปถึง (optional)
        public int? PlannedDurationMinutes { get; set; }  // เวลาที่ควรอยู่ (optional)

        [MaxLength(1000)]
        public string? Notes { get; set; }
    }
}
