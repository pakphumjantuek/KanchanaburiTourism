namespace KanjanaburiTravel.Dtos.Users
{
    // Dtos/Users/UpdateInterestsRequest.cs
    public class UpdateInterestsRequest
    {
        public List<UserInterestItem> Items { get; set; } = new();
    }

    public class UserInterestItem
    {
        public string InterestKey { get; set; } = null!;
        public double Weight { get; set; }
    }

}
