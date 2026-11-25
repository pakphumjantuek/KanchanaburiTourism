using Microsoft.ML;
using System.Text.Json;
using TravelKanjanuburi.ML.Models;

namespace TravelKanjanuburi.ML.Training
{
    public class LightGbmTrainingService
    {
        private readonly TrainingDataBuilderService _dataBuilder;
        private readonly MLContext _mlContext;
        private readonly IWebHostEnvironment _env;

        public LightGbmTrainingService(TrainingDataBuilderService dataBuilder, IWebHostEnvironment env)
        {
            _dataBuilder = dataBuilder;
            _mlContext = new MLContext(seed: 123);
            _env = env;
        }

        private static readonly SemaphoreSlim _trainLock = new(1, 1);
        private const int MinUsersForTraining = 50;
        private const double MaxZeroActivityShare = 0.2;

        /// แถวสำหรับประเมิน: เพิ่มป้าย lift ไว้ในแถวเอง จึงไม่ต้องจับคู่ผู้ใช้จาก GroupId ภายหลัง
        /// (ML.NET แปลง GroupId เป็นชนิดคีย์ ค่าที่อ่านกลับอาจไม่ตรงกับรหัสผู้ใช้จริง)
        public sealed record NdcgRow(double NdcgAt1, double NdcgAt3, double NdcgAt7);

        public class EvalRow : UserCategoryRankingData
        {
            public float LiftLabel { get; set; }
        }

        public sealed class ScoredRow : EvalRow
        {
            public float Score { get; set; }
        }

        private static double Gain(float label) => Math.Pow(2, label) - 1;

        /// NDCG@k ต่อผู้ใช้หนึ่งคน (ใช้ gain 2^label-1 แบบเดียวกับ ML.NET); อันดับเสมอสุ่มด้วย rng ที่กำหนด seed
        private static double NdcgAtK(IReadOnlyList<(float label, double score)> items, int k, Random rng)
        {
            var ranked = items.OrderByDescending(x => x.score).ThenBy(_ => rng.Next()).ToList();
            double dcg = 0, idcg = 0;
            for (int i = 0; i < Math.Min(k, ranked.Count); i++) dcg += Gain(ranked[i].label) / Math.Log2(i + 2);
            var ideal = items.OrderByDescending(x => x.label).ToList();
            for (int i = 0; i < Math.Min(k, ideal.Count); i++) idcg += Gain(ideal[i].label) / Math.Log2(i + 2);
            return idcg > 0 ? dcg / idcg : double.NaN;
        }

        /// สัดส่วนกิจกรรมของแต่ละหมวดทั้งระบบ จากฟีเจอร์ในอดีตของผู้ใช้ชุดเทรน (ไม่ใช้ป้ายอนาคต จึงไม่รั่ว)
        private static double[] ComputeGlobalShare(List<UserCategoryRankingData> trainRows)
        {
            int c = trainRows.Select(x => (int)x.CategoryIndex).DefaultIfEmpty(0).Max() + 1;
            var share = new double[c];
            foreach (var r in trainRows) share[(int)r.CategoryIndex] += Math.Max(0, r.CategoryRatio);
            double total = share.Sum();
            for (int i = 0; i < c; i++) share[i] = total > 0 ? share[i] / total : 1.0 / c;
            return share;
        }

        /// ป้ายแบบ "เกินกว่าความนิยมหมวด": เทียบสัดส่วนกิจกรรมอนาคตของผู้ใช้กับสัดส่วนของทั้งระบบ แล้วจัดเป็น 0-3 เหมือนป้ายเดิม
        private static float[] LiftLabels(float[] future, double[] globalShare)
        {
            int c = future.Length;
            var labels = new float[c];
            double total = future.Where(x => x > 0).Sum();
            if (total <= 0) return labels;
            var lift = new double[c];
            for (int i = 0; i < c; i++) lift[i] = (Math.Max(0, future[i]) / total) / Math.Max(1e-6, globalShare[i]);
            double mx = lift.Max();
            for (int i = 0; i < c; i++)
            {
                double n = mx > 0 ? lift[i] / mx : 0;
                labels[i] = n < 0.05 ? 0 : n < 0.25 ? 1 : n < 0.6 ? 2 : 3;
            }
            return labels;
        }

        /// สร้างแถวชุดทดสอบพร้อมป้าย lift (ผู้ใช้ที่ไม่มีกิจกรรมอนาคตจะได้ป้ายเป็น 0 ทั้งหมด และถูกข้ามตอนคำนวณ NDCG)
        private static List<EvalRow> BuildEvalRows(
            List<UserCategoryRankingData> testRows, Dictionary<uint, float[]> futureScores, double[] globalShare)
        {
            var labelsByUser = new Dictionary<uint, float[]>();
            foreach (var userId in testRows.Select(x => x.GroupId).Distinct())
                if (futureScores.TryGetValue(userId, out var fut) && fut.Length == globalShare.Length)
                    labelsByUser[userId] = LiftLabels(fut, globalShare);

            return testRows.Select(r => new EvalRow
            {
                Label = r.Label,
                CurrentCategoryScore = r.CurrentCategoryScore,
                CategoryRatio = r.CategoryRatio,
                TotalUserActivity = r.TotalUserActivity,
                RecencyScore = r.RecencyScore,
                CategoryIndex = r.CategoryIndex,
                CategoryPrior = r.CategoryPrior,
                RatioLift = r.RatioLift,
                RatioRank = r.RatioRank,
                ScoreRank = r.ScoreRank,
                GapToMaxRatio = r.GapToMaxRatio,
                PriorRank = r.PriorRank,
                LogTotalActivity = r.LogTotalActivity,
                GroupId = r.GroupId,
                LiftLabel = labelsByUser.TryGetValue(r.GroupId, out var l) ? l[(int)r.CategoryIndex] : 0f
            }).ToList();
        }

        /// เทียบโมเดลกับ baseline ง่ายๆ บนผู้ใช้ชุดทดสอบ ทั้งแบบป้ายเดิม (ปริมาณกิจกรรม) และแบบ lift (เกินกว่าความนิยมหมวด)
        private (Dictionary<string, object> absolute, Dictionary<string, object> lift) EvaluateAgainstBaselines(
            List<ScoredRow> scored, List<UserCategoryRankingData> trainRows, double[] globalShare)
        {
            var catPopularity = trainRows.GroupBy(x => x.CategoryIndex)
                .ToDictionary(g => g.Key, g => g.Average(x => x.Label));

            var rng = new Random(2026);
            var methods = new (string name, Func<ScoredRow, double> score)[]
            {
                ("Random", _ => rng.NextDouble()),
                ("PastCategoryScore", s => s.CurrentCategoryScore),
                ("CategoryPopularity", s => catPopularity.TryGetValue(s.CategoryIndex, out var p) ? p : 0),
                ("PastRatioLift", s => Math.Max(0, s.CategoryRatio) / Math.Max(1e-6, globalShare[(int)s.CategoryIndex])),
                ("LightGBM", s => s.Score),
            };

            double Avg(List<double> v) { var ok = v.Where(x => !double.IsNaN(x)).ToList(); return ok.Count == 0 ? 0 : Math.Round(ok.Average(), 4); }

            // จัดกลุ่มตามแถวที่อยู่ติดกัน (แต่ละผู้ใช้มี 1 แถวต่อหมวด) เพื่อไม่ต้องพึ่งค่า GroupId ที่อ่านกลับ
            var groups = new List<List<ScoredRow>>();
            int categoryCount = globalShare.Length;
            for (int start = 0; start + categoryCount <= scored.Count; start += categoryCount)
                groups.Add(scored.GetRange(start, categoryCount));

            Dictionary<string, object> Run(Func<ScoredRow, float> labelOf)
            {
                var result = new Dictionary<string, object>();
                foreach (var (name, scoreFn) in methods)
                {
                    var at1 = new List<double>(); var at3 = new List<double>(); var at7 = new List<double>();
                    foreach (var g in groups)
                    {
                        var items = g.Select(s => (labelOf(s), scoreFn(s))).ToList();
                        at1.Add(NdcgAtK(items, 1, rng)); at3.Add(NdcgAtK(items, 3, rng)); at7.Add(NdcgAtK(items, 7, rng));
                    }
                    result[name] = new NdcgRow(Avg(at1), Avg(at3), Avg(at7));
                }
                return result;
            }

            var absolute = Run(s => s.Label);
            var lift = Run(s => s.LiftLabel);
            return (absolute, lift);
        }

        private static CategoryFeatureStats BuildFeatureStats(List<UserCategoryRankingData> trainRows, double[] globalShare)
        {
            var prior = new double[globalShare.Length];
            for (int c = 0; c < prior.Length; c++)
            {
                var labels = trainRows.Where(x => (int)x.CategoryIndex == c).Select(x => (double)x.Label).ToList();
                prior[c] = labels.Count > 0 ? labels.Average() : 0;
            }
            return new CategoryFeatureStats { Prior = prior, GlobalShare = globalShare };
        }

        private static void ApplyFeatureStats(CategoryFeatureStats stats, List<UserCategoryRankingData> rows)
        {
            foreach (var g in rows.GroupBy(x => x.GroupId))
                stats.Apply(g.OrderBy(x => x.CategoryIndex).ToList());
        }

        // LightGBM regression บนป้ายกิจกรรมอนาคต แล้วใช้คะแนนจัดอันดับหมวดต่อผู้ใช้
        // ทดลองออฟไลน์ (6 รอบสุ่มแบ่งผู้ใช้): regression + ฟีเจอร์เชิงเปรียบเทียบ ชนะ baseline ความนิยมหมวดที่ NDCG@3 ทุกรอบ
        // ส่วน lambdarank แบบเดิมและ 31 leaves/200 iters แพ้ เพราะ overfit ข้อมูลจำนวนแถวน้อย
        private IEstimator<ITransformer> BuildPipeline() =>
            _mlContext.Transforms.Categorical.OneHotEncoding(
                  outputColumnName: "CategoryEncoded",
                  inputColumnName: nameof(UserCategoryRankingData.CategoryIndex))
              .Append(_mlContext.Transforms.Concatenate(
                  "Features",
                  nameof(UserCategoryRankingData.CurrentCategoryScore),
                  nameof(UserCategoryRankingData.CategoryRatio),
                  nameof(UserCategoryRankingData.TotalUserActivity),
                  nameof(UserCategoryRankingData.RecencyScore),
                  nameof(UserCategoryRankingData.CategoryPrior),
                  nameof(UserCategoryRankingData.RatioLift),
                  nameof(UserCategoryRankingData.RatioRank),
                  nameof(UserCategoryRankingData.ScoreRank),
                  nameof(UserCategoryRankingData.GapToMaxRatio),
                  nameof(UserCategoryRankingData.PriorRank),
                  nameof(UserCategoryRankingData.LogTotalActivity),
                  "CategoryEncoded"))
              .Append(_mlContext.Regression.Trainers.LightGbm(
                new Microsoft.ML.Trainers.LightGbm.LightGbmRegressionTrainer.Options
                {
                    LabelColumnName = "Label",
                    FeatureColumnName = "Features",

                    NumberOfLeaves = 8,
                    LearningRate = 0.05,
                    NumberOfIterations = 100,
                    MinimumExampleCountPerLeaf = 50
                }));

        private static void Collect(Dictionary<string, List<NdcgRow>> acc, Dictionary<string, object> foldTable)
        {
            foreach (var kv in foldTable)
            {
                if (!acc.TryGetValue(kv.Key, out var list)) acc[kv.Key] = list = new List<NdcgRow>();
                list.Add((NdcgRow)kv.Value);
            }
        }

        private static Dictionary<string, object> AverageFolds(Dictionary<string, List<NdcgRow>> acc) =>
            acc.ToDictionary(
                kv => kv.Key,
                kv => (object)new NdcgRow(
                    Math.Round(kv.Value.Average(r => r.NdcgAt1), 4),
                    Math.Round(kv.Value.Average(r => r.NdcgAt3), 4),
                    Math.Round(kv.Value.Average(r => r.NdcgAt7), 4)));

        public async Task<object> TrainAndSaveModelAsync()
        {
            if (!_trainLock.Wait(0))
                throw new InvalidOperationException("Training already in progress.");

            try
            {
                var sw = System.Diagnostics.Stopwatch.StartNew();

                // สร้าง Dataset สำหรับเทรน
                var trainingData = await _dataBuilder.BuildTrainingDataAsync();

                if (!trainingData.Any())
                    throw new Exception("No training data found.");

                // ตรวจความผิดปกติก่อนเทรน: ฟีเจอร์ยุบเป็นศูนย์ หรือผู้ใช้น้อยเกินไป → ไม่เทรน และไม่ทับโมเดลเดิม
                int distinctUsers = trainingData.Select(x => x.GroupId).Distinct().Count();
                double zeroShare = trainingData.Count(x => x.TotalUserActivity <= 0f) / (double)trainingData.Count;
                if (distinctUsers < MinUsersForTraining)
                    throw new InvalidOperationException(
                        $"ข้อมูลไม่พอสำหรับเทรน: มีผู้ใช้ {distinctUsers} คน (ต้องการอย่างน้อย {MinUsersForTraining}) โมเดลเดิมไม่ถูกแตะต้อง");
                if (zeroShare > MaxZeroActivityShare)
                    throw new InvalidOperationException(
                        $"ฟีเจอร์ผิดปกติ: แถวที่ TotalUserActivity เป็นศูนย์ {zeroShare:P0} (เกิน {MaxZeroActivityShare:P0}) " +
                        "ตรวจช่วงเวลาของข้อมูลและการคิด time decay โมเดลเดิมไม่ถูกแตะต้อง");

                int totalRows = trainingData.Count;

                var allUsers = trainingData
                    .Select(x => x.GroupId)
                    .Distinct()
                    .ToList();

                var rng = new Random(123);
                var shuffledUsers = allUsers
                    .OrderBy(x => rng.Next())
                    .ToList();

                // ผู้ใช้มีแค่หลักพัน ชุดทดสอบ 20% ชุดเดียวแกว่งมาก (ห้องทดลองคลาดเคลื่อนราว ±0.006 ของ NDCG@1)
                // จึงรายงานผลจาก k-fold CV ตามผู้ใช้ (ทุกคนถูกทดสอบหนึ่งครั้งโดยโมเดลที่ไม่เคยเห็นเขา) แล้วค่อยเทรนโมเดลจริงจากผู้ใช้ทั้งหมด
                const int Folds = 5;
                var cvAbs = new Dictionary<string, List<NdcgRow>>();
                var cvLift = new Dictionary<string, List<NdcgRow>>();

                for (int fold = 0; fold < Folds; fold++)
                {
                    var foldTestUsers = shuffledUsers.Where((_, i) => i % Folds == fold).ToHashSet();
                    var foldTrain = trainingData.Where(x => !foldTestUsers.Contains(x.GroupId)).ToList();
                    var foldTest = trainingData.Where(x => foldTestUsers.Contains(x.GroupId)).ToList();

                    var foldShare = ComputeGlobalShare(foldTrain);
                    var foldStats = BuildFeatureStats(foldTrain, foldShare);
                    ApplyFeatureStats(foldStats, foldTrain);
                    ApplyFeatureStats(foldStats, foldTest);

                    var foldModel = BuildPipeline().Fit(_mlContext.Data.LoadFromEnumerable(foldTrain));
                    var foldEval = BuildEvalRows(foldTest, _dataBuilder.LastFutureScores, foldShare);
                    var foldScored = _mlContext.Data
                        .CreateEnumerable<ScoredRow>(foldModel.Transform(_mlContext.Data.LoadFromEnumerable(foldEval)), reuseRowObject: false)
                        .ToList();

                    var foldReport = EvaluateAgainstBaselines(foldScored, foldTrain, foldShare);
                    Collect(cvAbs, foldReport.absolute);
                    Collect(cvLift, foldReport.lift);
                }

                var baselineReport = (absolute: AverageFolds(cvAbs), lift: AverageFolds(cvLift));

                // โมเดลจริง: เทรนจากผู้ใช้ทั้งหมด พร้อมสถิติหมวดจากข้อมูลทั้งหมด
                var allShare = ComputeGlobalShare(trainingData);
                var featureStats = BuildFeatureStats(trainingData, allShare);
                ApplyFeatureStats(featureStats, trainingData);
                var trainData = _mlContext.Data.LoadFromEnumerable(trainingData);
                var model = BuildPipeline().Fit(trainData);

                sw.Stop();

                int uniqueUsers = trainingData.Select(x => x.GroupId).Distinct()
                    .Count(); int uniqueCategories = trainingData.Select(x => x.CategoryIndex).Distinct().Count();

                var lgbAbs = (NdcgRow)baselineReport.absolute["LightGBM"];
                var lgbLift = (NdcgRow)baselineReport.lift["LightGBM"];
                bool BeatsAll(Dictionary<string, object> table, NdcgRow me) =>
                    table.Where(kv => kv.Key != "LightGBM").All(kv =>
                        me.NdcgAt1 > ((NdcgRow)kv.Value).NdcgAt1 && me.NdcgAt3 > ((NdcgRow)kv.Value).NdcgAt3);

                var meta = new
                {
                    ModelName = "LightGBM Category Scorer",
                    ModelVersion = "2.0.0",
                    Algorithm = "LightGBM",
                    ProblemType = "Regression (ใช้คะแนนจัดอันดับหมวดต่อผู้ใช้)",

                    FeatureCount = 11,
                    FeatureDescription = "CurrentScore + Ratio + TotalActivity + RecencyScore + CategoryPrior + RatioLift + RatioRank + ScoreRank + GapToMaxRatio + PriorRank + LogTotalActivity + CategoryEncoded (time decay อ้างอิง splitTime)",

                    Dataset = new
                    {
                        TotalRows = totalRows,
                        TrainRows = totalRows,   // โมเดลจริงเทรนจากทุกแถว
                        TestRows = totalRows,    // ทุกแถวถูกทดสอบแบบ out-of-fold หนึ่งครั้ง
                        Validation = $"{Folds}-fold cross-validation ตามผู้ใช้",
                    },

                    Metrics = new
                    {
                        NDCG = lgbAbs.NdcgAt3, // NDCG@3 ของ LightGBM บนป้ายกิจกรรมอนาคต (ป้ายที่ใช้เทรนและใช้งานจริงใน Home)
                        DCG = 0.0,
                        BeatsBestBaselineAbsolute = BeatsAll(baselineReport.absolute, lgbAbs),
                        BeatsBestBaselineLift = BeatsAll(baselineReport.lift, lgbLift),
                        Note = "NDCG = NDCG@3 บนป้ายกิจกรรมอนาคต (7 หมวด ค่าเฉลี่ยตัวเดียวสูงเกินจริง) ดู Baselines (ป้ายเดิม) และ BaselinesLift (เกินกว่าความนิยมหมวด) เทียบกับ baseline (\"ชนะ\" หมายถึงสูงกว่าทุก baseline ทั้ง NDCG@1 และ @3)"
                    },
                    // Baselines = วัดด้วยป้ายเดิม (ปริมาณกิจกรรมของหมวด); BaselinesLift = วัดว่าหมวดไหนที่ผู้ใช้สนใจ "เกินกว่าความนิยมทั่วไป"
                    Baselines = baselineReport.absolute,
                    BaselinesLift = baselineReport.lift,

                    Training = new
                    {
                        TrainedAtUtc = DateTime.UtcNow,
                        DurationSeconds = Math.Round(sw.Elapsed.TotalSeconds, 2),
                        MlNetVersion = typeof(MLContext).Assembly.GetName().Version?.ToString()
                    },

                    DataSnapshot = new
                    {
                        UniqueUsers = uniqueUsers,
                        UniqueCategories = uniqueCategories,
                        // ผู้ใช้ทั้งหมดที่มีกิจกรรม เทียบกับที่ใช้เทรน และเหตุผลที่ข้าม
                        UsersWithActivity = _dataBuilder.LastUserStats.UsersWithActivity,
                        UsersSkippedTooFewLogs = _dataBuilder.LastUserStats.SkippedTooFewLogs,
                        UsersSkippedNoPast = _dataBuilder.LastUserStats.SkippedNoPast,
                        MinLogsPerUser = TrainingDataBuilderService.MinLogsPerUser
                    }
                };

                var modelDirectory = Path.Combine(_env.ContentRootPath, "MLModels");

                if (!Directory.Exists(modelDirectory))
                    Directory.CreateDirectory(modelDirectory);

                var modelPath = Path.Combine(modelDirectory, "category_regression_model.zip");
                var metaPath = Path.Combine(modelDirectory, "model_meta.json");

                var json = JsonSerializer.Serialize(meta, new JsonSerializerOptions
                {
                    WriteIndented = true
                });

                // เขียนไฟล์ชั่วคราวแล้วสลับ เพื่อไม่ให้ตัวโหลดโมเดลอ่านไฟล์ที่เขียนค้างครึ่งๆ กลางๆ
                // เขียนสถิติหมวดก่อนโมเดล: ถ้าโมเดลเก่ายังโหลดค้างอยู่จะไม่ใช้ฟีเจอร์ใหม่จึงไม่พัง
                featureStats.Save(_env.ContentRootPath);

                var tmpModelPath = modelPath + ".tmp";
                _mlContext.Model.Save(model, trainData.Schema, tmpModelPath);
                File.Move(tmpModelPath, modelPath, overwrite: true);
                File.WriteAllText(metaPath, json);

                return meta; // 🔥 return กลับไปเลย
            }
            finally
            {
                _trainLock.Release();
            }
        }

    }
}
