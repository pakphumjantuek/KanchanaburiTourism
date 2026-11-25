using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TravelKanjanuburi.Model.MTrips;

namespace YourApp.Data.Configurations;

public class TripConfig : IEntityTypeConfiguration<Trip>
{
    public void Configure(EntityTypeBuilder<Trip> b)
    {
        b.HasKey(x => x.TripId);

        b.Property(x => x.Title).HasMaxLength(200).IsRequired();
        b.Property(x => x.Description).HasMaxLength(2000);

        b.HasMany(x => x.Items)
            .WithOne(x => x.Trip)
            .HasForeignKey(x => x.TripId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasMany(x => x.Segments)
            .WithOne(x => x.Trip)
            .HasForeignKey(x => x.TripId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasIndex(x => new { x.UserId, x.CreatedAt });
    }
}
