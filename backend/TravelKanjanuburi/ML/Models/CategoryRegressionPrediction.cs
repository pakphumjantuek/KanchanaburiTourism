using Microsoft.ML.Data;

namespace TravelKanjanuburi.ML.Models
{
    public class CategoryRegressionPrediction
    {
        [ColumnName("Score")]
        public float Score { get; set; }
    }
}
