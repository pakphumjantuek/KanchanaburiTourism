public class ReorderTripItemsRequest
{
    public int DayIndex { get; set; }
    public List<ReorderTripItemDto> Items { get; set; } = new();
}

public class ReorderTripItemDto
{
    public int TripItemId { get; set; }
    public int OrderIndex { get; set; }
}

public class TripItemDto
{
    public int TripItemId { get; set; }
    public int TripId { get; set; }

    public int PlaceId { get; set; }

    public int DayIndex { get; set; }
    public int OrderIndex { get; set; }

    public DateTime? PlannedArrivalTime { get; set; }
    public int? PlannedDurationMinutes { get; set; }

    public string? Notes { get; set; }
}

public class TripSegmentDto
{
    public int TripSegmentId { get; set; }
    public int TripId { get; set; }

    public int FromTripItemId { get; set; }
    public int ToTripItemId { get; set; }

    public double DistanceKm { get; set; }
    public int TravelMinutes { get; set; }

    public string TransportMode { get; set; } = "driving";
    public string? RoutePolyline { get; set; }
}

public class AddTripItemRequest
{
    public int PlaceId { get; set; }

    public int DayIndex { get; set; }
    public int OrderIndex { get; set; }

    public DateTime? PlannedArrivalTime { get; set; }
    public int? PlannedDurationMinutes { get; set; }

    public string? Notes { get; set; }
}
public class UpdateTripItemRequest
{
    public int DayIndex { get; set; }
    public int OrderIndex { get; set; }

    public DateTime? PlannedArrivalTime { get; set; }
    public int? PlannedDurationMinutes { get; set; }

    public string? Notes { get; set; }
}



public class SaveRouteRequest
{
    public int DayIndex { get; set; } = 1;
    public string TransportMode { get; set; } = "driving";

    public double TotalDistanceKm { get; set; }
    public int TotalTravelMinutes { get; set; }

    // optional: เก็บเส้น (GeoJSON coords จาก OSRM) ถ้าอยากเก็บไว้โชว์ทีหลัง
    public List<List<double>>? Polyline { get; set; } // [[lng,lat], [lng,lat], ...]
}