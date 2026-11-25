using TravelKanjanuburi.Dtos.Home;

[ApiController]
[Route("api/home")]
[AllowAnonymous] // ✅ home เข้าได้แม้ไม่ login
public class HomeController : ControllerBase
{
    private readonly HomeService _home;

    public HomeController(HomeService home)
    {
        _home = home;
    }

    [HttpGet]
    public async Task<ActionResult<HomeResponseDto>> Get(
        [FromQuery] int topN = 20,
        [FromQuery] double? lat = null,
        [FromQuery] double? lng = null,
        CancellationToken ct = default)
    {
        var userId = TryGetUserId(User);
        var res = await _home.GetHomeAsync(userId, topN, lat, lng, ct);
        return Ok(res);
    }

    private static int? TryGetUserId(ClaimsPrincipal user)
    {
        var raw =
            user.FindFirstValue("userId") ??
            user.FindFirstValue("UserId") ??
            user.FindFirstValue(ClaimTypes.NameIdentifier) ??
            user.FindFirstValue("sub");

        return int.TryParse(raw, out var id) && id > 0 ? id : null;
    }
}
