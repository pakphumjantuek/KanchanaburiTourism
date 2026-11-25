using TravelKanjanuburi.Dtos.Users;

namespace KanjanaburiTravel.Controllers;

//[Authorize]
[ApiController]
[Route("api/users/interests")]
public class UserInterestsController : BaseApiController
{
    private readonly IUserInterestService _service;
    private readonly ILogger<UserInterestsController> _logger;

    public UserInterestsController(IUserInterestService service, ILogger<UserInterestsController> logger)
    {
        _service = service;
        _logger = logger;
    }

    private int GetUserId()
    {
        var id =
               User.FindFirstValue("userId") ??
        User.FindFirstValue("UserId") ??
        User.FindFirstValue(ClaimTypes.NameIdentifier) ??
        User.FindFirstValue(JwtRegisteredClaimNames.Sub);


        if (string.IsNullOrWhiteSpace(id))
            throw new UnauthorizedAccessException("ไม่พบ user id ใน token");

        if (!int.TryParse(id, out var userId))
            throw new UnauthorizedAccessException("user id ใน token ไม่ใช่ตัวเลข");

        return userId;
    }

    // ✅ ของฉัน (ชื่อหมวดมาจาก PlaceCategories)
    // GET api/users/interests/me
    [HttpGet("me")]
    public async Task<IActionResult> GetMyInterests(CancellationToken ct)
    {
        var userId = GetUserId();
        var data = await _service.GetMyInterestsAsync(userId, ct);
        return Ok(new ApiResponse { IsSuccess = true, Result = data, StatusCode = HttpStatusCode.OK });
    }

    // ✅ เจาะรายคน
    // GET api/users/interests/123?days=90&top=20
    [HttpGet("{userId:int}")]
    public async Task<IActionResult> GetUserInterestDetails(int userId, [FromQuery] int days = 90, [FromQuery] int top = 20, CancellationToken ct = default)
    {
        var dto = await _service.GetAsync(userId, days, top, ct);
        return Ok(new { isSuccess = true, result = dto });
    }

    // PUT api/users/interests  (แทนที่ทั้งชุด)
    [HttpPut]
    public async Task<IActionResult> ReplaceMyInterests([FromBody] UpdateUserInterestsRequest request)
    {
        var response = new ApiResponse();
        try
        {
            var userId = GetUserId();
            var data = await _service.ReplaceMyInterestsAsync(userId, request);
            response.StatusCode = HttpStatusCode.OK;
            response.Result = data;
        }
        catch (ArgumentException ex)
        {
            response.IsSuccess = false;
            response.StatusCode = HttpStatusCode.BadRequest;
            response.ErrorMessages.Add(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error replacing interests");
            response.IsSuccess = false;
            response.StatusCode = HttpStatusCode.InternalServerError;
            response.ErrorMessages.Add("เกิดข้อผิดพลาดภายในระบบ");
        }

        return HandleResponse(response);
    }

    // POST api/users/interests  (upsert ทีละตัว)
    [HttpPost]
    public async Task<IActionResult> UpsertMyInterest([FromBody] UserInterestDto item)
    {
        var response = new ApiResponse();
        try
        {
            var userId = GetUserId();
            var data = await _service.UpsertMyInterestAsync(userId, item);
            response.StatusCode = HttpStatusCode.OK;
            response.Result = data;
        }
        catch (ArgumentException ex)
        {
            response.IsSuccess = false;
            response.StatusCode = HttpStatusCode.BadRequest;
            response.ErrorMessages.Add(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error upserting interest");
            response.IsSuccess = false;
            response.StatusCode = HttpStatusCode.InternalServerError;
            response.ErrorMessages.Add("เกิดข้อผิดพลาดภายในระบบ");
        }

        return HandleResponse(response);
    }

    // DELETE api/users/interests/{interestKey}
    [HttpDelete("{interestKey}")]
    public async Task<IActionResult> DeleteMyInterest(string interestKey)
    {
        var response = new ApiResponse();
        try
        {
            var userId = GetUserId();
            await _service.DeleteMyInterestAsync(userId, interestKey);
            response.StatusCode = HttpStatusCode.NoContent;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting interest");
            response.IsSuccess = false;
            response.StatusCode = HttpStatusCode.InternalServerError;
            response.ErrorMessages.Add("เกิดข้อผิดพลาดภายในระบบ");
        }

        return HandleResponse(response);
    }
}
