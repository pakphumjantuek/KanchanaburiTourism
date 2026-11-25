using AutoMapper.QueryableExtensions;
using TravelKanjanuburi.Dtos.Places;
using TravelKanjanuburi.Model.MPlaces; 

namespace TravelKanjanuburi.Services.Places
{
    public class PlaceOpeningHourService
    {
        private readonly ApplicationDbContext _db;
        private readonly IMapper _mapper;

        public PlaceOpeningHourService(ApplicationDbContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }

        public async Task<List<OpeningHourDto>> GetByPlaceIdAsync(int placeId, CancellationToken ct = default)
        {
            var items = await _db.OpeningHours
                .AsNoTracking()
                .Where(x => x.PlaceId == placeId)
                .OrderBy(x => x.DayOfWeek)
                .ProjectTo<OpeningHourDto>(_mapper.ConfigurationProvider)
                .ToListAsync(ct);

            if (items.Count == 0)
                throw new KeyNotFoundException($"Opening hours for PlaceId {placeId} not found.");

            return items;
        }


        // ✅ Create: สร้าง OpeningHours 7 วันให้ Place (กันสร้างซ้ำ)
        public async Task CreateDefaultWeeklyAsync(
            int placeId,
            TimeOnly openTime,
            TimeOnly closeTime,
            CancellationToken ct = default)
        {
            var exists = await _db.OpeningHours
                .AnyAsync(x => x.PlaceId == placeId, ct);

            if (exists)
                throw new InvalidOperationException("Opening hours already exist for this place.");

            var items = Enum.GetValues<DayOfWeek>()
                .Select(day => new OpeningHour
                {
                    PlaceId = placeId,
                    DayOfWeek = (int)day,   // ถ้าคุณเปลี่ยนเป็น enum ใน entity ก็แก้ตรงนี้
                    OpenTime = openTime,
                    CloseTime = closeTime,
                    IsClosed = false
                })
                .ToList();

            _db.OpeningHours.AddRange(items);
            await _db.SaveChangesAsync(ct);
        }

        // ✅ Update: อัปเดตรายวัน (Upsert: ถ้ายังไม่มีแถวก็สร้างให้)
        public async Task UpsertDayAsync(
            int placeId,
            UpsertOpeningHourDto dto,
            CancellationToken ct = default)
        {
            // validation ง่ายๆ
            if (!dto.IsClosed && dto.CloseTime < dto.OpenTime)
                throw new InvalidOperationException("CloseTime must be >= OpenTime (for same-day schedule).");

            if (!Enum.IsDefined(typeof(DayOfWeek), dto.DayOfWeek))
                throw new InvalidOperationException("DayOfWeek must be 0 (Sunday) to 6 (Saturday).");

            var dayInt = (int)dto.DayOfWeek;

            var entity = await _db.OpeningHours
                .FirstOrDefaultAsync(x => x.PlaceId == placeId && x.DayOfWeek == dayInt, ct);

            if (entity == null)
            {
                entity = new OpeningHour
                {
                    PlaceId = placeId,
                    DayOfWeek = dayInt
                };
                _db.OpeningHours.Add(entity);
            }

            entity.IsClosed = dto.IsClosed;
            entity.OpenTime = dto.OpenTime;
            entity.CloseTime = dto.CloseTime;

            await _db.SaveChangesAsync(ct);
        }

        // ✅ Update: อัปเดตทั้งสัปดาห์ (วนเรียก UpsertDayAsync)
        public async Task UpsertWeeklyAsync(
            int placeId,
            UpsertWeeklyOpeningHoursDto dto,
            CancellationToken ct = default)
        {
            if (dto.Items == null || dto.Items.Count == 0)
                throw new InvalidOperationException("Items is required.");

            // load existing once (ลด query)
            var existing = await _db.OpeningHours
                .Where(x => x.PlaceId == placeId)
                .ToListAsync(ct);

            foreach (var item in dto.Items)
            {
                if (!item.IsClosed && item.CloseTime < item.OpenTime)
                    throw new InvalidOperationException($"CloseTime must be >= OpenTime for {item.DayOfWeek}.");

                if (!Enum.IsDefined(typeof(DayOfWeek), item.DayOfWeek))
                    throw new InvalidOperationException("DayOfWeek must be 0 (Sunday) to 6 (Saturday).");

                var dayInt = (int)item.DayOfWeek;

                var entity = existing.FirstOrDefault(x => x.DayOfWeek == dayInt);
                if (entity == null)
                {
                    entity = new OpeningHour { PlaceId = placeId, DayOfWeek = dayInt };
                    _db.OpeningHours.Add(entity);
                    existing.Add(entity);
                }

                entity.IsClosed = item.IsClosed;
                entity.OpenTime = item.OpenTime;
                entity.CloseTime = item.CloseTime;
            }

            await _db.SaveChangesAsync(ct);
        }

        // ✅ Delete: ลบ OpeningHours ทั้งหมดของสถานที่ (รีเซ็ต)
        public async Task DeleteByPlaceIdAsync(int placeId, CancellationToken ct = default)
        {
            var items = await _db.OpeningHours
                .Where(x => x.PlaceId == placeId)
                .ToListAsync(ct);

            if (items.Count == 0)
                return;

            _db.OpeningHours.RemoveRange(items);
            await _db.SaveChangesAsync(ct);
        }
    }
}
