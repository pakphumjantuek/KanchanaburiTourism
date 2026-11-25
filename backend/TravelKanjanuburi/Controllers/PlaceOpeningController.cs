using Microsoft.AspNetCore.Authorization;
using TravelKanjanuburi.Services.Places;
using TravelKanjanuburi.Dtos.Places;

namespace TravelKanjanuburi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PlaceOpeningController : BaseApiController
    {
        private readonly PlaceOpeningHourService _hourService;
        private readonly PlaceService _placeService;

        public PlaceOpeningController(PlaceOpeningHourService hourService, PlaceService placeService)
        {
            _hourService = hourService;
            _placeService = placeService;
        }

        // GET: api/placeopening/{placeId}
        [HttpGet("{placeId:int}")]
        public async Task<IActionResult> GetByPlaceId(
            int placeId,
            CancellationToken ct)
        {
            var result = await _hourService.GetByPlaceIdAsync(placeId, ct);
            return Ok(ApiResponse.Success(result));
        }

        // POST: api/placeopening/{placeId}
        // สร้าง default opening hours 7 วัน
        [HttpPost("{placeId:int}")]
        [Authorize(Roles = "Admin,Operator")]
        public async Task<IActionResult> CreateDefault(
            int placeId,
            [FromBody] CreateDefaultOpeningHoursDto dto,
            CancellationToken ct)
        {
            await _placeService.EnsureCanManageAsync(placeId, CurrentUserId, IsAdmin, ct);
            await _hourService.CreateDefaultWeeklyAsync(
                placeId,
                dto.OpenTime,
                dto.CloseTime,
                ct
            );

            return StatusCode(
                StatusCodes.Status201Created,
                ApiResponse.Success(
                    "Created default opening hours.",
                    HttpStatusCode.Created
                )
            );
        }

        // PUT: api/placeopening/{placeId}/day
        // upsert รายวัน
        [HttpPut("{placeId:int}/day")]
        [Authorize(Roles = "Admin,Operator")]
        public async Task<IActionResult> UpsertDay(
            int placeId,
            [FromBody] UpsertOpeningHourDto dto,
            CancellationToken ct)
        {
            await _placeService.EnsureCanManageAsync(placeId, CurrentUserId, IsAdmin, ct);
            await _hourService.UpsertDayAsync(placeId, dto, ct);
            return Ok(ApiResponse.Success("Updated opening hour for the day."));
        }

        // PUT: api/placeopening/{placeId}
        // upsert ทั้งสัปดาห์
        [HttpPut("{placeId:int}")]
        [Authorize(Roles = "Admin,Operator")]
        public async Task<IActionResult> UpsertWeekly(
            int placeId,
            [FromBody] UpsertWeeklyOpeningHoursDto dto,
            CancellationToken ct)
        {
            await _placeService.EnsureCanManageAsync(placeId, CurrentUserId, IsAdmin, ct);
            await _hourService.UpsertWeeklyAsync(placeId, dto, ct);
            return Ok(ApiResponse.Success("Updated weekly opening hours."));
        }

        // DELETE: api/placeopening/{placeId}
        // ลบ opening hours ทั้งหมด (reset)
        [HttpDelete("{placeId:int}")]
        [Authorize(Roles = "Admin,Operator")]
        public async Task<IActionResult> Delete(
            int placeId,
            CancellationToken ct)
        {
            await _placeService.EnsureCanManageAsync(placeId, CurrentUserId, IsAdmin, ct);
            await _hourService.DeleteByPlaceIdAsync(placeId, ct);
            return Ok(ApiResponse.Success("Deleted opening hours."));
        }
    }
}
