public class BaseApiController : ControllerBase
{
    protected int? CurrentUserId =>
        int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub), out var id) ? id : null;

    protected bool IsAdmin => User.IsInRole("Admin");

    protected IActionResult HandleResponse(ApiResponse response)
    {
        return StatusCode((int)response.StatusCode, response);
    }
}
