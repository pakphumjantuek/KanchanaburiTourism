using System.Net;
using AutoMapper;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using TravelKanjanuburi.Dtos.Trips;
using TravelKanjanuburi.Features.Trips;
using TravelKanjanuburi.Model.MPlaces;
using TravelKanjanuburi.Model.MTrips;
using TravelKanjanuburi.Services.Trips;
using Xunit;

/// <summary>
/// ทดสอบส่วนทริปที่เคยตอบ 500: เพิ่ม/แก้จุดแล้วเลขลำดับชน, บันทึกเส้นทางตอน OSRM ล่ม
/// (ฐานข้อมูลในหน่วยความจำ ไม่บังคับ unique index จึงทดสอบที่การตรวจฝั่งโค้ดของเรา)
/// </summary>
public class TripServiceTests
{
    private const int UserId = 7;

    // ---------- ตัวช่วย ----------

    private sealed class StubHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, HttpResponseMessage> _respond;
        public List<string> Urls { get; } = new();
        public StubHandler(Func<HttpRequestMessage, HttpResponseMessage> respond) => _respond = respond;

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
        {
            Urls.Add(request.RequestUri!.ToString());
            return Task.FromResult(_respond(request));
        }
    }

    private sealed class StubFactory : IHttpClientFactory
    {
        private readonly HttpMessageHandler _handler;
        public StubFactory(HttpMessageHandler handler) => _handler = handler;
        public HttpClient CreateClient(string name)
            => new(_handler, disposeHandler: false) { BaseAddress = new Uri("http://osrm.test/") };
    }

    private static HttpResponseMessage Json(string body)
        => new(HttpStatusCode.OK) { Content = new StringContent(body, System.Text.Encoding.UTF8, "application/json") };

    private static ApplicationDbContext NewDb()
    {
        var opt = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        var db = new ApplicationDbContext(opt);

        db.Places.AddRange(
            new Place { PlaceId = 1, Name = "a", Latitude = 14.00, Longitude = 99.50, IsActive = true },
            new Place { PlaceId = 2, Name = "b", Latitude = 14.10, Longitude = 99.60, IsActive = true },
            new Place { PlaceId = 3, Name = "c", Latitude = 14.20, Longitude = 99.70, IsActive = true },
            new Place { PlaceId = 4, Name = "d", Latitude = 14.30, Longitude = 99.80, IsActive = true });
        db.Trips.Add(new Trip { TripId = 1, UserId = UserId, Title = "t", StartDateTime = DateTime.Today, EndDateTime = DateTime.Today.AddDays(1) });
        db.SaveChanges();
        return db;
    }

    private static TripItem Item(int id, int place, int day, int order)
        => new() { TripItemId = id, TripId = 1, PlaceId = place, DayIndex = day, OrderIndex = order };

    private static TripService NewService(ApplicationDbContext db, StubHandler? handler = null)
    {
        var mapper = new MapperConfiguration(c => c.AddProfile<TripMappingProfile>()).CreateMapper();
        var http = new StubFactory(handler ?? new StubHandler(_ => new HttpResponseMessage(HttpStatusCode.ServiceUnavailable)));
        return new TripService(db, mapper, http, NullLogger<TripService>.Instance);
    }

    private static AddTripItemRequest Add(int place, int day, int order)
        => new() { PlaceId = place, DayIndex = day, OrderIndex = order };

    // ---------- เพิ่มจุด ----------

    [Fact]
    public async Task AddItem_FreeOrderIndex_IsKept()
    {
        using var db = NewDb();
        db.TripItems.Add(Item(10, 1, 1, 1));
        db.SaveChanges();

        var dto = await NewService(db).AddItemAsync(UserId, 1, Add(2, 1, 2), CancellationToken.None);

        dto.OrderIndex.Should().Be(2);
    }

    [Fact]
    public async Task AddItem_OrderIndexTakenAfterDeletingMiddleStop_AppendsAtEndOfDay()
    {
        // ลำดับ 1 และ 3 (เคยลบ 2) หน้าเว็บส่ง "จำนวนจุด + 1" = 3 ซึ่งชนของเดิม เดิมตอบ 500
        using var db = NewDb();
        db.TripItems.AddRange(Item(10, 1, 1, 1), Item(11, 2, 1, 3));
        db.SaveChanges();

        var dto = await NewService(db).AddItemAsync(UserId, 1, Add(3, 1, 3), CancellationToken.None);

        dto.OrderIndex.Should().Be(4);
        db.TripItems.Where(i => i.DayIndex == 1).Select(i => i.OrderIndex).Should().OnlyHaveUniqueItems();
    }

    [Fact]
    public async Task AddItem_SameOrderOnDifferentDay_IsNotAConflict()
    {
        using var db = NewDb();
        db.TripItems.Add(Item(10, 1, 1, 1));
        db.SaveChanges();

        var dto = await NewService(db).AddItemAsync(UserId, 1, Add(2, 2, 1), CancellationToken.None);

        dto.OrderIndex.Should().Be(1);
    }

    [Fact]
    public async Task AddItem_UnknownPlace_IsBadRequestNotServerError()
    {
        using var db = NewDb();

        var act = () => NewService(db).AddItemAsync(UserId, 1, Add(999, 1, 1), CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>();
    }

    // ---------- แก้จุด ----------

    [Fact]
    public async Task UpdateItem_MoveOntoOccupiedOrder_IsRejectedWithClearError()
    {
        using var db = NewDb();
        db.TripItems.AddRange(Item(10, 1, 1, 1), Item(11, 2, 1, 2));
        db.SaveChanges();

        var act = () => NewService(db).UpdateItemAsync(UserId, 1, 10,
            new UpdateTripItemRequest { DayIndex = 1, OrderIndex = 2 }, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*มีจุดอยู่แล้ว*");
    }

    [Fact]
    public async Task UpdateItem_KeepingOwnOrderAndChangingNotes_IsAllowed()
    {
        using var db = NewDb();
        db.TripItems.AddRange(Item(10, 1, 1, 1), Item(11, 2, 1, 2));
        db.SaveChanges();

        var dto = await NewService(db).UpdateItemAsync(UserId, 1, 10,
            new UpdateTripItemRequest { DayIndex = 1, OrderIndex = 1, Notes = "x" }, CancellationToken.None);

        dto.OrderIndex.Should().Be(1);
    }

    [Theory]
    [InlineData(0, 1)]
    [InlineData(1, 0)]
    public async Task UpdateItem_NonPositiveIndexes_AreBadRequest(int day, int order)
    {
        using var db = NewDb();
        db.TripItems.Add(Item(10, 1, 1, 1));
        db.SaveChanges();

        var act = () => NewService(db).UpdateItemAsync(UserId, 1, 10,
            new UpdateTripItemRequest { DayIndex = day, OrderIndex = order }, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>();
    }

    // ---------- บันทึกเส้นทาง ----------

    private static void ThreeStopDay(ApplicationDbContext db)
    {
        db.TripItems.AddRange(Item(10, 1, 1, 1), Item(11, 2, 1, 2), Item(12, 3, 1, 3));
        db.SaveChanges();
    }

    [Fact]
    public async Task SaveRoute_CallsOsrmOnce_AndSavesEachLeg()
    {
        using var db = NewDb();
        ThreeStopDay(db);
        var handler = new StubHandler(_ => Json(
            "{\"routes\":[{\"distance\":30000,\"duration\":2400,\"legs\":[{\"distance\":10000,\"duration\":600},{\"distance\":20000,\"duration\":1800}]}]}"));

        await NewService(db, handler).SaveRouteAsync(UserId, 1,
            new SaveRouteRequest { DayIndex = 1, TransportMode = "driving" }, CancellationToken.None);

        handler.Urls.Should().ContainSingle(); // เดิมเรียกทีละช่วง (2 ครั้งสำหรับ 3 จุด)
        handler.Urls[0].Should().Contain("99.5,14;99.6,14.1;99.7,14.2"); // จุดทศนิยม ไม่ขึ้นกับภาษาเครื่อง
        var segs = db.TripSegments.OrderBy(s => s.FromTripItemId).ToList();
        segs.Should().HaveCount(2);
        (segs[0].DistanceKm, segs[0].TravelMinutes).Should().Be((10.0, 10));
        (segs[1].DistanceKm, segs[1].TravelMinutes).Should().Be((20.0, 30));
    }

    [Fact]
    public async Task SaveRoute_WhenOsrmDown_SavesStraightLineEstimatesInsteadOfFailing()
    {
        using var db = NewDb();
        ThreeStopDay(db);
        var handler = new StubHandler(_ => throw new HttpRequestException("down"));

        await NewService(db, handler).SaveRouteAsync(UserId, 1,
            new SaveRouteRequest { DayIndex = 1, TransportMode = "driving" }, CancellationToken.None);

        var segs = db.TripSegments.ToList();
        segs.Should().HaveCount(2);
        segs.Should().OnlyContain(s => s.DistanceKm > 0 && s.TravelMinutes > 0);
    }

    [Fact]
    public async Task SaveRoute_WhenOsrmReturnsWrongLegCount_FallsBackToEstimates()
    {
        using var db = NewDb();
        ThreeStopDay(db);
        var handler = new StubHandler(_ => Json("{\"routes\":[{\"distance\":1,\"duration\":1,\"legs\":[{\"distance\":1,\"duration\":1}]}]}"));

        await NewService(db, handler).SaveRouteAsync(UserId, 1,
            new SaveRouteRequest { DayIndex = 1 }, CancellationToken.None);

        db.TripSegments.Should().HaveCount(2);
        db.TripSegments.Should().OnlyContain(s => s.DistanceKm > 1); // ไม่ใช่ค่า 0/1 ที่หลุดมา
    }

    [Fact]
    public async Task SaveRoute_UnknownTransportMode_IsNeverPutInTheOsrmUrl()
    {
        using var db = NewDb();
        ThreeStopDay(db);
        var handler = new StubHandler(_ => Json(
            "{\"routes\":[{\"distance\":1,\"duration\":1,\"legs\":[{\"distance\":1,\"duration\":60},{\"distance\":1,\"duration\":60}]}]}"));

        await NewService(db, handler).SaveRouteAsync(UserId, 1,
            new SaveRouteRequest { DayIndex = 1, TransportMode = "../../admin" }, CancellationToken.None);

        handler.Urls[0].Should().Contain("route/v1/driving/").And.NotContain("admin");
        db.TripSegments.Should().OnlyContain(s => s.TransportMode == "driving");
    }

    [Fact]
    public async Task SaveRoute_PlaceDeletedFromSystem_IsClearErrorAndKeepsOldSegments()
    {
        using var db = NewDb();
        ThreeStopDay(db);
        db.TripSegments.Add(new TripSegment { TripId = 1, FromTripItemId = 10, ToTripItemId = 11, DistanceKm = 5, TravelMinutes = 5, TransportMode = "driving" });
        db.Places.Remove(db.Places.Single(p => p.PlaceId == 3));
        db.SaveChanges();

        var act = () => NewService(db).SaveRouteAsync(UserId, 1, new SaveRouteRequest { DayIndex = 1 }, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*ถูกลบ*");
        db.ChangeTracker.Clear();
        db.TripSegments.Should().ContainSingle(); // ไม่ได้บันทึกอะไรครึ่งๆ กลางๆ
    }

    [Fact]
    public async Task SaveRoute_OtherUsersTrip_IsNotFound()
    {
        using var db = NewDb();
        ThreeStopDay(db);

        var act = () => NewService(db).SaveRouteAsync(UserId + 1, 1, new SaveRouteRequest { DayIndex = 1 }, CancellationToken.None);

        await act.Should().ThrowAsync<KeyNotFoundException>();
    }

    // ---------- จัดลำดับใหม่ ----------

    private static ReorderTripItemsRequest Reorder(int day, params (int id, int order)[] items)
        => new() { DayIndex = day, Items = items.Select(i => new ReorderTripItemDto { TripItemId = i.id, OrderIndex = i.order }).ToList() };

    [Fact]
    public async Task Reorder_FullDay_SwapsPositions()
    {
        using var db = NewDb();
        ThreeStopDay(db);

        await NewService(db).ReorderTripItemsAsync(UserId, 1, Reorder(1, (10, 2), (11, 1), (12, 3)), CancellationToken.None);

        db.TripItems.OrderBy(i => i.OrderIndex).Select(i => i.TripItemId).Should().Equal(11, 10, 12);
    }

    [Fact]
    public async Task Reorder_OnlySomeStopsOfTheDay_IsRejected()
    {
        // เดิมส่งแค่บางจุดได้ แล้วเลขใหม่อาจไปชนจุดที่ไม่ได้ส่งจนล้มกลางทาง
        using var db = NewDb();
        ThreeStopDay(db);

        var act = () => NewService(db).ReorderTripItemsAsync(UserId, 1, Reorder(1, (10, 3), (11, 1)), CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*ครบทุกจุด*");
        db.TripItems.OrderBy(i => i.TripItemId).Select(i => i.OrderIndex).Should().Equal(1, 2, 3); // ไม่เปลี่ยนอะไร
    }

    [Fact]
    public async Task Reorder_DuplicateIdsOrNonPositiveOrder_AreBadRequest()
    {
        using var db = NewDb();
        ThreeStopDay(db);
        var svc = NewService(db);

        await FluentActions.Awaiting(() => svc.ReorderTripItemsAsync(UserId, 1, Reorder(1, (10, 1), (10, 2), (11, 3)), CancellationToken.None))
            .Should().ThrowAsync<ArgumentException>();
        await FluentActions.Awaiting(() => svc.ReorderTripItemsAsync(UserId, 1, Reorder(1, (10, 0), (11, 1), (12, 2)), CancellationToken.None))
            .Should().ThrowAsync<ArgumentException>();
    }

    // ---------- ลบจุด ----------

    [Fact]
    public async Task DeleteItem_MiddleStop_ClosesTheGapInOrderIndex()
    {
        using var db = NewDb();
        ThreeStopDay(db);

        await NewService(db).DeleteItemAsync(UserId, 1, 11, CancellationToken.None);

        db.TripItems.OrderBy(i => i.OrderIndex).AsEnumerable().Select(i => (i.TripItemId, i.OrderIndex))
            .Should().Equal((10, 1), (12, 2));
    }

    [Fact]
    public async Task DeleteItem_ThenAddAtCountPlusOne_NoLongerCollides()
    {
        // เหตุการณ์จริงที่เคยตอบ 500: ลบกลางทางแล้วเพิ่มจุดด้วย "จำนวนจุด + 1"
        using var db = NewDb();
        ThreeStopDay(db);
        var svc = NewService(db);

        await svc.DeleteItemAsync(UserId, 1, 11, CancellationToken.None);
        var dto = await svc.AddItemAsync(UserId, 1, Add(4, 1, db.TripItems.Count(i => i.DayIndex == 1) + 1), CancellationToken.None);

        dto.OrderIndex.Should().Be(3);
    }

    [Fact]
    public async Task DeleteItem_WhenRouteWasSaved_RebuildsSegmentBetweenNeighboursWithSameMode()
    {
        using var db = NewDb();
        ThreeStopDay(db);
        db.TripSegments.AddRange(
            new TripSegment { TripId = 1, FromTripItemId = 10, ToTripItemId = 11, DistanceKm = 1, TravelMinutes = 1, TransportMode = "walking" },
            new TripSegment { TripId = 1, FromTripItemId = 11, ToTripItemId = 12, DistanceKm = 1, TravelMinutes = 1, TransportMode = "walking" });
        db.SaveChanges();
        var handler = new StubHandler(_ => Json("{\"routes\":[{\"distance\":9000,\"duration\":6000,\"legs\":[{\"distance\":9000,\"duration\":6000}]}]}"));

        await NewService(db, handler).DeleteItemAsync(UserId, 1, 11, CancellationToken.None);

        handler.Urls.Should().ContainSingle().Which.Should().Contain("route/v1/walking/");
        var seg = db.TripSegments.Should().ContainSingle().Subject;
        (seg.FromTripItemId, seg.ToTripItemId, seg.DistanceKm, seg.TravelMinutes, seg.TransportMode)
            .Should().Be((10, 12, 9.0, 100, "walking"));
    }

    [Fact]
    public async Task DeleteItem_WhenNoRouteWasEverSaved_DoesNotCreateOneOrCallOsrm()
    {
        using var db = NewDb();
        ThreeStopDay(db);
        var handler = new StubHandler(_ => Json("{}"));

        await NewService(db, handler).DeleteItemAsync(UserId, 1, 11, CancellationToken.None);

        handler.Urls.Should().BeEmpty();
        db.TripSegments.Should().BeEmpty();
    }

    // ---------- แก้ทริป / ค้นหา ----------

    private static CreateTripRequest TripReq(string? title, int endOffsetDays = 1) => new()
    {
        Title = title!,
        StartDateTime = new DateTime(2026, 12, 1),
        EndDateTime = new DateTime(2026, 12, 1).AddDays(endOffsetDays)
    };

    [Fact]
    public async Task UpdateTrip_BlankTitleOrEndBeforeStart_AreBadRequest()
    {
        using var db = NewDb();
        var svc = NewService(db);

        await FluentActions.Awaiting(() => svc.UpdateAsync(UserId, 1, TripReq("  "), CancellationToken.None))
            .Should().ThrowAsync<ArgumentException>();
        await FluentActions.Awaiting(() => svc.UpdateAsync(UserId, 1, TripReq(null), CancellationToken.None))
            .Should().ThrowAsync<ArgumentException>(); // เดิม NullReferenceException
        await FluentActions.Awaiting(() => svc.UpdateAsync(UserId, 1, TripReq("ok", endOffsetDays: -1), CancellationToken.None))
            .Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task UpdateTrip_ValidRequest_IsSaved()
    {
        using var db = NewDb();

        var dto = await NewService(db).UpdateAsync(UserId, 1, TripReq("  ทริปใหม่  "), CancellationToken.None);

        dto.Title.Should().Be("ทริปใหม่");
    }

    [Theory]
    [InlineData("50%", "50\\%")]
    [InlineData("a_b", "a\\_b")]
    [InlineData("[x]", "\\[x]")]
    [InlineData("a\\b", "a\\\\b")]
    [InlineData("plain", "plain")]
    public void EscapeLike_EscapesWildcards(string input, string expected)
    {
        TripService.EscapeLike(input).Should().Be(expected);
    }

    [Theory]
    [InlineData("driving", "driving")]
    [InlineData("WALKING", "walking")]
    [InlineData(" cycling ", "cycling")]
    [InlineData("flying", "driving")]
    [InlineData(null, "driving")]
    public void NormalizeMode_OnlyAllowsKnownModes(string? input, string expected)
    {
        TripService.NormalizeMode(input).Should().Be(expected);
    }
}
