using Microsoft.AspNetCore.Authorization;
using TravelKanjanuburi.Dtos.Places;
using TravelKanjanuburi.Services.Places;
using static TravelKanjanuburi.Model.Paged;

namespace TravelKanjanuburi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PlaceCategoriesController : BaseApiController
    {
        private readonly PlaceCategoriesService _placeService;

        public PlaceCategoriesController(PlaceCategoriesService placeService)
        {
            _placeService = placeService;
        }

        // GET: api/placecategories
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] PagedQuery q,
            CancellationToken ct)
        {
            var result = await _placeService.GetAllAsync(q, ct);
            return Ok(ApiResponse.Success(result));
        }

        // GET: api/placecategories/{id}
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(
            int id,
            CancellationToken ct)
        {
            var result = await _placeService.GetPlaceCatagoryIdAsync(id, ct);
            return Ok(ApiResponse.Success(result));
        }

        // POST: api/placecategories
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create(
            [FromBody] PlaceCategoriesDto req,
            CancellationToken ct)
        {
            await _placeService.CreatePlaceCatagoryAsync(req, ct);

            return StatusCode(
                StatusCodes.Status201Created,
                ApiResponse.Success(null, HttpStatusCode.Created)
            );
        }

        // PUT: api/placecategories/{id}
        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] PlaceCategoriesDto req,
            CancellationToken ct)
        {
            await _placeService.UpdatePlaceCatagoryAsync(id, req, ct);
            return Ok(ApiResponse.Success());
        }

        // DELETE: api/placecategories/{id}
        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(
            int id,
            CancellationToken ct)
        {
            await _placeService.DeletePlaceAsync(id, ct);

            return StatusCode(
                StatusCodes.Status204NoContent,
                ApiResponse.Success(null, HttpStatusCode.NoContent)
            );
        }
    }
}
