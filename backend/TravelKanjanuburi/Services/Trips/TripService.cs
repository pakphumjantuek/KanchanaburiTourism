using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore.Storage;
using System.Globalization;
using TravelKanjanuburi.Dtos.Trips;
using TravelKanjanuburi.Helper;
using TravelKanjanuburi.Model.MTrips;
using static TravelKanjanuburi.Model.Paged;

namespace TravelKanjanuburi.Services.Trips
{
    public class TripService
    {
        private readonly ApplicationDbContext _db;
        private readonly IMapper _mapper;
        private readonly IHttpClientFactory _http;
        private readonly ILogger<TripService> _log;

        public TripService(ApplicationDbContext db, IMapper mapper, IHttpClientFactory http, ILogger<TripService> log)
        {
            _db = db;
            _mapper = mapper;
            _http = http;
            _log = log;
        }

        // ---------------------------
        // Trips
        // ---------------------------
        public async Task<PagedResult<TripDto>> GetMyTripsAsync(int userId, PagedQuery query, CancellationToken ct)
        {
            var page = query.Page < 1 ? 1 : query.Page;
            var pageSize = query.PageSize is < 1 or > 200 ? 20 : query.PageSize;

            var q = _db.Trips.AsNoTracking().Where(x => x.UserId == userId);

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                // escape % _ [ ที่ผู้ใช้พิมพ์ ไม่งั้นค้นหา "50%" หรือ "a_b" จะกลายเป็นตัวแทนอักขระแล้วได้ผลเกิน
                var pattern = $"%{EscapeLike(query.Search.Trim())}%";
                q = q.Where(x => EF.Functions.Like(x.Title, pattern, LikeEscape));
            }

            var total = await q.LongCountAsync(ct);

            var items = await q
                .OrderByDescending(x => x.TripId)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ProjectTo<TripDto>(_mapper.ConfigurationProvider)
                .ToListAsync(ct);

            return new PagedResult<TripDto>(items, page, pageSize, total);
        }

        public async Task<TripDto> GetByIdAsync(int userId, int tripId, CancellationToken ct)
        {
            var trip = await _db.Trips
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.TripId == tripId && x.UserId == userId, ct);

            if (trip == null)
                throw new KeyNotFoundException($"Trip with ID {tripId} not found.");

            return _mapper.Map<TripDto>(trip);
        }

        public async Task<TripDetailDto> GetDetailAsync(int userId, int tripId, CancellationToken ct)
        {
            var trip = await _db.Trips
                .AsNoTracking()
                .Include(x => x.Items)
                .Include(x => x.Segments)
                .FirstOrDefaultAsync(x => x.TripId == tripId && x.UserId == userId, ct);

            if (trip == null)
                throw new KeyNotFoundException($"Trip with ID {tripId} not found.");

            var dto = _mapper.Map<TripDetailDto>(trip);

            dto.Items = trip.Items
                .OrderBy(x => x.DayIndex).ThenBy(x => x.OrderIndex)
                .Select(x => _mapper.Map<TripItemDto>(x))
                .ToList();

            dto.Segments = trip.Segments
                .Select(x => _mapper.Map<TripSegmentDto>(x))
                .ToList();

            return dto;
        }

        public async Task<TripDto> CreateAsync(int userId, CreateTripRequest req, CancellationToken ct)
        {
            ValidateTripRequest(req);

            var trip = new Trip
            {
                UserId = userId,
                Title = req.Title.Trim(),
                Description = req.Description?.Trim(),
                StartDateTime = req.StartDateTime,
                EndDateTime = req.EndDateTime,
                StartLat = req.StartLat,
                StartLng = req.StartLng,
                CreatedAt = DateTime.UtcNow
            };

            await _db.Trips.AddAsync(trip, ct);
            await _db.SaveChangesAsync(ct);

            return _mapper.Map<TripDto>(trip);
        }

        public async Task<TripDto> UpdateAsync(int userId, int tripId, CreateTripRequest req, CancellationToken ct)
        {
            ValidateTripRequest(req); // เดิมแก้ทริปไม่ตรวจชื่อว่าง/วันสิ้นสุดก่อนวันเริ่ม (ชื่อ null ทำให้ NullReference)

            var trip = await _db.Trips.FirstOrDefaultAsync(x => x.TripId == tripId && x.UserId == userId, ct);
            if (trip == null) throw new KeyNotFoundException($"Trip with ID {tripId} not found.");

            trip.Title = req.Title.Trim();
            trip.Description = req.Description?.Trim();
            trip.StartDateTime = req.StartDateTime;
            trip.EndDateTime = req.EndDateTime;
            trip.StartLat = req.StartLat;
            trip.StartLng = req.StartLng;
            trip.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync(ct);
            return _mapper.Map<TripDto>(trip);
        }

        public async Task DeleteAsync(int userId, int tripId, CancellationToken ct)
        {
            var trip = await _db.Trips.FirstOrDefaultAsync(x => x.TripId == tripId && x.UserId == userId, ct);
            if (trip == null) throw new KeyNotFoundException($"Trip with ID {tripId} not found.");

            _db.Trips.Remove(trip);
            await _db.SaveChangesAsync(ct);
        }

        public async Task<TripMapViewDto> GetMapViewAsync( int userId,int tripId,int dayIndex,string? transportMode,CancellationToken ct)
        {
            var trip = await _db.Trips.AsNoTracking()
                .FirstOrDefaultAsync(x => x.TripId == tripId && x.UserId == userId, ct);

            if (trip == null) throw new KeyNotFoundException("Trip not found.");

            var items = await _db.TripItems.AsNoTracking()
                .Where(x => x.TripId == tripId && x.DayIndex == dayIndex)
                .OrderBy(x => x.OrderIndex)
                .ToListAsync(ct);

            // join places
            var placeIds = items.Select(x => x.PlaceId).Distinct().ToList();

            var places = await _db.Places.AsNoTracking()
                .Where(p => placeIds.Contains(p.PlaceId))
                .ToDictionaryAsync(p => p.PlaceId, ct);

            var stops = new List<TripMapStopDto>();
            foreach (var it in items)
            {
                if (!places.TryGetValue(it.PlaceId, out var p)) continue;

                // กันพิกัด 0,0 แบบหลุด ๆ (ถ้าคุณใช้ 0,0 เป็น default)
                if (p.Latitude == 0 && p.Longitude == 0) continue;

                stops.Add(new TripMapStopDto
                {
                    TripItemId = it.TripItemId,
                    PlaceId = it.PlaceId,
                    OrderIndex = it.OrderIndex,
                    Name = p.Name,
                    Latitude = p.Latitude,
                    Longitude = p.Longitude,
                    Type = "normal"
                });
            }

            if (stops.Count > 0)
            {
                stops[0].Type = "start";
                if (stops.Count > 1) stops[^1].Type = "end";
            }

            var dto = new TripMapViewDto
            {
                TripId = tripId,
                Title = trip.Title,
                DayIndex = dayIndex,
                Stops = stops
            };

            // route (คำนวณครั้งเดียว) ถ้ามี >=2 จุด
            if (stops.Count >= 2)
            {
                var mode = (transportMode ?? "driving").Trim().ToLowerInvariant();
                if (mode is not ("driving" or "walking" or "cycling"))
                    mode = "driving";

                var coordStr = string.Join(";", stops.Select(s =>
                    $"{s.Longitude.ToString(CultureInfo.InvariantCulture)}," +
                    $"{s.Latitude.ToString(CultureInfo.InvariantCulture)}"
                )); var url =
                    $"route/v1/{mode}/{coordStr}" +
                    "?overview=full&geometries=geojson&steps=false";

                var http = _http.CreateClient("osrm");

                OsrmResponse? osrm;
                try
                {
                    osrm = await http.GetFromJsonAsync<OsrmResponse>(url, ct);
                }
                catch
                {
                    return dto; // ❗ แค่นี้พอ ไม่ให้ 500
                }

                var r = osrm?.routes?.FirstOrDefault();
                if (r == null)
                {
                    return dto; // ไม่มี route ก็ไม่ล้ม
                }




                if (r != null && r.geometry?.coordinates?.Count > 0)
                {
                    dto.Route = new TripMapRouteDto
                    {
                        TotalDistanceKm = r.distance / 1000.0,
                        TotalTravelMinutes = (int)Math.Round(r.duration / 60.0),
                        Polyline = r.geometry.coordinates.Select(c => new[] { c[0], c[1] }).ToList()
                    };
                    if (r != null)
                    {
                        // สร้าง map tripItemId -> plannedDurationMin (เผื่อบวกเวลาที่แวะ)
                        var plannedStayByTripItemId = items
                          .GroupBy(x => x.TripItemId)
                          .ToDictionary(
                              g => g.Key,
                              g => g.First().PlannedDurationMinutes ?? 0
                          );

                        // legs ต้องมี count = stops.Count - 1
                        var legs = r.legs ?? new List<OsrmLeg>();
                        if (legs.Count == Math.Max(0, stops.Count - 1))
                        {
                            int travelAcc = 0;
                            int totalAcc = 0;

                            stops[0].EtaTravelMinutesFromStart = 0;
                            stops[0].EtaTotalMinutesFromStart = 0;

                            for (int i = 0; i < legs.Count; i++)
                            {
                                var legMin = (int)Math.Round(legs[i].duration / 60.0);

                                // travel ETA (ไม่รวมแวะ)
                                travelAcc += legMin;

                                // total ETA (รวมแวะที่จุดก่อนหน้า)
                                var fromTripItemId = stops[i].TripItemId;
                                var stayMin = plannedStayByTripItemId.TryGetValue(fromTripItemId, out var s) ? s : 0;

                                totalAcc += stayMin;   // แวะก่อนออก
                                totalAcc += legMin;    // แล้วค่อยเดินทาง

                                stops[i + 1].LegMinutesFromPrev = legMin;
                                stops[i + 1].EtaTravelMinutesFromStart = travelAcc;

                                stops[i + 1].EtaTotalMinutesFromStart = totalAcc;
                                stops[i + 1].StayMinutesAtPrev = stayMin; // จะโชว์ก็ได้
                            }
                        }

                    }

                }
            }

            return dto;
        }

        // ---------------------------
        // TripItems
        // ---------------------------
        public async Task<TripItemDto> AddItemAsync(int userId, int tripId, AddTripItemRequest req, CancellationToken ct)
        {
            var trip = await _db.Trips.FirstOrDefaultAsync(x => x.TripId == tripId && x.UserId == userId, ct);
            if (trip == null) throw new KeyNotFoundException($"Trip with ID {tripId} not found.");

            if (req.DayIndex < 1) throw new ArgumentException("DayIndex must be >= 1");
            if (req.OrderIndex < 1) throw new ArgumentException("OrderIndex must be >= 1");

            if (!await _db.Places.AsNoTracking().AnyAsync(p => p.PlaceId == req.PlaceId, ct))
                throw new ArgumentException("ไม่พบสถานที่ที่เลือก");

            // อีเวนต์ที่จบแล้ว/ยังไม่เริ่ม เพิ่มเข้าทริปใหม่ไม่ได้ (จุดที่อยู่ในทริปเดิมอยู่ต่อ)
            if (!await _db.Places.AsNoTracking().Where(p => p.PlaceId == req.PlaceId).AnyAsync(PlaceVisibility.VisibleNow(), ct))
                throw new ArgumentException("อีเวนต์นี้ไม่ได้เปิดให้เลือกแล้ว (จบแล้วหรือยังไม่เริ่ม)");

            // หน้าเว็บส่ง orderIndex = จำนวนจุดในวัน + 1 ถ้าเคยลบจุดกลางวันไป เลขลำดับจะเว้นช่อง แล้วเลขนี้ไปชนจุดที่มีอยู่
            // (unique index ของ TripId+DayIndex+OrderIndex) จึงต่อท้ายวันแทนการล้มด้วย 500
            var orderIndex = req.OrderIndex;
            var dayItems = _db.TripItems.Where(x => x.TripId == tripId && x.DayIndex == req.DayIndex);
            if (await dayItems.AnyAsync(x => x.OrderIndex == orderIndex, ct))
                orderIndex = await dayItems.MaxAsync(x => x.OrderIndex, ct) + 1;

            var item = new TripItem
            {
                TripId = tripId,
                PlaceId = req.PlaceId,
                DayIndex = req.DayIndex,
                OrderIndex = orderIndex,
                PlannedArrivalTime = req.PlannedArrivalTime,
                PlannedDurationMinutes = req.PlannedDurationMinutes,
                Notes = req.Notes?.Trim()
            };

            await _db.TripItems.AddAsync(item, ct);
            trip.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _db.SaveChangesAsync(ct);
            }
            catch (DbUpdateException ex) when (IsDuplicateKey(ex))
            {
                // มีคนเพิ่มจุดพร้อมกันจนเลขลำดับชนหลังตรวจไปแล้ว
                throw new InvalidOperationException("ลำดับของจุดนี้ถูกใช้ไปแล้ว กรุณาลองอีกครั้ง");
            }

            return _mapper.Map<TripItemDto>(item);
        }

        public async Task<TripItemDto> UpdateItemAsync(int userId, int tripId, int tripItemId, UpdateTripItemRequest req, CancellationToken ct)
        {
            var item = await _db.TripItems
                .Include(x => x.Trip)
                .FirstOrDefaultAsync(x => x.TripItemId == tripItemId && x.TripId == tripId, ct);

            if (item == null || item.Trip.UserId != userId)
                throw new KeyNotFoundException($"TripItem with ID {tripItemId} not found.");

            if (req.DayIndex < 1) throw new ArgumentException("DayIndex must be >= 1");
            if (req.OrderIndex < 1) throw new ArgumentException("OrderIndex must be >= 1");

            // ย้ายไปลำดับที่มีจุดอื่นอยู่แล้วไม่ได้ (ให้ใช้การจัดลำดับใหม่แทน) ตอบข้อความชัดเจนแทน 500
            var occupied = await _db.TripItems.AnyAsync(x =>
                x.TripId == tripId && x.TripItemId != tripItemId &&
                x.DayIndex == req.DayIndex && x.OrderIndex == req.OrderIndex, ct);
            if (occupied)
                throw new InvalidOperationException(
                    $"ลำดับที่ {req.OrderIndex} ของวันที่ {req.DayIndex} มีจุดอยู่แล้ว ใช้การจัดลำดับใหม่เพื่อสลับตำแหน่ง");

            item.DayIndex = req.DayIndex;
            item.OrderIndex = req.OrderIndex;
            item.PlannedArrivalTime = req.PlannedArrivalTime;
            item.PlannedDurationMinutes = req.PlannedDurationMinutes;
            item.Notes = req.Notes?.Trim();

            item.Trip.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _db.SaveChangesAsync(ct);
            }
            catch (DbUpdateException ex) when (IsDuplicateKey(ex))
            {
                throw new InvalidOperationException("ลำดับนี้ถูกใช้ไปแล้ว กรุณาลองอีกครั้ง");
            }

            return _mapper.Map<TripItemDto>(item);
        }

        public async Task DeleteItemAsync(int userId, int tripId, int tripItemId, CancellationToken ct)
        {
            var item = await _db.TripItems
                .Include(x => x.Trip)
                .FirstOrDefaultAsync(x => x.TripItemId == tripItemId && x.TripId == tripId, ct);

            if (item == null || item.Trip.UserId != userId)
                throw new KeyNotFoundException($"TripItem with ID {tripItemId} not found.");

            var dayIndex = item.DayIndex;

            // โหมดเดินทางของเส้นทางที่เคยบันทึกไว้ในวันนั้น (ถ้าไม่เคยบันทึกเส้นทางเลย จะไม่สร้างให้เอง)
            var dayItemIds = await _db.TripItems
                .Where(x => x.TripId == tripId && x.DayIndex == dayIndex)
                .Select(x => x.TripItemId)
                .ToListAsync(ct);
            var savedMode = await _db.TripSegments
                .Where(s => s.TripId == tripId && dayItemIds.Contains(s.FromTripItemId) && dayItemIds.Contains(s.ToTripItemId))
                .Select(s => s.TransportMode)
                .FirstOrDefaultAsync(ct);

            // ลบ Segments ที่เกี่ยวข้อง (กัน FK ค้าง)
            var segs = await _db.TripSegments
                .Where(s => s.TripId == tripId && (s.FromTripItemId == tripItemId || s.ToTripItemId == tripItemId))
                .ToListAsync(ct);

            _db.TripSegments.RemoveRange(segs);
            _db.TripItems.Remove(item);

            item.Trip.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync(ct);

            // ปิดช่องว่างเลขลำดับ (เดิมลบจุดกลางวันแล้วเลขเว้นช่อง ทำให้เพิ่มจุดใหม่ชนเลขเดิม)
            await CompactOrderAsync(tripId, dayIndex, ct);

            // ต่อเส้นทางระหว่างจุดก่อน-หลังที่ถูกลบใหม่ ตารางเวลากับเส้นทางจะได้ตรงกัน
            if (savedMode != null)
            {
                try
                {
                    await RebuildSegmentsAsync(tripId, dayIndex, NormalizeMode(savedMode), ct);
                }
                catch (InvalidOperationException)
                {
                    // มีสถานที่ในวันนั้นถูกลบออกจากระบบ: ลบจุดสำเร็จแล้ว ปล่อยให้ผู้ใช้บันทึกเส้นทางเองภายหลัง
                }
            }
        }

        /// เรียงเลขลำดับของวันให้เป็น 1..N ต่อเนื่อง (สองรอบผ่านค่าติดลบ เพื่อหลบ unique index)
        private async Task CompactOrderAsync(int tripId, int dayIndex, CancellationToken ct)
        {
            var items = await _db.TripItems
                .Where(x => x.TripId == tripId && x.DayIndex == dayIndex)
                .OrderBy(x => x.OrderIndex)
                .ToListAsync(ct);

            if (items.Select((x, i) => x.OrderIndex == i + 1).All(ok => ok)) return;

            await using var tx = await BeginTransactionIfSupportedAsync(ct);

            int temp = -1000;
            foreach (var it in items) it.OrderIndex = temp--;
            await _db.SaveChangesAsync(ct);

            for (int i = 0; i < items.Count; i++) items[i].OrderIndex = i + 1;
            await _db.SaveChangesAsync(ct);

            if (tx != null) await tx.CommitAsync(ct);
        }

        // ฐานข้อมูลในหน่วยความจำ (ใช้ในเทสต์) ไม่รองรับ transaction
        private async Task<IDbContextTransaction?> BeginTransactionIfSupportedAsync(CancellationToken ct)
            => _db.Database.IsRelational() ? await _db.Database.BeginTransactionAsync(ct) : null;

        public async Task ReorderTripItemsAsync(int userId, int tripId, ReorderTripItemsRequest req, CancellationToken ct)
        {
            if (req == null) throw new ArgumentNullException(nameof(req));
            if (req.DayIndex <= 0) throw new ArgumentException("dayIndex ไม่ถูกต้อง");
            if (req.Items == null || req.Items.Count == 0) throw new ArgumentException("items ว่าง");

            // ✅ เช็คว่า Trip เป็นของ user
            var tripOk = await _db.Trips.AsNoTracking()
                .AnyAsync(t => t.TripId == tripId && t.UserId == userId, ct);

            if (!tripOk) throw new KeyNotFoundException("Trip not found.");

            // ✅ กัน orderIndex ซ้ำ/ไม่ถูกต้อง
            var newOrders = req.Items.Select(x => x.OrderIndex).ToList();
            if (newOrders.Any(o => o < 1))
                throw new ArgumentException("orderIndex ต้องเริ่มที่ 1");
            if (newOrders.Distinct().Count() != newOrders.Count)
                throw new InvalidOperationException("orderIndex ซ้ำกัน");

            var ids = req.Items.Select(x => x.TripItemId).Distinct().ToList();
            if (ids.Count != req.Items.Count)
                throw new ArgumentException("tripItemId ซ้ำกัน");

            // โหลดเฉพาะ item ของวันนั้น
            var dbItems = await _db.TripItems
                .Where(x => x.TripId == tripId && x.DayIndex == req.DayIndex && ids.Contains(x.TripItemId))
                .ToListAsync(ct);

            if (dbItems.Count != ids.Count)
                throw new InvalidOperationException("มี TripItem บางตัวไม่อยู่ในทริป/ไม่อยู่ในวันเดียวกัน");

            // ต้องส่งครบทุกจุดของวันนั้น: ถ้าส่งมาแค่บางจุด เลขลำดับใหม่อาจไปชนจุดที่ไม่ได้ส่ง (unique index) แล้วล้มกลางทาง
            var dayCount = await _db.TripItems.CountAsync(x => x.TripId == tripId && x.DayIndex == req.DayIndex, ct);
            if (dayCount != ids.Count)
                throw new InvalidOperationException("ต้องส่งจุดครบทุกจุดของวันนั้นเมื่อจัดลำดับใหม่");

            // map ค่า order ใหม่
            var map = req.Items.ToDictionary(x => x.TripItemId, x => x.OrderIndex);

            await using var tx = await BeginTransactionIfSupportedAsync(ct);

            // ---------------- Phase 1: set temp order (หลบ unique index) ----------------
            // ใช้ค่าติดลบเพื่อไม่ชนกับค่าปกติ (1..N)
            int temp = -1000;
            foreach (var it in dbItems.OrderBy(x => x.TripItemId))
            {
                it.OrderIndex = temp--;
            }
            await _db.SaveChangesAsync(ct);

            // ---------------- Phase 2: set final order ----------------
            foreach (var it in dbItems)
            {
                it.OrderIndex = map[it.TripItemId];
            }
            await _db.SaveChangesAsync(ct);

            if (tx != null) await tx.CommitAsync(ct);
        }

        public async Task SaveRouteAsync(int userId,int tripId,SaveRouteRequest req,CancellationToken ct)
        {
            var trip = await _db.Trips
                .FirstOrDefaultAsync(x => x.TripId == tripId && x.UserId == userId, ct);

            if (trip == null)
                throw new KeyNotFoundException("Trip not found.");

            // โหมดที่ไม่รู้จักใช้ driving เหมือนฝั่งแผนที่ (กันค่าแปลกถูกต่อลงใน URL ของ OSRM)
            await RebuildSegmentsAsync(tripId, req.DayIndex, NormalizeMode(req.TransportMode), ct);
        }

        /// สร้าง segment ของวันนั้นใหม่ทั้งหมดจากลำดับจุดปัจจุบัน (ใช้ทั้งตอนบันทึกเส้นทางและหลังลบจุด)
        private async Task RebuildSegmentsAsync(int tripId, int dayIndex, string mode, CancellationToken ct)
        {
            // TripItems ของวันนั้น (เรียงแล้ว)
            var items = await _db.TripItems
                .Where(x => x.TripId == tripId && x.DayIndex == dayIndex)
                .OrderBy(x => x.OrderIndex)
                .ToListAsync(ct);

            if (items.Count < 2) return;

            // ลบ segment เก่าของวันนั้น
            var itemIds = items.Select(x => x.TripItemId).ToList();
            var oldSegs = await _db.TripSegments
                .Where(s => s.TripId == tripId
                    && itemIds.Contains(s.FromTripItemId)
                    && itemIds.Contains(s.ToTripItemId))
                .ToListAsync(ct);

            _db.TripSegments.RemoveRange(oldSegs);

            // โหลด Place (lat/lng)
            var placeIds = items.Select(x => x.PlaceId).Distinct().ToList();
            var places = await _db.Places
                .Where(p => placeIds.Contains(p.PlaceId))
                .ToDictionaryAsync(p => p.PlaceId, ct);

            var stops = new List<Place>(items.Count);
            foreach (var it in items)
            {
                if (!places.TryGetValue(it.PlaceId, out var p))
                    throw new InvalidOperationException("สถานที่บางแห่งในวันนี้ถูกลบออกจากระบบแล้ว กรุณาลบจุดนั้นออกจากทริปก่อน");
                stops.Add(p);
            }

            // เรียก OSRM ครั้งเดียวทั้งเส้นทาง (เดิมเรียกทีละช่วงตามลำดับ: ช้า เสี่ยงโดนจำกัดอัตรา และล้มทั้งคำขอเมื่อช่วงใดช่วงหนึ่งพลาด)
            var legs = await TryGetRouteLegsAsync(mode, stops, ct);
            if (legs == null)
            {
                // OSRM ล่ม/ช้า: บันทึกค่าประมาณจากเส้นตรงแทนการตอบ 500 (ผู้ใช้กดบันทึกใหม่ได้เมื่อ OSRM กลับมา)
                _log.LogWarning("OSRM route unavailable for trip {TripId} day {Day}; saving straight-line estimates", tripId, dayIndex);
                legs = EstimateLegs(mode, stops);
            }

            for (int i = 0; i < items.Count - 1; i++)
            {
                _db.TripSegments.Add(new TripSegment
                {
                    TripId = tripId,
                    FromTripItemId = items[i].TripItemId,
                    ToTripItemId = items[i + 1].TripItemId,
                    TransportMode = mode,
                    DistanceKm = legs[i].km,
                    TravelMinutes = legs[i].min,
                });
            }

            await _db.SaveChangesAsync(ct);
        }

        private const string LikeEscape = "\\";

        /// escape อักขระพิเศษของ LIKE (\\ % _ [) ให้ค้นหาตามตัวอักษรจริง
        internal static string EscapeLike(string term)
            => term.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_").Replace("[", "\\[");

        private static void ValidateTripRequest(CreateTripRequest req)
        {
            if (req == null) throw new ArgumentNullException(nameof(req));
            if (string.IsNullOrWhiteSpace(req.Title)) throw new ArgumentException("Title is required.");
            if (req.EndDateTime < req.StartDateTime) throw new ArgumentException("EndDateTime must be >= StartDateTime.");
        }

        internal static string NormalizeMode(string? transportMode)
        {
            var mode = (transportMode ?? "driving").Trim().ToLowerInvariant();
            return mode is "driving" or "walking" or "cycling" ? mode : "driving";
        }

        /// ระยะ/เวลาแต่ละช่วงจากเส้นทางจริงของ OSRM (คำขอเดียว) คืน null เมื่อใช้ไม่ได้ ผู้เรียกจะ fallback เอง
        private async Task<List<(double km, int min)>?> TryGetRouteLegsAsync(
            string mode, IReadOnlyList<Place> stops, CancellationToken ct)
        {
            try
            {
                var coords = string.Join(";", stops.Select(s =>
                    $"{s.Longitude.ToString(CultureInfo.InvariantCulture)},{s.Latitude.ToString(CultureInfo.InvariantCulture)}"));

                var http = _http.CreateClient("osrm");
                var osrm = await http.GetFromJsonAsync<OsrmResponse>(
                    $"route/v1/{mode}/{coords}?overview=false&steps=false", ct);

                var legs = osrm?.routes?.FirstOrDefault()?.legs;
                if (legs == null || legs.Count != stops.Count - 1) return null;

                return legs.Select(l => (l.distance / 1000.0, (int)Math.Round(l.duration / 60.0))).ToList();
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                throw; // ผู้ใช้ยกเลิกคำขอ ไม่ใช่ OSRM ล่ม
            }
            catch (Exception)
            {
                return null; // เครือข่าย/หมดเวลา/JSON ผิดรูป
            }
        }

        // ค่าประมาณจากเส้นตรง ความเร็วชุดเดียวกับตัวจัดทริปอัตโนมัติเมื่อไม่มี OSRM
        internal static List<(double km, int min)> EstimateLegs(string mode, IReadOnlyList<Place> stops)
        {
            double speed = mode switch { "walking" => 4.5, "cycling" => 15.0, _ => 40.0 };
            var legs = new List<(double km, int min)>(stops.Count - 1);
            for (int i = 0; i < stops.Count - 1; i++)
            {
                var km = Geo.HaversineKm(stops[i].Latitude, stops[i].Longitude, stops[i + 1].Latitude, stops[i + 1].Longitude);
                legs.Add((km, (int)Math.Round(km / speed * 60.0)));
            }
            return legs;
        }

        private static bool IsDuplicateKey(DbUpdateException ex)
            => ex.InnerException?.Message.Contains("duplicate key", StringComparison.OrdinalIgnoreCase) == true;

        public async Task<List<TripSegmentDto>> GetSegmentsByDayAsync(
            int userId, int tripId, int dayIndex, CancellationToken ct)
        {
            // เช็คเจ้าของทริป
            var ok = await _db.Trips.AsNoTracking()
                .AnyAsync(t => t.TripId == tripId && t.UserId == userId, ct);
            if (!ok) throw new KeyNotFoundException("Trip not found.");

            // item ของวันนั้น
            var itemIds = await _db.TripItems.AsNoTracking()
                .Where(i => i.TripId == tripId && i.DayIndex == dayIndex)
                .Select(i => i.TripItemId)
                .ToListAsync(ct);

            if (itemIds.Count == 0) return new();

            // segments เฉพาะที่ from/to อยู่ในวันนั้น
            return await _db.TripSegments.AsNoTracking()
                .Where(s => s.TripId == tripId
                    && itemIds.Contains(s.FromTripItemId)
                    && itemIds.Contains(s.ToTripItemId))
                .Select(s => new TripSegmentDto
                {
                    FromTripItemId = s.FromTripItemId,
                    ToTripItemId = s.ToTripItemId,
                    TravelMinutes = s.TravelMinutes,
                    DistanceKm = s.DistanceKm
                })
                .ToListAsync(ct);
        }

    }
}
