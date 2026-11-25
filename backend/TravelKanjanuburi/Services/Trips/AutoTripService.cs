using TravelKanjanuburi.Services.Trips;
using TravelKanjanuburi.Helper;
using TravelKanjanuburi.Model.MTrips;

public sealed class AutoTripService
{
    private readonly ApplicationDbContext _db;
    private readonly IPlaceRecommender _reco;
    private readonly IRoadMatrixProvider _road;

    // ถ้าโปรเจกต์ใช้แค่ไทย เราจะ treat เวลาเป็นเวลาไทยเสมอ
    private static readonly TimeZoneInfo _tz = ResolveThailandTimeZone();

    public AutoTripService(ApplicationDbContext db, IPlaceRecommender reco, IRoadMatrixProvider road)
    {
        _db = db;
        _reco = reco;
        _road = road;
    }

    public sealed class AutoTripPreference
    {
        public List<int> PreferredCategoryIds { get; init; } = new(); // รหัสหมวด (CategoryId)
        public double RelaxedPace { get; init; } = 0.5;
        public double BudgetLevel { get; init; } = 0.5;
        public bool WithElderOrKids { get; init; } = false;
    }

    public async Task<Trip> GenerateAsync(
        int userId,
        DateTime startUtc, // รับมาจาก API เหมือนเดิม แต่เราจะ treat เป็น "วันเริ่ม" เท่านั้น
        int days,
        int hoursPerDay,
        double? startLat,
        double? startLng,
        string transportMode,
        AutoTripPreference? pref,
        CancellationToken ct)
    {
        pref ??= new AutoTripPreference();

        days = Math.Clamp(days, MinDays, MaxDays);
        hoursPerDay = Math.Clamp(hoursPerDay, MinHoursPerDay, MaxHoursPerDay);
        transportMode = string.IsNullOrWhiteSpace(transportMode) ? "driving" : transportMode;

       
        DateTime startBangkok = ConvertToBangkokTime(startUtc);

        var startLocalDate = startBangkok.Date;
        var startLocal = startLocalDate.AddHours(8); // ✅ 08:00 ไทย

        // ====================================================
        // 1) Reco candidates
        // ====================================================
        var topCandidates = await _reco.RecommendPersonalAsync(
            userId, 200, startLat, startLng, ct, forTrip: true);

        var candidatePlaceIds = topCandidates
            .Select(x => x.PlaceId)
            .Distinct()
            .ToList();

        if (candidatePlaceIds.Count == 0)
            throw new InvalidOperationException("ไม่มีสถานที่ให้จัดทริป");

        // ====================================================
        // 2) Load Places + Tags + OpeningHours
        // ====================================================
        var places = await _db.Places.AsNoTracking()
            .Where(PlaceVisibility.VisibleNow())
            .Where(p => p.IsActive && candidatePlaceIds.Contains(p.PlaceId))
            .Include(p => p.PlaceCategory)
            .Include(p => p.OpeningHours)
            .ToListAsync(ct);

        // ร้านอาหาร = หมวดอาหาร หรือมีเมนูท้องถิ่นผูกไว้ → ใช้แทรกเป็นมื้อ ไม่ใช่จุดเที่ยว
        var foodCategoryId = await _db.PlaceCategories.AsNoTracking()
            .Where(c => c.CategoryName == FoodCategoryName)
            .Select(c => (int?)c.CategoryId)
            .FirstOrDefaultAsync(ct);

        var foodPlaces = await _db.Places.AsNoTracking()
            .Where(PlaceVisibility.VisibleNow())
            .Where(p => p.IsActive && ((foodCategoryId != null && p.CategoryId == foodCategoryId) || p.PlaceLocalDishes.Any()))
            .Include(p => p.OpeningHours)
            .ToListAsync(ct);
        var foodIds = foodPlaces.Select(p => p.PlaceId).ToHashSet();
        places = places.Where(p => !foodIds.Contains(p.PlaceId)).ToList();

        if (places.Count == 0)
            throw new InvalidOperationException("ไม่พบ Place ที่ใช้งานได้");

        // ระยะ/เวลาขับจริงจาก OSRM (เฉพาะโหมดขับรถ; ล้มเหลวหรือโหมดอื่น → ใช้เส้นตรงเหมือนเดิม)
        var road = transportMode == "driving"
            ? await _road.EnsureAsync(places.Concat(foodPlaces), ct)
            : null;

        (double km, int min) Leg(Place? from, double fromLat, double fromLng, Place to)
        {
            if (road != null && from != null && road.TryGet(from.PlaceId, to.PlaceId, out var rk, out var rm))
                return (rk, rm);
            var k = Geo.HaversineKm(fromLat, fromLng, to.Latitude, to.Longitude);
            return (k, EstimateTravelMinutes(k, transportMode));
        }

        var scoreMap = topCandidates
            .GroupBy(x => x.PlaceId)
            .ToDictionary(g => g.Key, g => g.Max(x => x.Score));

        // ====================================================
        // 3) Tag helpers
        // ====================================================
        var prefSet = pref.PreferredCategoryIds.ToHashSet();

        bool HasPreferredCategory(Place p)
        {
            if (prefSet.Count == 0) return false;
            return p.CategoryId.HasValue && prefSet.Contains(p.CategoryId.Value);
        }
        // ====================================================
        // 4) Split pool: TAG-FIRST
        // ====================================================
        var preferredPlaces = prefSet.Count == 0
            ? new List<Place>()
            : places.Where(HasPreferredCategory).ToList();

                var otherPlaces = places
                    .Except(preferredPlaces)
                    .ToList();

        preferredPlaces = preferredPlaces
            .OrderByDescending(p =>
                ComputeUtility(
                    scoreMap.GetValueOrDefault(p.PlaceId),
                    p,
                    pref,
                    0))
            .ToList();

        otherPlaces = otherPlaces
            .OrderByDescending(p =>
                ComputeUtility(
                    scoreMap.GetValueOrDefault(p.PlaceId),
                    p,
                    pref,
                    0))
            .ToList();


        // ====================================================
        // 5) Trip init (เก็บ "เวลาไทย" เป็น Unspecified)
        // ====================================================
        var tripStartLocal = DateTime.SpecifyKind(startLocal, DateTimeKind.Unspecified);
        var lastDayStartLocal = startLocal.AddDays(days - 1);

        // ✅ จบตาม hoursPerDay (เช่น 6 ชม. -> 14:00)
        var tripEndLocal = DateTime.SpecifyKind(lastDayStartLocal.AddHours(hoursPerDay), DateTimeKind.Unspecified);

        var trip = new Trip
        {
            UserId = userId,
            Title = $"เที่ยวกาญจน์ {days} วัน · {startLocalDate.ToString("d MMM", new System.Globalization.CultureInfo("th-TH"))}",
            StartDateTime = tripStartLocal, // ✅ ไทย 08:00
            EndDateTime = tripEndLocal,     // ✅ ไทย 08:00 (+days)
            StartLat = startLat,
            StartLng = startLng,
            Items = new List<TripItem>(),
            Segments = new List<TripSegment>()
        };

        int baseTarget = hoursPerDay >= 10 ? 6 : (hoursPerDay <= 6 ? 4 : 5);
        int shift = pref.RelaxedPace >= 0.75 ? -1 : (pref.RelaxedPace <= 0.25 ? 1 : 0);
        int targetPerDay = Math.Clamp(baseTarget + shift, 3, 7);

        if (pref.WithElderOrKids)
            targetPerDay = Math.Max(2, targetPerDay - 1);

        bool hasStart = startLat.HasValue && startLng.HasValue;
        var pickedGlobal = new HashSet<int>();

        // ====================================================
        // 6) Per day planning (เวลาไทย)
        // ====================================================
        for (int day = 1; day <= days; day++)
        {
            var dayStartLocal = startLocal.AddDays(day - 1);  // ✅ ไทย
            var dayEndLocal = dayStartLocal.AddHours(hoursPerDay);
            var cursorLocal = dayStartLocal;
            double dayDistanceWeight = (double)(days - day + 1) / days;

            var dayPool = preferredPlaces
                .Concat(otherPlaces)
                .Where(p => !pickedGlobal.Contains(p.PlaceId))
                .ToList();

            if (dayPool.Count == 0) break;

            // ใช้ทั้งพูล (ไม่ตัดแค่ 20 อันดับแรก): ถ้าตัดไว้ แล้วทุกจุดในนั้นปิดหรือไกลเกินในวันนั้น วันนั้นจะว่างทั้งวัน
            // การจัดอันดับยังคงใช้ utility (คะแนน + หมวดที่ชอบ - เวลาเดินทาง - โซน) จึงได้จุดที่ดีที่สุดก่อนอยู่แล้ว
            var picked = dayPool.ToList();

            var ordered = new List<Place>();
            double curLat = startLat ?? 0;
            double curLng = startLng ?? 0;
            Place? curPlace = null;
            Place? dayAnchor = null;
            var selCursor = dayStartLocal; // เวลา "จำลอง" หลังจบจุดล่าสุดที่เลือก (ใช้เช็คเวลาเปิด-ปิดตอนเลือก)
            var selMeals = NewMealQueue();
            // เพดานเวลาเดินทางต่อช่วงของจุดเที่ยววันนี้: เริ่มที่ค่าปกติ และผ่อนครั้งเดียวเมื่อหาจุดต่อไปไม่ได้เลยทั้งที่วันยังไม่ครบเป้า
            int legCeiling = MaxLegMinutes(transportMode);
            bool legRelaxed = false;
            // สุ่มแบบกำหนดผลได้: เงื่อนไขเดิม (ผู้ใช้/วันเริ่ม/วันที่) ได้ทริปเดิม
            var rng = new Random(unchecked((userId * 397) ^ ((int)(startLocalDate.Ticks / TimeSpan.TicksPerDay) * 31) ^ (day * 7919) ^ days));

            // --- greedy selection (soft-random), ต้องอยู่ในเวลาเปิด-ปิดจริง
            while (picked.Count > 0 && ordered.Count < targetPerDay)
            {
                // ลงตารางจริงจะแทรกมื้ออาหารหลังจุดที่ทำให้เลยเวลามื้อ ช่วงเลือกต้องนับเวลานั้นด้วย
                if (ordered.Count > 0)
                    selCursor = AdvancePastMeals(selCursor, selMeals);

                var ranked = picked
                    .Select(p =>
                    {
                        // ไม่มีจุดเริ่ม: จุดแรกไม่มีระยะ แต่จุดถัดไปต้องนับจากจุดก่อนหน้า
                        int travelMin = hasStart || ordered.Count > 0
                            ? Leg(curPlace, curLat, curLng, p).min
                            : 0;

                        // ไม่ลากไปไกลเกินไประหว่างจุด (จุดแรกของวันไม่จำกัด เพราะอาจเริ่มไกลจากที่พัก)
                        if (ordered.Count > 0 && travelMin > legCeiling)
                            return new { Place = p, Utility = double.NegativeInfinity };
                        int stayMin = GetStayMinutes(p, pref);

                        // เวลาจำลองต้องตรงกับตอนลงตารางจริง: จุดแรกของวันถึงตอนเริ่มวันเลย (ไม่นับเดินทางจากจุดเริ่มต้น)
                        // ถ้านับ เวลาจำลองจะช้ากว่าจริงราว 10-25 นาที แล้วคิดว่าถึงเวลามื้อก่อน ทำให้จุดท้ายวันไม่ทันเวลา
                        // ส่วนระยะจากจุดเริ่มต้นยังนับใน utility ด้านล่าง (ใช้จัดอันดับจุดแรก)
                        var proposedArrivalLocal = selCursor.AddMinutes(ordered.Count > 0 ? travelMin + 10 : 0);

                        bool feasible = TryAdjustArrivalToOpening(
                            p,
                            proposedArrivalLocal,
                            stayMin,
                            dayEndLocal,
                            out var adjustedArrivalLocal,
                            out var adjustedLeaveLocal);

                        if (!feasible)
                            return new { Place = p, Utility = double.NegativeInfinity };

                        double util = ComputeUtility(
                             scoreMap.GetValueOrDefault(p.PlaceId),
                             p, pref, travelMin);

                        // ⭐ กันไม่ให้วิ่งข้ามโซนแล้วกลับมา
                        if (dayAnchor != null)
                        {
                            double zoneDistKm = Geo.HaversineKm(
                                dayAnchor.Latitude,
                                dayAnchor.Longitude,
                                p.Latitude,
                                p.Longitude);

                            // ถ้าเริ่มออกนอกโซน (>15 กม.)
                            if (zoneDistKm > 15)
                            {
                                util -= (zoneDistKm - 15) * 0.5;
                            }
                        }

                        var waitMin = Math.Max(
                            0,
                            (adjustedArrivalLocal - proposedArrivalLocal).TotalMinutes);

                        util -= travelMin * 0.02 * dayDistanceWeight;
                        util -= WaitPenalty(waitMin);

                        return new { Place = p, Utility = util };
                    })
                    .Where(x => !double.IsNegativeInfinity(x.Utility))
                    .OrderByDescending(x => x.Utility)
                    .Take(3)                 // ⭐ Top 3 ดีที่สุด
                    .ToList();

                if (ranked.Count == 0)
                {
                    // วันยังได้จุดไม่ครบเป้า แต่ที่ใกล้ๆ หมดแล้ว (ถูกใช้ในวันก่อน/ปิด/ไกลเกินเพดาน) → ผ่อนเพดานหนึ่งครั้งแล้วลองใหม่
                    // ดีกว่าจบวันตั้งแต่เช้า; ความไกลยังถูกหักในคะแนน utility เหมือนเดิม
                    if (!legRelaxed && ordered.Count > 0)
                    {
                        legRelaxed = true;
                        legCeiling = RelaxedMaxLegMinutes(transportMode);
                        continue;
                    }
                    break;
                }

                // ⭐ จุดแรกของวัน = สุ่มใน Top 3
                // ⭐ จุดถัดไป = เอาที่ดีที่สุด
                var chosen = ordered.Count == 0
                    ? ranked[rng.Next(ranked.Count)]
                    : ranked[0];

                var next = chosen.Place;

                // ขยับเวลาจำลองไปหลังจบจุดที่เลือก เพื่อให้จุดถัดไปถูกเช็คกับเวลาที่ไปถึงจริง
                var chosenTravel = ordered.Count > 0
                    ? Leg(curPlace, curLat, curLng, next).min
                    : 0;
                if (TryAdjustArrivalToOpening(next,
                        selCursor.AddMinutes(chosenTravel + (ordered.Count > 0 ? 10 : 0)),
                        GetStayMinutes(next, pref), dayEndLocal, out _, out var chosenLeave))
                    selCursor = chosenLeave;

                ordered.Add(next);
                picked.Remove(next);

                // ⭐ ถ้าเป็นจุดแรกของวัน → ใช้เป็นโซนหลัก
                if (dayAnchor == null)
                {
                    dayAnchor = next;
                }

                curLat = next.Latitude;
                curLng = next.Longitude;
                curPlace = next;
            }


            // --- schedule จริง
            int orderIndex = 1;
            TripItem? prev = null;
            Place? prevPlace = null; // จุดที่ลงตารางได้จริงล่าสุด (ข้ามจุดที่ติดเวลาเปิด-ปิด)
            var mealTimes = NewMealQueue();

            // แทรกร้านอาหารใกล้จุดล่าสุด เมื่อเวลาเลยช่วงมื้อ
            void TryInsertMeal()
            {
                while (mealTimes.Count > 0 && IsMealDue(cursorLocal, mealTimes.Peek()))
                {
                    mealTimes.Dequeue();
                    if (prevPlace == null) continue;
                    foreach (var food in RankMealPlaces(foodPlaces, prevPlace, pickedGlobal).Take(5))
                        if (TryAddStop(food, MealMinutes, isMeal: true)) break;
                }
            }

            foreach (var p in ordered)
            {
                TryInsertMeal();
                TryAddStop(p, GetStayMinutes(p, pref));
            }
            TryInsertMeal();

            bool TryAddStop(Place p, int stay, bool isMeal = false)
            {
                int travelMin = 0;
                double distKm = 0;

                if (prevPlace != null)
                {
                    var leg = Leg(prevPlace, prevPlace.Latitude, prevPlace.Longitude, p);
                    // ร้านอาหารไม่ผ่อนเพดาน (ไม่ขับไกลเพื่อกินข้าว) ส่วนจุดเที่ยวใช้เพดานที่ช่วงเลือกจุดใช้จริง
                    if (leg.min > (isMeal ? MaxLegMinutes(transportMode) : legCeiling)) return false;
                    distKm = leg.km;
                    travelMin = leg.min + 10; // buffer
                }

                var proposedArrivalLocal = cursorLocal.AddMinutes(travelMin);

                if (!TryAdjustArrivalToOpening(p, proposedArrivalLocal, stay, dayEndLocal, out var arrivalLocal, out var leaveLocal))
                    return false;

                // ✅ เก็บเวลาไทย (Unspecified) ลง TripItem
                var plannedArrivalLocal = DateTime.SpecifyKind(arrivalLocal, DateTimeKind.Unspecified);

                var item = new TripItem
                {
                    DayIndex = day,
                    OrderIndex = orderIndex,
                    PlaceId = p.PlaceId,
                    PlannedArrivalTime = plannedArrivalLocal,
                    PlannedDurationMinutes = stay
                };

                trip.Items.Add(item);

                if (prev != null)
                {
                    trip.Segments.Add(new TripSegment
                    {
                        FromTripItem = prev,
                        ToTripItem = item,
                        DistanceKm = distKm,
                        TravelMinutes = travelMin,
                        TransportMode = transportMode
                    });
                }

                pickedGlobal.Add(p.PlaceId);
                prev = item;
                prevPlace = p;
                orderIndex++;
                cursorLocal = leaveLocal;
                return true;
            }
        }

        if (trip.Items.Count == 0)
            throw new InvalidOperationException("จัดทริปไม่สำเร็จ (ติดเวลาทำการ/เวลาไม่พอ)");

        _db.Trips.Add(trip);
        await _db.SaveChangesAsync(ct);

        return trip;
    }

    // ----------------------------------------------------
    // OpeningHours
    // ----------------------------------------------------

    internal static bool TryAdjustArrivalToOpening(
        Place place,
        DateTime proposedArrivalLocal,
        int stayMinutes,
        DateTime dayEndLocal,
        out DateTime arrivalLocal,
        out DateTime leaveLocal)
    {
        arrivalLocal = default;
        leaveLocal = default;

        if (!TryGetOpenWindowForDate(place, proposedArrivalLocal, out var openAt, out var closeAt))
            return false;

        arrivalLocal = proposedArrivalLocal < openAt ? openAt : proposedArrivalLocal;
        leaveLocal = arrivalLocal.AddMinutes(stayMinutes);

        if (leaveLocal > closeAt) return false;
        if (leaveLocal > dayEndLocal) return false;

        return true;
    }

    internal static bool TryGetOpenWindowForDate(
        Place place,
        DateTime localDateTime,
        out DateTime openAt,
        out DateTime closeAt)
    {
        openAt = default;
        closeAt = default;

        if (place.OpeningHours == null || place.OpeningHours.Count == 0)
        {
            openAt = localDateTime.Date;
            closeAt = localDateTime.Date.AddDays(1);
            return true;
        }

        int dow = (int)localDateTime.DayOfWeek;

        var oh = place.OpeningHours.FirstOrDefault(x => x.DayOfWeek == dow);
        if (oh == null) return false;
        if (oh.IsClosed) return false;

        var open = oh.OpenTime.ToTimeSpan();
        var close = oh.CloseTime.ToTimeSpan();

        if (open == close)
        {
            openAt = localDateTime.Date;
            closeAt = localDateTime.Date.AddDays(1);
            return true;
        }

        openAt = localDateTime.Date + open;

        var rawClose = localDateTime.Date + close;
        closeAt = rawClose <= openAt ? rawClose.AddDays(1) : rawClose;

        return true;
    }

    // ----------------------------------------------------
    // Utility / scoring
    // ----------------------------------------------------

    internal static double ComputeUtility(
      double recoScore,
      Place place,
      AutoTripPreference pref,
      int travelMinutes)
    {
        // ✅ Category bonus (มีหรือไม่มี)
        double categoryBonus =
            place.CategoryId.HasValue &&
            pref.PreferredCategoryIds.Contains(place.CategoryId.Value)
                ? 0.6
                : 0.0;

        double travelPenalty =
            travelMinutes * (0.012 - pref.RelaxedPace * 0.006);

        travelPenalty += PricePenalty(place.PriceRange, pref.BudgetLevel);

        return recoScore + categoryBonus + PopularityBonus(place.PopularityScore) - travelPenalty;
    }

    // PriceRange = ค่าเข้าชมเป็นบาท; ≥500 บาทถือว่าแพงสุด, โทษสูงสุด 0.5 (ต่ำกว่าโบนัสหมวดที่ชอบ 0.6)
    internal static double PricePenalty(int? priceBaht, double budgetLevel)
    {
        if (priceBaht is not > 0) return 0;
        double expensiveness = Math.Min(priceBaht.Value, 500) / 500.0;
        return expensiveness * (1.0 - budgetLevel) * 0.5;
    }


    // เวลาเดินทางสูงสุดต่อช่วงระหว่างจุด (นาที) กันตารางที่ขับไกลเพื่อแวะจุดเดียว
    internal static int MaxLegMinutes(string mode) => mode switch
    {
        "walking" => 20,
        "cycling" => 30,
        _ => 45
    };

    // เพดานที่ผ่อนแล้ว (x1.5): ใช้เมื่อวันนั้นหาจุดต่อไปภายในเพดานปกติไม่ได้เลย (ขับรถ 45 → 68 นาทีต่อช่วง)
    // ผ่อนเฉพาะโหมดขับรถ: เดินเท้า/ปั่นจักรยานต้องกระชับ การเดิน 30 นาทีต่อช่วงไม่เหมาะกับการท่องเที่ยว
    internal static int RelaxedMaxLegMinutes(string mode)
        => IsDriving(mode)
            ? (int)Math.Round(MaxLegMinutes(mode) * 1.5, MidpointRounding.AwayFromZero)
            : MaxLegMinutes(mode);

    private static bool IsDriving(string mode) => mode is not ("walking" or "cycling");

    private static int EstimateTravelMinutes(double km, string mode)
    {
        double speed = mode switch
        {
            "walking" => 4.5,
            "cycling" => 15.0,
            _ => 40.0
        };
        return (int)Math.Round((km / speed) * 60.0);
    }

    // หาหมวดอาหารจากชื่อ (ชื่อเดียวกับที่ HomeService ใช้) แทนการฮาร์ดโค้ดเลข id
    internal const string FoodCategoryName = "อาหาร";
    private const int MealMinutes = 60;
    private const int MealBufferMinutes = 15; // เวลาเดินทางไปร้าน + บัฟเฟอร์ ใช้ตอนจำลองเวลาในช่วงเลือกจุด

    internal const int MinDays = 1, MaxDays = 7, MinHoursPerDay = 4, MaxHoursPerDay = 14;

    /// คืนข้อความผิดพลาดถ้าค่าอยู่นอกช่วงที่รองรับ (ให้ controller ตอบ 400) คืน null ถ้าใช้ได้
    public static string? ValidateRequest(int days, int hoursPerDay)
    {
        if (days is < MinDays or > MaxDays)
            return $"จำนวนวันต้องอยู่ระหว่าง {MinDays}-{MaxDays} วัน";
        if (hoursPerDay is < MinHoursPerDay or > MaxHoursPerDay)
            return $"เวลาเที่ยวต่อวันต้องอยู่ระหว่าง {MinHoursPerDay}-{MaxHoursPerDay} ชั่วโมง";
        return null;
    }

    private const int MealLeadMinutes = 20;

    /// ถือว่าถึงเวลามื้อเมื่อเหลืออีกไม่เกิน 20 นาที (ประมาณเวลาเดินทางไปร้าน + บัฟเฟอร์): ไม่งั้นจุดเที่ยวถัดไปที่เริ่มหลังเวลามื้อเล็กน้อยจะคร่อมมื้อ
    /// แล้วพอจบก็ไม่เหลือเวลาแทรกร้านอาหาร (วันที่สั้น เช่น 6 ชม. จะไม่มีมื้อกลางวันเลย)
    internal static bool IsMealDue(DateTime cursor, TimeSpan mealTime)
        => cursor.TimeOfDay >= mealTime - TimeSpan.FromMinutes(MealLeadMinutes);

    internal static Queue<TimeSpan> NewMealQueue()
        => new(new[] { new TimeSpan(11, 30, 0), new TimeSpan(18, 0, 0) });

    /// ตอนจำลองเวลาในช่วงเลือกจุด: ถ้าเลยเวลามื้อแล้ว ให้บวกเวลาพักมื้อ (ตอนลงตารางจริงจะแทรกร้านอาหารตรงนี้)
    /// ไม่งั้นช่วงเลือกจะคิดว่ามีเวลาเหลือมากกว่าความจริง จุดท้ายวันจึงถูกตัดทิ้งตอนลงตาราง
    internal static DateTime AdvancePastMeals(DateTime cursor, Queue<TimeSpan> meals)
    {
        while (meals.Count > 0 && IsMealDue(cursor, meals.Peek()))
        {
            meals.Dequeue();
            cursor = cursor.AddMinutes(MealMinutes + MealBufferMinutes);
        }
        return cursor;
    }

    // โทษเวลารอร้านเปิด: รอ 60 นาที = -0.6 (เท่าโบนัสหมวดที่ชอบ)
    internal static double WaitPenalty(double waitMinutes) => Math.Max(0, waitMinutes) * 0.01;

    // โบนัสความนิยมสถานที่ (PopularityScore 0-100) สูงสุด 0.3 ใช้ตัดสินสถานที่ในหมวดเดียวกันที่คะแนน ML เท่ากัน
    // ต่ำกว่าโบนัสหมวดที่ชอบ (0.6) จึงไม่ล้มความต้องการของผู้ใช้
    internal static double PopularityBonus(double popularityScore)
        => Math.Clamp(popularityScore / 100.0, 0, 1) * 0.3;

    internal static IEnumerable<Place> RankMealPlaces(IEnumerable<Place> food, Place from, ISet<int> used)
        => food
            .Where(f => !used.Contains(f.PlaceId))
            .OrderBy(f => Geo.HaversineKm(from.Latitude, from.Longitude, f.Latitude, f.Longitude));

    internal static int GetStayMinutes(Place p, AutoTripPreference pref)
    {
        int stay = p.AvgVisitMinutes is > 0 and <= 360 ? p.AvgVisitMinutes.Value : 60;

        if (pref.RelaxedPace >= 0.75) stay = Math.Min(180, stay + 15);
        if (pref.WithElderOrKids) stay = Math.Min(180, stay + 10);

        return stay;
    }

    // ----------------------------------------------------
    // Helpers
    // ----------------------------------------------------

    private static DateTime ConvertToBangkokTime(DateTime input)
    {
        if (input.Kind == DateTimeKind.Utc)
            return TimeZoneInfo.ConvertTimeFromUtc(input, _tz);

        if (input.Kind == DateTimeKind.Local)
            return TimeZoneInfo.ConvertTime(input, _tz);

        // Unspecified
        var assumedUtc = DateTime.SpecifyKind(input, DateTimeKind.Utc);
        return TimeZoneInfo.ConvertTimeFromUtc(assumedUtc, _tz);
    }

    private static TimeZoneInfo ResolveThailandTimeZone()
    {
        try { return TimeZoneInfo.FindSystemTimeZoneById("Asia/Bangkok"); }
        catch { return TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time"); }
    }
}
