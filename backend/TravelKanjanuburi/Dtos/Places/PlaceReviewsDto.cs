using System.ComponentModel.DataAnnotations;

namespace TravelKanjanuburi.Model.MPlaces.Reviews
{
    public class UpsertPlaceReviewDto
    {
        [Range(1, 5)]
        public int Rating { get; set; }

        [MaxLength(4000)]
        public string? Comment { get; set; }
    }

    public class PlaceReviewDto
    {
        public int PlaceReviewId { get; set; }
        public int PlaceId { get; set; }
        public string UserId { get; set; }
        public string? DisplayName { get; set; } = null!;

        public int Rating { get; set; }
        public string? Comment { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
