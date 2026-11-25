using FluentAssertions;
using TravelKanjanuburi.Model.MPlaces;
using TravelKanjanuburi.Services.Trips;
using Xunit;

/// <summary>
/// ทดสอบส่วนของตัวจัดทริปอัตโนมัติที่เคยพังจริง (ทดสอบโค้ดจริงของ AutoTripService ไม่ใช่สำเนา)
/// </summary>
public class AutoTripPlanningTests
{
    // 2026-11-29 = อาทิตย์, 2026-11-30 = จันทร์
    private static readonly DateTime Sunday = new(2026, 11, 29, 8, 0, 0);
    private static readonly DateTime Monday = new(2026, 11, 30, 8, 0, 0);

    private static Place WithHours(params (int dow, string open, string close, bool closed)[] days)
        => new()
        {
            PlaceId = 1,
            OpeningHours = days.Select(d => new OpeningHour
            {
                DayOfWeek = d.dow,
                OpenTime = TimeOnly.Parse(d.open),
                CloseTime = TimeOnly.Parse(d.close),
                IsClosed = d.closed
            }).ToList()
        };

    // ---------- วันอาทิตย์ = 0 (บั๊กที่ทำให้ทริปว่างทั้งวัน เมื่อข้อมูลเป็น 1-7) ----------

    [Fact]
    public void Sunday_IsMatchedByDayOfWeekZero()
    {
        var place = WithHours((0, "08:00", "17:00", false));

        var ok = AutoTripService.TryGetOpenWindowForDate(place, Sunday, out var openAt, out var closeAt);

        ok.Should().BeTrue();
        openAt.Should().Be(new DateTime(2026, 11, 29, 8, 0, 0));
        closeAt.Should().Be(new DateTime(2026, 11, 29, 17, 0, 0));
    }

    [Fact]
    public void Sunday_WithOnlyDays1To7_TreatedAsClosed_DocumentsWhyDataMustBeZeroToSix()
    {
        // ข้อมูลแบบเก่า (อาทิตย์ = 7) จะไม่ตรงกับ DayOfWeek.Sunday (0) → ถือว่าปิด
        var place = WithHours((1, "08:00", "17:00", false), (7, "08:00", "17:00", false));

        AutoTripService.TryGetOpenWindowForDate(place, Sunday, out _, out _).Should().BeFalse();
        AutoTripService.TryGetOpenWindowForDate(place, Monday, out _, out _).Should().BeTrue();
    }

    [Fact]
    public void ClosedDay_IsNotOpen()
    {
        var place = WithHours((1, "08:00", "17:00", true));

        AutoTripService.TryGetOpenWindowForDate(place, Monday, out _, out _).Should().BeFalse();
    }

    [Fact]
    public void NoOpeningHoursAtAll_MeansAlwaysOpen()
    {
        var place = new Place { PlaceId = 1 };

        AutoTripService.TryGetOpenWindowForDate(place, Sunday, out var openAt, out var closeAt).Should().BeTrue();
        (closeAt - openAt).Should().Be(TimeSpan.FromDays(1));
    }

    [Fact]
    public void OpenEqualsClose_Means24Hours()
    {
        var place = WithHours((1, "00:00", "00:00", false));

        AutoTripService.TryGetOpenWindowForDate(place, Monday, out var openAt, out var closeAt).Should().BeTrue();
        (closeAt - openAt).Should().Be(TimeSpan.FromDays(1));
    }

    // ---------- ปรับเวลาถึงให้ตรงช่วงเปิด ----------

    [Fact]
    public void ArrivalBeforeOpening_IsMovedToOpeningTime()
    {
        var place = WithHours((1, "09:00", "17:00", false));
        var dayEnd = Monday.AddHours(9);

        var ok = AutoTripService.TryAdjustArrivalToOpening(place, Monday /* 08:00 */, 60, dayEnd, out var arrival, out var leave);

        ok.Should().BeTrue();
        arrival.Should().Be(new DateTime(2026, 11, 30, 9, 0, 0));
        leave.Should().Be(new DateTime(2026, 11, 30, 10, 0, 0));
    }

    [Fact]
    public void StayThatRunsPastClosing_IsInfeasible()
    {
        var place = WithHours((1, "09:00", "17:00", false));
        var dayEnd = Monday.AddHours(12);

        // ไปถึง 16:30 อยู่ 60 นาที → 17:30 เกินเวลาปิด
        AutoTripService.TryAdjustArrivalToOpening(place, Monday.AddHours(8.5), 60, dayEnd, out _, out _)
            .Should().BeFalse();
    }

    [Fact]
    public void StayThatRunsPastEndOfDay_IsInfeasible()
    {
        var place = new Place { PlaceId = 1 }; // เปิดตลอด
        var dayEnd = Monday.AddHours(9); // 17:00

        AutoTripService.TryAdjustArrivalToOpening(place, Monday.AddHours(8.5), 60, dayEnd, out _, out _)
            .Should().BeFalse();
    }

    // ---------- เพดานเวลาเดินทางต่อช่วง ----------

    [Fact]
    public void MaxLegMinutes_PerMode()
    {
        AutoTripService.MaxLegMinutes("driving").Should().Be(45);
        AutoTripService.MaxLegMinutes("cycling").Should().Be(30);
        AutoTripService.MaxLegMinutes("walking").Should().Be(20);
    }

    [Fact]
    public void RelaxedMaxLegMinutes_OnlyRelaxesDriving()
    {
        AutoTripService.RelaxedMaxLegMinutes("driving").Should().Be(68);
        AutoTripService.RelaxedMaxLegMinutes("cycling").Should().Be(30); // ไม่ผ่อน
        AutoTripService.RelaxedMaxLegMinutes("walking").Should().Be(20); // ไม่ผ่อน
    }

    [Fact]
    public void MaxLegMinutes_UnknownMode_FallsBackToDriving()
    {
        AutoTripService.MaxLegMinutes("whatever").Should().Be(AutoTripService.MaxLegMinutes("driving"));
    }

    // ---------- เวลามื้ออาหารในช่วงเลือกจุด ----------

    [Fact]
    public void AdvancePastMeals_BeforeLunch_DoesNothing()
    {
        var meals = AutoTripService.NewMealQueue();

        AutoTripService.AdvancePastMeals(Monday.AddHours(2) /* 10:00 */, meals).Should().Be(Monday.AddHours(2));
        meals.Count.Should().Be(2);
    }

    [Fact]
    public void IsMealDue_TriggersTwentyMinutesBeforeMealTime()
    {
        var lunch = new TimeSpan(11, 30, 0);

        AutoTripService.IsMealDue(Monday.AddHours(3.0) /* 11:00 */, lunch).Should().BeFalse();
        AutoTripService.IsMealDue(Monday.AddMinutes(3 * 60 + 10) /* 11:10 */, lunch).Should().BeTrue();
        AutoTripService.IsMealDue(Monday.AddMinutes(3 * 60 + 12) /* 11:12 */, lunch).Should().BeTrue();
    }

    [Fact]
    public void AdvancePastMeals_AfterLunch_AddsOneMealOnly()
    {
        var meals = AutoTripService.NewMealQueue();

        // 12:00 เลยมื้อกลางวัน → +75 นาที = 13:15 ซึ่งยังไม่ถึงมื้อเย็น
        AutoTripService.AdvancePastMeals(Monday.AddHours(4), meals).Should().Be(new DateTime(2026, 11, 30, 13, 15, 0));
        meals.Count.Should().Be(1);

        // เรียกซ้ำที่เวลาเดิม ต้องไม่บวกมื้อกลางวันซ้ำ
        AutoTripService.AdvancePastMeals(new DateTime(2026, 11, 30, 13, 15, 0), meals)
            .Should().Be(new DateTime(2026, 11, 30, 13, 15, 0));
    }

    [Fact]
    public void AdvancePastMeals_AfterBothMeals_AddsBoth()
    {
        var meals = AutoTripService.NewMealQueue();

        // 19:00 → มื้อกลางวัน +75 = 20:15 ซึ่งเลยมื้อเย็นด้วย +75 = 21:30
        AutoTripService.AdvancePastMeals(Monday.AddHours(11), meals).Should().Be(new DateTime(2026, 11, 30, 21, 30, 0));
        meals.Count.Should().Be(0);
    }

    // ---------- โทษเวลารอ / โบนัสความนิยม ----------

    [Fact]
    public void WaitPenalty_GrowsWithWaiting_AndNeverNegative()
    {
        AutoTripService.WaitPenalty(0).Should().Be(0);
        AutoTripService.WaitPenalty(-30).Should().Be(0);
        AutoTripService.WaitPenalty(60).Should().BeApproximately(0.6, 1e-9);
    }

    [Fact]
    public void Popularity_BreaksTiesWithinSameCategory()
    {
        var pref = new AutoTripService.AutoTripPreference();
        var famous = new Place { PlaceId = 1, CategoryId = 3, PopularityScore = 90 };
        var hidden = new Place { PlaceId = 2, CategoryId = 3, PopularityScore = 10 };

        AutoTripService.ComputeUtility(0.4, famous, pref, 10)
            .Should().BeGreaterThan(AutoTripService.ComputeUtility(0.4, hidden, pref, 10));
    }

    [Fact]
    public void PopularityBonus_IsBoundedAndSmallerThanPreferredCategoryBonus()
    {
        AutoTripService.PopularityBonus(-5).Should().Be(0);
        AutoTripService.PopularityBonus(1000).Should().BeApproximately(0.3, 1e-9);

        var pref = new AutoTripService.AutoTripPreference { PreferredCategoryIds = { 3 } };
        var preferredUnknown = new Place { PlaceId = 1, CategoryId = 3, PopularityScore = 0 };
        var famousOther = new Place { PlaceId = 2, CategoryId = 4, PopularityScore = 100 };

        // ผู้ใช้เลือกหมวดไว้ ต้องชนะสถานที่ดังของหมวดอื่น
        AutoTripService.ComputeUtility(0.4, preferredUnknown, pref, 10)
            .Should().BeGreaterThan(AutoTripService.ComputeUtility(0.4, famousOther, pref, 10));
    }

    // ---------- ตรวจค่านำเข้า ----------

    [Theory]
    [InlineData(1, 8, false)]
    [InlineData(7, 14, false)]
    [InlineData(0, 8, true)]
    [InlineData(10, 8, true)]
    [InlineData(2, 3, true)]
    [InlineData(2, 15, true)]
    public void ValidateRequest_RejectsOutOfRange(int days, int hours, bool shouldFail)
    {
        (AutoTripService.ValidateRequest(days, hours) != null).Should().Be(shouldFail);
    }

    // ---------- ตารางถนนจาก OSRM ----------

    [Fact]
    public void RoadMatrix_SamePlace_IsZero_AndMissingPairIsNotFound()
    {
        var m = new RoadMatrix(new Dictionary<(int, int), (double km, int min)>
        {
            [(1, 2)] = (4.2, 9)
        });

        m.TryGet(5, 5, out var km, out var min).Should().BeTrue();
        (km, min).Should().Be((0.0, 0));

        m.TryGet(1, 2, out km, out min).Should().BeTrue();
        (km, min).Should().Be((4.2, 9));

        // ทิศกลับกันไม่มีในตาราง → ผู้เรียกต้อง fallback เอง
        m.TryGet(2, 1, out _, out _).Should().BeFalse();
    }
}
