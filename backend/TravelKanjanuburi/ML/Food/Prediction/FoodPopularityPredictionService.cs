using Microsoft.Extensions.ML;
using TravelKanjanuburi.ML.Food.FeatureEngineering;
using TravelKanjanuburi.ML.Food.Models;
using TravelKanjanuburi.Model.Foods;

namespace TravelKanjanuburi.ML.Food.Prediction
{
    public class FoodPopularityPredictionService
    {
        private readonly ApplicationDbContext _context;
        private readonly FoodFeatureBuilderService _featureBuilder;
        private readonly PredictionEnginePool<
            FoodPopularityData,
            FoodPopularityPrediction> _predictionEnginePool;

        public FoodPopularityPredictionService(
     ApplicationDbContext context,
     FoodFeatureBuilderService featureBuilder,
     IServiceProvider serviceProvider)
        {
            _context = context;
            _featureBuilder = featureBuilder;

            _predictionEnginePool = serviceProvider
                .GetService<PredictionEnginePool<
                    FoodPopularityData,
                    FoodPopularityPrediction>>();
        }

        public async Task<List<(LocalDish Dish, float Score)>>
            GetTrendingFoodsAsync(int topN = 10)
        {
            if (_predictionEnginePool == null)
                throw new InvalidOperationException("Food ML model not loaded.");

            var now = DateTime.UtcNow;

            // ใช้ 60 วันล่าสุดเป็น feature
            var featureFrom = now.AddDays(-60);
            var featureTo = now;

            var featureRows = await _featureBuilder
                .BuildFeaturesAsync(featureFrom, featureTo);

            if (!featureRows.Any())
                return new List<(LocalDish, float)>();

            var dishes = await _context.LocalDishes
                .Where(d => d.IsActive)
                    .Include(d => d.LocalDishImages)   // 👈 สำคัญมาก
                .ToDictionaryAsync(d => d.DishId);

            var scoredList = new List<(LocalDish Dish, float Score)>();

            var rawScores = new List<(LocalDish Dish, float Score)>();

            foreach (var row in featureRows)
            {
                if (!dishes.ContainsKey((int)row.DishId))
                    continue;

                var prediction = _predictionEnginePool.Predict(row);

                // ===== Hybrid Score =====
                // prediction = log(1+คะแนนความนิยมที่คาดไว้ 30 วันข้างหน้า) เป็นตัวหลัก
                // ส่วนปรับทุกตัวต้องมีขอบเขต (<= ~0.5) ไม่งั้นจะกลบผลโมเดล (เดิม 0.1*TotalActivity ไม่จำกัดเพดาน)
                var finalScore =
                    prediction.Score
                    + 0.1f * row.AvgRating                              // 0..0.5
                    - 0.005f * Math.Min(row.DaysSinceLastActivity, 60f); // 0..-0.3

                rawScores.Add((
                    dishes[(int)row.DishId],
                    finalScore
                ));
            }

            return rawScores
       .OrderByDescending(x => x.Score)
       .Take(topN)
       .ToList();


        }
    }
}