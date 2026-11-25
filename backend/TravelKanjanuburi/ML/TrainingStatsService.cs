namespace TravelKanjanuburi.ML;

public sealed class TrainingStatsService
{
    private readonly ApplicationDbContext _db;

    public TrainingStatsService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<TrainingStatsDto> GetAsync(int days, CancellationToken ct)
    {
        if (days is < 0 or > 3650) days = 90;

        var since = days <= 0
            ? DateTime.MinValue
            : DateTime.UtcNow.Date.AddDays(-days);

        var baseQ = _db.BehaviorLogs
            .AsNoTracking()
            .Where(b => b.CreatedAt >= since);

        // -----------------------------
        // BASIC COUNTS
        // -----------------------------
        var totalLogs = await baseQ.LongCountAsync(ct);

        var placeQ = baseQ.Where(b => b.PlaceId != null);
        var placeLogs = await placeQ.LongCountAsync(ct);
        var searchLogs = totalLogs - placeLogs;

        var uniqueUsers = await placeQ
            .Where(b => b.UserId != null)
            .Select(b => b.UserId!.Value)
            .Distinct()
            .LongCountAsync(ct);

        var uniquePlaces = await placeQ
            .Select(b => b.PlaceId!.Value)
            .Distinct()
            .LongCountAsync(ct);

        // -----------------------------
        // TRAINABLE ROWS
        // -----------------------------
        var rowsTrainable = await placeQ
            .GroupBy(b => new { b.UserId, PlaceId = b.PlaceId!.Value })
            .LongCountAsync(ct);

        // -----------------------------
        // ACTION BREAKDOWN
        // -----------------------------
        var actions = await placeQ
            .GroupBy(b => b.ActionType)
            .Select(g => new ActionCountDto
            {
                ActionType = g.Key.ToString(),
                Count = g.LongCount()
            })
            .OrderByDescending(x => x.Count)
            .ToListAsync(ct);

        // -----------------------------
        // TOP USERS (REGISTERED + GUEST)
        // -----------------------------
        var topUsers = await placeQ
            .Where(b => b.UserId != null || b.AnonymousId != null)
            .GroupBy(b => new { b.UserId, b.AnonymousId })
            .Select(g => new TopUserDto
            {
                UserId = g.Key.UserId,
                AnonymousId = g.Key.AnonymousId,

                DisplayName =
                    g.Key.UserId != null
                        ? g.Select(x => x.User!.DisplayName).FirstOrDefault()
                            ?? $"User #{g.Key.UserId}"
                        : $"Guest #{g.Key.AnonymousId!.Substring(0, 6)}",

                Logs = g.LongCount(),

                UniquePlaces = g
                    .Where(x => x.PlaceId != null)
                    .Select(x => x.PlaceId!.Value)
                    .Distinct()
                    .LongCount()
            })
            .OrderByDescending(x => x.Logs)
            .Take(10)
            .ToListAsync(ct);

        // -----------------------------
        // TOP PLACES
        // -----------------------------
        var topPlacesRaw = await placeQ
            .GroupBy(b => b.PlaceId!.Value)
            .Select(g => new
            {
                PlaceId = g.Key,
                Logs = g.LongCount(),
                UniqueUsers = g
                    .Where(x => x.UserId != null)
                    .Select(x => x.UserId!.Value)
                    .Distinct()
                    .LongCount()
            })
            .OrderByDescending(x => x.Logs)
            .Take(10)
            .ToListAsync(ct);

        var topPlaceIds = topPlacesRaw.Select(x => x.PlaceId).ToList();

        var placeNames = await _db.Places
            .AsNoTracking()
            .Where(p => topPlaceIds.Contains(p.PlaceId))
            .Select(p => new { p.PlaceId, p.Name })
            .ToListAsync(ct);

        var nameMap = placeNames.ToDictionary(x => x.PlaceId, x => x.Name);

        var topPlaces = topPlacesRaw
            .Select(x => new TopPlaceDto
            {
                PlaceId = x.PlaceId,
                Name = nameMap.TryGetValue(x.PlaceId, out var n) ? n : null,
                Logs = x.Logs,
                UniqueUsers = x.UniqueUsers
            })
            .ToList();

        // -----------------------------
        // DAILY TIME-SERIES (SQL SERVER SAFE)
        // -----------------------------
        var daily = await baseQ
            .GroupBy(x => EF.Functions.DateDiffDay(since, x.CreatedAt))
            .Select(g => new DailyTrainingStatsDto
            {
                DateUtc = since.AddDays(g.Key),
                TotalLogs = g.LongCount(),
                PlaceLogs = g.LongCount(x => x.PlaceId != null),
                SearchLogs = g.LongCount(x => x.PlaceId == null),
                RowsTrainable = g
                    .Where(x => x.PlaceId != null)
                    .GroupBy(x => new { x.UserId, PlaceId = x.PlaceId!.Value })
                    .LongCount()
            })
            .OrderBy(x => x.DateUtc)
            .ToListAsync(ct);

        // -----------------------------
        // DAILY ACTIONS (FOR STACKED BAR)
        // -----------------------------
        var dailyActions = await placeQ
            .GroupBy(x => new
            {
                Day = EF.Functions.DateDiffDay(since, x.CreatedAt),
                x.ActionType
            })
            .Select(g => new DailyActionDto
            {
                DateUtc = since.AddDays(g.Key.Day),
                ActionType = g.Key.ActionType.ToString(),
                Count = g.LongCount()
            })
            .OrderBy(x => x.DateUtc)
            .ThenByDescending(x => x.Count)
            .ToListAsync(ct);

        // -----------------------------
        // EXTRA METRICS
        // -----------------------------
        double pairDensity = 0;
        if (uniqueUsers > 0 && uniquePlaces > 0)
            pairDensity = (double)rowsTrainable / (uniqueUsers * uniquePlaces);

        double topPlaceShare = 0;
        if (placeLogs > 0 && topPlacesRaw.Count > 0)
            topPlaceShare = (double)topPlacesRaw[0].Logs / placeLogs;

        double topUserShare = 0;
        if (placeLogs > 0 && topUsers.Count > 0)
            topUserShare = (double)topUsers[0].Logs / placeLogs;

        double trainableRate = placeLogs > 0
            ? (double)rowsTrainable / placeLogs
            : 0;

        // -----------------------------
        // AVERAGES (SAFE)
        // -----------------------------
        double avgPlacesPerUser = 0;
        var userPlaceCountsQ = placeQ
            .Where(x => x.UserId != null)
            .GroupBy(x => x.UserId!.Value)
            .Select(g => g.Select(z => z.PlaceId!.Value).Distinct().Count());

        if (await userPlaceCountsQ.AnyAsync(ct))
            avgPlacesPerUser = await userPlaceCountsQ.AverageAsync(ct);

        double avgUsersPerPlace = 0;
        var placeUserCountsQ = placeQ
            .Where(x => x.UserId != null)
            .GroupBy(x => x.PlaceId!.Value)
            .Select(g => g.Select(z => z.UserId!.Value).Distinct().Count());

        if (await placeUserCountsQ.AnyAsync(ct))
            avgUsersPerPlace = await placeUserCountsQ.AverageAsync(ct);

        // -----------------------------
        // RETURN DTO
        // -----------------------------
        return new TrainingStatsDto
        {
            Days = days,
            SinceUtc = since,

            TotalLogs = totalLogs,
            PlaceLogs = placeLogs,
            SearchLogs = searchLogs,
            UniqueUsers = uniqueUsers,
            UniquePlaces = uniquePlaces,
            RowsTrainable = rowsTrainable,

            Actions = actions,
            TopUsers = topUsers,
            TopPlaces = topPlaces,

            Daily = daily,
            DailyActions = dailyActions,

            PairDensity = Math.Round(pairDensity, 4),
            TopPlaceShare = Math.Round(topPlaceShare, 4),
            TopUserShare = Math.Round(topUserShare, 4),
            TrainableRate = Math.Round(trainableRate, 4),

            AvgPlacesPerUser = Math.Round(avgPlacesPerUser, 2),
            AvgUsersPerPlace = Math.Round(avgUsersPerPlace, 2),
        };
    }
}


