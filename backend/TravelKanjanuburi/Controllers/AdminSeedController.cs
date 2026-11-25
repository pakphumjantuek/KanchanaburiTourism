using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelKanjanuburi.Services.Logss;

[ApiController]
[Route("api/admin/seed")]
[Authorize] // ถ้ามี role แล้วค่อยใช้ [Authorize(Roles="ADMIN")]
public class AdminSeedController : ControllerBase
{
    private readonly SeedBehaviorService _seed;

    public AdminSeedController(SeedBehaviorService seed)
    {
        _seed = seed;
    }

    public sealed class SeedRequest
    {
        public int Users { get; set; } = 10;
        public int Places { get; set; } = 50;
        public int LogsPerUser { get; set; } = 40;
        public int DaysBack { get; set; } = 120;
        public bool ClearExisting { get; set; } = false;
    }

    public sealed class SeedDishRequest
    {
        public int Users { get; set; } = 50;
        public int Dishes { get; set; } = 30;      // 👈 ถูกต้อง
        public int LogsPerDish { get; set; } = 100;
        public int DaysBack { get; set; } = 180;
        public bool ClearExisting { get; set; } = false;
    }

    [HttpPost("behavior")]
    public async Task<IActionResult> SeedBehavior([FromBody] SeedRequest req, CancellationToken ct)
    {
        var result = await _seed.SeedAsync(
            users: req.Users,
            places: req.Places,
            logsPerUser: req.LogsPerUser,
            daysBack: req.DaysBack,
            clearExisting: req.ClearExisting,
            ct: ct);

        return Ok(new { isSuccess = true, result });
    }

    [HttpPost("localdish")]
    public async Task<IActionResult> SeedLocalDish(
    [FromServices] SeedLocalDishService seedDish,
    [FromBody] SeedDishRequest req,
    CancellationToken ct)
    {
        var result = await seedDish.SeedAsync(
            dishCount: req.Dishes,
            users: req.Users,
            logsPerDish: req.LogsPerDish,
            daysBack: req.DaysBack,
            clearExisting: req.ClearExisting,
            ct: ct);

        return Ok(new { isSuccess = true, result });
    }
}
