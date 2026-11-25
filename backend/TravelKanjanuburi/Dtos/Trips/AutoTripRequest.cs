namespace TravelKanjanuburi.Dtos.Trips
{
    public class AutoTripRequest
    {
        public DateTime StartDateTime { get; set; }          // เดิมของคุณ
        public int Days { get; set; } = 1;                   // เดิมของคุณ
        public int HoursPerDay { get; set; } = 8;            // เดิมของคุณ
        public double? StartLat { get; set; }                // เดิมของคุณ
        public double? StartLng { get; set; }                // เดิมของคุณ
        public string? TransportMode { get; set; }           // เดิมของคุณ

        // ✅ เพิ่มใหม่: tag ที่ผู้ใช้เลือก (ใช้ Tag.TagName)
        public List<int> PreferredCategoryIds { get; init; } = new();

        // ✅ เพิ่มใหม่: 0..1 (0 แน่น / 1 ชิล)
        public double RelaxedPace { get; set; } = 0.5;

        // ✅ เพิ่มใหม่: 0..1 (0 ประหยัด / 1 แพงได้)
        public double BudgetLevel { get; set; } = 0.5;

        // ✅ เพิ่มใหม่: มีเด็ก/ผู้สูงอายุ
        public bool WithElderOrKids { get; set; } = false;
    }

    //public sealed class TripPreference
    //{
    //    public HashSet<string> PreferredTags { get; init; }
    //        = new(StringComparer.OrdinalIgnoreCase);

    //    public double RelaxedPace { get; init; }
    //    public bool WithElderOrKids { get; init; }
    //    public double BudgetLevel { get; init; }
    //}
    public sealed class AutoTripResponseDto
    {
        public int TripId { get; set; }
        public string Title { get; set; } = "";
        public DateTime StartDateTime { get; set; }
        public DateTime EndDateTime { get; set; }
    }


}
