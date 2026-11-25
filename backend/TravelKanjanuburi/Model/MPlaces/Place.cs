using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TravelKanjanuburi.Model.Foods;
using TravelKanjanuburi.Model.MPlaces;

public class Place
{
    public int PlaceId { get; set; }

    [MaxLength(200)]
    public string Name { get; set; } = null!;

    [MaxLength(4000)]
    public string? Description { get; set; }
    public int? CategoryId { get; set; }
    [ForeignKey("CategoryId")]
    public PlaceCategory PlaceCategory { get; set; } = null!;

    public double Latitude { get; set; }
    public double Longitude { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }
    public int? AvgVisitMinutes { get; set; }
    public int? PriceRange { get; set; } 

    public double PopularityScore { get; set; } = 0;
    public bool IsActive { get; set; } = true;

    public double AverageRating { get; set; } = 0;
    public int ReviewCount { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // เจ้าของ (ผู้ประกอบการ) — null = แอดมินเป็นคนลงเอง
    public int? OwnerId { get; set; }

    // อีเวนต์ชั่วคราว: เปิดแล้วต้องมีเวลาสิ้นสุด เลยเวลาแล้วสถานที่หยุดแสดงผลให้ผู้ใช้เอง (เวลาเก็บเป็น UTC)
    public bool IsEvent { get; set; } = false;
    public DateTime? EventStartAt { get; set; }
    public DateTime? EventEndAt { get; set; }

    public ICollection<PlaceImage> Images { get; set; } = new List<PlaceImage>();
    public ICollection<OpeningHour> OpeningHours { get; set; } = new List<OpeningHour>();
    public ICollection<PlaceTag> PlaceTags { get; set; } = new List<PlaceTag>();
    public ICollection<PlaceReview> Reviews { get; set; } = new List<PlaceReview>();
    public ICollection<PlaceLocalDish> PlaceLocalDishes { get; set; } = new List<PlaceLocalDish>();
}
