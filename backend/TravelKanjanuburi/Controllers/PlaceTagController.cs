using Microsoft.AspNetCore.Authorization;
using TravelKanjanuburi.Dtos.Places;
using TravelKanjanuburi.Services.Places;
using static TravelKanjanuburi.Model.Paged;

namespace TravelKanjanuburi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PlaceTagController : BaseApiController
    {
        private readonly PlaceTagService _tagService;

        public PlaceTagController(PlaceTagService tagService)
        {
            _tagService = tagService;
        }

        // GET: api/placetag
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] PagedQuery q,
            CancellationToken ct)
        {
            var result = await _tagService.GetAllAsync(q, ct);
            return Ok(ApiResponse.Success(result));
        }

        // GET: api/placetag/{id}
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(
            int id,
            CancellationToken ct)
        {
            var result = await _tagService.GetTagsIdAsync(id, ct);
            return Ok(ApiResponse.Success(result));
        }

        // POST: api/placetag
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create(
            [FromBody] TagDto req,
            CancellationToken ct)
        {
            await _tagService.CreateTagsAsync(req, ct);

            return StatusCode(
                StatusCodes.Status201Created,
                ApiResponse.Success(null, HttpStatusCode.Created)
            );
        }

        // PUT: api/placetag/{id}
        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] TagDto req,
            CancellationToken ct)
        {
            await _tagService.UpdateTagsAsync(id, req, ct);
            return Ok(ApiResponse.Success());
        }

        // DELETE: api/placetag/{id}
        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(
            int id,
            CancellationToken ct)
        {
            await _tagService.DeleteTagsAsync(id, ct);

            return StatusCode(
                StatusCodes.Status204NoContent,
                ApiResponse.Success(null, HttpStatusCode.NoContent)
            );
        }
    }
}
