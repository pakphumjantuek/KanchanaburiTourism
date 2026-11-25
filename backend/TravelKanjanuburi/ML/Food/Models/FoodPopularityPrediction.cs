using Microsoft.ML.Data;

namespace TravelKanjanuburi.ML.Food.Models
{
    public class FoodPopularityPrediction
    {
        [ColumnName("Score")]
        public float Score { get; set; }
    }
}
