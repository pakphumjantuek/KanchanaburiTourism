using TravelKanjanuburi.ML.Food.FeatureEngineering;
using TravelKanjanuburi.ML.Food.Models;
using TravelKanjanuburi.Model.Log;

namespace TravelKanjanuburi.ML.Food.Training
{
    public class FoodTrainingDataBuilderService
    {
        private readonly ApplicationDbContext _context;
        private readonly FoodFeatureBuilderService _featureBuilder;

        // ต้องตรงกับตอนทำนาย (FoodPopularityPredictionService ใช้ฟีเจอร์ 60 วันล่าสุด)
        public const int FeatureWindowDays = 60;
        public const int LabelWindowDays = 30;
        public const int StepDays = 7;

        public FoodTrainingDataBuilderService(
            ApplicationDbContext context,
            FoodFeatureBuilderService featureBuilder)
        {
            _context = context;
            _featureBuilder = featureBuilder;
        }

        /// จำนวน window ที่สร้างได้ในรอบล่าสุด (ใช้รายงานผล)
        public int LastWindowCount { get; private set; }

        /// <summary>
        /// Sliding window: เลื่อนจุดตัด e ทีละ StepDays
        /// ฟีเจอร์ = ล็อก [e-60d, e)  ป้าย = ความนิยมใน [e, e+30d)
        /// คืนแถวเรียงจากเก่า → ใหม่ เพื่อให้ผู้เรียกแบ่ง train/test ตามเวลาได้
        /// </summary>
        public async Task<List<FoodPopularityData>> BuildTrainingDataAsync()
        {
            LastWindowCount = 0;
            var trainingRows = new List<FoodPopularityData>();

            var now = DateTime.UtcNow;

            var earliest = await _context.BehaviorLogs
                .Where(l => l.DishId != null && (l.PlaceId == null || !l.Place.IsEvent))
                .MinAsync(l => (DateTime?)l.CreatedAt);

            if (earliest == null)
                return trainingRows;

            // ป้ายต้องเห็นอนาคตครบ 30 วัน จึงเริ่มจุดตัดล่าสุดที่ now-30d แล้วถอยทีละสัปดาห์
            var cutoffs = new List<DateTime>();
            for (var e = now.AddDays(-LabelWindowDays); e.AddDays(-FeatureWindowDays) >= earliest.Value; e = e.AddDays(-StepDays))
                cutoffs.Add(e);
            cutoffs.Reverse();

            if (cutoffs.Count == 0)
                return trainingRows;

            // โหลดล็อกอนาคตครั้งเดียวทั้งช่วง แล้วคัดตาม window ในหน่วยความจำ
            var labelStart = cutoffs.First();
            var allDishLogs = await _context.BehaviorLogs
                .Where(l => l.DishId != null && (l.PlaceId == null || !l.Place.IsEvent) && l.CreatedAt >= labelStart)
                .Select(l => new { DishId = l.DishId!.Value, l.CreatedAt, l.ActionType, l.ActionValue })
                .ToListAsync();

            foreach (var cutoff in cutoffs)
            {
                var labelEnd = cutoff.AddDays(LabelWindowDays);

                var featureRows = await _featureBuilder.BuildFeaturesAsync(
                    cutoff.AddDays(-FeatureWindowDays), cutoff, asOfUtc: cutoff);

                var futureByDish = allDishLogs
                    .Where(l => l.CreatedAt >= cutoff && l.CreatedAt < labelEnd)
                    .GroupBy(l => l.DishId)
                    .ToDictionary(g => g.Key, g => g.Sum(l => GetFutureWeight(l.ActionType, l.ActionValue)));

                int kept = 0;
                foreach (var row in featureRows)
                {
                    futureByDish.TryGetValue((int)row.DishId, out var futureScore);
                    row.Label = futureScore > 0 ? MathF.Log(1 + futureScore) : 0;

                    if (row.TotalActivity > 0 || row.Label > 0)
                    {
                        trainingRows.Add(row);
                        kept++;
                    }
                }

                if (kept > 0) LastWindowCount++;
            }

            return trainingRows;
        }

        private float GetFutureWeight(
            BehaviorActionType action,
            double? rating = null)
        {
            return action switch
            {
                BehaviorActionType.View => 1,
                BehaviorActionType.Favorite => 5,
                BehaviorActionType.Review => rating.HasValue
                    ? (float)(6 * (rating.Value / 5.0))
                    : 5,
                _ => 0
            };
        }
    }
}
