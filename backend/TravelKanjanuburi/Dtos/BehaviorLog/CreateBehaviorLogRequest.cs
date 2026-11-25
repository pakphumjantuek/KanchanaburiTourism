namespace TravelKanjanuburi.Dtos.BehaviorLog
{
    namespace TravelKanjanuburi.Dtos.BehaviorLog
    {
        public class CreateBehaviorLogRequest
        {
            public int? PlaceId { get; set; }
            public string ActionType { get; set; } = null!; // "VIEW", "CLICK", ...
            public double? ActionValue { get; set; }
            public string? MetaJson { get; set; }

            // ✅ เพิ่มตัวนี้: GUID/string จาก client (ดีที่สุด)
            public string? ClientEventId { get; set; }
            public string? AnonymousId { get; set; }

        }
    }

    public class PlaceRecommendDto
    {
        public int PlaceId { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string? Address { get; set; }
        public string PlaceType { get; set; } = null!;
        public double PopularityScore { get; set; }
        public int CategoryId { get; set; }
        public string? CategoryName { get; set; }
        public List<string> Tags { get; set; } = new();

        public string? CoverImageUrl { get; set; }

        // recommendation outputs
        public double Score { get; set; }
        public string? ReasonJson { get; set; }

        public double? AverageRating { get; set; } = 0;

    }


    public class RecommendQuery
    {
        public double? Lat { get; set; }
        public double? Lng { get; set; }
        public int Limit { get; set; } = 20;
    }

}
