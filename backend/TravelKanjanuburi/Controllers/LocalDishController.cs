using Microsoft.AspNetCore.Authorization;
using TravelKanjanuburi.Dtos.Food;
using TravelKanjanuburi.Services.foods;
using static TravelKanjanuburi.Model.Paged;

namespace TravelKanjanuburi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LocalDishController : BaseApiController
    {
        private readonly LocalDishService _localDishService;

        public LocalDishController(LocalDishService localDishService)
        {
            _localDishService = localDishService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] PagedQuery q, CancellationToken ct)
        {
            var result = await _localDishService.GetAllAsync(q, ct);
            return Ok(ApiResponse.Success(result));
        }

        [HttpGet("mine")]
        [Authorize(Roles = "Admin,Operator")]
        public async Task<IActionResult> GetMine([FromQuery] PagedQuery q, CancellationToken ct)
        {
            var result = await _localDishService.GetAllAsync(q, ct, CurrentUserId);
            return Ok(ApiResponse.Success(result));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id, CancellationToken ct)
        {
            var result = await _localDishService.GetLocalDishByIdAsync(id, ct);
            return Ok(ApiResponse.Success(result));
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Operator")]
        public async Task<IActionResult> Create(
            [FromBody] CreateLocalDishRequest req,
            CancellationToken ct)
        {
            var result = await _localDishService.CreateLocalDishAsync(req, ct, IsAdmin ? null : CurrentUserId);
            return StatusCode(
                StatusCodes.Status201Created,
                ApiResponse.Success(result, HttpStatusCode.Created)
            );
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Operator")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] CreateLocalDishRequest req,
            CancellationToken ct)
        {
            await _localDishService.EnsureCanManageAsync(id, CurrentUserId, IsAdmin, ct);
            await _localDishService.UpdateLocalDishAsync(id, req, ct);
            return Ok(ApiResponse.Success());
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Operator")]
        public async Task<IActionResult> Delete(int id, CancellationToken ct)
        {
            await _localDishService.EnsureCanManageAsync(id, CurrentUserId, IsAdmin, ct);
            await _localDishService.DeleteLocalDishAsync(id, ct);
            return StatusCode(
                StatusCodes.Status204NoContent,
                ApiResponse.Success(null, HttpStatusCode.NoContent)
            );
        }

        [HttpPost("{id}/images")]
        [Authorize(Roles = "Admin,Operator")]
        public async Task<IActionResult> UploadImages(
            int id,
            [FromForm] List<IFormFile> files,
            [FromForm] int coverIndex = 0,
            [FromForm] bool replaceOld = false,
            CancellationToken ct = default)
        {
            await _localDishService.EnsureCanManageAsync(id, CurrentUserId, IsAdmin, ct);
            await _localDishService.UploadImagesAsync(id,files,coverIndex,replaceOld,ct
            );

            return StatusCode(
                StatusCodes.Status201Created,
                ApiResponse.Success(null, HttpStatusCode.Created)
            );
        }

        [HttpDelete("{dishId}/images/{imageId}")]
        [Authorize(Roles = "Admin,Operator")]
        public async Task<IActionResult> DeleteImage(
            int dishId,
            int imageId,
            CancellationToken ct = default)
        {
            await _localDishService.EnsureCanManageAsync(dishId, CurrentUserId, IsAdmin, ct);
            await _localDishService.DeleteImageAsync(dishId, imageId, ct);
            return Ok(ApiResponse.Success());
        }

        [HttpGet("{id}/places")]
        public async Task<IActionResult> GetPlacesByDishId(
            int id,
            CancellationToken ct)
        {
            var result = await _localDishService.GetPlacesByDishIdAsync(id, ct);
            return Ok(ApiResponse.Success(result));
        }
    }
}
