using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TravelKanjanuburi.Model.MTrips;
namespace YourApp.Data.Configurations;

public class TripItemConfig : IEntityTypeConfiguration<TripItem>
{
    public void Configure(EntityTypeBuilder<TripItem> b)
    {
        b.HasKey(x => x.TripItemId);

        b.Property(x => x.Notes).HasMaxLength(1000);

        // กัน OrderIndex ซ้ำในวันเดียวกันของทริปเดียวกัน
        b.HasIndex(x => new { x.TripId, x.DayIndex, x.OrderIndex }).IsUnique();

        b.HasIndex(x => new { x.TripId, x.PlaceId });
    }
}
