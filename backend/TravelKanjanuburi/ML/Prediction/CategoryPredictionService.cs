using Microsoft.Extensions.ML;
using TravelKanjanuburi.ML.Models;
using TravelKanjanuburi.Services.FeatureEngineering;

public class CategoryPredictionService
{
    private readonly UserFeatureBuilderService _featureBuilder;
    private readonly PredictionEnginePool<UserCategoryRankingData, CategoryRegressionPrediction>? _predictionEnginePool;
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _env;

    private const double Lambda = 0.05; // ต้องเหมือนตอน Train 100%

    public CategoryPredictionService(
        UserFeatureBuilderService featureBuilder,
        ApplicationDbContext context,
        IServiceProvider serviceProvider,
        IWebHostEnvironment env)
    {
        _featureBuilder = featureBuilder;
        _context = context;
        _env = env;

        // null ได้ถ้ายังไม่มีไฟล์โมเดล → PredictDistributionAsync คืนค่าว่าง แล้ว HomeService จะ fallback เป็นความนิยมรวม
        _predictionEnginePool = serviceProvider
            .GetService<PredictionEnginePool<UserCategoryRankingData, CategoryRegressionPrediction>>();
    }

    public async Task<float[]> PredictDistributionAsync(int userId)
    {
        if (_predictionEnginePool == null)
            return Array.Empty<float>();

        // ต้องใช้ช่วงข้อมูลเดียวกับตอนเทรน (ประวัติทั้งหมด; time decay ทำให้ข้อมูลเก่าลดน้ำหนักเอง)
        var featureFrom = DateTime.MinValue;
        var featureTo = DateTime.UtcNow;

        var userFeature = await _featureBuilder
            .BuildUserFeatureAsync(userId, featureFrom, featureTo);

        if (userFeature == null || userFeature.Length == 0)
            return Array.Empty<float>();

        if (userFeature.All(x => x == 0))
            return new float[userFeature.Length];

        var total = userFeature.Sum();

        // โหลดหมวด
        var categories = await _context.PlaceCategories
            .OrderBy(c => c.CategoryId)
            .ToListAsync();

        if (categories.Count != userFeature.Length)
            throw new Exception("Category count mismatch with feature vector.");

        var indexToCategoryId = categories
            .Select((c, index) => new { c.CategoryId, index })
            .ToDictionary(x => x.index, x => x.CategoryId);

        // 🔥 ดึง last interaction ต่อหมวด
        var lastInteractionByCategory = await _context.BehaviorLogs
            .Where(x => x.UserId == userId && x.PlaceId != null)
            .Include(x => x.Place)
            .Where(x => x.Place.CategoryId != null && !x.Place.IsEvent)
            .GroupBy(x => x.Place.CategoryId.Value)
            .Select(g => new
            {
                CategoryId = g.Key,
                LastDate = g.Max(x => x.CreatedAt)
            })
            .ToDictionaryAsync(x => x.CategoryId, x => x.LastDate);

        var inputs = new List<UserCategoryRankingData>();

        for (int i = 0; i < userFeature.Length; i++)
        {
            var score = userFeature[i];
            var ratio = total > 0 ? score / total : 0;
            var categoryId = indexToCategoryId[i];

            // 🔥 คำนวณ Recency ต่อหมวด
            float recencyScore = 0f;

            if (lastInteractionByCategory.ContainsKey(categoryId))
            {
                var lastDate = lastInteractionByCategory[categoryId];
                var days = (DateTime.UtcNow - lastDate).TotalDays;

                recencyScore = (float)Math.Exp(-Lambda * days);
            }

            var input = new UserCategoryRankingData
            {
                CurrentCategoryScore = score,
                CategoryRatio = ratio,
                TotalUserActivity = total,
                CategoryIndex = i,
                GroupId = (uint)userId,
                RecencyScore = recencyScore
            };

            inputs.Add(input);
        }

        // ฟีเจอร์เชิงเปรียบเทียบข้ามหมวด (rank/lift/prior) ใช้ฟังก์ชันและสถิติชุดเดียวกับตอนเทรน
        // ไม่มีไฟล์สถิติ = โมเดลรุ่นเก่าที่ไม่ใช้ฟีเจอร์เหล่านี้ จึงข้ามได้
        CategoryFeatureStats.Load(_env.ContentRootPath)?.Apply(inputs);

        var scores = inputs.Select(x => _predictionEnginePool.Predict(x).Score).ToList();

        // 🔥 Softmax
        // โมเดล regression ให้คะแนนในสเกลป้าย (~0-3) แคบกว่าโมเดล ranker เดิม (~-12 ถึง 2) จึงใช้ T=1.0
        // ให้ส่วนแบ่งหมวดอันดับ 1 เฉลี่ยราว 0.22 เท่ากับของเดิมที่ T=2.5 (วัดจากผู้ใช้ทั้งหมด) ไม่แบนเป็นเกือบเท่ากันทุกหมวด
        const double temperature = 1.0;

        var expScores = scores
            .Select(s => Math.Exp(s / temperature))
            .ToList();

        var sumExp = expScores.Sum();

        if (sumExp == 0)
            return new float[userFeature.Length];

        return expScores
            .Select(s => (float)(s / sumExp))
            .ToArray();
    }
}