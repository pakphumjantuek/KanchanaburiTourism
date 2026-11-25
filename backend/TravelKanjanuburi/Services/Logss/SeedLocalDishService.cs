using TravelKanjanuburi.Model.Log;

namespace TravelKanjanuburi.Services.Logss
{
    public class SeedLocalDishService
    {
        private readonly ApplicationDbContext _context;

        public SeedLocalDishService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<object> SeedAsync(
            int dishCount,
            int users,
            int logsPerDish,
            int daysBack,
            bool clearExisting,
            CancellationToken ct)
        {
            var random = new Random();

            // =========================
            // 1️⃣ Clear existing logs
            // =========================
            if (clearExisting)
            {
                var existingLogs = await _context.BehaviorLogs
                    .Where(x => x.DishId != null)
                    .ToListAsync(ct);

                _context.BehaviorLogs.RemoveRange(existingLogs);
                await _context.SaveChangesAsync(ct);
            }

            // =========================
            // 2️⃣ Ensure Users exist
            // =========================
            var existingUserIds = await _context.Users
                .Select(u => u.UserId)
                .ToListAsync(ct);

            if (!existingUserIds.Any())
                throw new Exception("No users found in database.");

            var selectedUserIds = existingUserIds
                .Take(users)
                .ToList();

            if (!selectedUserIds.Any())
                throw new Exception("Not enough users.");

            // =========================
            // 3️⃣ Get Dishes
            // =========================
            var allDishIds = await _context.LocalDishes
                .Where(d => d.IsActive)
                .Select(d => d.DishId)
                .Take(dishCount)
                .ToListAsync(ct);

            if (!allDishIds.Any())
                throw new Exception("No LocalDishes found.");

            var logs = new List<BehaviorLog>();

            var now = DateTime.UtcNow;

            // =========================
            // 4️⃣ Generate Logs
            // =========================
            foreach (var dishId in allDishIds)
            {
                // 🔥 Boost บางเมนูให้ activity สูง
                double popularityFactor = Math.Pow(
                    1.0 / (dishId % 10 + 1),
                    1.3
                );

                int boostedLogs = (int)(logsPerDish * (1 + popularityFactor * 8));

                for (int i = 0; i < boostedLogs; i++)
                {
                    var action = random.Next(0, 3);

                    DateTime createdAt;

                    // ===============================
                    // 🔥 แบ่ง pattern ของแต่ละเมนู
                    // ===============================

                    if (dishId % 7 == 0)
                    {
                        // 🔺 Rising Trend
                        // 80% activity อยู่ใน 0–30 วันล่าสุด (label window)
                        if (random.NextDouble() < 0.8)
                            createdAt = now.AddDays(-random.Next(0, 30));
                        else
                            createdAt = now.AddDays(-random.Next(30, daysBack));
                    }
                    else if (dishId % 5 == 0)
                    {
                        // 🔻 Falling Trend
                        // Activity ส่วนใหญ่เก่า (เข้า feature window)
                        createdAt = now.AddDays(-random.Next(45, daysBack));
                    }
                    else if (dishId % 3 == 0)
                    {
                        // 💥 Viral Spike ล่าสุดมาก
                        createdAt = now.AddDays(-random.Next(0, 7));
                    }
                    else
                    {
                        // ➖ Stable
                        createdAt = now.AddDays(-random.Next(0, daysBack));
                    }

                    logs.Add(new BehaviorLog
                    {
                        UserId = selectedUserIds[random.Next(selectedUserIds.Count)],
                        DishId = dishId,
                        ActionType = action switch
                        {
                            0 => BehaviorActionType.View,
                            1 => BehaviorActionType.Favorite,
                            _ => BehaviorActionType.Review
                        },
                        ActionValue = action == 2
                            ? random.Next(3, 6)
                            : null,
                        CreatedAt = createdAt
                    });
                }
            }

            // =========================
            // 5️⃣ Save
            // =========================
            await _context.BehaviorLogs.AddRangeAsync(logs, ct);
            await _context.SaveChangesAsync(ct);

            return new
            {
                DishesSeeded = allDishIds.Count,
                UsersUsed = selectedUserIds.Count,
                LogsCreated = logs.Count
            };
        }
    }
}