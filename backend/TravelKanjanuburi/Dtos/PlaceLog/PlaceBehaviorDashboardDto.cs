using TravelKanjanuburi.Model.Log;

namespace TravelKanjanuburi.Dtos.PlaceLog
{
    public class PlaceBehaviorDashboardDto
    {
        public int PlaceId { get; set; }

        public int Views { get; set; }
        public int Favorites { get; set; }
        public int AddToTrips { get; set; }
        public int Reviews { get; set; }

        public int UniqueUsers { get; set; }

        public List<PlaceActionCountDto> Actions { get; set; } = new();
    }

    public class PlaceActionCountDto
    {
        public BehaviorActionType ActionType { get; set; }
        public int Count { get; set; }
    }

}
