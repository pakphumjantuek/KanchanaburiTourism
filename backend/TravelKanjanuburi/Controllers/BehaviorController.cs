using TravelKanjanuburi.Dtos.BehaviorLog.TravelKanjanuburi.Dtos.BehaviorLog;

[ApiController]
[Route("api/behavior")]
public class BehaviorController : ControllerBase
{
    private readonly BehaviorService _behavior;

    public BehaviorController(BehaviorService behavior)
    {
        _behavior = behavior ?? throw new ArgumentNullException(nameof(behavior));
    }

    [HttpPost]
    [AllowAnonymous] 
    public async Task<IActionResult> Create([FromBody] CreateBehaviorLogRequest req, CancellationToken ct)
    {
        if (req is null)
            return BadRequest(new { isSuccess = false, message = "Body (req) เป็นค่าว่าง" });

        if (string.IsNullOrWhiteSpace(req.ActionType))
            return BadRequest(new { isSuccess = false, message = "ActionType ห้ามว่าง" });

        // ถ้า login อยู่ จะมี userId ถ้าไม่ login จะเป็น null
        var userId = TryGetUserId(User);

        try
        {
            await _behavior.LogAsync(userId, req, ct);
            return Ok(new { isSuccess = true });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { isSuccess = false, message = ex.Message });
        }
        catch (DbUpdateException ex)
        {
            return Conflict(new
            {
                isSuccess = false,
                message = "เหตุการณ์ซ้ำ ระบบไม่บันทึกซ้ำ",
                detail = ex.InnerException?.Message ?? ex.Message
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { isSuccess = false, message = "เกิดข้อผิดพลาดในระบบ", detail = ex.Message });
        }
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
