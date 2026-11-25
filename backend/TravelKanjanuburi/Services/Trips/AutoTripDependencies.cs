using TravelKanjanuburi.Dtos.BehaviorLog;

namespace TravelKanjanuburi.Services.Trips
{
    /// <summary>แหล่งคะแนนแนะนำสถานที่ที่ตัวจัดทริปใช้ (แยกเป็น interface เพื่อให้ทดสอบโดยไม่ต้องใช้โมเดล ML/ฐานข้อมูลพฤติกรรม)</summary>
    public interface IPlaceRecommender
    {
        Task<List<PlaceRecommendDto>> RecommendPersonalAsync(
            int userId, int topN, double? lat, double? lng, CancellationToken ct, bool forTrip = false);
    }

    /// <summary>แหล่งระยะ/เวลาขับรถจริง คืน null เมื่อใช้ไม่ได้ (ผู้เรียก fallback เป็นเส้นตรง)</summary>
    public interface IRoadMatrixProvider
    {
        Task<RoadMatrix?> EnsureAsync(IEnumerable<Place> places, CancellationToken ct);
    }
}
