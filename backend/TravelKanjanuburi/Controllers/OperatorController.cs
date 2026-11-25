using Microsoft.AspNetCore.Authorization;
using TravelKanjanuburi.Model;

namespace TravelKanjanuburi.Controllers
{
    public class OperatorApplyRequest
    {
        public string BusinessName { get; set; } = null!;
        public string? ContactPhone { get; set; }
        public string? Description { get; set; }
    }

    public class OperatorRejectRequest
    {
        public string? Reason { get; set; }
    }

    [Route("api/[controller]")]
    [ApiController]
    public class OperatorController : BaseApiController
    {
        private const int OperatorRoleId = 3;
        private readonly ApplicationDbContext _db;

        public OperatorController(ApplicationDbContext db) => _db = db;

        private static object ToDto(OperatorApplication a) => new
        {
            a.OperatorApplicationId,
            a.UserId,
            userName = a.User?.DisplayName,
            email = a.User?.Email,
            a.BusinessName,
            a.ContactPhone,
            a.Description,
            a.Status,
            a.RejectReason,
            a.CreatedAt,
            a.ReviewedAt
        };

        // ---------- ผู้ใช้ ----------

        /// <summary>ผู้ใช้ที่ล็อกอินอยู่ขอเป็นผู้ประกอบการ</summary>
        [HttpPost("apply")]
        [Authorize]
        public async Task<IActionResult> Apply([FromBody] OperatorApplyRequest req, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(req.BusinessName))
                return BadRequest(ApiResponse.Fail("กรุณากรอกชื่อกิจการ", HttpStatusCode.BadRequest));

            var uid = CurrentUserId!.Value;
            var user = await _db.Users.FirstAsync(u => u.UserId == uid, ct);

            if (user.RoleId == OperatorRoleId || IsAdmin)
                return BadRequest(ApiResponse.Fail("บัญชีนี้เป็นผู้ประกอบการหรือแอดมินอยู่แล้ว", HttpStatusCode.BadRequest));

            var pending = await _db.OperatorApplications
                .AnyAsync(a => a.UserId == uid && a.Status == OperatorStatus.Pending, ct);
            if (pending)
                return BadRequest(ApiResponse.Fail("มีคำขอที่รออนุมัติอยู่แล้ว", HttpStatusCode.BadRequest));

            var app = new OperatorApplication
            {
                UserId = uid,
                BusinessName = req.BusinessName.Trim(),
                ContactPhone = req.ContactPhone ?? user.PhoneNumber,
                Description = req.Description?.Trim()
            };
            _db.OperatorApplications.Add(app);
            await _db.SaveChangesAsync(ct);
            return Ok(ApiResponse.Success(ToDto(app)));
        }

        /// <summary>คำขอล่าสุดของฉัน (null = ยังไม่เคยขอ)</summary>
        [HttpGet("my-application")]
        [Authorize]
        public async Task<IActionResult> MyApplication(CancellationToken ct)
        {
            var uid = CurrentUserId!.Value;
            var app = await _db.OperatorApplications.AsNoTracking()
                .Where(a => a.UserId == uid)
                .OrderByDescending(a => a.CreatedAt)
                .FirstOrDefaultAsync(ct);
            return Ok(ApiResponse.Success(app == null ? null : ToDto(app)));
        }

        // ---------- แอดมิน ----------

        [HttpGet("applications")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> List([FromQuery] string? status, CancellationToken ct)
        {
            var q = _db.OperatorApplications.AsNoTracking().Include(a => a.User).AsQueryable();
            if (!string.IsNullOrWhiteSpace(status)) q = q.Where(a => a.Status == status);

            var items = await q.OrderBy(a => a.Status == OperatorStatus.Pending ? 0 : 1)
                .ThenByDescending(a => a.CreatedAt)
                .Take(500)
                .ToListAsync(ct);
            return Ok(ApiResponse.Success(items.Select(ToDto).ToList()));
        }

        /// <summary>ผู้ประกอบการที่อนุมัติแล้ว (ใช้เลือกเจ้าของสถานที่)</summary>
        [HttpGet("approved")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Approved(CancellationToken ct)
        {
            var items = await _db.Users.AsNoTracking()
                .Where(u => u.RoleId == OperatorRoleId && u.IsActive)
                .OrderBy(u => u.DisplayName)
                .Select(u => new
                {
                    userId = u.UserId,
                    displayName = u.DisplayName,
                    email = u.Email,
                    businessName = _db.OperatorApplications
                        .Where(a => a.UserId == u.UserId && a.Status == OperatorStatus.Approved)
                        .OrderByDescending(a => a.ReviewedAt)
                        .Select(a => a.BusinessName).FirstOrDefault()
                })
                .ToListAsync(ct);
            return Ok(ApiResponse.Success(items));
        }

        [HttpPost("applications/{id:int}/approve")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Approve(int id, CancellationToken ct)
        {
            var app = await _db.OperatorApplications.Include(a => a.User).FirstOrDefaultAsync(a => a.OperatorApplicationId == id, ct)
                ?? throw new KeyNotFoundException("ไม่พบคำขอ");

            app.Status = OperatorStatus.Approved;
            app.RejectReason = null;
            app.ReviewedAt = DateTime.UtcNow;
            app.ReviewedByUserId = CurrentUserId;

            // ไม่ลดสิทธิ์แอดมิน
            if (app.User.RoleId != 2) app.User.RoleId = OperatorRoleId;

            await _db.SaveChangesAsync(ct);
            return Ok(ApiResponse.Success(ToDto(app)));
        }

        /// <summary>ปฏิเสธคำขอ (ถ้าเคยอนุมัติแล้ว = ถอนสิทธิ์ผู้ประกอบการ; สถานที่/เมนูเดิมยังอยู่)</summary>
        [HttpPost("applications/{id:int}/reject")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Reject(int id, [FromBody] OperatorRejectRequest req, CancellationToken ct)
        {
            var app = await _db.OperatorApplications.Include(a => a.User).FirstOrDefaultAsync(a => a.OperatorApplicationId == id, ct)
                ?? throw new KeyNotFoundException("ไม่พบคำขอ");

            app.Status = OperatorStatus.Rejected;
            app.RejectReason = string.IsNullOrWhiteSpace(req?.Reason) ? null : req!.Reason!.Trim();
            app.ReviewedAt = DateTime.UtcNow;
            app.ReviewedByUserId = CurrentUserId;

            if (app.User.RoleId == OperatorRoleId) app.User.RoleId = 1;

            await _db.SaveChangesAsync(ct);
            return Ok(ApiResponse.Success(ToDto(app)));
        }
    }
}
