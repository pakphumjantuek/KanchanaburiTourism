namespace TravelKanjanuburi.ML
{
    public sealed class TrainingStatsDto
    {
        public int Days { get; set; }
        public DateTime SinceUtc { get; set; }

        public long TotalLogs { get; set; }
        public long PlaceLogs { get; set; }       // มี PlaceId != null (ใช้เทรนได้)
        public long SearchLogs { get; set; }      // PlaceId == null (มักเป็น SEARCH)
        public long UniqueUsers { get; set; }
        public long UniquePlaces { get; set; }

        public long RowsTrainable { get; set; }   // จำนวน (UserId, PlaceId) pairs

        public List<ActionCountDto> Actions { get; set; } = new();
        public List<TopUserDto> TopUsers { get; set; } = new();
        public List<TopPlaceDto> TopPlaces { get; set; } = new();
        public List<DailyTrainingStatsDto> Daily { get; set; } = new();
        public List<DailyActionDto> DailyActions { get; set; } = new();

        public double PairDensity { get; set; }          // 0..1
        public double TopPlaceShare { get; set; }        // 0..1
        public double TopUserShare { get; set; }         // 0..1
        public double AvgPlacesPerUser { get; set; }     // เฉลี่ย user ไปกี่ที่
        public double AvgUsersPerPlace { get; set; }
        public double TrainableRate { get; set; }
    }
    public sealed class DailyActionDto
    {
        public DateTime DateUtc { get; set; }
        public string ActionType { get; set; } = default!;
        public long Count { get; set; }
    }

    public sealed class DailyTrainingStatsDto
    {
        public DateTime DateUtc { get; set; } // เก็บเป็นวัน (00:00 UTC)
        public long TotalLogs { get; set; }
        public long PlaceLogs { get; set; }
        public long SearchLogs { get; set; }
        public long RowsTrainable { get; set; }
    }
    public sealed class ActionCountDto
    {
        public string ActionType { get; set; } = "";
        public long Count { get; set; }
    }

    public sealed class TopUserDto
    {
        public int? UserId { get; set; }
        public string? AnonymousId { get; set; }

        public string? DisplayName { get; set; }
        public long Logs { get; set; }
        public long UniquePlaces { get; set; }
    }

    public sealed class TopPlaceDto
    {
        public int PlaceId { get; set; }
        public string? Name { get; set; }
        public long Logs { get; set; }
        public long UniqueUsers { get; set; }
    }

}
