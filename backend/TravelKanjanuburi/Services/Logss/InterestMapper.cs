namespace TravelKanjanuburi.Helper
{
    public interface IInterestMapper
    {
        HashSet<string> MapToInterestKeys(int? categoryId, List<int> tagIds, string? metaJson);
    }

    public sealed class InterestMapper : IInterestMapper
    {
        public HashSet<string> MapToInterestKeys(int? categoryId, List<int> tagIds, string? metaJson)
        {
            var keys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            // ✅ สนใจจาก "ประเภทสถานที่จริง"
            if (categoryId is > 0)
                keys.Add($"cat:{categoryId.Value}");

            // (optional) ถ้าจะเก็บ tag ด้วยในอนาคต:
            // foreach (var tid in tagIds) keys.Add($"tag:{tid}");

            return keys;
        }
    }
}
