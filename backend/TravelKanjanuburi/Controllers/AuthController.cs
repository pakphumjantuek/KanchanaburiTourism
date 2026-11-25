// Controllers/AuthController.cs

using KanjanaburiTravel.Dtos.Auth;
using TravelKanjanuburi.Services.Interface;
namespace KanjanaburiTravel.Controllers;
[ApiController]
[Route("api/auth")]
public class AuthController : BaseApiController
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    private void SetRefreshTokenCookie(string refreshToken, DateTime expiresAt)
    {
        var options = new CookieOptions
        {
            HttpOnly = true,              // แนะนำ: ปลอดภัยกว่า
            Secure = true,                // ถ้าใช้ HTTPS จริง เปลี่ยนเป็น true
            SameSite = SameSiteMode.None, // ถ้า front คนละ origin ให้ใช้ None
            Expires = expiresAt,
            Path = "/"                    // 👈 สำคัญมาก!
        };

        Response.Cookies.Append("refreshToken", refreshToken, options);
    }

    private void ClearRefreshTokenCookie()
    {
        Response.Cookies.Delete("refreshToken", new CookieOptions
        {
            Path = "/",
            SameSite = SameSiteMode.None,
            Secure = true
        });
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var response = new ApiResponse();
        try
        {
            var auth = await _authService.RegisterAsync(request);
            response.StatusCode = HttpStatusCode.OK;
            response.Result = auth;
        }
        catch (InvalidOperationException ex)
        {
            response.IsSuccess = false;
            response.StatusCode = HttpStatusCode.BadRequest;
            response.ErrorMessages.Add(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during register");
            response.IsSuccess = false;
            response.StatusCode = HttpStatusCode.InternalServerError;
            response.ErrorMessages.Add("เกิดข้อผิดพลาดภายในระบบ");
        }

        return HandleResponse(response);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var response = new ApiResponse();
        try
        {
            var result = await _authService.LoginAsync(request);

            // เซ็ต refresh token ลง cookie
            var refreshExpires = DateTime.UtcNow.AddDays(7);
            SetRefreshTokenCookie(result.RefreshToken, refreshExpires);

            response.StatusCode = HttpStatusCode.OK;
            response.Result = result.Auth; // ส่ง accessToken + user ไปให้ frontend
        }
        catch (UnauthorizedAccessException ex)
        {
            response.IsSuccess = false;
            response.StatusCode = HttpStatusCode.Unauthorized;
            response.ErrorMessages.Add(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login");
            response.IsSuccess = false;
            response.StatusCode = HttpStatusCode.InternalServerError;
            response.ErrorMessages.Add("เกิดข้อผิดพลาดภายในระบบ ");
        }

        return HandleResponse(response);
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<IActionResult> Refresh()
    {
        var response = new ApiResponse();
        try
        {
            var refreshToken = Request.Cookies["refreshToken"];
            if (string.IsNullOrEmpty(refreshToken))
            {
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.Unauthorized;
                response.ErrorMessages.Add("ไม่มี refresh token");
                return HandleResponse(response);
            }

            var result = await _authService.RefreshAsync(refreshToken);

            var refreshExpires = DateTime.UtcNow.AddDays(7);
            SetRefreshTokenCookie(result.RefreshToken, refreshExpires);

            response.StatusCode = HttpStatusCode.OK;
            response.Result = result.Auth;
        }
        catch (UnauthorizedAccessException ex)
        {
            response.IsSuccess = false;
            response.StatusCode = HttpStatusCode.Unauthorized;
            response.ErrorMessages.Add(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during refresh");
            response.IsSuccess = false;
            response.StatusCode = HttpStatusCode.InternalServerError;
            response.ErrorMessages.Add("เกิดข้อผิดพลาดภายในระบบ");
        }

        return HandleResponse(response);
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        var response = new ApiResponse();

        try
        {
            var refreshToken = Request.Cookies["refreshToken"];
            if (!string.IsNullOrEmpty(refreshToken))
            {
                await _authService.RevokeRefreshTokenAsync(refreshToken);
            }

            ClearRefreshTokenCookie();

            // ใช้ 200 แทน 204 เพื่อให้ Swagger / Browser แฮปปี้
            response.StatusCode = HttpStatusCode.OK;
            response.Result = new { message = "ออกจากระบบเรียบร้อยแล้ว" };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during logout");
            response.IsSuccess = false;
            response.StatusCode = HttpStatusCode.InternalServerError;
            response.ErrorMessages.Add("เกิดข้อผิดพลาดภายในระบบ");
        }

        return HandleResponse(response);
    }
}
