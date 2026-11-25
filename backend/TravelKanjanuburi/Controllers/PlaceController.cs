using Microsoft.AspNetCore.Authorization;
using TravelKanjanuburi.Dtos.Food;
using TravelKanjanuburi.Dtos.Places;
using TravelKanjanuburi.Services.Places;
using static TravelKanjanuburi.Model.Paged;

namespace TravelKanjanuburi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PlaceController : BaseApiController
    {
        private readonly PlaceService _placeService;
        private readonly TravelKanjanuburi.Services.foods.LocalDishService _dishService;

        public PlaceController(PlaceService placeService, TravelKanjanuburi.Services.foods.LocalDishService dishService)
        {
            _placeService = placeService;
            _dishService = dishService;
        }


        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] PagedQuery q,
            CancellationToken ct)
        {
            // แอดมินเห็นอีเวนต์ที่จบแล้ว/ยังไม่เริ่มด้วย ผู้ใช้ทั่วไปเห็นเฉพาะที่กำลังแสดง
            var result = await _placeService.GetAllAsync(q, ct, includeHiddenEvents: IsAdmin);
            return Ok(ApiResponse.Success(result));
        }
     

        [HttpGet("mine")]
        [Authorize(Roles = "Admin,Operator")]
        public async Task<IActionResult> GetMine([FromQuery] PagedQuery q, CancellationToken ct)
        {
            var result = await _placeService.GetAllAsync(q, ct, CurrentUserId, includeHiddenEvents: true);
            return Ok(ApiResponse.Success(result));
        }

        public class SetOwnerRequest { public int? OwnerId { get; set; } }

        [HttpPut("{id:int}/owner")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SetOwner(int id, [FromBody] SetOwnerRequest req, CancellationToken ct)
        {
            try
            {
                await _placeService.SetOwnerAsync(id, req.OwnerId, ct);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse.Fail(ex.Message, HttpStatusCode.BadRequest));
            }
            return Ok(ApiResponse.Success());
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(
            int id,
            CancellationToken ct)
        {
            var result = await _placeService.GetPlaceByIdAsync(id, ct);

            // อีเวนต์ที่ยังไม่ถึงเวลาเริ่ม: ผู้ใช้ทั่วไปยังไม่ควรเห็น (แอดมิน/เจ้าของเห็น)
            // อีเวนต์ที่จบแล้ว: ยังเปิดลิงก์ตรงได้ หน้าเว็บแสดงข้อความ "อีเวนต์นี้จบแล้ว"
            var isManager = IsAdmin || (result.OwnerId != null && result.OwnerId == CurrentUserId);
            if (result.EventStatus == "upcoming" && !isManager)
                throw new KeyNotFoundException($"Places with ID {id} not found.");

            return Ok(ApiResponse.Success(result));
        }


        [HttpPost]
        [Authorize(Roles = "Admin,Operator")]
        public async Task<IActionResult> Create(
            [FromBody] CreatePlaceRequest req,
            CancellationToken ct)
        {
            if (!IsAdmin)
            {
                try { await _placeService.EnsureFoodCategoryAsync(req.CategoryId, ct); }
                catch (InvalidOperationException ex) { return BadRequest(ApiResponse.Fail(ex.Message, HttpStatusCode.BadRequest)); }
            }
            var result = await _placeService.CreatePlaceAsync(req, ct, IsAdmin ? null : CurrentUserId);
            return StatusCode(
                StatusCodes.Status201Created,
                ApiResponse.Success(result, HttpStatusCode.Created)
            );
        }

        
        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin,Operator")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] UpdatePlaceRequest req,
            CancellationToken ct)
        {
            await _placeService.EnsureCanManageAsync(id, CurrentUserId, IsAdmin, ct);
            if (!IsAdmin)
            {
                try { await _placeService.EnsureFoodCategoryAsync(req.CategoryId, ct); }
                catch (InvalidOperationException ex) { return BadRequest(ApiResponse.Fail(ex.Message, HttpStatusCode.BadRequest)); }
            }
            await _placeService.UpdatePlaceAsync(id, req, ct);
            return Ok(ApiResponse.Success());
        }

      
        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin,Operator")]
        public async Task<IActionResult> Delete(
            int id,
            CancellationToken ct)
        {
            await _placeService.EnsureCanManageAsync(id, CurrentUserId, IsAdmin, ct);
            await _placeService.DeletePlaceAsync(id, ct);
            return StatusCode(
                StatusCodes.Status204NoContent,
                ApiResponse.Success(null, HttpStatusCode.NoContent)
            );
        }

        
        [HttpPost("{id:int}/images")]
        [Authorize(Roles = "Admin,Operator")]
        public async Task<IActionResult> UploadImages(
            int id,
            [FromForm] List<IFormFile> files,
            [FromForm] int coverIndex = 0,
            [FromForm] bool replaceOld = false,
            CancellationToken ct = default)
        {
            await _placeService.EnsureCanManageAsync(id, CurrentUserId, IsAdmin, ct);
            await _placeService.UploadImagesAsync(
                id,
                files,
                coverIndex,
                replaceOld,
                ct
            );

            return StatusCode(
                StatusCodes.Status201Created,
                ApiResponse.Success(null, HttpStatusCode.Created)
            );
        }

       
        [HttpDelete("{placeId:int}/images/{imageId:int}")]
        [Authorize(Roles = "Admin,Operator")]
        public async Task<IActionResult> DeleteImage(
            int placeId,
            int imageId,
            CancellationToken ct = default)
        {
            await _placeService.EnsureCanManageAsync(placeId, CurrentUserId, IsAdmin, ct);
            await _placeService.DeleteImageAsync(placeId, imageId, ct);
            return Ok(ApiResponse.Success());
        }

        [HttpGet("{placeId:int}/dishes")]
        public async Task<IActionResult> GetDishesByPlaceId(
            int placeId,
            CancellationToken ct)
        {
            var result = await _placeService.GetDishesByPlaceIdAsync(placeId, ct);
            return Ok(ApiResponse.Success(result));
        }

       
        [HttpPost("{placeId:int}/dishes")]
        [Authorize(Roles = "Admin,Operator")]
        public async Task<IActionResult> UpsertDishToPlace(
            int placeId,
            [FromBody] UpsertPlaceDishRequest req,
            CancellationToken ct)
        {
            await _placeService.EnsureCanManageAsync(placeId, CurrentUserId, IsAdmin, ct);
            // ผู้ประกอบการเลือกได้เฉพาะเมนูที่ตัวเองสร้าง (แอดมินเลือกได้ทั้งหมด)
            await _dishService.EnsureCanManageAsync(req.DishId, CurrentUserId, IsAdmin, ct);
            await _placeService.UpsertPlaceDishAsync(placeId, req, ct);
            return Ok(ApiResponse.Success());
        }

      
        [HttpDelete("{placeId:int}/dishes/{dishId:int}")]
        [Authorize(Roles = "Admin,Operator")]
        public async Task<IActionResult> DeleteDishFromPlace(
            int placeId,
            int dishId,
            CancellationToken ct)
        {
            await _placeService.EnsureCanManageAsync(placeId, CurrentUserId, IsAdmin, ct);
            await _placeService.DeletePlaceDishAsync(placeId, dishId, ct);
            return Ok(ApiResponse.Success());
        }

        [HttpGet("{id:int}/dashboard")]
        public async Task<IActionResult> GetPlaceDashboard(int id,[FromQuery] DateTime? from,[FromQuery] DateTime? to,CancellationToken ct)
        {
            var result = await _placeService
                .GetPlaceBehaviorDashboardAsync(id, from, to, ct);

            return Ok(ApiResponse.Success(result));
        }
    }
}
