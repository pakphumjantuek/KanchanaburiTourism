using TravelKanjanuburi.Dtos.Trips;
using TravelKanjanuburi.Services.Trips;
using static TravelKanjanuburi.Model.Paged;

namespace TravelKanjanuburi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public class TripController : BaseApiController
    {
        private readonly TripService _tripService;
        private readonly ILogger<TripController> _logger;
        private readonly AutoTripService _autoTripService;

        public TripController(TripService tripService, ILogger<TripController> logger,AutoTripService autoTripService)
        {
            _tripService = tripService;
            _logger = logger;
            _autoTripService = autoTripService;
        }

        // =========================
        // Trips
        // =========================

        // GET: api/trip?Page=1&PageSize=20&Search=xxx
        [HttpGet]
        public async Task<IActionResult> GetMyTrips([FromQuery] PagedQuery q, CancellationToken ct)
        {
            var response = new ApiResponse();
            try
            {
                int userId = GetUserIdOrThrow();

                var result = await _tripService.GetMyTripsAsync(userId, q, ct);

                response.StatusCode = HttpStatusCode.OK;
                response.Result = result;
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.Unauthorized;
                response.ErrorMessages.Add("กรุณาเข้าสู่ระบบ");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting trips.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.ErrorMessages.Add("เกิดข้อผิดพลาดภายในระบบ");
            }

            return HandleResponse(response);
        }

        // GET: api/trip/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id, CancellationToken ct)
        {
            var response = new ApiResponse();
            try
            {
                int userId = GetUserIdOrThrow();

                var result = await _tripService.GetByIdAsync(userId, id, ct);

                response.StatusCode = HttpStatusCode.OK;
                response.Result = result;
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Trip not found.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.NotFound;
                response.ErrorMessages.Add(ex.Message);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.Unauthorized;
                response.ErrorMessages.Add("กรุณาเข้าสู่ระบบ");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting trip.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.ErrorMessages.Add("เกิดข้อผิดพลาดภายในระบบ");
            }

            return HandleResponse(response);
        }

        // GET: api/trip/5/detail
        [HttpGet("{id}/detail")]
        public async Task<IActionResult> GetDetail(int id, CancellationToken ct)
        {
            var response = new ApiResponse();
            try
            {
                int userId = GetUserIdOrThrow();

                var result = await _tripService.GetDetailAsync(userId, id, ct);

                response.StatusCode = HttpStatusCode.OK;
                response.Result = result;
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Trip not found.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.NotFound;
                response.ErrorMessages.Add(ex.Message);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.Unauthorized;
                response.ErrorMessages.Add("กรุณาเข้าสู่ระบบ");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting trip detail.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.ErrorMessages.Add("เกิดข้อผิดพลาดภายในระบบ");
            }

            return HandleResponse(response);
        }

        // GET: api/trip/30/map?dayIndex=1&transportMode=driving
        [HttpGet("{tripId:int}/map")]
        public async Task<IActionResult> GetMapView(
            int tripId,
            [FromQuery] int dayIndex = 1,
            [FromQuery] string? transportMode = "driving",
            CancellationToken ct = default)
        {
            var response = new ApiResponse();
            try
            {
                int userId = GetUserIdOrThrow();

                var result = await _tripService.GetMapViewAsync(
                    userId: userId,
                    tripId: tripId,
                    dayIndex: dayIndex,
                    transportMode: transportMode,
                    ct: ct);

                response.StatusCode = HttpStatusCode.OK;
                response.Result = result;
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.Unauthorized;
                response.ErrorMessages.Add("กรุณาเข้าสู่ระบบ");
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Trip not found.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.NotFound;
                response.ErrorMessages.Add(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting trip map view.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.ErrorMessages.Add("เกิดข้อผิดพลาดภายในระบบ");
            }



            return HandleResponse(response);
        }


        // POST: api/trip
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateTripRequest req, CancellationToken ct)
        {
            var response = new ApiResponse();
            try
            {
                int userId = GetUserIdOrThrow();

                var created = await _tripService.CreateAsync(userId, req, ct);

                response.StatusCode = HttpStatusCode.Created;
                response.Result = created;
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Bad request.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.BadRequest;
                response.ErrorMessages.Add(ex.Message);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.Unauthorized;
                response.ErrorMessages.Add("กรุณาเข้าสู่ระบบ");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating trip.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.ErrorMessages.Add("เกิดข้อผิดพลาดภายในระบบ");
            }

            return HandleResponse(response);
        }

        // PUT: api/trip/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CreateTripRequest req, CancellationToken ct)
        {
            var response = new ApiResponse();
            try
            {
                int userId = GetUserIdOrThrow();

                var updated = await _tripService.UpdateAsync(userId, id, req, ct);

                response.StatusCode = HttpStatusCode.OK;
                response.Result = updated;
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Trip not found.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.NotFound;
                response.ErrorMessages.Add(ex.Message);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Bad request.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.BadRequest;
                response.ErrorMessages.Add(ex.Message);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.Unauthorized;
                response.ErrorMessages.Add("กรุณาเข้าสู่ระบบ");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating trip.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.ErrorMessages.Add("เกิดข้อผิดพลาดภายในระบบ");
            }

            return HandleResponse(response);
        }

        // DELETE: api/trip/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id, CancellationToken ct)
        {
            try
            {
                int userId = GetUserIdOrThrow();
                await _tripService.DeleteAsync(userId, id, ct);

                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Trip not found.");
                return NotFound(new ApiResponse
                {
                    IsSuccess = false,
                    StatusCode = HttpStatusCode.NotFound,
                    ErrorMessages = { ex.Message }
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized.");
                return Unauthorized(new ApiResponse
                {
                    IsSuccess = false,
                    StatusCode = HttpStatusCode.Unauthorized,
                    ErrorMessages = { "กรุณาเข้าสู่ระบบ" }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting trip.");
                return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse
                {
                    IsSuccess = false,
                    StatusCode = HttpStatusCode.InternalServerError,
                    ErrorMessages = { "เกิดข้อผิดพลาดภายในระบบ" }
                });
            }
        }


        // =========================
        // TripItems
        // =========================

        // POST: api/trip/5/items
        [HttpPost("{tripId}/items")]
        public async Task<IActionResult> AddItem(int tripId, [FromBody] AddTripItemRequest req, CancellationToken ct)
        {
            var response = new ApiResponse();
            try
            {
                int userId = GetUserIdOrThrow();

                var result = await _tripService.AddItemAsync(userId, tripId, req, ct);

                response.StatusCode = HttpStatusCode.Created;
                response.Result = result;
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Trip not found.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.NotFound;
                response.ErrorMessages.Add(ex.Message);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Bad request.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.BadRequest;
                response.ErrorMessages.Add(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Trip item conflict.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.Conflict;
                response.ErrorMessages.Add(ex.Message);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.Unauthorized;
                response.ErrorMessages.Add("กรุณาเข้าสู่ระบบ");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding trip item.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.ErrorMessages.Add("เกิดข้อผิดพลาดภายในระบบ");
            }

            return HandleResponse(response);
        }

        // PUT: api/trip/5/items/10
        [HttpPut("{tripId}/items/{tripItemId}")]
        public async Task<IActionResult> UpdateItem(int tripId, int tripItemId, [FromBody] UpdateTripItemRequest req, CancellationToken ct)
        {
            var response = new ApiResponse();
            try
            {
                int userId = GetUserIdOrThrow();

                var result = await _tripService.UpdateItemAsync(userId, tripId, tripItemId, req, ct);

                response.StatusCode = HttpStatusCode.OK;
                response.Result = result;
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Trip item not found.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.NotFound;
                response.ErrorMessages.Add(ex.Message);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Bad request.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.BadRequest;
                response.ErrorMessages.Add(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Trip item conflict.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.Conflict;
                response.ErrorMessages.Add(ex.Message);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.Unauthorized;
                response.ErrorMessages.Add("กรุณาเข้าสู่ระบบ");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating trip item.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.ErrorMessages.Add("เกิดข้อผิดพลาดภายในระบบ");
            }

            return HandleResponse(response);
        }

        // DELETE: api/trip/5/items/10
        [HttpDelete("{tripId}/items/{tripItemId}")]
        public async Task<IActionResult> DeleteItem(int tripId, int tripItemId, CancellationToken ct)
        {
            var response = new ApiResponse();
            try
            {
                int userId = GetUserIdOrThrow();

                await _tripService.DeleteItemAsync(userId, tripId, tripItemId, ct);

                response.StatusCode = HttpStatusCode.OK;
                response.Result = null;
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Trip item not found.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.NotFound;
                response.ErrorMessages.Add(ex.Message);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.Unauthorized;
                response.ErrorMessages.Add("กรุณาเข้าสู่ระบบ");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting trip item.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.ErrorMessages.Add("เกิดข้อผิดพลาดภายในระบบ");
            }

            return HandleResponse(response);
        }

        [HttpPut("{tripId:int}/reorder")]
        public async Task<IActionResult> Reorder(int tripId, [FromBody] ReorderTripItemsRequest req, CancellationToken ct)
        {
            var response = new ApiResponse();

            try
            {
                int userId = GetUserIdOrThrow();

                await _tripService.ReorderTripItemsAsync(userId, tripId, req, ct);

                response.StatusCode = HttpStatusCode.OK;
                response.Result = null;
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Trip not found.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.NotFound;
                response.ErrorMessages.Add(ex.Message);
            }
            catch (Exception ex) when (ex is ArgumentException or InvalidOperationException)
            {
                // ข้อมูลที่ส่งมาไม่ถูกต้อง (เลขซ้ำ/ไม่ครบทุกจุดของวัน) เป็นความผิดของคำขอ ไม่ใช่ของระบบ
                _logger.LogWarning(ex, "Bad reorder request.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.BadRequest;
                response.ErrorMessages.Add(ex.Message);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.Unauthorized;
                response.ErrorMessages.Add("กรุณาเข้าสู่ระบบ");
            }
            catch (Exception ex)
            {
                // ไม่ส่ง ex.Message ของข้อผิดพลาดภายในกลับไปให้ผู้ใช้
                _logger.LogError(ex, "Error reorder trip items.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.ErrorMessages.Add("เกิดข้อผิดพลาดภายในระบบ");
            }

            return HandleResponse(response);
        }

        [HttpGet("{tripId:int}/segments")]
        public async Task<IActionResult> GetSegments(int tripId, [FromQuery] int dayIndex, CancellationToken ct)
        {
            var response = new ApiResponse();
            try
            {
                var userIdClaim =
                    User.FindFirst(ClaimTypes.NameIdentifier) ??
                    User.FindFirst(JwtRegisteredClaimNames.Sub);

                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                    return Unauthorized(HandleResponse(new ApiResponse { IsSuccess = false, StatusCode = HttpStatusCode.Unauthorized }));

                var segs = await _tripService.GetSegmentsByDayAsync(userId, tripId, dayIndex, ct);

                response.StatusCode = HttpStatusCode.OK;
                response.Result = segs;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting segments.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.ErrorMessages.Add(ex.Message);
            }

            return HandleResponse(response);
        }



        [HttpPost("{tripId}/save-route")]
        public async Task<IActionResult> SaveRoute(int tripId, [FromBody] SaveRouteRequest req, CancellationToken ct)
        {
            var response = new ApiResponse();
            try
            {
                int userId = GetUserIdOrThrow();

                await _tripService.SaveRouteAsync(userId, tripId, req, ct);

                response.StatusCode = HttpStatusCode.OK;
                response.Result = null;
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Trip not found.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.NotFound;
                response.ErrorMessages.Add(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Cannot save route.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.BadRequest;
                response.ErrorMessages.Add(ex.Message);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.Unauthorized;
                response.ErrorMessages.Add("กรุณาเข้าสู่ระบบ");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving route.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.ErrorMessages.Add("เกิดข้อผิดพลาดภายในระบบ");
            }

            return HandleResponse(response);
        }

        [HttpPost("generate")]
        public async Task<IActionResult> GenerateAutoTrip([FromBody] AutoTripRequest req, CancellationToken ct)
        {
            var response = new ApiResponse();

            try
            {
                int userId = GetUserIdOrThrow();

                // ค่านอกช่วงที่รองรับ: แจ้งผู้ใช้ตรงๆ แทนการแก้เป็นค่าอื่นเงียบๆ (เช่นขอ 10 วันแล้วได้ 1 วัน)
                var invalid = AutoTripService.ValidateRequest(req.Days, req.HoursPerDay);
                if (invalid != null)
                {
                    response.IsSuccess = false;
                    response.StatusCode = HttpStatusCode.BadRequest;
                    response.ErrorMessages.Add(invalid);
                    return HandleResponse(response);
                }

                // ✅ สร้าง preference จาก request
                var pref = new AutoTripService.AutoTripPreference
                {
                    PreferredCategoryIds = req.PreferredCategoryIds ?? new List<int>(),
                    RelaxedPace = Math.Clamp(req.RelaxedPace, 0, 1),
                    BudgetLevel = Math.Clamp(req.BudgetLevel, 0, 1),
                    WithElderOrKids = req.WithElderOrKids
                };

                var trip = await _autoTripService.GenerateAsync(
                    userId: userId,
                    startUtc: req.StartDateTime,
                    days: req.Days,
                    hoursPerDay: req.HoursPerDay,
                    startLat: req.StartLat,
                    startLng: req.StartLng,
                    transportMode: req.TransportMode ?? "driving",
                    pref: pref,              // ✅ เพิ่ม parameter นี้
                    ct: ct
                );

                response.StatusCode = HttpStatusCode.OK;
                response.Result = new AutoTripResponseDto
                {
                    TripId = trip.TripId,
                    Title = trip.Title,
                    StartDateTime = trip.StartDateTime,
                    EndDateTime = trip.EndDateTime
                };
                _logger.LogInformation(
                      "Preferred IDs: {ids}",
                      string.Join(",", pref.PreferredCategoryIds));
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.Unauthorized;
                response.ErrorMessages.Add("กรุณาเข้าสู่ระบบ");
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "AutoTrip validation failed.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.BadRequest;
                response.ErrorMessages.Add(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating auto trip.");
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.ErrorMessages.Add("เกิดข้อผิดพลาดภายในระบบ");
            }

            return HandleResponse(response);
        }


        // =========================
        // Helper: userId (ปรับให้เข้ากับ auth ของคุณ)
        // =========================
        private int GetUserIdOrThrow()
        {
            var s =
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
                User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ??
                User.FindFirst("userId")?.Value ??
                User.FindFirst("UserId")?.Value;

            if (int.TryParse(s, out var id) && id > 0) return id;
            throw new UnauthorizedAccessException("No user id claim");
        }
    }
}
