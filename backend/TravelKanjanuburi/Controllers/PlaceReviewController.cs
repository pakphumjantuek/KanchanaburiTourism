using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using TravelKanjanuburi.Services.Places;
using TravelKanjanuburi.Model.MPlaces.Reviews;

namespace TravelKanjanuburi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PlaceReviewController : BaseApiController
    {
        private readonly PlaceReviewService _placeReview;

        public PlaceReviewController(PlaceReviewService placeReview)
        {
            _placeReview = placeReview;
        }

        // GET: api/placereview/place/{placeId}?skip=0&take=20
        [HttpGet("place/{placeId:int}")]
        public async Task<IActionResult> GetReviewsByPlace(
            int placeId,
            [FromQuery] int skip = 0,
            [FromQuery] int take = 20,
            CancellationToken ct = default)
        {
            var result = await _placeReview.GetByPlaceIdAsync(placeId, skip, take, ct);
            return Ok(ApiResponse.Success(result));
        }

        // GET: api/placereview/my?placeId=123
        [HttpGet("my")]
        [Authorize]
        public async Task<IActionResult> GetMyReview(
            [FromQuery] int placeId,
            CancellationToken ct = default)
        {
            var userId = GetUserIdOrThrow();
            var result = await _placeReview.GetMyReviewAsync(placeId, userId, ct);

            // result อาจเป็น null ได้ (ยังไม่เคยรีวิว)
            return Ok(ApiResponse.Success(result));
        }

        // POST: api/placereview/place/{placeId}
        // body: { "rating": 5, "comment": "ดีมาก" }
        [HttpPost("place/{placeId:int}")]
        [Authorize]
        public async Task<IActionResult> UpsertMyReview(
            int placeId,
            [FromBody] UpsertPlaceReviewDto dto,
            CancellationToken ct = default)
        {
            var userId = GetUserIdOrThrow();

            var result = await _placeReview.AddOrUpdateAsync(
                placeId,
                userId,
                dto.Rating,
                dto.Comment,
                ct
            );

            return Ok(ApiResponse.Success(result));
        }

        // DELETE: api/placereview/place/{placeId}
        [HttpDelete("place/{placeId:int}")]
        [Authorize]
        public async Task<IActionResult> DeleteMyReview(
            int placeId,
            CancellationToken ct = default)
        {
            var userId = GetUserIdOrThrow();
            await _placeReview.DeleteAsync(placeId, userId, ct);

            return Ok(ApiResponse.Success("Deleted"));
        }

        private int GetUserIdOrThrow()
        {
            var s =
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
                User.FindFirst("userId")?.Value ??
                User.FindFirst("UserId")?.Value ??
                User.FindFirst("id")?.Value;

            if (int.TryParse(s, out var id) && id > 0)
                return id;

            throw new UnauthorizedAccessException("No user id claim");
        }
    }
}
