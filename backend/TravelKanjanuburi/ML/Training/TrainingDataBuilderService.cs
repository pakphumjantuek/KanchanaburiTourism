using TravelKanjanuburi.ML.Models;
using TravelKanjanuburi.Model.Log;
using TravelKanjanuburi.Services.FeatureEngineering;

namespace TravelKanjanuburi.ML.Training
{
    public class TrainingDataBuilderService
    {
        private readonly ApplicationDbContext _context;
        private readonly UserFeatureBuilderService _featureBuilder;
        private const double Lambda = 0.05;
        public TrainingDataBuilderService(
            ApplicationDbContext context,
            UserFeatureBuilderService featureBuilder)
        {
            _context = context;
            _featureBuilder = featureBuilder;
        }

        /// คะแนนกิจกรรมอนาคต (30 วัน) ต่อหมวดของผู้ใช้แต่ละคนจากการสร้างข้อมูลรอบล่าสุด ใช้สำหรับประเมินแบบ "เกินกว่าความนิยมหมวด" เท่านั้น
        public Dictionary<uint, float[]> LastFutureScores { get; } = new();

        /// ผู้ใช้ต้องมีล็อกสถานที่อย่างน้อย 2 รายการ: รายการแรกเป็น "อดีต" (ฟีเจอร์) รายการถัดไปเป็น "อนาคต" (ป้าย)
        /// ผู้ใช้ที่มีล็อกเดียวไม่มีอดีตให้โมเดลเรียนรู้ จึงเทรนไม่ได้ (เดิมบังคับ 15 รายการ ทำให้ตัดคนที่ใช้น้อยทิ้งโดยไม่จำเป็น)
        public const int MinLogsPerUser = 2;

        /// สถิติผู้ใช้ของการสร้างข้อมูลรอบล่าสุด (ใช้รายงานหน้าแอดมินว่าใครถูกใช้/ถูกข้ามเพราะอะไร)
        public TrainingUserStats LastUserStats { get; private set; } = new();

        public sealed class TrainingUserStats
        {
            public int UsersWithActivity { get; set; }       // ผู้ใช้ที่มีกิจกรรมใดๆ ในระบบ
            public int Trained { get; set; }                  // ผู้ใช้ที่ถูกใช้เทรน
            public int SkippedTooFewLogs { get; set; }        // ล็อกสถานที่น้อยกว่า MinLogsPerUser
            public int SkippedNoPast { get; set; }            // มีล็อกพอ แต่ไม่มีข้อมูลอดีตที่คำนวณฟีเจอร์ได้
        }

        public async Task<List<UserCategoryRankingData>> BuildTrainingDataAsync()
        {
            LastFutureScores.Clear();
            LastUserStats = new TrainingUserStats();
            var trainingRows = new List<UserCategoryRankingData>();

            // 1️⃣ โหลด categories ทั้งหมด
            var categories = await _context.PlaceCategories
                .OrderBy(c => c.CategoryId)
                .ToListAsync();

            var categoryIndexMap = categories
                .Select((c, index) => new { c.CategoryId, index })
                .ToDictionary(x => x.CategoryId, x => x.index);

            // 2️⃣ โหลด user ทั้งหมดที่มี behavior
            // สถานที่ที่เป็นอีเวนต์ไม่นำมาเทรน (ทั้งตอนหา user และตอนสร้างตัวอย่าง)
            var userIds = await _context.BehaviorLogs
                .Where(x => x.UserId != null && (x.PlaceId == null || !x.Place.IsEvent))
                .Select(x => x.UserId!.Value)
                .Distinct()
                .ToListAsync();

            LastUserStats.UsersWithActivity = userIds.Count;

            foreach (var userId in userIds)
            {
                // 3️⃣ โหลด log ของ user เรียงตามเวลา
                var userLogs = await _context.BehaviorLogs
                    .Include(x => x.Place)
                    .Where(x => x.UserId == userId && x.PlaceId != null && !x.Place.IsEvent)
                    .OrderBy(x => x.CreatedAt)
                    .ToListAsync();

                // กัน user ที่ยังไม่มีทั้งอดีตและอนาคตให้เรียนรู้
                if (userLogs.Count < MinLogsPerUser)
                {
                    LastUserStats.SkippedTooFewLogs++;
                    continue;
                }

                // 4️⃣ หา split point (70% แรกเป็น feature)
                int splitIndex = (int)(userLogs.Count * 0.7);

                var splitTime = userLogs[splitIndex].CreatedAt;

                var featureFrom = DateTime.MinValue;
                var featureTo = splitTime;

                var labelFrom = splitTime;
                var labelTo = splitTime.AddDays(30); // อนาคต 30 วัน


                // 5️⃣ สร้าง feature vector จากอดีต
                // time decay คิดจาก splitTime (ไม่ใช่เวลาที่รันเทรน) ไม่งั้นข้อมูลเก่าจะถูกถ่วงจนเป็นศูนย์
                var featureVector = await _featureBuilder
                    .BuildUserFeatureAsync(userId, featureFrom, featureTo, asOfUtc: featureTo);

                if (featureVector.All(x => x == 0))
                {
                    LastUserStats.SkippedNoPast++;
                    continue;
                }

                LastUserStats.Trained++;

                var pastLogs = userLogs
                .Where(x => x.CreatedAt < featureTo)
                .ToList();

                var lastInteractionByCategory = pastLogs
                    .Where(x => x.Place?.CategoryId != null)
                    .GroupBy(x => x.Place!.CategoryId!.Value)
                    .ToDictionary(
                        g => g.Key,
                        g => g.Max(x => x.CreatedAt)
                    );

                float totalFeatureActivity = featureVector.Sum();

                // 6️⃣ สร้าง future label score
                var futureCategoryScores = new float[categories.Count];

                var futureLogs = userLogs
                    .Where(x => x.CreatedAt >= labelFrom &&
                                x.CreatedAt < labelTo &&
                                x.Place?.CategoryId != null)
                    .ToList();

                foreach (var log in futureLogs)
                {
                    var catId = log.Place!.CategoryId!.Value;

                    if (!categoryIndexMap.ContainsKey(catId))
                        continue;

                    int idx = categoryIndexMap[catId];

                    // ใช้ weight เดิมเพื่อสะท้อนความแรงของ action
                    var weight = GetFutureWeight(log.ActionType, log.ActionValue);

                    futureCategoryScores[idx] += (float)weight;
                }

                float maxFutureScore = futureCategoryScores.Max();
                LastFutureScores[(uint)userId] = (float[])futureCategoryScores.Clone();

                // 7️⃣ สร้าง training row ต่อ category
                for (int i = 0; i < categories.Count; i++)
                {
                    float currentScore = featureVector[i];
                    float ratio = totalFeatureActivity > 0
                        ? currentScore / totalFeatureActivity
                        : 0;

                    float futureScore = futureCategoryScores[i];
                  
                    float normalizedFuture = maxFutureScore > 0
                          ? futureScore / maxFutureScore
                          : 0;

                    // Label จากอนาคตจริง ๆ
                    int label = normalizedFuture switch
                    {
                        < 0.05f => 0,
                        < 0.25f => 1,
                        < 0.6f => 2,
                        _ => 3
                    };

                    // คำนวณวันนับจาก interaction ล่าสุดใน category นี้
                    var categoryId = categories[i].CategoryId;

                    float recencyScore = 0f;

                    if (lastInteractionByCategory.ContainsKey(categoryId))
                    {
                        var lastDate = lastInteractionByCategory[categoryId];
                        var days = (featureTo - lastDate).TotalDays; // อ้างอิง splitTime เช่นเดียวกับฟีเจอร์

                        recencyScore = (float)Math.Exp(-Lambda * days);
                    }

                    trainingRows.Add(new UserCategoryRankingData
                    {
                        CurrentCategoryScore = MathF.Round(currentScore, 3),
                        CategoryRatio = MathF.Round(ratio, 4),
                        TotalUserActivity = MathF.Round(totalFeatureActivity, 3),
                        CategoryIndex = i,
                        RecencyScore = MathF.Round(recencyScore, 4),
                        Label = label,
                        GroupId = (uint)userId
                    });
                }
            }

            return trainingRows;
        }


        public async Task<string> ExportDatasetToCsvAsync(string filePath)
        {
            var rows = await BuildTrainingDataAsync();

            if (!rows.Any())
                throw new Exception("No training data to export.");

            var sb = new StringBuilder();

            // Header
            sb.AppendLine("UserId,CategoryIndex,Label,CurrentCategoryScore,CategoryRatio" +
                ",RecencyScore,TotalUserActivity,FutureScore");

            foreach (var row in rows)
            {
                // คะแนนกิจกรรมอนาคตจริงของหมวดนี้ (ใช้ทำป้าย lift ตอนทดลองออฟไลน์)
                float future = LastFutureScores.TryGetValue(row.GroupId, out var fut) && (int)row.CategoryIndex < fut.Length
                    ? fut[(int)row.CategoryIndex]
                    : 0f;

                sb.AppendLine(
                    $"{row.GroupId}," +
                    $"{row.CategoryIndex}," +
                    $"{row.Label}," +
                    $"{row.CurrentCategoryScore:F3}," +
                    $"{row.CategoryRatio:F4}," +
                    $"{row.RecencyScore:F4}," +
                    $"{row.TotalUserActivity:F3}," +
                    $"{future:F3}"
                );
            }

            await File.WriteAllTextAsync(filePath, sb.ToString());

            return filePath;
        }

        private double GetFutureWeight(BehaviorActionType action, double? rating = null)
        {
            return action switch
            {
                BehaviorActionType.View => 1,
                BehaviorActionType.Click => 2,
                BehaviorActionType.Search => 2,
                BehaviorActionType.Favorite => 5,
                BehaviorActionType.AddToTrip => 7,
                BehaviorActionType.Review => rating.HasValue
                    ? 6 * (rating.Value / 5.0)
                    : 5,

                BehaviorActionType.Skip => -1,
                BehaviorActionType.NotInterested => -2,
                BehaviorActionType.QuickBounce => -2,

                _ => 0
            };
        }



    }
}
