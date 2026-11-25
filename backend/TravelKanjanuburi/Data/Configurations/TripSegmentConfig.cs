using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TravelKanjanuburi.Model.MTrips;

namespace YourApp.Data.Configurations;

public class TripSegmentConfig : IEntityTypeConfiguration<TripSegment>
{
    public void Configure(EntityTypeBuilder<TripSegment> b)
    {
        b.HasKey(x => x.TripSegmentId);

        b.Property(x => x.TransportMode).HasMaxLength(20);

        b.HasOne(x => x.FromTripItem)
            .WithMany()
            .HasForeignKey(x => x.FromTripItemId)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.ToTripItem)
            .WithMany()
            .HasForeignKey(x => x.ToTripItemId)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasIndex(x => new { x.TripId, x.FromTripItemId, x.ToTripItemId }).IsUnique();
    }
}
