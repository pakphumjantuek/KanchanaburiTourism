using AutoMapper.QueryableExtensions;
using System.Linq.Expressions;
using TravelKanjanuburi.Dtos.Food;
using TravelKanjanuburi.Dtos.PlaceLog;
using TravelKanjanuburi.Dtos.Places;
using TravelKanjanuburi.Model.Foods;
using TravelKanjanuburi.Model.Log;
using TravelKanjanuburi.Model.MPlaces;
using TravelKanjanuburi.Services.Images;
using static TravelKanjanuburi.Model.Paged;

namespace TravelKanjanuburi.Services.Places
{
    public class PlaceService
    {
        private readonly ApplicationDbContext _db;
        private readonly IMapper _mapper;
        private readonly IImageService _imageService;

        public PlaceService(ApplicationDbContext db, IMapper mapper, IImageService imageService)
        {
            _db = db;
            _mapper = mapper;
            _imageService = imageService;
        }

        public const string FoodCategoryName = "อาหาร";

        /// <summary>ผู้ประกอบการลงได้เฉพาะหมวด "อาหาร" (แอดมินไม่จำกัด)</summary>
        public async Task EnsureFoodCategoryAsync(int? categoryId, CancellationToken ct = default)
        {
            var ok = categoryId.HasValue && await _db.PlaceCategories.AsNoTracking()
                .AnyAsync(c => c.CategoryId == categoryId.Value && c.CategoryName == FoodCategoryName, ct);
            if (!ok) throw new InvalidOperationException("ผู้ประกอบการลงสถานที่ได้เฉพาะหมวดหมู่ \"อาหาร\"");
        }

        /// <summary>ผู้ประกอบการแก้ได้เฉพาะของตัวเอง แอดมิน (ownerId = null) แก้ได้ทั้งหมด</summary>
        public async Task EnsureCanManageAsync(int placeId, int? userId, bool isAdmin, CancellationToken ct = default)
        {
            if (isAdmin) return;
            var ownerId = await _db.Places.AsNoTracking().Where(p => p.PlaceId == placeId).Select(p => p.OwnerId).FirstOrDefaultAsync(ct);
            var exists = await _db.Places.AnyAsync(p => p.PlaceId == placeId, ct);
            if (!exists) throw new KeyNotFoundException($"Places with ID {placeId} not found.");
            if (userId == null || ownerId != userId) throw new UnauthorizedAccessException("คุณไม่มีสิทธิ์จัดการสถานที่นี้");
        }

/// <summary>แอดมินกำหนดเจ้าของ (null = ไม่มีเจ้าของ/แอดมินดูแลเอง) — เจ้าของต้องเป็นผู้ประกอบการหรือแอดมิน</summary>
        public async Task SetOwnerAsync(int placeId, int? ownerId, CancellationToken ct = default)
        {
            var place = await _db.Places.FirstOrDefaultAsync(p => p.PlaceId == placeId, ct)
                ?? throw new KeyNotFoundException($"Places with ID {placeId} not found.");

            if (ownerId.HasValue)
            {
                var roleId = await _db.Users.Where(u => u.UserId == ownerId.Value && u.IsActive)
                    .Select(u => (int?)u.RoleId).FirstOrDefaultAsync(ct);
                if (roleId == null) throw new KeyNotFoundException("ไม่พบผู้ใช้");
                if (roleId != 3 && roleId != 2) throw new InvalidOperationException("ผู้ใช้นี้ไม่ใช่ผู้ประกอบการ");
            }

            place.OwnerId = ownerId;
            await _db.SaveChangesAsync(ct);
        }

        /// <summary>จัดข้อมูลอีเวนต์: ไม่เป็นอีเวนต์ = ล้างเวลา | เป็นอีเวนต์ = ต้องมีเวลาสิ้นสุด และหลังเวลาเริ่ม (เก็บ UTC)</summary>
        private static void NormalizeEvent(Place place, bool mustEndInFuture)
        {
            if (!place.IsEvent)
            {
                place.EventStartAt = null;
                place.EventEndAt = null;
                return;
            }

            if (place.EventEndAt == null)
                throw new InvalidOperationException("สถานที่ที่เป็นอีเวนต์ต้องระบุวันเวลาสิ้นสุด");

            place.EventEndAt = place.EventEndAt.Value.ToUniversalTime();
            place.EventStartAt = place.EventStartAt?.ToUniversalTime();

            if (place.EventStartAt != null && place.EventEndAt <= place.EventStartAt)
                throw new InvalidOperationException("เวลาสิ้นสุดอีเวนต์ต้องหลังเวลาเริ่ม");
            if (mustEndInFuture && place.EventEndAt <= DateTime.UtcNow)
                throw new InvalidOperationException("เวลาสิ้นสุดอีเวนต์ต้องเป็นเวลาในอนาคต");
        }

        /// <param name="includeHiddenEvents">true = แอดมิน/เจ้าของ เห็นอีเวนต์ที่จบแล้วหรือยังไม่เริ่มด้วย</param>
        public async Task<PagedResult<PlaceDetailDto>> GetAllAsync(PagedQuery query,CancellationToken ct, int? ownerId = null, bool includeHiddenEvents = false)
        {
            var page = query.Page < 1 ? 1 : query.Page;
            var pageSize = query.PageSize is < 1 or > 200 ? 20 : query.PageSize;

            var q = _db.Places.AsNoTracking();
            if (ownerId.HasValue) q = q.Where(x => x.OwnerId == ownerId.Value);
            if (!includeHiddenEvents) q = q.Where(PlaceVisibility.VisibleNow());
            if (query.EventOnly == true) q = q.Where(x => x.IsEvent);

            // 🔍 Search
            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var term = query.Search.Trim();
                q = q.Where(x => EF.Functions.Like(x.Name, $"%{term}%"));
            }

            // ❌ exclude อาหาร
            // (รายการ "ของฉัน" ของผู้ประกอบการต้องเห็นร้านอาหารของตัวเองด้วย)
            if (!ownerId.HasValue && query.EventOnly != true && !string.Equals(query.Category, "อาหาร", StringComparison.OrdinalIgnoreCase))
            {
                q = q.Where(x => x.CategoryId != 7);
            }

            // 🏷 Category
            if (!string.IsNullOrWhiteSpace(query.Category))
            {
                var cat = query.Category.Trim();
                q = q.Where(x => x.PlaceCategory.CategoryName == cat);
            }

            // 📍 Near me
            if (query.Lat.HasValue && query.Lng.HasValue && query.RadiusKm.HasValue)
            {
                var lat = query.Lat.Value;
                var lng = query.Lng.Value;
                var radius = query.RadiusKm.Value;

                const double R = 6371; // km

                q = q
                    .Select(x => new
                    {
                        Place = x,
                        Distance =
                            R * 2 *
                            Math.Asin(Math.Sqrt(
                                Math.Pow(Math.Sin((x.Latitude - lat) * Math.PI / 180 / 2), 2) +
                                Math.Cos(lat * Math.PI / 180) *
                                Math.Cos(x.Latitude * Math.PI / 180) *
                                Math.Pow(Math.Sin((x.Longitude - lng) * Math.PI / 180 / 2), 2)
                            ))
                    })
                    .Where(x => x.Distance <= radius)
                    .OrderBy(x => x.Distance)
                    .Select(x => x.Place);
            }
            else
            {
                // หน้าอีเวนต์: ที่ใกล้จบขึ้นก่อน (จะได้ไม่พลาด) | หน้าอื่น: ใหม่สุดก่อน
                q = query.EventOnly == true ? q.OrderBy(x => x.EventEndAt) : q.OrderByDescending(x => x.CreatedAt);
            }

            var total = await q.LongCountAsync(ct);

            var items = await q
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ProjectTo<PlaceDetailDto>(_mapper.ConfigurationProvider)
                .ToListAsync(ct);

            return new PagedResult<PlaceDetailDto>(items, page, pageSize, total);
        }


        public async Task<PlaceDetailDto> GetPlaceByIdAsync(int id, CancellationToken ct = default)
        {
            var place = await _db.Places
                .AsNoTracking()
                .Include(x => x.Images)
                .Include(p => p.OpeningHours)
                .Include(x => x.PlaceTags)
                    .ThenInclude(pt => pt.Tag)
                .FirstOrDefaultAsync(x => x.PlaceId == id, ct);

            if (place == null)
                throw new KeyNotFoundException($"Places with ID {id} not found.");

            return _mapper.Map<PlaceDetailDto>(place);
        }

        public async Task<CreatePlaceRequest> CreatePlaceAsync(CreatePlaceRequest req, CancellationToken ct = default, int? ownerId = null)
        {
            if (req == null)
                throw new ArgumentNullException(nameof(req), "PlaceDetailDto cannot be null.");

            var place = _mapper.Map<Place>(req);
            place.OwnerId = ownerId;
            NormalizeEvent(place, mustEndInFuture: true);

            if (req.TagIds?.Count > 0)
            {
                var tagIds = req.TagIds.Distinct().ToList();
                place.PlaceTags = tagIds.Select(tid => new PlaceTag { TagId = tid }).ToList();
            }

            await _db.Places.AddAsync(place, ct);
            await _db.SaveChangesAsync(ct);

            return _mapper.Map<CreatePlaceRequest>(place);
        }

        public async Task<UpdatePlaceRequest> UpdatePlaceAsync(int id, UpdatePlaceRequest req, CancellationToken ct = default)
        {
            var place = await _db.Places
                .Include(p => p.PlaceTags)
                .FirstOrDefaultAsync(p => p.PlaceId == id, ct);

            if (place == null) throw new KeyNotFoundException($"Place {id} not found.");

            // update field ปกติ (ignore null)
            var wasEnded = place.IsEvent && place.EventEndAt <= DateTime.UtcNow;
            var oldEnd = place.EventEndAt;
            _mapper.Map(req, place);
            // แก้ข้อมูลอื่นของอีเวนต์ที่จบไปแล้วได้โดยไม่ต้องเปลี่ยนเวลา แต่ถ้าเปลี่ยนเวลาสิ้นสุดต้องเป็นอนาคต
            NormalizeEvent(place, mustEndInFuture: !(wasEnded && place.EventEndAt == oldEnd));

            // sync tags
            var newIds = (req.TagIds ?? new()).Distinct().ToHashSet();
            var oldIds = place.PlaceTags.Select(x => x.TagId).ToHashSet();

            var toAdd = newIds.Except(oldIds);
            var toRemove = oldIds.Except(newIds);

            place.PlaceTags = place.PlaceTags.Where(pt => !toRemove.Contains(pt.TagId)).ToList();
            foreach (var tid in toAdd) place.PlaceTags.Add(new PlaceTag { PlaceId = id, TagId = tid });

            await _db.SaveChangesAsync(ct);
            return _mapper.Map<UpdatePlaceRequest>(place);
        }


        public async Task DeletePlaceAsync(int id, CancellationToken ct = default)
        {
            var place = await _db.Places.FirstOrDefaultAsync(p => p.PlaceId == id, ct);
            if (place == null)
                throw new KeyNotFoundException("ไม่พบไอดีPlace");

            // TripItems + TripSegments
            var tripItemIds = await _db.TripItems
                .Where(x => x.PlaceId == id)
                .Select(x => x.TripItemId)
                .ToListAsync(ct);

            if (tripItemIds.Any())
            {
                _db.TripSegments.RemoveRange(
                    _db.TripSegments.Where(s =>
                        tripItemIds.Contains(s.FromTripItemId) ||
                        tripItemIds.Contains(s.ToTripItemId))
                );

                _db.TripItems.RemoveRange(
                    _db.TripItems.Where(x => x.PlaceId == id)
                );
            }

            _db.BehaviorLogs.RemoveRange(_db.BehaviorLogs.Where(x => x.PlaceId == id));
            // ลูกของ Place
            _db.PlaceTags.RemoveRange(_db.PlaceTags.Where(x => x.PlaceId == id));
            _db.PlaceImages.RemoveRange(_db.PlaceImages.Where(x => x.PlaceId == id));
            _db.OpeningHours.RemoveRange(_db.OpeningHours.Where(x => x.PlaceId == id));
            _db.PlaceReviews.RemoveRange(_db.PlaceReviews.Where(x => x.PlaceId == id));

            var images = await _db.PlaceImages.Where(x => x.PlaceId == id).ToListAsync(ct);

            foreach (var img in images)
                _imageService.DeletePhysical(img.ImageUrl);

            _db.Places.Remove(place);

            await _db.SaveChangesAsync(ct);
        }

        public async Task UploadImagesAsync(int placeId, List<IFormFile> files,int coverIndex = 0,bool replaceOld = false,CancellationToken ct = default)
        {
            var place = await _db.Places
                .Include(x => x.Images)
                .FirstOrDefaultAsync(x => x.PlaceId == placeId, ct);

            if (place == null)
                throw new KeyNotFoundException("ไม่พบสถานที่");

            if (files == null || files.Count == 0)
                throw new InvalidOperationException("ไม่มีไฟล์");

            if (replaceOld)
            {
                foreach (var old in place.Images.ToList())
                {
                    _imageService.DeletePhysical(old.ImageUrl);
                    _db.PlaceImages.Remove(old);
                }
            }

            foreach (var img in place.Images) img.IsCover = false;

            var urls = await _imageService.UploadAsync(
                  files,
                  "uploads/place",
                  ct
              );

            if (coverIndex < 0 || coverIndex >= urls.Count) coverIndex = 0;

            for (int i = 0; i < urls.Count; i++)
            {
                place.Images.Add(new PlaceImage
                {
                    ImageUrl = urls[i],
                    IsCover = i == coverIndex
                });
            }

            await _db.SaveChangesAsync(ct);
        }

        public async Task DeleteImageAsync(int placeId, int imageId, CancellationToken ct = default)
        {
            var img = await _db.PlaceImages
                .FirstOrDefaultAsync(x => x.ImageId == imageId && x.PlaceId == placeId, ct);

            if (img == null)
                throw new KeyNotFoundException("ไม่พบรูปภาพ");

            _imageService.DeletePhysical(img.ImageUrl);

            _db.PlaceImages.Remove(img);
            await _db.SaveChangesAsync(ct);
        }
        
        //ระบบสถานที่ในเมนูท้องถิ่น
        public async Task UpsertPlaceDishAsync(int placeId, UpsertPlaceDishRequest req, CancellationToken ct = default)
        {
            var placeExists = await _db.Places.AnyAsync(x => x.PlaceId == placeId, ct);
            if (!placeExists) throw new KeyNotFoundException("ไม่พบ PlaceId");

            var dishExists = await _db.LocalDishes.AnyAsync(x => x.DishId == req.DishId, ct);
            if (!dishExists) throw new KeyNotFoundException("ไม่พบ DishId");

            var link = await _db.PlaceLocalDishes
                .FirstOrDefaultAsync(x => x.PlaceId == placeId && x.DishId == req.DishId, ct);

            if (link == null)
            {
                link = new PlaceLocalDish
                {
                    PlaceId = placeId,
                    DishId = req.DishId,
                    Price = req.Price,
                    IsAvailable = req.IsAvailable
                };
                _db.PlaceLocalDishes.Add(link);
            }
            else
            {
                link.Price = req.Price;
                link.IsAvailable = req.IsAvailable;
            }

            await _db.SaveChangesAsync(ct);
        }

        public async Task<List<DishForPlaceDto>> GetDishesByPlaceIdAsync(int placeId, CancellationToken ct = default)
        {
            var placeExists = await _db.Places.AsNoTracking().AnyAsync(x => x.PlaceId == placeId, ct);
            if (!placeExists) throw new KeyNotFoundException("ไม่พบ PlaceId");

            var dishes = await _db.PlaceLocalDishes
                 .AsNoTracking()
                 .Where(x => x.PlaceId == placeId)
                 .ProjectTo<DishForPlaceDto>(_mapper.ConfigurationProvider)
                 .ToListAsync(ct);
            return dishes;
        }

        public async Task DeletePlaceDishAsync(int placeId, int dishId, CancellationToken ct = default)
        {
            var link = await _db.PlaceLocalDishes
                .FirstOrDefaultAsync(x => x.PlaceId == placeId && x.DishId == dishId, ct);

            if (link == null) throw new KeyNotFoundException("ไม่พบเมนูของร้านนี้");

            _db.PlaceLocalDishes.Remove(link);
            await _db.SaveChangesAsync(ct);
        }


        public async Task<PlaceBehaviorDashboardDto> GetPlaceBehaviorDashboardAsync(int placeId, DateTime? from = null,DateTime? to = null,CancellationToken ct = default)
        {
            var q = _db.BehaviorLogs
                .AsNoTracking()
                .Where(x => x.PlaceId == placeId);

            if (from.HasValue)
                q = q.Where(x => x.CreatedAt >= from.Value);

            if (to.HasValue)
                q = q.Where(x => x.CreatedAt <= to.Value);

            var data = await q
                .GroupBy(x => x.PlaceId)
                .Select(g => new PlaceBehaviorDashboardDto
                {
                    PlaceId = g.Key!.Value,

                    Views = g.Count(x => x.ActionType == BehaviorActionType.View),
                    Favorites = g.Count(x => x.ActionType == BehaviorActionType.Favorite),
                    AddToTrips = g.Count(x => x.ActionType == BehaviorActionType.AddToTrip),
                    Reviews = g.Count(x => x.ActionType == BehaviorActionType.Review),

                    UniqueUsers = g
                        .Select(x => x.UserId ?? 0)
                        .Distinct()
                        .Count(),

                    Actions = g
                        .GroupBy(x => x.ActionType)
                        .Select(a => new PlaceActionCountDto
                        {
                            ActionType = a.Key,
                            Count = a.Count()
                        })
                        .ToList()
                })
                .FirstOrDefaultAsync(ct);

            return data ?? new PlaceBehaviorDashboardDto { PlaceId = placeId };
        }




    }
}   
