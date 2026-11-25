namespace TravelKanjanuburi.Model.MTrips
{
    public class TripSegment
    {
        public int TripSegmentId { get; set; }

        public int TripId { get; set; }
        public Trip Trip { get; set; } = null!;

        public int FromTripItemId { get; set; }
        public TripItem FromTripItem { get; set; } = null!;

        public int ToTripItemId { get; set; }
        public TripItem ToTripItem { get; set; } = null!;

        public double DistanceKm { get; set; }
        public int TravelMinutes { get; set; }

        public string TransportMode { get; set; } = "driving"; // driving|walking|cycling

        // (แนะนำเสริม) ถ้าจะเก็บเส้นทางไว้ ไม่ต้องคำนวณซ้ำ
        public string? RoutePolyline { get; set; }
    }
}
