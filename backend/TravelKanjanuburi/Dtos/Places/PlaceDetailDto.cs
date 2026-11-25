namespace TravelKanjanuburi.Dtos.Places
{
    public class PlaceDetailDto
    {
        public int PlaceId { get; set; }
        public int? OwnerId { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string? Address { get; set; }
        public int? AvgVisitMinutes { get; set; }
        public int? PriceRange { get; set; }
        public double PopularityScore { get; set; }
        public int? CategoryId { get; set; }
        public string? CategoryName { get; set; }
        public bool IsActive { get; set; } = true;
        public double AverageRating { get; set; } 
        public int ReviewCount { get; set; } 

        public List<int> TagIds { get; set; } = new();
        public List<string> Tags { get; set; } = new();
        public List<PlaceImageDto> Images { get; set; } = new();

        public double? DistanceKm { get; set; }

        /// <summary>เป็นอีเวนต์ชั่วคราวหรือไม่ (เวลาเป็น UTC)</summary>
        public bool IsEvent { get; set; }
        // EF คืนเวลาแบบไม่ระบุ Kind ต้องระบุเป็น UTC ไม่งั้น JSON ไม่มี "Z" แล้วหน้าเว็บตีเป็นเวลาท้องถิ่น (เพี้ยน 7 ชั่วโมง)
        private DateTime? _eventStartAt;
        private DateTime? _eventEndAt;
        public DateTime? EventStartAt
        {
            get => _eventStartAt;
            set => _eventStartAt = value.HasValue ? DateTime.SpecifyKind(value.Value, DateTimeKind.Utc) : null;
        }
        public DateTime? EventEndAt
        {
            get => _eventEndAt;
            set => _eventEndAt = value.HasValue ? DateTime.SpecifyKind(value.Value, DateTimeKind.Utc) : null;
        }

        /// <summary>null = ไม่ใช่อีเวนต์ | upcoming = ยังไม่เริ่ม | active = กำลังแสดง | ended = จบแล้ว</summary>
        public string? EventStatus { get; set; }

    }
}
