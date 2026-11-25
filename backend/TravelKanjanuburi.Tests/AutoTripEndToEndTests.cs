using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TravelKanjanuburi.Dtos.BehaviorLog;
using TravelKanjanuburi.Model.MPlaces;
using TravelKanjanuburi.Model.MTrips;
using TravelKanjanuburi.Services.Trips;
using Xunit;

/// <summary>
/// ทดสอบการสร้างทริปทั้งทริปด้วยฐานข้อมูลในหน่วยความจำ + ตัวแนะนำ/ตารางถนนปลอม
/// ครอบคลุมบั๊กที่เจอจริง: วันว่างเมื่อคร่อมวันอาทิตย์, ช่วงเดินทางไกลเกิน, ผลไม่คงที่
/// </summary>
public class AutoTripEndToEndTests
{
    // 2026-11-28 08:00 ไทย = เสาร์; วันที่ 2 = อาทิตย์; วันที่ 3 = จันทร์
    private static readonly DateTime StartUtc = new(2026, 11, 28, 1, 0, 0, DateTimeKind.Utc);
    private const double StartLat = 14.05, StartLng = 99.55;

    private static readonly HashSet<int> ClosedOnSunday = new() { 1, 2, 3, 4, 5, 6, 7, 8 };

    // ---------- ตัวช่วย ----------

    private sealed class FakeRecommender : IPlaceRecommender
    {
        private readonly ApplicationDbContext _db;
        private readonly bool _empty;
        public FakeRecommender(ApplicationDbContext db, bool empty = false) { _db = db; _empty = empty; }

        public async Task<List<PlaceRecommendDto>> RecommendPersonalAsync(
            int userId, int topN, double? lat, double? lng, CancellationToken ct, bool forTrip = false)
        {
            if (_empty) return new();
            return (await _db.Places.AsNoTracking().Where(p => p.IsActive).ToListAsync(ct))
                .Select(p => new PlaceRecommendDto
                {
                    PlaceId = p.PlaceId,
                    Name = p.Name,
                    Latitude = p.Latitude,
                    Longitude = p.Longitude,
                    PlaceType = "x",
                    PopularityScore = p.PopularityScore,
                    CategoryId = p.CategoryId ?? 0,
                    Score = p.PopularityScore / 100.0
                })
                .OrderByDescending(x => x.Score)
                .Take(topN)
                .ToList();
        }
    }

    private sealed class FakeRoad : IRoadMatrixProvider
    {
        private readonly RoadMatrix? _m;
        public FakeRoad(RoadMatrix? m = null) { _m = m; }
        public Task<RoadMatrix?> EnsureAsync(IEnumerable<Place> places, CancellationToken ct) => Task.FromResult(_m);
    }

    private static ApplicationDbContext NewDb(bool allClosed = false)
    {
        var opt = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var db = new ApplicationDbContext(opt);

        db.PlaceCategories.AddRange(
            new PlaceCategory { CategoryId = 3, CategoryName = "ธรรมชาติ" },
            new PlaceCategory { CategoryId = 4, CategoryName = "วัฒนธรรม" },
            new PlaceCategory { CategoryId = 7, CategoryName = "อาหาร" });

        // กริด 5x5 ห่างกันราว 2.5 กม. รอบตัวเมือง: 1-20 = ที่เที่ยว, 21-25 = ร้านอาหาร (หมวด 7)
        int id = 1;
        for (int r = 0; r < 5; r++)
            for (int c = 0; c < 5; c++, id++)
            {
                bool food = id > 20;
                var p = new Place
                {
                    PlaceId = id,
                    Name = $"place-{id}",
                    CategoryId = food ? 7 : (id % 2 == 0 ? 3 : 4),
                    Latitude = 14.03 + r * 0.02,
                    Longitude = 99.53 + c * 0.02,
                    AvgVisitMinutes = 60,
                    PopularityScore = 100 - id,
                    IsActive = true
                };
                for (int dow = 0; dow <= 6; dow++)
                {
                    bool closed = allClosed || (dow == 0 && ClosedOnSunday.Contains(id));
                    p.OpeningHours.Add(new OpeningHour
                    {
                        DayOfWeek = dow,
                        OpenTime = new TimeOnly(8, 0),
                        CloseTime = new TimeOnly(17, 0),
                        IsClosed = closed
                    });
                }
                db.Places.Add(p);
            }
        db.SaveChanges();
        return db;
    }

    private static Task<Trip> Generate(
        ApplicationDbContext db, IPlaceRecommender? reco = null, IRoadMatrixProvider? road = null,
        int userId = 42, int days = 3, int hours = 9, string mode = "driving",
        AutoTripService.AutoTripPreference? pref = null)
        => new AutoTripService(db, reco ?? new FakeRecommender(db), road ?? new FakeRoad())
            .GenerateAsync(userId, StartUtc, days, hours, StartLat, StartLng, mode, pref, CancellationToken.None);

    // ---------- ทดสอบ ----------

    // ---------- ผ่อนเพดานเดินทางเมื่อวันได้จุดไม่ครบ ----------

    /// สองที่เที่ยวเปิดตลอด ที่ 1 อยู่ใกล้จุดเริ่ม ที่ 2 อยู่ไกลตามตารางถนนที่กำหนด (ไม่มีร้านอาหาร)
    private static (ApplicationDbContext db, IRoadMatrixProvider road) TwoPlacesWithLeg(int legMinutes)
    {
        var opt = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        var db = new ApplicationDbContext(opt);
        db.PlaceCategories.Add(new PlaceCategory { CategoryId = 3, CategoryName = "ธรรมชาติ" });
        db.Places.AddRange(
            new Place { PlaceId = 1, Name = "near", CategoryId = 3, Latitude = 14.05, Longitude = 99.55, AvgVisitMinutes = 60, PopularityScore = 90, IsActive = true },
            new Place { PlaceId = 2, Name = "far", CategoryId = 3, Latitude = 14.30, Longitude = 99.80, AvgVisitMinutes = 60, PopularityScore = 50, IsActive = true });
        db.SaveChanges();

        var road = new FakeRoad(new RoadMatrix(new Dictionary<(int, int), (double km, int min)>
        {
            [(1, 2)] = (legMinutes * 0.8, legMinutes),
            [(2, 1)] = (legMinutes * 0.8, legMinutes),
        }));
        return (db, road);
    }

    [Fact]
    public async Task LegBeyondNormalCeilingButWithinRelaxed_StillGetsSecondStop()
    {
        // 60 นาที เกินเพดานปกติ (45) แต่ไม่เกินเพดานที่ผ่อนแล้ว (68) และไม่มีจุดอื่นให้เลือกเลย
        var (db, road) = TwoPlacesWithLeg(60);
        using var _ = db;

        var trip = await Generate(db, road: road, days: 1, hours: 8);

        trip.Items.Select(i => i.PlaceId).Should().Equal(1, 2);
        trip.Segments.Should().ContainSingle().Which.TravelMinutes.Should().Be(70); // 60 + บัฟเฟอร์ 10
    }

    [Fact]
    public async Task LegBeyondRelaxedCeiling_IsStillRejected()
    {
        var (db, road) = TwoPlacesWithLeg(80);
        using var _ = db;

        var trip = await Generate(db, road: road, days: 1, hours: 8);

        trip.Items.Select(i => i.PlaceId).Should().Equal(1); // ไกลเกินแม้ผ่อนแล้ว
    }

    [Fact]
    public async Task LegWithinNormalCeiling_NeedsNoRelaxation()
    {
        var (db, road) = TwoPlacesWithLeg(40);
        using var _ = db;

        var trip = await Generate(db, road: road, days: 1, hours: 8);

        trip.Items.Select(i => i.PlaceId).Should().Equal(1, 2);
    }

    [Fact]
    public async Task ThreeDayTripAcrossSunday_HasNoEmptyDay()
    {
        using var db = NewDb();

        var trip = await Generate(db);

        trip.Items.Select(i => i.DayIndex).Distinct().OrderBy(x => x)
            .Should().Equal(1, 2, 3); // ไม่มีวันไหนว่าง
    }

    [Fact]
    public async Task Sunday_NeverSchedulesPlacesClosedOnSunday()
    {
        using var db = NewDb();

        var trip = await Generate(db);

        trip.Items.Where(i => i.DayIndex == 2)
            .Select(i => i.PlaceId)
            .Should().NotContain(id => ClosedOnSunday.Contains(id));
    }

    [Fact]
    public async Task NoPlaceIsRepeatedAcrossDays()
    {
        using var db = NewDb();

        var trip = await Generate(db);

        trip.Items.Select(i => i.PlaceId).Should().OnlyHaveUniqueItems();
    }

    [Fact]
    public async Task EveryStop_IsInsideOpeningHours_AndWithinTheDay()
    {
        using var db = NewDb();
        var trip = await Generate(db, hours: 9);

        foreach (var it in trip.Items)
        {
            var arrival = it.PlannedArrivalTime!.Value;
            var leave = arrival.AddMinutes(it.PlannedDurationMinutes ?? 0);

            arrival.TimeOfDay.Should().BeGreaterThanOrEqualTo(TimeSpan.FromHours(8));   // ไม่ก่อนเปิด/เริ่มวัน
            leave.TimeOfDay.Should().BeLessThanOrEqualTo(TimeSpan.FromHours(17));       // ไม่เกินเวลาปิด/จบวัน (8+9)
            arrival.Date.Should().Be(StartUtc.AddHours(7).Date.AddDays(it.DayIndex - 1));
        }
    }

    [Fact]
    public async Task TravelBetweenStops_NeverExceedsLegCap()
    {
        using var db = NewDb();

        var trip = await Generate(db);

        // segment = เวลาเดินทาง + buffer 10 นาที
        trip.Segments.Should().OnlyContain(s =>
            s.TravelMinutes <= AutoTripService.MaxLegMinutes("driving") + 10);
    }

    [Fact]
    public async Task RoadMatrix_FarPlaceIsNeverReachedFromAnotherStop()
    {
        using var db = NewDb();
        var places = db.Places.AsNoTracking().ToList();

        // ตารางถนนสมมติ: ที่ 1 (อันดับความนิยมสูงสุด) อยู่ห่างจากทุกที่ 90 นาที
        var d = new Dictionary<(int, int), (double km, int min)>();
        foreach (var a in places)
            foreach (var b in places)
                if (a.PlaceId != b.PlaceId)
                {
                    bool far = a.PlaceId == 1 || b.PlaceId == 1;
                    d[(a.PlaceId, b.PlaceId)] = far ? (70.0, 90) : (3.0, 5);
                }

        var trip = await Generate(db, road: new FakeRoad(new RoadMatrix(d)));

        trip.Segments.Should().OnlyContain(s => s.TravelMinutes <= 5 + 10);
        trip.Items.Where(i => i.PlaceId == 1).Should().OnlyContain(i =>
            // ถ้ามีที่ 1 อยู่ในทริป ต้องเป็นจุดเดียวของวัน (ไม่มีจุดอื่นมาต่อ)
            trip.Items.Count(x => x.DayIndex == i.DayIndex) == 1);
    }

    [Fact]
    public async Task SameInputs_GiveIdenticalTrip()
    {
        using var db = NewDb();

        var t1 = await Generate(db);
        var t2 = await Generate(db);

        Shape(t2).Should().Equal(Shape(t1));
    }

    [Fact]
    public async Task EightHourDay_IncludesAMealStop_AfterLunchTime()
    {
        using var db = NewDb();

        var trip = await Generate(db, days: 1, hours: 9);

        var meals = trip.Items.Where(i => i.PlaceId > 20).ToList(); // 21-25 = ร้านอาหาร
        meals.Should().NotBeEmpty();
        meals.Should().OnlyContain(m => m.PlannedArrivalTime!.Value.TimeOfDay >= new TimeSpan(11, 30, 0));
    }

    [Fact]
    public async Task PreferredCategory_IsFavoured()
    {
        using var db = NewDb();
        var pref = new AutoTripService.AutoTripPreference { PreferredCategoryIds = { 3 } };

        var trip = await Generate(db, days: 1, pref: pref);

        var attractions = trip.Items.Where(i => i.PlaceId <= 20).ToList();
        attractions.Count(i => i.PlaceId % 2 == 0) // หมวดธรรมชาติ = id คู่
            .Should().BeGreaterThan(attractions.Count / 2);
    }

    [Fact]
    public async Task NoCandidates_Throws()
    {
        using var db = NewDb();

        var act = () => Generate(db, reco: new FakeRecommender(db, empty: true));

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task EverythingClosed_Throws_InsteadOfSavingAnEmptyTrip()
    {
        using var db = NewDb(allClosed: true);

        var act = () => Generate(db);

        await act.Should().ThrowAsync<InvalidOperationException>();
        (await db.Trips.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task Walking_StaysCompact()
    {
        using var db = NewDb();

        var trip = await Generate(db, days: 1, mode: "walking");

        trip.Segments.Should().OnlyContain(s =>
            s.TravelMinutes <= AutoTripService.MaxLegMinutes("walking") + 10);
    }

    private static List<(int day, int order, int place, DateTime? at)> Shape(Trip t)
        => t.Items.OrderBy(i => i.DayIndex).ThenBy(i => i.OrderIndex)
            .Select(i => (i.DayIndex, i.OrderIndex, i.PlaceId, i.PlannedArrivalTime)).ToList();
}
