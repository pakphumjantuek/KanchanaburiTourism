using TravelKanjanuburi.Dtos.BehaviorLog;

namespace TravelKanjanuburi.Dtos.Home
{
    public sealed class HomeSectionDto
    {
        public string Key { get; set; } = "";
        public string Title { get; set; } = "";

        // 👇 รองรับหลายประเภท (Place / Food / อนาคต)
        public List<object> Items { get; set; } = new();
    }

    public class FoodRecommendDto
    {
        public int DishId { get; set; }
        public string NameTH { get; set; } = string.Empty;
        public float Score { get; set; }
        public string? CoverImageUrl { get; set; }

    }

    public sealed class HomeResponseDto
    {
        public bool IsSuccess { get; set; } = true;

        public List<HomeSectionDto> Sections { get; set; } = new();
    }
}