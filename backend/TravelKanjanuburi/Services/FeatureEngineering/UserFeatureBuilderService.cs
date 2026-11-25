
using global::TravelKanjanuburi.Model.Log;

namespace TravelKanjanuburi.Services.FeatureEngineering
{
    public class UserFeatureBuilderService
    {
        private readonly ApplicationDbContext _context;

        public UserFeatureBuilderService(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <param name="asOfUtc">
        /// เวลาอ้างอิงของ time decay: ตอนเทรนต้องส่ง "จุดแบ่งข้อมูล" (splitTime) เพื่อไม่ให้ค่าฟีเจอร์ขึ้นกับวันที่รันเทรน
        /// ตอนใช้งานจริง (ทำนาย) ไม่ต้องส่ง จะใช้เวลาปัจจุบัน
        /// </param>
        public async Task<float[]> BuildUserFeatureAsync(int userId, DateTime fromUtc, DateTime toUtc, DateTime? asOfUtc = null)
        {
            // 1️⃣ ดึง category ทั้งหมด
            var categories = await _context.PlaceCategories
                .OrderBy(c => c.CategoryId)
                .ToListAsync();

            int categoryCount = categories.Count;

            // 🔥 สร้าง feature vector
            float[] features = new float[categoryCount];

            // map categoryId → index
            var categoryIndexMap = categories
                .Select((c, index) => new { c.CategoryId, index })
                .ToDictionary(x => x.CategoryId, x => x.index);

            // 2️⃣ ดึง behavior log
            var logs = await _context.BehaviorLogs
                    .Include(l => l.Place)
                    .Where(l =>
                        l.UserId == userId &&
                        l.PlaceId != null &&
                        !l.Place.IsEvent &&
                        l.CreatedAt >= fromUtc &&
                        l.CreatedAt < toUtc)
                    .ToListAsync();

            var now = asOfUtc ?? DateTime.UtcNow;
            const double Lambda = 0.05; // 🔥 ปรับค่าได้

            foreach (var log in logs)
            {
                if (log.Place == null)
                    continue;

                if (!categoryIndexMap.ContainsKey(log.Place.CategoryId!.Value))
                    continue;

                int categoryIndex = categoryIndexMap[log.Place.CategoryId.Value];

                // 🔥 จำนวนวันที่ผ่านมา
                var daysOld = (now - log.CreatedAt).TotalDays;

                // 🔥 Time Decay
                var decayWeight = Math.Exp(-Lambda * daysOld);

                // 🔥 Action Weight
                var actionWeight = GetWeight(log.ActionType, log.ActionValue);
            
                features[categoryIndex] += (float)(actionWeight * decayWeight);
            }

            return features;
        }

        private double GetWeight(BehaviorActionType action, double? rating = null)
        {
            return action switch
            {
                // 🔵 Weak positive
                BehaviorActionType.View => 1,
                BehaviorActionType.Click => 3,
                BehaviorActionType.Search => 2,

                // 🟢 Strong positive
                BehaviorActionType.Favorite => 6,
                BehaviorActionType.AddToTrip => 8,
                BehaviorActionType.Review => GetReviewWeight(rating),

                // 🔴 Negative
                BehaviorActionType.Skip => -1,
                BehaviorActionType.NotInterested => -2,
                BehaviorActionType.QuickBounce => -2,

                _ => 0
            };
        }

        private double GetReviewWeight(double? rating)
        {
            if (!rating.HasValue)
                return 5;

            if (rating.Value <= 2)
                return -6; // 🔥 low rating = negative

            const double baseWeight = 8;
            return baseWeight * (rating.Value / 5.0);
        }




    }
}


