using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using TravelKanjanuburi.Dtos.BehaviorLog;
using TravelKanjanuburi.Dtos.Home;
using TravelKanjanuburi.Helper;
using TravelKanjanuburi.ML.Food.Prediction;
using TravelKanjanuburi.Model.Log;
using TravelKanjanuburi.Services.FeatureEngineering;

public sealed class HomeService
{
    private readonly ApplicationDbContext _db;
    private readonly IMapper _mapper;
    private readonly CategoryPredictionService _predictionService;
    private readonly FoodPopularityPredictionService _foodMl;
    private readonly IMemoryCache _cache;

    // trending เป็นของทั้งระบบ (ไม่ผูกผู้ใช้) จึงแคชนานกว่า; การกระจายหมวดผูกพฤติกรรมผู้ใช้ จึงแคชสั้น
    private static readonly TimeSpan TrendingTtl = TimeSpan.FromMinutes(5);
    private static readonly TimeSpan UserDistributionTtl = TimeSpan.FromMinutes(5);

    public HomeService(
        ApplicationDbContext db,
        IMapper mapper,
        CategoryPredictionService predictionService,
        FoodPopularityPredictionService foodMl,
        IMemoryCache cache)
    {
        _cache = cache;
        _db = db;
        _mapper = mapper;
        _predictionService = predictionService;
        _foodMl = foodMl;
    }

    // =====================================================
    // MAIN ENTRY
    // =====================================================

    public async Task<HomeResponseDto> GetHomeAsync(
     int? userId,
     int topN,
     double? lat,
     double? lng,
     CancellationToken ct)
    {
        if (topN is < 1 or > 50)
            topN = 20;

        HashSet<int> seen = new();

        if (userId is > 0)
            seen = await GetSeenPlaceIdsAsync(userId.Value, ct);

        var popularNow = await GetPopularNowAsync(topN, seen, ct);
        var hiddenFoods = await GetHiddenFoodAsync(topN, lat, lng, seen, ct);
        var foodDtos = await GetTrendingFoodDtosAsync();

        List<PlaceRecommendDto> popularForYou;

        if (userId is > 0)
            popularForYou = await GetPersonalizedAsync(userId.Value, topN, lat, lng, seen, ct);
        else
            popularForYou = popularNow;

        return new HomeResponseDto
        {
            IsSuccess = true,
            Sections = new List<HomeSectionDto>
        {
            new HomeSectionDto
            {
                Key = "popular_for_you",
                Title = userId is > 0 ? "ยอดนิยมสำหรับคุณ" : "ยอดนิยมแนะนำ",
                Items = popularForYou.Cast<object>().ToList()
            },
            new HomeSectionDto
            {
                Key = "popular_now",
                Title = "ยอดนิยมตอนนี้",
                Items = popularNow.Cast<object>().ToList()
            },
            new HomeSectionDto
            {
                Key = "hidden_food",
                Title = "ร้านอาหารพื้นถิ่นที่อยากให้คุณลอง",
                Items = hiddenFoods.Cast<object>().ToList()
            },
            new HomeSectionDto
            {
                Key = "trending_food",
                Title = "เมนูยอดนิยมช่วงนี้ 🔥",
                Items = foodDtos
            }
        }
        };
    }

    // =====================================================
    // TRENDING FOOD (cached)
    // =====================================================

    private async Task<List<object>> GetTrendingFoodDtosAsync()
    {
        const string key = "home:trending_foods:10";

        if (_cache.TryGetValue(key, out List<object>? cached) && cached != null)
            return cached;

        List<(TravelKanjanuburi.Model.Foods.LocalDish Dish, float Score)> trendingFoods;
        try
        {
            trendingFoods = await _foodMl.GetTrendingFoodsAsync(10);
        }
        catch (InvalidOperationException)
        {
            // ไม่มีโมเดลอาหาร → ข้ามเฉพาะ section นี้ ไม่ให้ทั้งหน้า Home ล่ม และไม่แคชผลว่าง
            return new();
        }

        // แคชเป็น DTO (ข้อมูลล้วน) ไม่แคช entity ที่ผูกกับ DbContext ของ request
        var dtos = trendingFoods
            .Select(x => new FoodRecommendDto
            {
                DishId = x.Dish.DishId,
                NameTH = x.Dish.NameTH,
                CoverImageUrl = x.Dish.LocalDishImages
                    .OrderByDescending(i => i.IsCover)   // cover มาก่อน
                    .Select(i => i.ImageUrl)
                    .FirstOrDefault(),
                Score = MathF.Round(x.Score, 3)
            })
            .Cast<object>()
            .ToList();

        if (dtos.Count > 0)
            _cache.Set(key, dtos, TrendingTtl);

        return dtos;
    }

    // =====================================================
    // USER CATEGORY DISTRIBUTION (cached)
    // =====================================================

    private async Task<float[]> GetUserDistributionAsync(int userId)
    {
        var key = $"home:user_dist:{userId}";

        if (_cache.TryGetValue(key, out float[]? cached) && cached != null)
            return cached;

        var dist = await _predictionService.PredictDistributionAsync(userId);

        // ผลว่าง = ยังไม่มีโมเดล/ผู้ใช้ไม่มีกิจกรรม → ไม่แคช เพื่อให้เทรนเสร็จหรือผู้ใช้เริ่มมีกิจกรรมแล้วเห็นผลทันที
        if (dist != null && dist.Length > 0 && dist.Any(x => x != 0))
            _cache.Set(key, dist, UserDistributionTtl);

        return dist ?? Array.Empty<float>();
    }

    // =====================================================
    // PERSONALIZED HYBRID
    // =====================================================

    private async Task<List<PlaceRecommendDto>> GetPersonalizedAsync(
      int userId,
      int topN,
      double? lat,
      double? lng,
      HashSet<int> exclude,
      CancellationToken ct)
    {
        var categories = await _db.PlaceCategories
            .OrderBy(x => x.CategoryId)
            .ToListAsync(ct);

        if (!categories.Any())
            return new();

        var distribution = await GetUserDistributionAsync(userId);

        if (distribution == null || distribution.Length == 0 || distribution.All(x => x == 0))
            return await GetFallbackPopularAsync(topN, exclude, ct);

        // 🔥 Normalize distribution
        var sum = distribution.Sum();
        if (sum > 0)
            distribution = distribution.Select(x => x / sum).ToArray();

        var categoryIndexMap = categories
            .Select((cat, index) => new { cat.CategoryId, index })
            .ToDictionary(x => x.CategoryId, x => x.index);

        var ratioList = categories
            .Select((cat, index) => new
            {
                cat.CategoryId,
                Index = index,
                Ratio = distribution[index]
            })
            .Where(x => x.Ratio > 0)
            .OrderByDescending(x => x.Ratio)
            .ToList();

        if (!ratioList.Any())
            return await GetFallbackPopularAsync(topN, exclude, ct);

        // Smart Allocation
        var allocation = new Dictionary<int, int>();
        int used = 0;

        foreach (var item in ratioList)
        {
            int take = (int)Math.Floor(topN * item.Ratio);
            allocation[item.CategoryId] = take;
            used += take;
        }

        int remaining = topN - used;

        foreach (var item in ratioList)
        {
            if (remaining <= 0) break;
            allocation[item.CategoryId]++;
            remaining--;
        }

        var selectedCategoryIds = allocation
            .Where(x => x.Value > 0)
            .Select(x => x.Key)
            .ToList();

        var places = await _db.Places
            .AsNoTracking()
            .Where(PlaceVisibility.VisibleNow())
            .Where(p =>
                p.IsActive &&
                p.CategoryId != null &&
                selectedCategoryIds.Contains(p.CategoryId.Value) &&
                !exclude.Contains(p.PlaceId))
            .Include(p => p.PlaceCategory)
            .Include(p => p.Images)
            .ToListAsync(ct);

        PlaceRecommendDto ScorePlace(Place p, double mlScore)
        {
            var popularity = Math.Clamp(p.PopularityScore / 100.0, 0, 1);

            double distanceScore = 0;
            if (lat.HasValue && lng.HasValue)
            {
                distanceScore = 1.0 / (1.0 + Geo.HaversineKm(
                    lat.Value, lng.Value,
                    p.Latitude, p.Longitude));

                distanceScore = Math.Clamp(distanceScore, 0, 0.5);
            }

            var timeBoost = GetTimeOfDayBoost(p.PlaceCategory?.CategoryName);

            var finalScore =
                (mlScore * 0.6) +
                (popularity * 0.2) +
                (distanceScore * 0.1) +
                (timeBoost * 0.1);

            var dto = _mapper.Map<PlaceRecommendDto>(p);
            dto.Score = finalScore;

            dto.ReasonJson = JsonSerializer.Serialize(new
            {
                type = "ml_personalized_hybrid",
                category = p.PlaceCategory?.CategoryName,
                mlScore = Math.Round(mlScore, 4),
                popularity = Math.Round(popularity, 4),
                distance = Math.Round(distanceScore, 4),
                timeBoost = Math.Round(timeBoost, 4),
                finalScore = Math.Round(finalScore, 4)
            });

            return dto;
        }

        var result = new List<PlaceRecommendDto>();
        var leftovers = new List<PlaceRecommendDto>(); // ตัวที่ผ่านการให้คะแนนแต่เกินโควตาหมวด ไว้เติมเมื่อผลไม่ครบ

        foreach (var kv in allocation)
        {
            var categoryId = kv.Key;
            var takeCount = kv.Value;

            if (takeCount <= 0) continue;

            if (!categoryIndexMap.TryGetValue(categoryId, out var index))
                continue;

            // 🔥 Smooth ML score
            var mlScore = Math.Sqrt(distribution[index]);

            var scored = places
                .Where(p => p.CategoryId == categoryId)
                .Select(p => ScorePlace(p, mlScore))
                .OrderByDescending(x => x.Score)
                .ToList();

            result.AddRange(scored.Take(takeCount));
            leftovers.AddRange(scored.Skip(takeCount));
        }

        // Backfill: หมวดไหนมีสถานที่น้อยกว่าโควตา → เติมจากตัวเกินโควตาของหมวดอื่น ตามคะแนนรวม
        if (result.Count < topN)
        {
            // ยังไม่พอ (หมวดที่เลือกมีสถานที่รวมน้อยกว่า topN) → ดึงจากหมวดอื่นที่ไม่ได้อยู่ในโควตา
            if (result.Count + leftovers.Count < topN)
            {
                var otherPlaces = await _db.Places
                    .AsNoTracking()
                    .Where(PlaceVisibility.VisibleNow())
                    .Where(p =>
                        p.IsActive &&
                        p.CategoryId != null &&
                        !selectedCategoryIds.Contains(p.CategoryId.Value) &&
                        !exclude.Contains(p.PlaceId))
                    .OrderByDescending(p => p.PopularityScore)
                    .Take(topN * 2)
                    .Include(p => p.PlaceCategory)
                    .Include(p => p.Images)
                    .ToListAsync(ct);

                foreach (var p in otherPlaces)
                {
                    var mlScore = categoryIndexMap.TryGetValue(p.CategoryId!.Value, out var idx)
                        ? Math.Sqrt(distribution[idx])
                        : 0;
                    leftovers.Add(ScorePlace(p, mlScore));
                }
            }

            result.AddRange(leftovers
                .OrderByDescending(x => x.Score)
                .Take(topN - result.Count));
        }

        return result
            .OrderByDescending(x => x.Score)
            .Take(topN)
            .ToList();
    }

    // =====================================================
    // TIME BOOST
    // =====================================================

    private double GetTimeOfDayBoost(string? categoryName)
    {
        if (string.IsNullOrEmpty(categoryName))
            return 0;

        // เวลาไทย (UTC+7, ไม่มี DST) ไม่ขึ้นกับเขตเวลาของเซิร์ฟเวอร์ และไม่ต้องพึ่งชื่อ time zone ที่ต่างกันบน Windows/Linux
        var hour = DateTime.UtcNow.AddHours(7).Hour;

        return (hour, categoryName) switch
        {
            ( >= 6 and < 11, "ธรรมชาติ") => 0.2,
            ( >= 6 and < 11, "อาหาร") => 0.1,

            ( >= 11 and < 17, "ธรรมชาติ") => 0.15,
            ( >= 11 and < 17, "วัฒนธรรม") => 0.1,

            ( >= 17 and < 21, "อาหาร") => 0.25,
            ( >= 17 and < 21, "บันเทิง") => 0.15,

            ( >= 21 or < 6, "บันเทิง") => 0.25,
            ( >= 21 or < 6, "อาหาร") => 0.15,

            _ => 0
        };
    }

    // =====================================================
    // POPULAR NOW
    // =====================================================

    private async Task<List<PlaceRecommendDto>> GetPopularNowAsync(
        int topN,
        HashSet<int> exclude,
        CancellationToken ct)
    {
        var places = await _db.Places
            .AsNoTracking()
            .Where(PlaceVisibility.VisibleNow())
            .Where(p => p.IsActive && !exclude.Contains(p.PlaceId))
            .OrderByDescending(p => p.PopularityScore)
            .Take(topN)
            .Include(p => p.PlaceCategory)
            .Include(p => p.Images)
            .ToListAsync(ct);

        var dtos = _mapper.Map<List<PlaceRecommendDto>>(places);

        foreach (var d in dtos)
        {
            var pop = Math.Clamp(d.PopularityScore / 100.0, 0, 1);
            d.Score = pop;

            d.ReasonJson = JsonSerializer.Serialize(new
            {
                type = "popular_now",
                popularity = Math.Round(pop, 4)
            });
        }

        return dtos;
    }

    // =====================================================
    // HIDDEN FOOD (Hybrid + Distance + Low Popular Boost)
    // =====================================================

    private async Task<List<PlaceRecommendDto>> GetHiddenFoodAsync(
        int topN,
        double? lat,
        double? lng,
        HashSet<int> exclude,
        CancellationToken ct)
    {
        // หา id หมวดอาหารจากชื่อ (ชื่อเดียวกับที่ GetTimeOfDayBoost ใช้) แทนการฮาร์ดโค้ดเลข id
        var foodCategoryId = await _db.PlaceCategories
            .AsNoTracking()
            .Where(c => c.CategoryName == "อาหาร")
            .Select(c => (int?)c.CategoryId)
            .FirstOrDefaultAsync(ct);

        if (foodCategoryId == null)
            return new();

        // 🔥 ดึงร้านอาหารที่ popularity ต่ำ (Hidden Gem)
        // เรียงจากไม่ดังที่สุดก่อนแล้วค่อยตัด เพื่อให้ candidate เป็นร้านที่ซ่อนจริง ไม่ใช่แถวแรกที่ DB เจอ
        var places = await _db.Places
            .AsNoTracking()
            .Where(PlaceVisibility.VisibleNow())
            .Where(p =>
                p.IsActive &&
                p.CategoryId == foodCategoryId &&
                p.PopularityScore <= 40 &&
                !exclude.Contains(p.PlaceId))
            .OrderBy(p => p.PopularityScore)
            .ThenBy(p => p.PlaceId)
            .Take(topN * 5)
            .Include(p => p.PlaceCategory)
            .Include(p => p.Images)
            .ToListAsync(ct);

        if (!places.Any())
            return new();

        var placeIds = places.Select(p => p.PlaceId).ToList();

        // 🔥 Engagement จาก BehaviorLogs
        var engagementMap = await _db.BehaviorLogs
            .Where(b => b.PlaceId != null && placeIds.Contains(b.PlaceId.Value))
            .GroupBy(b => b.PlaceId!.Value)
            .Select(g => new
            {
                PlaceId = g.Key,
                Score = g.LongCount()
            })
            .ToDictionaryAsync(x => x.PlaceId, ct);

        var result = new List<PlaceRecommendDto>();

        foreach (var p in places)
        {
            engagementMap.TryGetValue(p.PlaceId, out var engagementRaw);

            var popularity = Math.Clamp(p.PopularityScore / 100.0, 0, 1);
            var engagement = Math.Clamp((engagementRaw?.Score ?? 0) / 30.0, 0, 1);

            // 🔥 Distance Boost
            var distanceScore = 0.0;
            if (lat.HasValue && lng.HasValue)
            {
                distanceScore = 1.0 / (1.0 + Geo.HaversineKm(
                    lat.Value,
                    lng.Value,
                    p.Latitude,
                    p.Longitude));
            }

            // 🔥 Hidden Logic:
            // ยิ่ง popularity ต่ำ ยิ่งดี
            var hiddenBoost = 1 - popularity;

            var finalScore =
                (hiddenBoost * 0.5) +
                (distanceScore * 0.3) +
                (engagement * 0.2);

            var dto = _mapper.Map<PlaceRecommendDto>(p);
            dto.Score = finalScore;

            dto.ReasonJson = JsonSerializer.Serialize(new
            {
                type = "hidden_food_hybrid",
                popularity = p.PopularityScore,
                hiddenBoost = Math.Round(hiddenBoost, 4),
                engagement = Math.Round(engagement, 4),
                distance = Math.Round(distanceScore, 4),
                finalScore = Math.Round(finalScore, 4)
            });

            result.Add(dto);
        }

        return result
            .OrderByDescending(x => x.Score)
            .Take(topN)
            .ToList();
    }

    // =====================================================
    // SEEN
    // =====================================================

    private async Task<HashSet<int>> GetSeenPlaceIdsAsync(
        int userId,
        CancellationToken ct)
    {
        return (await _db.BehaviorLogs
            .AsNoTracking()
            .Where(b =>
                b.UserId == userId &&
                b.PlaceId != null &&
                (b.ActionType == BehaviorActionType.AddToTrip ||
                 b.ActionType == BehaviorActionType.Favorite ||
                 b.ActionType == BehaviorActionType.Review))
            .Select(b => b.PlaceId!.Value)
            .Distinct()
            .ToListAsync(ct))
            .ToHashSet();
    }

    private async Task<List<PlaceRecommendDto>> GetFallbackPopularAsync(
      int topN,
      HashSet<int> exclude,
      CancellationToken ct)
    {
        var places = await _db.Places
            .AsNoTracking()
            .Where(PlaceVisibility.VisibleNow())
            .Where(p => p.IsActive && !exclude.Contains(p.PlaceId))
            .OrderByDescending(p => p.PopularityScore)
            .Include(p => p.Images)
            .Take(topN)
            .ToListAsync(ct);

        return places.Select(p =>
        {
            var dto = _mapper.Map<PlaceRecommendDto>(p);
            dto.Score = p.PopularityScore;
            dto.ReasonJson = "{\"type\":\"global_popularity\"}";
            return dto;
        }).ToList();
    }

}
