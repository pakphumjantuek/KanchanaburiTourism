using Microsoft.EntityFrameworkCore;
using TravelKanjanuburi.Model.Log;

public sealed class SeedBehaviorService
{
    private readonly ApplicationDbContext _db;

    public SeedBehaviorService(ApplicationDbContext db)
    {
        _db = db;
    }

    // ===============================
    // Result DTO
    // ===============================
    public sealed record SeedResult(
        int Users,
        int Places,
        int InsertedLogs,
        int Pairs
    );

    // ===============================
    // Public API
    // ===============================
    public async Task<SeedResult> SeedAsync(
        int users,
        int places,
        int logsPerUser,
        int daysBack,
        bool clearExisting,
        CancellationToken ct)
    {
        // ---------- normalize inputs ----------
        users = Clamp(users, 1, 200000);
        places = Clamp(places, 1, 100000);
        logsPerUser = Clamp(logsPerUser, 1, 2000);
        daysBack = Clamp(daysBack, 1, 3650);


        // ---------- clear existing (optional) ----------
        if (clearExisting)
        {
            await _db.Database.ExecuteSqlRawAsync(
                "DELETE FROM BehaviorLogs WHERE PlaceId IS NOT NULL",
                ct);
        }

        // ---------- load users ----------
        var userIds = await _db.Users
      .AsNoTracking()
      .Select(u => u.UserId)
      .OrderBy(u => Guid.NewGuid()) // ใช้ได้แต่ช้าเมื่อ user เยอะมาก
      .Take(users)
      .ToListAsync(ct);


        if (userIds.Count == 0)
            throw new InvalidOperationException("ไม่มี User ในระบบ");

        // ---------- load places ----------
        var placeIds = await _db.Places
            .AsNoTracking()
            .Where(p => p.IsActive)
            .Select(p => p.PlaceId)
            .Take(places)
            .ToListAsync(ct);

        if (placeIds.Count == 0)
            throw new InvalidOperationException("ไม่มี Place ที่ IsActive=true");

        var rng = new Random();
        var now = DateTime.UtcNow;

        int inserted = 0;

        // ---------- seed logs ----------
        foreach (var uid in userIds)
        {
            // ทำ cluster ความสนใจต่อ user
            var clusterSize = Math.Min(20, placeIds.Count);
            var cluster = placeIds
                .OrderBy(_ => rng.Next())
                .Take(clusterSize)
                .ToList();

            for (int i = 0; i < logsPerUser; i++)
            {
                var pid = rng.NextDouble() < 0.7
                    ? cluster[rng.Next(cluster.Count)]
                    : placeIds[rng.Next(placeIds.Count)];

                var action = PickAction(rng);
                double? value = action == BehaviorActionType.Review
    ? PickRating(rng)
    : null;

                var createdAt = now
                    .AddDays(-rng.NextDouble() * daysBack)
                    .AddMinutes(-rng.Next(0, 1440));

                _db.BehaviorLogs.Add(new BehaviorLog
                {
                    UserId = uid,
                    PlaceId = pid,
                    ActionType = action,
                    ActionValue = value,
                    MetaJson = null,
                    CreatedAt = createdAt
                });

                inserted++;

                // batch save ป้องกัน memory บวม
                if (inserted % 1000 == 0)
                {
                    await _db.SaveChangesAsync(ct);
                    _db.ChangeTracker.Clear();
                }
            }
        }

        await _db.SaveChangesAsync(ct);
        _db.ChangeTracker.Clear();

        // ---------- count pairs (UserId, PlaceId) ----------
        var pairs = await _db.BehaviorLogs
            .AsNoTracking()
            .Where(b => b.PlaceId != null)
            .GroupBy(b => new { b.UserId, b.PlaceId })
            .CountAsync(ct);

        // ✅ RETURN แน่นอน
        return new SeedResult(
            Users: userIds.Count,
            Places: placeIds.Count,
            InsertedLogs: inserted,
            Pairs: pairs
        );
    }

    // ==================================================
    // Helpers (ต้องอยู่ใน class เดียวกัน)
    // ==================================================

    private static int Clamp(int v, int min, int max)
    {
        if (v < min) return min;
        if (v > max) return max;
        return v;
    }

    private static BehaviorActionType PickAction(Random rng)
    {
        var x = rng.NextDouble();
        if (x < 0.55) return BehaviorActionType.View;
        if (x < 0.80) return BehaviorActionType.Click;
        if (x < 0.90) return BehaviorActionType.AddToTrip;
        if (x < 0.97) return BehaviorActionType.Favorite;
        return BehaviorActionType.Review;
    }

    private static double PickRating(Random rng)
    {
        // rating 1–5 (เน้น 4–5)
        var x = rng.NextDouble();
        if (x < 0.05) return 1;
        if (x < 0.10) return 2;
        if (x < 0.25) return 3;
        if (x < 0.65) return 4;
        return 5;
    }
}
