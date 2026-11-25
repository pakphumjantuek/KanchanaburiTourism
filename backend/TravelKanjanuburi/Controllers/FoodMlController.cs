using TravelKanjanuburi.ML.Food.Training;
using TravelKanjanuburi.ML.Food.Prediction;

namespace TravelKanjanuburi.Controllers
{
    [ApiController]
    [Route("api/ml/foods")]
    public class FoodMlController : ControllerBase
    {
        private readonly FoodLightGbmTrainingService _trainingService;
        private readonly FoodPopularityPredictionService _predictionService;

        public FoodMlController(
            FoodLightGbmTrainingService trainingService,
            FoodPopularityPredictionService predictionService)
        {
            _trainingService = trainingService;
            _predictionService = predictionService;
        }

        // ============================================
        // 1️⃣ Train Model
        // ============================================

        [HttpPost("train")]
        public async Task<IActionResult> Train()
        {
            var result = await _trainingService.TrainAndSaveModelAsync();
            return Ok(new
            {
                IsSuccess = true,
                Message = "Food model trained successfully",
                Data = result
            });
        }

        // ============================================
        // 2️⃣ Get Trending Foods
        // ============================================

        [HttpGet("trending")]
        public async Task<IActionResult> GetTrending([FromQuery] int topN = 10)
        {
            if (topN <= 0 || topN > 50)
                topN = 10;

            var result = await _predictionService
                .GetTrendingFoodsAsync(topN);

            var response = result.Select((x, index) => new
            {
                Rank = index + 1,
                DishId = x.Dish.DishId,
                NameTH = x.Dish.NameTH,
                NameEN = x.Dish.NameEN,
                Origin = x.Dish.Origin,
                SpicyLevel = x.Dish.SpicyLevel,
                Score = MathF.Round(x.Score, 4)
            });

            return Ok(new
            {
                IsSuccess = true,
                Total = response.Count(),
                Items = response
            });
        }
    }
}