namespace TravelKanjanuburi.Dtos.Food
{
    public class PlaceForDishDto
    {
        public int PlaceId { get; set; }
        public string Name { get; set; } = null!;
        public string? Address { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }

        public decimal? Price { get; set; }
        public bool IsAvailable { get; set; }

        public double AverageRating { get; set; }
        public int ReviewCount { get; set; }

        public string? CoverImageUrl { get; set; }
    }

    public class UpsertPlaceDishRequest
    {
        public int DishId { get; set; }
        public decimal? Price { get; set; }
        public bool IsAvailable { get; set; } = true;
    }

    public class DishForPlaceDto
    {
        public int DishId { get; set; }
        public string NameTH { get; set; } = null!;
        public string? NameEN { get; set; }
        public int SpicyLevel { get; set; }
        public bool IsHalal { get; set; }
        public bool IsVegetarian { get; set; }
        public bool IsActive { get; set; }

        // จากตารางกลาง
        public decimal? Price { get; set; }
        public bool IsAvailable { get; set; }

        // รูป cover ของเมนู (LocalDishImage.IsCover)
        public string? CoverImageUrl { get; set; }
    }
}
