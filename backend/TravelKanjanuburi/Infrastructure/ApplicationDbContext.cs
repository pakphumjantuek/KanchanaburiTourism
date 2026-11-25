using TravelKanjanuburi.Model.Foods;
using TravelKanjanuburi.Model.Log;
using TravelKanjanuburi.Model.MPlaces;
using TravelKanjanuburi.Model.MTrips;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserInterest> UserInterests => Set<UserInterest>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<OperatorApplication> OperatorApplications => Set<OperatorApplication>();

    //สถานที่
    public DbSet<Place> Places => Set<Place>();
    public DbSet<PlaceCategory> PlaceCategories => Set<PlaceCategory>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<PlaceTag> PlaceTags => Set<PlaceTag>();
    public DbSet<PlaceImage> PlaceImages => Set<PlaceImage>();
    public DbSet<OpeningHour> OpeningHours => Set<OpeningHour>();
    public DbSet<PlaceReview> PlaceReviews => Set<PlaceReview>();
    
    //อาหารพื้นถิ่น
    public DbSet<LocalDish> LocalDishes => Set<LocalDish>();
    public DbSet<LocalDishImage> LocalDishesImage => Set<LocalDishImage>();
    public DbSet<PlaceLocalDish> PlaceLocalDishes => Set<PlaceLocalDish>();


    //ทริป
    public DbSet<Trip> Trips => Set<Trip>();
    public DbSet<TripItem> TripItems => Set<TripItem>();
    public DbSet<TripSegment> TripSegments => Set<TripSegment>();

    //log
    public DbSet<BehaviorLog> BehaviorLogs => Set<BehaviorLog>();


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.UserId);
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.Email).HasMaxLength(255).IsRequired();
            entity.Property(u => u.DisplayName).HasMaxLength(255).IsRequired();

            entity.HasOne(u => u.Role)
                  .WithMany(r => r.Users)
                  .HasForeignKey(u => u.RoleId);
        });

        modelBuilder.Entity<Role>().HasData(new Role { RoleId = 3, RoleName = "Operator" });

        modelBuilder.Entity<OperatorApplication>(e =>
        {
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => new { x.UserId, x.Status });
        });

        modelBuilder.Entity<Place>().HasIndex(p => p.OwnerId);
        modelBuilder.Entity<Place>().HasOne<User>().WithMany().HasForeignKey(p => p.OwnerId).OnDelete(DeleteBehavior.NoAction);
        modelBuilder.Entity<LocalDish>().HasIndex(d => d.OwnerId);
        modelBuilder.Entity<LocalDish>().HasOne<User>().WithMany().HasForeignKey(d => d.OwnerId).OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<PlaceLocalDish>()
        .HasIndex(x => new { x.PlaceId, x.DishId })
        .IsUnique();

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(r => r.RoleId);
            entity.Property(r => r.RoleName).HasMaxLength(50).IsRequired();
        });

        modelBuilder.Entity<UserInterest>(entity =>
        {
            entity.HasKey(ui => ui.UserInterestId);
            entity.Property(ui => ui.InterestKey).HasMaxLength(100).IsRequired();
            entity.HasOne(ui => ui.User)
                  .WithMany(u => u.UserInterests)
                  .HasForeignKey(ui => ui.UserId);
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(r => r.RefreshTokenId);
            entity.Property(r => r.Token).HasMaxLength(200).IsRequired();

            entity.HasOne(r => r.User)
                  .WithMany() // ถ้าอยากให้ User มี ICollection<RefreshToken> ก็เพิ่มใน User
                  .HasForeignKey(r => r.UserId);
        });

        modelBuilder.Entity<PlaceTag>()
            .HasKey(x => new { x.PlaceId, x.TagId });

        modelBuilder.Entity<Place>()
            .HasIndex(x => new { x.Latitude, x.Longitude });

        modelBuilder.Entity<Tag>()
            .HasIndex(x => x.TagName)
            .IsUnique();

        modelBuilder.Entity<PlaceCategory>()
            .HasIndex(x => x.CategoryName)
            .IsUnique();
        // =======================
        // Trips (Trip Planner)
        // =======================

        // Trip
        modelBuilder.Entity<Trip>(entity =>
        {
            entity.HasKey(x => x.TripId);

            entity.Property(x => x.Title).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(2000);

            // 1 Trip มีหลาย Item (ลบ Trip -> ลบ Items ได้)
            entity.HasMany(x => x.Items)
                  .WithOne(x => x.Trip)
                  .HasForeignKey(x => x.TripId)
                  .OnDelete(DeleteBehavior.Cascade);

            // 1 Trip มีหลาย Segment (ลบ Trip -> ลบ Segments ได้)
            entity.HasMany(x => x.Segments)
                  .WithOne(x => x.Trip)
                  .HasForeignKey(x => x.TripId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(x => new { x.UserId, x.CreatedAt });
        });

        // TripItem
        modelBuilder.Entity<TripItem>(entity =>
        {
            entity.HasKey(x => x.TripItemId);

            entity.Property(x => x.Notes).HasMaxLength(1000);

            // กันลำดับซ้ำในวันเดียวกัน ของทริปเดียวกัน
            entity.HasIndex(x => new { x.TripId, x.DayIndex, x.OrderIndex }).IsUnique();

            entity.HasIndex(x => new { x.TripId, x.PlaceId });
        });

        // TripSegment (สำคัญ: กัน multiple cascade paths)
        modelBuilder.Entity<TripSegment>(entity =>
        {
            entity.HasKey(x => x.TripSegmentId);

            entity.Property(x => x.TransportMode).HasMaxLength(20);
            // ถ้าอยากเก็บเส้นทาง
            // entity.Property(x => x.RoutePolyline).HasColumnType("nvarchar(max)");

            // FK ไป TripItems 2 เส้น ต้องเป็น NO ACTION / RESTRICT
            entity.HasOne(x => x.FromTripItem)
                  .WithMany()
                  .HasForeignKey(x => x.FromTripItemId)
                  .OnDelete(DeleteBehavior.NoAction); // ✅ แก้ error

            entity.HasOne(x => x.ToTripItem)
                  .WithMany()
                  .HasForeignKey(x => x.ToTripItemId)
                  .OnDelete(DeleteBehavior.NoAction); // ✅ แก้ error

            entity.HasIndex(x => new { x.TripId, x.FromTripItemId, x.ToTripItemId }).IsUnique();
        });


        modelBuilder.Entity<BehaviorLog>(e =>
        {
            e.HasKey(x => x.BehaviorLogId);

            e.Property(x => x.AnonymousId).HasMaxLength(36);

            e.Property(x => x.ActionType)
                .HasConversion<string>()
                .HasMaxLength(50);

            e.HasIndex(x => new { x.UserId, x.CreatedAt });
            e.HasIndex(x => new { x.AnonymousId, x.CreatedAt });  // ✅ สำคัญ
        });


        modelBuilder.Entity<BehaviorLog>()
      .HasIndex(x => new { x.UserId, x.ClientEventId })
      .IsUnique()
      .HasFilter("[ClientEventId] IS NOT NULL AND [UserId] IS NOT NULL");

        modelBuilder.Entity<BehaviorLog>()
   .HasIndex(x => new { x.AnonymousId, x.ClientEventId })
   .IsUnique()
   .HasFilter("[ClientEventId] IS NOT NULL AND [AnonymousId] IS NOT NULL");

        modelBuilder.Entity<Recommendation>(e =>
    {
        e.HasKey(x => x.RecommendationId);
        e.HasIndex(x => new { x.UserId, x.RecType, x.GeneratedAt });
        e.Property(x => x.RecType).HasMaxLength(50);
    });

        modelBuilder.Entity<RecommendationItem>(e =>
        {
            e.HasKey(x => x.RecommendationItemId);
            e.HasIndex(x => new { x.RecommendationId, x.RankIndex });
            e.Property(x => x.ItemType).HasMaxLength(30);
            e.HasOne(x => x.Place).WithMany().HasForeignKey(x => x.PlaceId).OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<PlaceReview>()
            .HasIndex(r => new { r.PlaceId, r.UserId })
            .IsUnique();

    }
}
