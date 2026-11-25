using System.Text.Json;

namespace TravelKanjanuburi.ML.Models
{
    /// สถิติระดับหมวดที่เรียนรู้จากชุดเทรน (ค่าเฉลี่ยป้ายต่อหมวด + สัดส่วนกิจกรรมทั้งระบบ)
    /// ต้องบันทึกคู่กับโมเดล เพราะฟีเจอร์เชิงเปรียบเทียบตอนทำนายต้องใช้ค่าชุดเดียวกับตอนเทรน
    public sealed class CategoryFeatureStats
    {
        public double[] Prior { get; set; } = Array.Empty<double>();
        public double[] GlobalShare { get; set; } = Array.Empty<double>();

        public const string FileName = "category_feature_stats.json";

        private static readonly object _gate = new();
        private static CategoryFeatureStats? _cached;
        private static DateTime _cachedStamp;

        public static string PathFor(string contentRoot) => Path.Combine(contentRoot, "MLModels", FileName);

        public void Save(string contentRoot)
        {
            var path = PathFor(contentRoot);
            Directory.CreateDirectory(Path.GetDirectoryName(path)!);
            var tmp = path + ".tmp";
            File.WriteAllText(tmp, JsonSerializer.Serialize(this));
            File.Move(tmp, path, overwrite: true);
        }

        /// คืน null ถ้าไม่มีไฟล์ (เช่นโมเดลรุ่นเก่าที่ไม่ใช้ฟีเจอร์ใหม่) — แคชตามเวลาแก้ไขไฟล์ เพื่อไม่ต้องอ่านดิสก์ทุก request
        public static CategoryFeatureStats? Load(string contentRoot)
        {
            var path = PathFor(contentRoot);
            if (!File.Exists(path)) return null;

            var stamp = File.GetLastWriteTimeUtc(path);
            lock (_gate)
            {
                if (_cached != null && _cachedStamp == stamp) return _cached;
                _cached = JsonSerializer.Deserialize<CategoryFeatureStats>(File.ReadAllText(path));
                _cachedStamp = stamp;
                return _cached;
            }
        }

        /// ใส่ฟีเจอร์เชิงเปรียบเทียบให้แถวทั้งหมดของผู้ใช้หนึ่งคน (หนึ่งแถวต่อหมวด เรียงตาม CategoryIndex)
        /// ใช้ฟังก์ชันเดียวกันทั้งตอนเทรนและตอนทำนาย เพื่อไม่ให้ฟีเจอร์ไม่ตรงกัน
        public void Apply(IReadOnlyList<UserCategoryRankingData> userRows)
        {
            int n = userRows.Count;
            if (n == 0 || Prior.Length != n || GlobalShare.Length != n) return;

            float maxRatio = userRows.Max(r => r.CategoryRatio);

            foreach (var r in userRows)
            {
                int c = (int)r.CategoryIndex;
                if (c < 0 || c >= n) continue;

                r.CategoryPrior = (float)Prior[c];
                r.RatioLift = (float)(r.CategoryRatio / Math.Max(1e-6, GlobalShare[c]));
                r.RatioRank = userRows.Count(x => x.CategoryRatio > r.CategoryRatio);
                r.ScoreRank = userRows.Count(x => x.CurrentCategoryScore > r.CurrentCategoryScore);
                r.GapToMaxRatio = maxRatio - r.CategoryRatio;
                r.PriorRank = Prior.Count(p => p > Prior[c]);
                r.LogTotalActivity = MathF.Log(1 + r.TotalUserActivity);
            }
        }
    }
}
