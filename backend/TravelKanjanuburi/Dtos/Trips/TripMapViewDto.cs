namespace TravelKanjanuburi.Dtos.Trips
{
    public class TripMapViewDto
    {
        public int TripId { get; set; }
        public string Title { get; set; } = "";
        public int DayIndex { get; set; }

        public List<TripMapStopDto> Stops { get; set; } = new();
        public TripMapRouteDto? Route { get; set; }
    }

    public class TripMapStopDto
    {
        public int TripItemId { get; set; }
        public int PlaceId { get; set; }
        public int OrderIndex { get; set; }

        public string Name { get; set; } = "";
        public double Latitude { get; set; }
        public double Longitude { get; set; }

        // "start" | "end" | "normal"
        public string Type { get; set; } = "normal";
        public int? EtaMinutesFromStart { get; set; }
        public int? LegMinutesFromPrev { get; set; }
        public int? EtaTravelMinutesFromStart { get; set; }
        public int? EtaTotalMinutesFromStart { get; set; } // optional
        public int? StayMinutesAtPrev { get; set; }        // optional เพื่อโชว์ “แวะ”
    }

    public class TripMapRouteDto
    {
        public double TotalDistanceKm { get; set; }
        public int TotalTravelMinutes { get; set; }

        public List<double[]> Polyline { get; set; } = new();
    }
}
