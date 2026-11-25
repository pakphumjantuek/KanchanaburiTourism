
using TravelKanjanuburi.Dtos.BehaviorLog;
using TravelKanjanuburi.Dtos.Users;
using TravelKanjanuburi.Model.Log;

namespace KanjanaburiTravel.Services.Users;

public class UserInterestService : IUserInterestService
{
    private readonly ApplicationDbContext _db;

    public UserInterestService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<UserInterestDto>> GetMyInterestsAsync(int userId, CancellationToken ct)
    {
        var rows = await _db.UserInterests.AsNoTracking()
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.Weight)
            .Select(x => new { x.InterestKey, x.Weight })
            .ToListAsync(ct);

        // ดึง cat ids
        var catIds = rows
            .Select(r => TryParseCatId(r.InterestKey))
            .Where(id => id.HasValue)
            .Select(id => id!.Value)
            .Distinct()
            .ToList();

        var catMap = new Dictionary<int, string>();
        if (catIds.Count > 0)
        {
            catMap = await _db.PlaceCategories.AsNoTracking()
                .Where(c => catIds.Contains(c.CategoryId))
                .Select(c => new { c.CategoryId, c.CategoryName })
                .ToDictionaryAsync(x => x.CategoryId, x => x.CategoryName, ct);
        }

        return rows.Select(r =>
        {
            var id = TryParseCatId(r.InterestKey);
            var name = id.HasValue && catMap.TryGetValue(id.Value, out var n) ? n : r.InterestKey;

            return new UserInterestDto
            {
                InterestKey = r.InterestKey,
                DisplayName = name,
                Weight = r.Weight
            };
        }).ToList();
    }

    private static int? TryParseCatId(string key)
    {
        // key: "cat:12"
        if (string.IsNullOrWhiteSpace(key)) return null;
        if (!key.StartsWith("cat:", StringComparison.OrdinalIgnoreCase)) return null;

        var raw = key.Substring(4);
        return int.TryParse(raw, out var id) && id > 0 ? id : null;
    }


    public async Task<UserInterestDetailsDto> GetAsync(int userId, int days, int top, CancellationToken ct)
    {
        if (userId <= 0) throw new ArgumentException("userId ไม่ถูกต้อง");
        if (days is < 0 or > 3650) days = 90;
        if (top is < 1 or > 100) top = 20;

        var since = days <= 0 ? DateTime.MinValue : DateTime.UtcNow.AddDays(-days);

        // -------------------------
        // 1) Top interests
        // -------------------------
        var topInterests = await _db.UserInterests.AsNoTracking()
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.Weight)
            .Take(top)
            .Select(x => new UserInterestItemDto
            {
                InterestKey = x.InterestKey,
                Weight = x.Weight,
                UpdatedAtUtc = x.UpdatedAt
            })
            .ToListAsync(ct);

        // ✅ map cat:id -> CategoryName
        var catIds = topInterests
            .Select(x => TryParseCatId(x.InterestKey))
            .Where(x => x.HasValue)
            .Select(x => x!.Value)
            .Distinct()
            .ToList();

        Dictionary<int, string> catMap = new();
        if (catIds.Count > 0)
        {
            catMap = await _db.PlaceCategories.AsNoTracking()
                .Where(c => catIds.Contains(c.CategoryId))
                .Select(c => new { c.CategoryId, c.CategoryName })
                .ToDictionaryAsync(x => x.CategoryId, x => x.CategoryName, ct);
        }

        foreach (var it in topInterests)
        {
            var id = TryParseCatId(it.InterestKey);
            if (id.HasValue && catMap.TryGetValue(id.Value, out var name))
                it.DisplayName = name;
            else
                it.DisplayName = it.InterestKey; // fallback
        }

        // -------------------------
        // 2) Action summary
        // -------------------------
        var actionCounts = await _db.BehaviorLogs.AsNoTracking()
            .Where(b => b.UserId == userId && b.CreatedAt >= since)
            .GroupBy(b => b.ActionType)
            .Select(g => new { Action = g.Key.ToString(), Cnt = g.LongCount() })
            .ToListAsync(ct);

        // -------------------------
        // 3) Top places (แรงๆ) + เอาชื่อสถานที่
        // -------------------------
        var topPlacesRaw = await _db.BehaviorLogs.AsNoTracking()
            .Where(b =>
                b.UserId == userId &&
                b.PlaceId != null &&
                b.CreatedAt >= since &&
                (b.ActionType == BehaviorActionType.AddToTrip ||
                 b.ActionType == BehaviorActionType.Favorite ||
                 b.ActionType == BehaviorActionType.Review))
            .GroupBy(b => b.PlaceId!.Value)
            .Select(g => new
            {
                PlaceId = g.Key,
                Score = g.Sum(x =>
                    x.ActionType == BehaviorActionType.Favorite ? 3 :
                    x.ActionType == BehaviorActionType.Review ? 3 :
                    x.ActionType == BehaviorActionType.AddToTrip ? 2 : 1),
                Logs = g.LongCount()
            })
            .OrderByDescending(x => x.Score)
            .ThenByDescending(x => x.Logs)
            .Take(10)
            .ToListAsync(ct);

        var topPlaceIds = topPlacesRaw.Select(x => x.PlaceId).ToList();

        // ✅ ดึงชื่อสถานที่ + หมวด + รูปปก (ถ้ามี)
        var placeInfos = await _db.Places.AsNoTracking()
            .Where(p => topPlaceIds.Contains(p.PlaceId))
            .Select(p => new
            {
                p.PlaceId,
                p.Name,
                CategoryName = p.PlaceCategory != null ? p.PlaceCategory.CategoryName : null,
                CoverImageUrl = p.Images
                    .OrderByDescending(i => i.IsCover) // ถ้ามี field นี้
                    .Select(i => i.ImageUrl)
                    .FirstOrDefault()
            })
            .ToListAsync(ct);

        var placeMap = placeInfos.ToDictionary(x => x.PlaceId, x => x);

        var topPlaces = topPlacesRaw.Select(x =>
        {
            placeMap.TryGetValue(x.PlaceId, out var p);
            return new TopPlaceLiteDto
            {
                PlaceId = x.PlaceId,
                Name = p?.Name,
                CategoryName = p?.CategoryName,
                CoverImageUrl = p?.CoverImageUrl,
                Score = x.Score
            };
        }).ToList();

        return new UserInterestDetailsDto
        {
            UserId = userId,
            Days = days,
            SinceUtc = since,

            TopInterests = topInterests,
            ActionCounts = actionCounts.ToDictionary(x => x.Action, x => x.Cnt),

            TopPlaceIds = topPlaceIds, // optional
            TopPlaces = topPlaces      // ✅ ใหม่
        };
    }


    public async Task<List<UserInterestDto>> ReplaceMyInterestsAsync(int userId, UpdateUserInterestsRequest request)
    {
        // normalize + validate
        var items = (request.Items ?? new List<UserInterestDto>())
            .Where(x => !string.IsNullOrWhiteSpace(x.InterestKey))
            .Select(x => new UserInterestDto
            {
                InterestKey = x.InterestKey.Trim().ToLowerInvariant(),
                Weight = Clamp(x.Weight)
            })
            .GroupBy(x => x.InterestKey)
            .Select(g => g.OrderByDescending(x => x.Weight).First())
            .ToList();
        await using var tx = await _db.Database.BeginTransactionAsync();

        var old = await _db.UserInterests.Where(x => x.UserId == userId).ToListAsync();
        _db.UserInterests.RemoveRange(old);

        var now = DateTime.UtcNow;
        var entities = items.Select(x => new UserInterest
        {
            UserId = userId,
            InterestKey = x.InterestKey,
            Weight = x.Weight,
            UpdatedAt = now
        });

        await _db.UserInterests.AddRangeAsync(entities);
        await _db.SaveChangesAsync();

        await tx.CommitAsync();

        return items.OrderByDescending(x => x.Weight).ToList();
    }

    public async Task<UserInterestDto> UpsertMyInterestAsync(int userId, UserInterestDto item)
    {
        if (string.IsNullOrWhiteSpace(item.InterestKey))
            throw new ArgumentException("InterestKey ห้ามว่าง");

        var key = item.InterestKey.Trim().ToLowerInvariant();
        var weight = Clamp(item.Weight);

        var entity = await _db.UserInterests
            .FirstOrDefaultAsync(x => x.UserId == userId && x.InterestKey == key);

        if (entity == null)
        {
            entity = new UserInterest
            {
                UserId = userId,
                InterestKey = key,
                Weight = weight,
                UpdatedAt = DateTime.UtcNow
            };
            _db.UserInterests.Add(entity);
        }
        else
        {
            entity.Weight = weight;
            entity.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();

        return new UserInterestDto { InterestKey = key, Weight = weight };
    }

    public async Task DeleteMyInterestAsync(int userId, string interestKey)
    {
        var key = (interestKey ?? "").Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(key))
            return;

        var entity = await _db.UserInterests
            .FirstOrDefaultAsync(x => x.UserId == userId && x.InterestKey == key);

        if (entity == null) return;

        _db.UserInterests.Remove(entity);
        await _db.SaveChangesAsync();
    }

    private static double Clamp(double v, double min = -10, double max = 10)
     => v < min ? min : (v > max ? max : v);
}
