using Microsoft.Extensions.ML;
using TravelKanjanuburi.ML.Models;
using TravelKanjanuburi.ML.Training;
using TravelKanjanuburi.Services;
using TravelKanjanuburi.Services.FeatureEngineering;

namespace TravelKanjanuburi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RecommendationController : ControllerBase
    {
        private readonly RecommendationService _recommendationService;
        private readonly LightGbmTrainingService _trainingService;
        private readonly UserFeatureBuilderService _featureBuilder;
        private readonly CategoryPredictionService _predictionService;
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;
        private readonly TrainingDataBuilderService _trainingDataBuilder;
        private readonly PredictionEnginePool<UserCategoryRankingData, CategoryRegressionPrediction>? _predictionEnginePool;

        public RecommendationController(RecommendationService recommendationService, LightGbmTrainingService 
            trainingService, UserFeatureBuilderService featureBuilder, 
            CategoryPredictionService predictionService, ApplicationDbContext context
            , IWebHostEnvironment env, TrainingDataBuilderService trainingDataBuilder,
            PredictionEnginePool<UserCategoryRankingData, CategoryRegressionPrediction>? predictionEnginePool = null)
        {
            _recommendationService = recommendationService;
            _trainingService = trainingService;
            _featureBuilder = featureBuilder;
            _predictionService = predictionService;
            _context = context;
            _env = env;
            _trainingDataBuilder = trainingDataBuilder;;
            _predictionEnginePool = predictionEnginePool;

        }


        // GET /api/recommendation/training-stats?days=90 (สถิติ log พฤติกรรมสำหรับ dashboard)
        [HttpGet("training-stats")]
        public async Task<IActionResult> TrainingStats([FromQuery] int days = 90, CancellationToken ct = default)
        {
            if (days is < 0 or > 3650) days = 90;
            var svc = HttpContext.RequestServices.GetRequiredService<TravelKanjanuburi.ML.TrainingStatsService>();
            var stats = await svc.GetAsync(days, ct);
            return Ok(new { isSuccess = true, stats });
        }

        [HttpGet("model-meta")]
        public IActionResult GetModelMeta()
        {
            var modelDirectory = Path.Combine(_env.ContentRootPath, "MLModels");
            var metaPath = Path.Combine(modelDirectory, "model_meta.json");

            if (!System.IO.File.Exists(metaPath))
                return NotFound("Model meta not found.");

            var json = System.IO.File.ReadAllText(metaPath);
            return Content(json, "application/json");
        }

        [HttpGet("debug/{userId}")]
        public async Task<IActionResult> DebugPrediction(int userId)
        {
            var categories = await _context.PlaceCategories
                .OrderBy(c => c.CategoryId)
                .Select(c => c.CategoryName)
                .ToListAsync();

            // ใช้ช่วงข้อมูลเดียวกับที่โมเดลใช้ทำนายจริง (ประวัติทั้งหมด ข้อมูลเก่าลดน้ำหนักเอง)
            // เดิมใช้ 90 วัน ทำให้ "คะแนนดิบ/อันดับพฤติกรรม" ในหน้านี้ไม่ได้เทียบกับสิ่งที่โมเดลเห็นจริง
            var featureFrom = DateTime.MinValue;
            var featureTo = DateTime.UtcNow;

            var rawFeature = await _featureBuilder
                .BuildUserFeatureAsync(userId, featureFrom, featureTo);

            var distribution = await _predictionService
                .PredictDistributionAsync(userId);

            if (rawFeature.Length != categories.Count ||
                distribution.Length != categories.Count)
            {
                return BadRequest("Vector size mismatch.");
            }

            var total = rawFeature.Sum();

            // ================================
            // 1️⃣ สร้าง Raw Ranking
            // ================================
            var rawRanking = rawFeature
                .Select((score, index) => new
                {
                    Index = index,
                    Score = score
                })
                .OrderByDescending(x => x.Score)
                .Select((x, rank) => new
                {
                    x.Index,
                    RawRank = rank + 1
                })
                .ToDictionary(x => x.Index, x => x.RawRank);

            // ================================
            // 2️⃣ สร้าง ML Ranking
            // ================================
            var mlRanking = distribution
                .Select((score, index) => new
                {
                    Index = index,
                    Score = score
                })
                .OrderByDescending(x => x.Score)
                .Select((x, rank) => new
                {
                    x.Index,
                    MLRank = rank + 1
                })
                .ToDictionary(x => x.Index, x => x.MLRank);

            // ================================
            // 3️⃣ รวม Comparison พร้อม Insight
            // ================================
            var comparison = categories
                .Select((name, index) =>
                {
                    var rawScore = rawFeature[index];
                    var ratio = total > 0 ? rawScore / total : 0;
                    var mlScore = distribution[index];

                    var rawRank = rawRanking[index];
                    var mlRank = mlRanking[index];

                    return new
                    {
                        Category = name,

                        RawScore = Math.Round(rawScore, 4),
                        Ratio = Math.Round(ratio, 4),
                        RawRank = rawRank,

                        MLScore = Math.Round(mlScore, 6),
                        Percent = Math.Round(mlScore * 100, 2),
                        MLRank = mlRank,

                        RankChange = rawRank - mlRank,

                        Insight = mlRank < rawRank
                                ? "โมเดลดันอันดับขึ้น"
                                : mlRank > rawRank
                                    ? "โมเดลดันอันดับลง"
                                    : "อันดับคงเดิม"
                    };
                })
                .OrderByDescending(x => x.MLScore)
                .ToList();

            // ================================
            // 4️⃣ Confidence Metrics
            // ================================
            var maxScore = distribution.Max();
            var minScore = distribution.Min();
            var spread = maxScore - minScore;

            return Ok(new
            {
                UserId = userId,
                TotalUserActivity = Math.Round(total, 2),

                TopCategory = comparison.FirstOrDefault()?.Category,
                ConfidenceSpread = Math.Round(spread * 100, 2),

                Comparison = comparison
            });
        }

        [HttpPost("train-model")]
        public async Task<IActionResult> TrainModel()
        {
            try
            {
                var result = await _trainingService.TrainAndSaveModelAsync();

                return Ok(new
                {
                    isSuccess = true,
                    meta = result
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    isSuccess = false,
                    message = ex.Message
                });
            }
        }

        [HttpPost("export-dataset")]
        public async Task<IActionResult> ExportDataset()
        {
            var exportPath = Path.Combine(
                Directory.GetCurrentDirectory(),
                "MLModels",
                $"training_dataset_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv");

            if (!Directory.Exists("MLModels"))
                Directory.CreateDirectory("MLModels");

            var filePath = await _trainingDataBuilder.ExportDatasetToCsvAsync(exportPath);

            return Ok(new
            {
                message = "Dataset exported successfully.",
                file = filePath
            });
        }
        [HttpGet("raw-score-all")]
        public async Task<IActionResult> GetAllRawScores()
        {
            var featureFrom = DateTime.UtcNow.AddDays(-90);
            var featureTo = DateTime.UtcNow;

            var users = await _context.BehaviorLogs
                .Where(x => x.UserId != null)
                .Select(x => x.UserId!.Value)
                .Distinct()
                .ToListAsync();

            var categories = await _context.PlaceCategories
                .OrderBy(c => c.CategoryId)
                .ToListAsync();

            var result = new List<object>();

            foreach (var userId in users)
            {
                var userFeature = await _featureBuilder
                    .BuildUserFeatureAsync(userId, featureFrom, featureTo);

                if (userFeature == null || userFeature.Length == 0)
                    continue;

                var total = userFeature.Sum();

                var userScores = new List<object>();
                var inputs = new List<UserCategoryRankingData>();

                for (int i = 0; i < userFeature.Length; i++)
                {
                    var input = new UserCategoryRankingData
                    {
                        CurrentCategoryScore = userFeature[i],
                        CategoryRatio = total > 0 ? userFeature[i] / total : 0,
                        TotalUserActivity = total,
                        CategoryIndex = i,
                        RecencyScore = 0, // ใส่จริงได้ถ้าต้องการ
                        GroupId = (uint)userId
                    };

                    inputs.Add(input);
                }

                if (_predictionEnginePool == null)
                    return BadRequest(new { IsSuccess = false, Message = "ยังไม่มีโมเดล กรุณาเทรนโมเดลก่อน" });

                CategoryFeatureStats.Load(_env.ContentRootPath)?.Apply(inputs);

                for (int i = 0; i < inputs.Count; i++)
                {
                    var prediction = _predictionEnginePool.Predict(inputs[i]);

                    userScores.Add(new
                    {
                        Category = categories[i].CategoryName,
                        RawScore = Math.Round(prediction.Score, 4)
                    });
                }

                result.Add(new
                {
                    UserId = userId,
                    Scores = userScores
                        .OrderByDescending(x => ((dynamic)x).RawScore)
                });
            }

            return Ok(result);
        }


        //[HttpGet("feature/{userId}")]
        //public async Task<IActionResult> GetUserFeature(int userId)
        //{
        //    var categories = await _context.PlaceCategories
        //        .OrderBy(c => c.CategoryId)
        //        .Select(c => c.CategoryName)
        //        .ToListAsync();

        //    var featureFrom = DateTime.UtcNow.AddDays(-90);
        //    var featureTo = DateTime.UtcNow;

        //    var feature = await _featureBuilder
        //        .BuildUserFeatureAsync(userId, featureFrom, featureTo);

        //    if (feature.Length != categories.Count)
        //    {
        //        return BadRequest("Feature vector size mismatch.");
        //    }

        //    var result = categories
        //        .Select((name, index) => new
        //        {
        //            Category = name,
        //            Score = Math.Round(feature[index], 4)
        //        })
        //        .OrderByDescending(x => x.Score)
        //        .ToList();

        //    return Ok(new
        //    {
        //        UserId = userId,
        //        FeatureWindowDays = 90,
        //        Features = result
        //    });
        //}

        //[HttpGet("{userId}")]
        //public async Task<IActionResult> GetRecommendations(int userId, [FromQuery] int topN = 10)
        //{
        //    var result = await _recommendationService.GetRecommendationsAsync(userId, topN);
        //    return Ok(result);
        //}


        //[HttpGet("model-info")]
        //public IActionResult GetModelInfo()
        //{
        //    var modelDirectory = Path.Combine(_env.ContentRootPath, "MLModels");
        //    var metaPath = Path.Combine(modelDirectory, "model_training_info.json");

        //    if (!System.IO.File.Exists(metaPath))
        //        return NotFound("Model has not been trained yet.");

        //    var json = System.IO.File.ReadAllText(metaPath);
        //    var info = JsonSerializer.Deserialize<ModelTrainingInfo>(json);

        //    return Ok(info);
        //}


        //[HttpGet("compare/{userId}")]
        //public async Task<IActionResult> ComparePrediction(int userId)
        //{
        //    // 1️⃣ ได้ feature vector
        //    var feature = await _featureBuilder.BuildUserFeatureAsync(userId);

        //    // 2️⃣ Normalize ตรง ๆ (Baseline)
        //    var sum = feature.Sum();
        //    float[] normalized = feature
        //        .Select(f => sum == 0 ? 0 : f / sum)
        //        .ToArray();

        //    // 3️⃣ ML Distribution
        //    var mlDistribution = await _predictionService.PredictDistributionAsync(userId);

        //    return Ok(new
        //    {
        //        UserId = userId,
        //        FeatureVector = feature,
        //        Normalized = normalized,
        //        MLDistribution = mlDistribution
        //    });
        //}
    }
}
