using TravelKanjanuburi.Dtos.BehaviorLog;

namespace TravelKanjanuburi.Services.Trips
{
    /// <summary>
    /// แหล่งคะแนนสถานที่สำหรับตัวจัดทริป โดยใช้การแจกแจงความสนใจรายหมวดจาก LightGBM
    /// คะแนนสถานที่ = sqrt(ความน่าจะเป็นของหมวดนั้น) (ผู้ใช้ที่ยังไม่มีพฤติกรรมเลย หรือโมเดลยังไม่พร้อม
    /// จะได้คะแนน 0 ทุกที่ และตัวจัดทริปจะอาศัยหมวดที่เลือก ความนิยม ระยะทาง และเวลาเปิด-ปิดแทน)
    /// สถานที่ในหมวดเดียวกันได้คะแนนเท่ากัน จึงเรียงต่อด้วยความนิยมก่อนตัดเหลือ topN
    /// </summary>
    public sealed class CategoryPlaceRecommender : IPlaceRecommender
    {
        private readonly ApplicationDbContext _db;
        private readonly CategoryPredictionService _ml;
        private readonly ILogger<CategoryPlaceRecommender> _log;

        public CategoryPlaceRecommender(ApplicationDbContext db, CategoryPredictionService ml, ILogger<CategoryPlaceRecommender> log)
        {
            _db = db;
            _ml = ml;
            _log = log;
        }

        public async Task<List<PlaceRecommendDto>> RecommendPersonalAsync(
            int userId, int topN, double? lat, double? lng, CancellationToken ct, bool forTrip = false)
        {
            float[] dist;
            try
            {
                dist = await _ml.PredictDistributionAsync(userId);
            }
            catch (Exception ex)
            {
                // โมเดลยังไม่พร้อม/ฟีเจอร์ไม่ตรง: ไม่ให้การจัดทริปล้มทั้งหมด ใช้คะแนน 0 แล้วจัดตามหมวดที่เลือกและระยะทาง
                _log.LogWarning(ex, "ใช้คะแนนโมเดลไม่ได้ จัดทริปโดยไม่ใช้คะแนน ML");
                dist = Array.Empty<float>();
            }

            var sum = dist.Sum();
            if (sum > 0) dist = dist.Select(x => x / sum).ToArray();

            var categoryIds = await _db.PlaceCategories.AsNoTracking()
                .OrderBy(c => c.CategoryId).Select(c => c.CategoryId).ToListAsync(ct);
            var index = categoryIds.Select((id, i) => (id, i)).ToDictionary(x => x.id, x => x.i);

            var places = await _db.Places.AsNoTracking().Where(PlaceVisibility.VisibleNow()).Where(p => p.IsActive).ToListAsync(ct);

            return places
                .Select(p => new PlaceRecommendDto
                {
                    PlaceId = p.PlaceId,
                    Name = p.Name,
                    Latitude = p.Latitude,
                    Longitude = p.Longitude,
                    CategoryId = p.CategoryId ?? 0,
                    PopularityScore = p.PopularityScore,
                    Score = p.CategoryId.HasValue && index.TryGetValue(p.CategoryId.Value, out var i) && i < dist.Length
                        ? Math.Sqrt(dist[i])
                        : 0.0
                })
                .OrderByDescending(x => x.Score)
                .ThenByDescending(x => x.PopularityScore)
                .ThenBy(x => x.PlaceId)
                .Take(Math.Max(topN, 1))
                .ToList();
        }
    }
}
