using Microsoft.ML;
using System.Text.Json;
using TravelKanjanuburi.ML.Food.Models;

namespace TravelKanjanuburi.ML.Food.Training
{
    public class FoodLightGbmTrainingService
    {
        private readonly FoodTrainingDataBuilderService _dataBuilder;
        private readonly IWebHostEnvironment _env;
        private readonly MLContext _mlContext;

        private static readonly SemaphoreSlim _trainLock = new(1, 1);

        public FoodLightGbmTrainingService(
            FoodTrainingDataBuilderService dataBuilder,
            IWebHostEnvironment env)
        {
            _dataBuilder = dataBuilder;
            _env = env;
            _mlContext = new MLContext(seed: 123);
        }

        public async Task<object> TrainAndSaveModelAsync()
        {
            if (!_trainLock.Wait(0))
                throw new InvalidOperationException("Training already running.");

            try
            {
                var sw = System.Diagnostics.Stopwatch.StartNew();

                // 1️⃣ สร้าง dataset
                var trainingData = await _dataBuilder.BuildTrainingDataAsync();

                if (!trainingData.Any())
                    throw new Exception("No training data found.");

                // 2️⃣ Split ตามเวลา: แถวเรียงเก่า→ใหม่ ใช้ 80% แรกเทรน 20% หลังทดสอบ
                // เว้นช่วง embargo ระหว่างสองชุดให้ป้ายของชุดเทรน (มองอนาคต 30 วัน) ไม่ซ้อนกับฟีเจอร์ชุดทดสอบ
                int embargoRows = (int)Math.Ceiling(
                    FoodTrainingDataBuilderService.LabelWindowDays / (double)FoodTrainingDataBuilderService.StepDays)
                    * Math.Max(1, trainingData.Count / Math.Max(1, _dataBuilder.LastWindowCount));
                int splitAt = (int)(trainingData.Count * 0.8);
                var trainRows = trainingData.Take(Math.Max(0, splitAt - embargoRows)).ToList();
                var testRows = trainingData.Skip(splitAt).ToList();

                if (trainRows.Count < 100 || testRows.Count < 20)
                    throw new InvalidOperationException(
                        $"ข้อมูลไม่พอสำหรับเทรน/ทดสอบ (train {trainRows.Count}, test {testRows.Count}) โมเดลเดิมไม่ถูกแตะต้อง");

                var split = (
                    TrainSet: _mlContext.Data.LoadFromEnumerable(trainRows),
                    TestSet: _mlContext.Data.LoadFromEnumerable(testRows));

                // 3️⃣ Pipeline
                var pipeline =
                   _mlContext.Transforms.Concatenate(
    "Features",
    nameof(FoodPopularityData.ViewCount30d),
    nameof(FoodPopularityData.FavoriteCount30d),
    nameof(FoodPopularityData.ReviewCount30d),
    nameof(FoodPopularityData.AvgRating),
    nameof(FoodPopularityData.GrowthRate),
    nameof(FoodPopularityData.RecencyScore),
    nameof(FoodPopularityData.TotalActivity),
    nameof(FoodPopularityData.TotalActivityLog),
    nameof(FoodPopularityData.DaysSinceLastActivity)
)
                  .Append(_mlContext.Regression.Trainers.LightGbm(
                        new Microsoft.ML.Trainers.LightGbm.LightGbmRegressionTrainer.Options
                        {
                            LabelColumnName = "Label",
                            FeatureColumnName = "Features",
                            NumberOfLeaves = 8,      // ลดจาก 31
                            LearningRate = 0.1,      // เร่งให้ converge
                            NumberOfIterations = 50  // ลด overfit
                        }));

                // 4️⃣ Train
                var model = pipeline.Fit(split.TrainSet);

                // 5️⃣ Evaluate
                var predictions = model.Transform(split.TestSet);

                var metrics = _mlContext.Regression.Evaluate(
                    predictions,
                    labelColumnName: "Label");

                sw.Stop();

                // 6️⃣ Save Model
                // ต้องตรงกับพาธที่ Program.cs โหลดโมเดล (ContentRootPath/MLModels)
                var modelDir = Path.Combine(_env.ContentRootPath, "MLModels");

                if (!Directory.Exists(modelDir))
                    Directory.CreateDirectory(modelDir);

                var modelPath = Path.Combine(modelDir, "food_popularity_model.zip");

                _mlContext.Model.Save(model, split.TrainSet.Schema, modelPath);

                var meta = new
                {
                    ModelName = "Food Popularity Model",
                    Algorithm = "LightGBM Regression",
                    R2 = metrics.RSquared,
                    RMSE = metrics.RootMeanSquaredError,
                    MAE = metrics.MeanAbsoluteError,
                    TrainedAtUtc = DateTime.UtcNow,
                    DurationSeconds = Math.Round(sw.Elapsed.TotalSeconds, 2),
                    TotalRows = trainingData.Count,
                    TrainRows = trainRows.Count,
                    TestRows = testRows.Count,
                    Windows = _dataBuilder.LastWindowCount,
                    Split = "chronological 80/20 + embargo",
                    // baseline: ทายค่าเฉลี่ยของชุดเทรนทุกแถว (R2 ของโมเดลต้องชนะอันนี้)
                    BaselineMeanRmse = Math.Sqrt(testRows.Average(r => Math.Pow(r.Label - trainRows.Average(t => t.Label), 2))),
                    // baseline: ทายด้วยกิจกรรมล่าสุด (persistence)
                    BaselineLogActivityRmse = Math.Sqrt(testRows.Average(r => Math.Pow(r.Label - r.TotalActivityLog, 2)))
                };



                var metaPath = Path.Combine(modelDir, "food_model_meta.json");

                File.WriteAllText(
                    metaPath,
                    JsonSerializer.Serialize(meta, new JsonSerializerOptions
                    {
                        WriteIndented = true
                    }));

                return meta;
            }
            finally
            {
                _trainLock.Release();
            }
        }
    }
}