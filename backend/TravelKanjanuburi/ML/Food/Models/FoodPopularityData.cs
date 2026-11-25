using Microsoft.ML.Data;

namespace TravelKanjanuburi.ML.Food.Models
{
    public class FoodPopularityData
    {
        public float ViewCount30d { get; set; }

        public float FavoriteCount30d { get; set; }

        public float ReviewCount30d { get; set; }

        public float AvgRating { get; set; }

        public float GrowthRate { get; set; }

        public float RecencyScore { get; set; }

        public float TotalActivity { get; set; }

        public float DaysSinceLastActivity { get; set; }
        public float TotalActivityLog { get; set; }

        // ========= Label =========
        [ColumnName("Label")]
        public float Label { get; set; }

        // ไม่ใช้เป็น feature แต่เก็บไว้ reference
        public uint DishId { get; set; }
    }
}
