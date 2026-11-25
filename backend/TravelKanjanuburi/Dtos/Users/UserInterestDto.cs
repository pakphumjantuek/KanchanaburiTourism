namespace TravelKanjanuburi.Dtos.Users
{
    public class UserInterestDto
    {
        public string DisplayName { get; set; } = "";
        public string InterestKey { get; set; } = null!;
        public double Weight { get; set; }
    }
    public class UpdateUserInterestsRequest
    {
        public List<UserInterestDto> Items { get; set; } = new();
    }
}
