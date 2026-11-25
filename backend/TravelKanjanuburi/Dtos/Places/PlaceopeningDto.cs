namespace TravelKanjanuburi.Dtos.Places
{
    public class OpeningHourDto
    {
        public int OpeningHourId { get; set; }
        public int PlaceId { get; set; }
        public int DayOfWeek { get; set; } // 0-6
        public TimeOnly OpenTime { get; set; }
        public TimeOnly CloseTime { get; set; }
        public bool IsClosed { get; set; }
    }
    public class UpsertOpeningHourDto
    {
        public DayOfWeek DayOfWeek { get; set; }
        public TimeOnly OpenTime { get; set; }
        public TimeOnly CloseTime { get; set; }
        public bool IsClosed { get; set; }
    }

    public class UpsertWeeklyOpeningHoursDto
    {
        public List<UpsertOpeningHourDto> Items { get; set; } = new();
    }
    public class CreateDefaultOpeningHoursDto
    {
        public TimeOnly OpenTime { get; set; }
        public TimeOnly CloseTime { get; set; }
    }
}
