namespace TravelKanjanuburi.Model.MPlaces
{
    public class OpeningHour
    {
        public int OpeningHourId { get; set; }
        public int PlaceId { get; set; }
        public Place Place { get; set; } = null!;

        public int DayOfWeek { get; set; } // 0-6
        public TimeOnly OpenTime { get; set; }
        public TimeOnly CloseTime { get; set; }
        public bool IsClosed { get; set; } = false;
    }
}
