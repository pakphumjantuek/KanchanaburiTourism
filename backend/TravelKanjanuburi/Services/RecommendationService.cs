

namespace TravelKanjanuburi.Services
{
    public class RecommendationService
    {
        private readonly ApplicationDbContext _context;
        private readonly CategoryPredictionService _predictionService;

        public RecommendationService(
            ApplicationDbContext context,
            CategoryPredictionService predictionService)
        {
            _context = context;
            _predictionService = predictionService;
        }

        public async Task<List<Place>> GetRecommendationsAsync(int userId, int topN)
        {
            var distribution = await _predictionService.PredictDistributionAsync(userId);

            var categories = await _context.PlaceCategories
                .OrderBy(c => c.CategoryId)
                .ToListAsync();

            var results = new List<Place>();

            for (int i = 0; i < distribution.Length; i++)
            {
                int takeCount = (int)Math.Round(distribution[i] * topN);

                if (takeCount <= 0)
                    continue;

                var categoryId = categories[i].CategoryId;

                var places = await _context.Places
                    .Where(PlaceVisibility.VisibleNow())
                    .Where(p => p.CategoryId == categoryId)
                    .OrderByDescending(p => p.PopularityScore)
                    .Take(takeCount)
                    .ToListAsync();

                results.AddRange(places);
            }

            return results
                .OrderByDescending(p => p.PopularityScore)
                .Take(topN)
                .ToList();
        }

    }
}
