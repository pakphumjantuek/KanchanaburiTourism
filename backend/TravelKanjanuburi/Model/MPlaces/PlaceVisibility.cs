using System.Linq.Expressions;

/// <summary>
/// สถานที่ที่ผู้ใช้ทั่วไปมองเห็นได้ ณ เวลานี้: สถานที่ปกติเห็นเสมอ ส่วนอีเวนต์เห็นเฉพาะช่วงเริ่ม–สิ้นสุด
/// (เลยเวลาสิ้นสุดแล้วหายเอง ไม่ต้องมีงานเบื้องหลัง) ใช้กับทุกคำสั่งที่เปิดสถานที่ให้ผู้ใช้เห็น
/// </summary>
public static class PlaceVisibility
{
    public static Expression<Func<Place, bool>> VisibleNow()
    {
        var now = DateTime.UtcNow;
        return p => !p.IsEvent ||
                    ((p.EventStartAt == null || p.EventStartAt <= now) &&
                     (p.EventEndAt == null || p.EventEndAt > now));
    }
}
