namespace TravelKanjanuburi.Model
{
    public class Paged
    {
        public record PagedQuery(int Page = 1, int PageSize = 20, string? Search = null, string? Category = null,
        // Near me
        double? Lat = null,
        double? Lng = null,
        double? RadiusKm = null,
        // true = เฉพาะสถานที่ที่เป็นอีเวนต์ (หน้า "อีเวนต์" บน Navbar)
        bool? EventOnly = null);
        public record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, long Total);
    }
}
