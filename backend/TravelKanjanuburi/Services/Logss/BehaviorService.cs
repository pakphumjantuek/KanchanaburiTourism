using System.Text.Json;
using TravelKanjanuburi.Dtos.BehaviorLog.TravelKanjanuburi.Dtos.BehaviorLog;
using TravelKanjanuburi.Helper;
using TravelKanjanuburi.Model.Log;

public sealed class BehaviorService
{
    private readonly ApplicationDbContext _db;
    private readonly IInterestMapper _interestMapper;

    private static readonly TimeSpan DedupeWindow = TimeSpan.FromSeconds(2);

    public BehaviorService(ApplicationDbContext db, IInterestMapper interestMapper)
    {
        _db = db;
        _interestMapper = interestMapper;
    }

    public async Task LogAsync(int? userId, CreateBehaviorLogRequest req, CancellationToken ct)
    {
        if (req is null) throw new ArgumentNullException(nameof(req));
        if (string.IsNullOrWhiteSpace(req.ActionType))
            throw new ArgumentException("ActionType ห้ามว่าง");

        var action = ParseAction(req.ActionType);

        // =========================
        // 1) ClientEventId (dedupe)
        // =========================
        Guid? clientEventId = null;
        if (!string.IsNullOrWhiteSpace(req.ClientEventId))
        {
            var raw = req.ClientEventId.Trim();
            if (!Guid.TryParse(raw, out var parsed))
                throw new ArgumentException("ClientEventId ต้องเป็น GUID ที่ถูกต้อง");
            clientEventId = parsed;
        }

        var anonymousId = string.IsNullOrWhiteSpace(req.AnonymousId)
            ? null
            : req.AnonymousId.Trim();

        var isLoggedIn = userId.HasValue && userId.Value > 0;

        if (!isLoggedIn && anonymousId is null)
            throw new ArgumentException("ต้องมี userId หรือ anonymousId");

        // =========================
        // 2) กัน log ซ้ำ
        // =========================
        if (clientEventId is not null)
        {
            var exists = await _db.BehaviorLogs.AsNoTracking().AnyAsync(x =>
                x.ClientEventId == clientEventId &&
                (
                    (isLoggedIn && x.UserId == userId!.Value) ||
                    (!isLoggedIn && x.AnonymousId == anonymousId)
                ),
                ct);

            if (exists) return;
        }
        else
        {
            if (await IsDuplicateWindowAsync(userId, anonymousId, req.PlaceId, action, ct))
                return;
        }

        // =========================
        // 3) บันทึก BehaviorLog ดิบ
        // =========================
        _db.BehaviorLogs.Add(new BehaviorLog
        {
            UserId = isLoggedIn ? userId!.Value : (int?)null,
            AnonymousId = isLoggedIn ? null : anonymousId,

            PlaceId = req.PlaceId,
            ActionType = action,
            ActionValue = req.ActionValue,
            MetaJson = req.MetaJson,
            ClientEventId = clientEventId,
            CreatedAt = DateTime.UtcNow
        });

        // ถ้า anonymous → แค่ log
        if (!isLoggedIn)
        {
            await _db.SaveChangesAsync(ct);
            return;
        }

        // =========================
        // 4) คำนวณ delta
        // =========================
        var delta = CalculateDelta(action, req.ActionValue);

        // =========================
        // 5) กรณีไม่มี placeId (เช่น SEARCH)
        // =========================
        if (req.PlaceId is null)
        {
            var keys = _interestMapper.MapToInterestKeys(
                categoryId: null,
                tagIds: new List<int>(),
                metaJson: req.MetaJson
            );

            await UpdateInterestsAsync(userId!.Value, keys, delta, ct);
            await _db.SaveChangesAsync(ct);
            return;
        }

        // =========================
        // 6) หา CategoryId (MetaJson → fallback DB)
        // =========================
        int? categoryId = TryGetCategoryId(req.MetaJson);
        List<int> tagIds = new();

        if (categoryId is null)
        {
            var placeInfo = await _db.Places.AsNoTracking()
                .Where(p => p.PlaceId == req.PlaceId.Value && p.IsActive)
                .Select(p => new
                {
                    p.CategoryId,
                    TagIds = p.PlaceTags.Select(pt => pt.TagId).ToList()
                })
                .FirstOrDefaultAsync(ct);

            if (placeInfo is null)
            {
                await _db.SaveChangesAsync(ct);
                return;
            }

            categoryId = placeInfo.CategoryId;
            tagIds = placeInfo.TagIds;
        }

        // =========================
        // 7) Update UserInterests (Category = กลุ่ม)
        // =========================
        var interestKeys = _interestMapper.MapToInterestKeys(
            categoryId,
            tagIds,
            req.MetaJson
        );

        await UpdateInterestsAsync(userId!.Value, interestKeys, delta, ct);

        await _db.SaveChangesAsync(ct);
    }

    private static BehaviorActionType ParseAction(string actionType)
    {
        var a = actionType.Trim().ToUpperInvariant();
        return a switch
        {
            "VIEW" => BehaviorActionType.View,
            "CLICK" => BehaviorActionType.Click,
            "ADD_TO_TRIP" => BehaviorActionType.AddToTrip,
            "FAVORITE" => BehaviorActionType.Favorite,
            "REVIEW" => BehaviorActionType.Review,
            "SEARCH" => BehaviorActionType.Search,
            "RECOMMEND_SHOWN" => BehaviorActionType.RecommendShown,

            _ => throw new ArgumentException($"ActionType ไม่รองรับ: {actionType}")
        };
    }

    private static double CalculateDelta(BehaviorActionType action, double? value) => action switch
    {
        BehaviorActionType.View => 0.02,
        BehaviorActionType.Click => 0.03,
        BehaviorActionType.AddToTrip => 0.08,
        BehaviorActionType.Favorite => 0.12,
        BehaviorActionType.Review => value switch
        {
            >= 4 => 0.15,
            <= 2 => -0.10,
            _ => 0.05
        },
        BehaviorActionType.Search => 0.02,
        _ => 0.01
    };

    private async Task<bool> IsDuplicateWindowAsync(int? userId, string? anonymousId, int? placeId, BehaviorActionType action, CancellationToken ct)
    {
        if (placeId is null) return false;

        var dedupeAllowed = action is BehaviorActionType.View
            or BehaviorActionType.Click
            or BehaviorActionType.AddToTrip
            or BehaviorActionType.Favorite;

        if (!dedupeAllowed) return false;

        var since = DateTime.UtcNow.Subtract(DedupeWindow);
        var isLoggedIn = userId.HasValue && userId.Value > 0;

        return await _db.BehaviorLogs.AsNoTracking().AnyAsync(x =>
            x.PlaceId == placeId &&
            x.ActionType == action &&
            x.CreatedAt >= since &&
            (
                (isLoggedIn && x.UserId == userId!.Value) ||
                (!isLoggedIn && anonymousId != null && x.AnonymousId == anonymousId)
            ),
            ct);
    }

    private async Task UpdateInterestsAsync(int userId, HashSet<string> interestKeys, double delta, CancellationToken ct)
    {
        if (interestKeys.Count == 0) return;

        var now = DateTime.UtcNow;

        var existing = await _db.UserInterests
            .Where(x => x.UserId == userId && interestKeys.Contains(x.InterestKey))
            .ToListAsync(ct);

        foreach (var key in interestKeys)
        {
            var row = existing.FirstOrDefault(x => x.InterestKey == key);

            if (row is null)
            {
                _db.UserInterests.Add(new UserInterest
                {
                    UserId = userId,
                    InterestKey = key,
                    Weight = Clamp(delta, -10, 10),
                    UpdatedAt = now
                });
            }
            else
            {
                row.Weight *= 0.98;
                row.Weight = Clamp(row.Weight + delta, -10, 10);
                row.UpdatedAt = now;
            }
        }
    }

    private static double Clamp(double v, double min, double max)
        => v < min ? min : (v > max ? max : v);

    private static int? TryGetCategoryId(string? metaJson)
    {
        if (string.IsNullOrWhiteSpace(metaJson)) return null;

        try
        {
            using var doc = JsonDocument.Parse(metaJson);
            if (doc.RootElement.TryGetProperty("categoryId", out var el))
                return el.GetInt32();
        }
        catch { }

        return null;
    }
}
