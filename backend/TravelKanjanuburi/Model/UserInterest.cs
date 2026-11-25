namespace TravelKanjanuburi.Model
{
    public class UserInterest
    {
        public int UserInterestId { get; set; }
        public int UserId { get; set; }
        public string InterestKey { get; set; } = null!; // เช่น culture/food/history
        public double Weight { get; set; }
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public User User { get; set; } = null!;
    }
}
