namespace TravelKanjanuburi.Dtos.ModelStatus
{
    public sealed class ModelStatusDto
    {
        public ModelInfo Model { get; set; } = null!;
        public TrainingInfo Training { get; set; } = null!;
        public CategoryInfo Category { get; set; } = null!;
    }

    public sealed class ModelInfo
    {
        public string Type { get; set; } = null!;
        //public int ApproximationRank { get; set; }
        //public int Iterations { get; set; }

        public string Path { get; set; } = null!;
        public bool Exists { get; set; }
        public DateTime? LastWriteUtc { get; set; }
        public DateTime? LastTrainedAtUtc { get; set; }
    }

    public sealed class TrainingInfo
    {
        public bool IsTraining { get; set; }
        public DateTime? LastAttemptUtc { get; set; }
        public DateTime? LastSuccessUtc { get; set; }
        public int? LastRows { get; set; }
        public string? LastMessage { get; set; }
    }

    public sealed class CategoryInfo
    {
        public int GroupCount { get; set; }
        public List<CategoryItem> Groups { get; set; } = new();
    }

    public sealed class CategoryItem
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
    }

    public static class RecommendationModelInfo
    {
        public const string ModelType = "MatrixFactorization";
        public const int ApproximationRank = 32;
        public const int Iterations = 60;
    }

}
