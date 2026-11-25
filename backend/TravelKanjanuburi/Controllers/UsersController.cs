using static TravelKanjanuburi.Model.Paged;

[ApiController]
[Route("api/users")]
public class UsersController : BaseApiController
{
    private readonly IUserService _userService;
    private readonly ILogger<UsersController> _logger;

    public UsersController(IUserService userService, ILogger<UsersController> logger)
    {
        _userService = userService;
        _logger = logger;
    }

    [Authorize]
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile([FromQuery] int? userid, CancellationToken ct)
    {
        var response = new ApiResponse();

        try
        {
            // id ของคนที่ login อยู่
            var userIdClaim =
                User.FindFirst(ClaimTypes.NameIdentifier) ??
                User.FindFirst(JwtRegisteredClaimNames.Sub);

            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var currentUserId))
            {
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.Unauthorized;
                response.ErrorMessages.Add("ไม่พบข้อมูลผู้ใช้ในโทเค็น");
                return HandleResponse(response);
            }

            // ถ้าไม่ส่ง userid => ดูของตัวเอง
            var targetUserId = currentUserId;

            // ถ้าส่ง userid มา => ให้ดูได้เฉพาะ Admin
            if (userid.HasValue && userid.Value != currentUserId)
            {
                var isAdmin = User.IsInRole("Admin"); // หรือชื่อ role ของคุณ เช่น "Admin"
                if (!isAdmin)
                {
                    response.IsSuccess = false;
                    response.StatusCode = HttpStatusCode.Forbidden;
                    response.ErrorMessages.Add("ไม่มีสิทธิ์ดูโปรไฟล์ผู้อื่น");
                    return HandleResponse(response);
                }

                targetUserId = userid.Value;
            }

            var profile = await _userService.GetProfileAsync(targetUserId, ct);

            response.StatusCode = HttpStatusCode.OK;
            response.Result = profile;
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "User not found.");
            response.IsSuccess = false;
            response.StatusCode = HttpStatusCode.NotFound;
            response.ErrorMessages.Add(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user profile.");
            response.IsSuccess = false;
            response.StatusCode = HttpStatusCode.InternalServerError;
            response.ErrorMessages.Add("เกิดข้อผิดพลาดภายในระบบ");
        }

        return HandleResponse(response);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<IActionResult> GetAllUser([FromQuery] PagedQuery q, CancellationToken ct)
    {
        var response = new ApiResponse();
        try
        {        
            var profile = await _userService.GetAllAsync(q,ct);

            response.StatusCode = HttpStatusCode.OK;
            response.Result = profile;
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "User not found.");
            response.IsSuccess = false;
            response.StatusCode = HttpStatusCode.NotFound;
            response.ErrorMessages.Add(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user profile.");
            response.IsSuccess = false;
            response.StatusCode = HttpStatusCode.InternalServerError;
            response.ErrorMessages.Add("เกิดข้อผิดพลาดภายในระบบ");
        }

        return HandleResponse(response);
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateMe([FromForm] UpdateProfileRequest request)
    {
        var response = new ApiResponse();

        try
        {
            var userIdClaim =
                User.FindFirst(ClaimTypes.NameIdentifier) ??
                User.FindFirst(JwtRegisteredClaimNames.Sub);

            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.Unauthorized;
                response.ErrorMessages.Add("ไม่พบข้อมูลผู้ใช้ในโทเค็น");
                return HandleResponse(response);
            }

            await _userService.UpdateProfileAsync(userId, request);

            response.StatusCode = HttpStatusCode.Created;
            response.Result = null;
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "User not found.");
            response.IsSuccess = false;
            response.StatusCode = HttpStatusCode.NotFound;
            response.ErrorMessages.Add(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user profile.");
            response.IsSuccess = false;
            response.StatusCode = HttpStatusCode.InternalServerError;
            response.ErrorMessages.Add("เกิดข้อผิดพลาดภายในระบบ");
        }

        return HandleResponse(response);
    }
}
