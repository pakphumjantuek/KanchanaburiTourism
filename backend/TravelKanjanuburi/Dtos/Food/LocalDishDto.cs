using KanjanaburiTravel.Migrations;

namespace TravelKanjanuburi.Dtos.Food
{
    public class LocalDishDto
    {
        public int DishId { get; set; }
        public int? OwnerId { get; set; }
        public string NameTH { get; set; } = null!;
        public string? NameEN { get; set; }
        public string? Description { get; set; }
        public string? Origin { get; set; }
        public int SpicyLevel { get; set; } = 0;
        public bool IsHalal { get; set; } = false;
        public bool IsVegetarian { get; set; } = false;
        public bool IsActive { get; set; } = true;
        public List<LocalDishImageDto> Images { get; set; } = new();

    }
    public class CreateLocalDishRequest
    {
        public string NameTH { get; set; } = null!;
        public string? NameEN { get; set; }
        public string? Description { get; set; }
        public string? Origin { get; set; }
        public int SpicyLevel { get; set; }
        public bool IsHalal { get; set; }
        public bool IsVegetarian { get; set; }
        public bool IsActive { get; set; }
    }

    public class LocalDishImageDto
    {
        public int ImageId { get; set; }
        public string ImageUrl { get; set; } = null!;
        public bool IsCover { get; set; }
    }

}
