using Microsoft.ML.Data;

namespace TravelKanjanuburi.ML.Models
{
    public class UserCategoryRankingData
    {
        public float Label { get; set; }

        public float CurrentCategoryScore { get; set; }
        public float CategoryRatio { get; set; }
        public float TotalUserActivity { get; set; }
        public float RecencyScore { get; set; }
        public float CategoryIndex { get; set; }

        // ฟีเจอร์เชิงเปรียบเทียบ (คำนวณจาก 7 หมวดของผู้ใช้คนเดียวกัน + สถิติหมวดจากชุดเทรน) ดู CategoryFeatureStats.Apply
        public float CategoryPrior { get; set; }
        public float RatioLift { get; set; }
        public float RatioRank { get; set; }
        public float ScoreRank { get; set; }
        public float GapToMaxRatio { get; set; }
        public float PriorRank { get; set; }
        public float LogTotalActivity { get; set; }

        [KeyType(count: 100000)]
        public uint GroupId { get; set; }
    }
}
