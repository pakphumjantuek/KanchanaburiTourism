using TravelKanjanuburi.ML.Food.Models;
using TravelKanjanuburi.Model.Log;

namespace TravelKanjanuburi.ML.Food.FeatureEngineering
{
    public class FoodFeatureBuilderService
    {
        private readonly ApplicationDbContext _context;

        private const double Lambda = 0.05; // time decay

        public FoodFeatureBuilderService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<FoodPopularityData>> BuildFeaturesAsync(
            DateTime fromUtc,
            DateTime toUtc,
            DateTime? asOfUtc = null)
        {
            var dishes = await _context.LocalDishes
                .Where(d => d.IsActive)
                .ToListAsync();

            var logs = await _context.BehaviorLogs
                .Where(l =>
                    l.DishId != null &&
                    (l.PlaceId == null || !l.Place.IsEvent) &&
                    l.CreatedAt >= fromUtc &&
                    l.CreatedAt < toUtc)
                .ToListAsync();

            // ตอนเทรนต้องส่งจุดสิ้นสุด window เพื่อให้ time decay / daysSince ไม่ขึ้นกับวันที่รันเทรน
            var now = asOfUtc ?? DateTime.UtcNow;

            var result = new List<FoodPopularityData>();

            foreach (var dish in dishes)
            {
                var dishLogs = logs
                    .Where(l => l.DishId == dish.DishId)
                    .ToList();

                if (!dishLogs.Any())
                {
                    result.Add(new FoodPopularityData
                    {
                        DishId = (uint)dish.DishId
                    });
                    continue;
                }

                float viewCount = 0;
                float favoriteCount = 0;
                float reviewCount = 0;
                float ratingSum = 0;
                int ratingCounter = 0;
                float recencyScore = 0;

                foreach (var log in dishLogs)
                {
                    var daysOld = (now - log.CreatedAt).TotalDays;
                    var decay = Math.Exp(-Lambda * daysOld);

                    switch (log.ActionType)
                    {
                        case BehaviorActionType.View:
                            viewCount += 1;
                            break;

                        case BehaviorActionType.Favorite:
                            favoriteCount += 1;
                            break;

                        case BehaviorActionType.Review:
                            reviewCount += 1;
                            if (log.ActionValue.HasValue)
                            {
                                ratingSum += (float)log.ActionValue.Value;
                                ratingCounter++;
                            }
                            break;
                    }

                    recencyScore += (float)decay;
                }

                float avgRating = ratingCounter > 0
                    ? ratingSum / ratingCounter
                    : 0;

                float totalActivity =
                    viewCount +
                    favoriteCount +
                    reviewCount;

                var lastLogDate = dishLogs
                    .OrderByDescending(l => l.CreatedAt)
                    .FirstOrDefault()?.CreatedAt;

                float daysSinceLastActivity = lastLogDate.HasValue
                    ? (float)(now - lastLogDate.Value).TotalDays
                    : 999f;

                // ===== Growth Rate =====
                var midPoint = fromUtc.AddDays((toUtc - fromUtc).TotalDays / 2);

                var firstHalf = dishLogs
                    .Where(l => l.CreatedAt < midPoint)
                    .Count();

                var secondHalf = dishLogs
                    .Where(l => l.CreatedAt >= midPoint)
                    .Count();

                float growthRate = firstHalf > 0
                    ? (float)(secondHalf - firstHalf) / firstHalf
                    : 0;

                result.Add(new FoodPopularityData
                {
                    DishId = (uint)dish.DishId,

                    ViewCount30d = MathF.Round(viewCount, 2),
                    FavoriteCount30d = MathF.Round(favoriteCount, 2),
                    ReviewCount30d = MathF.Round(reviewCount, 2),
                    AvgRating = MathF.Round(avgRating, 2),
                    GrowthRate = MathF.Round(growthRate, 3),
                    RecencyScore = MathF.Round(recencyScore, 3),
                    TotalActivity = MathF.Round(totalActivity, 2),
                    TotalActivityLog = MathF.Log(1 + totalActivity),
                    DaysSinceLastActivity = MathF.Round(daysSinceLastActivity, 1)
                });
//                Console.WriteLine(
//    $"{dish.DishId} | " +
//    $"{viewCount} | " +
//    $"{favoriteCount} | " +
//    $"{reviewCount} | " +
//    $"{avgRating} | " +
//    $"{growthRate} | " +
//    $"{recencyScore}"
//);
            }

            return result;
        }
    }
}