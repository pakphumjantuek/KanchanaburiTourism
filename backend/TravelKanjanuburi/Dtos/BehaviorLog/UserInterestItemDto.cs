namespace TravelKanjanuburi.Dtos.BehaviorLog
{
    public sealed class UserInterestItemDto
    {
        public string InterestKey { get; set; } = "";   // เช่น "category:วัฒนธรรม" หรือ "tag:คาเฟ่"
        public double Weight { get; set; }
        public DateTime UpdatedAtUtc { get; set; }
        public string? DisplayName { get; set; }   // ✅ เพิ่ม
        public List<TopPlaceLiteDto> TopPlaces { get; set; } = new(); 
    }
    public sealed class TopPlaceLiteDto
    {
        public int PlaceId { get; set; }
        public string? Name { get; set; }
        public string? CategoryName { get; set; }
        public string? CoverImageUrl { get; set; }
        public long Score { get; set; } // คะแนนรวมจาก action (ไว้เรียง/โชว์)
    }
    public sealed class UserInterestDetailsDto
    {
        public int UserId { get; set; }
        public int Days { get; set; }
        public DateTime SinceUtc { get; set; }
        public List<UserInterestItemDto> TopInterests { get; set; } = new();

        public Dictionary<string, long> ActionCounts { get; set; } = new(); // VIEW/CLICK/...
        public List<int> TopPlaceIds { get; set; } = new(); // (หรือส่งชื่อด้วยก็ได้)
        public List<TopPlaceLiteDto> TopPlaces { get; set; } = new(); // ✅ เพิ่ม

    }

}
