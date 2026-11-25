using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KanjanaburiTravel.Migrations
{
    public partial class LocalDishes : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ============================================================
            // 1) BehaviorLogs.ClientEventId: nvarchar(64) -> uniqueidentifier (SAFE)
            // ============================================================

            // 1.1 เพิ่มคอลัมน์ใหม่เป็น GUID
            migrationBuilder.AddColumn<Guid>(
                name: "ClientEventId_New",
                table: "BehaviorLogs",
                type: "uniqueidentifier",
                nullable: true);

            // 1.2 แปลงค่าที่เป็น GUID ได้เท่านั้น (ค่าที่ไม่ใช่ GUID จะเป็น NULL)
            migrationBuilder.Sql(@"
UPDATE dbo.BehaviorLogs
SET ClientEventId_New = TRY_CONVERT(uniqueidentifier, ClientEventId);
");

            // 1.3 Drop index ที่ผูกกับ ClientEventId เดิม (มีอยู่จริงใน DB ของคุณ)
            // จากที่คุณ list มา: IX_BehaviorLogs_UserId_ClientEventId มีอยู่
            migrationBuilder.DropIndex(
                name: "IX_BehaviorLogs_UserId_ClientEventId",
                table: "BehaviorLogs");

            // 1.4 ลบคอลัมน์เดิม (nvarchar)
            migrationBuilder.DropColumn(
                name: "ClientEventId",
                table: "BehaviorLogs");

            // 1.5 เปลี่ยนชื่อคอลัมน์ใหม่ให้เป็น ClientEventId
            migrationBuilder.RenameColumn(
                name: "ClientEventId_New",
                table: "BehaviorLogs",
                newName: "ClientEventId");

            // 1.6 สร้าง index กลับมาใหม่ (unique + filter เหมือนที่คุณตั้งใน model)
            migrationBuilder.CreateIndex(
                name: "IX_BehaviorLogs_UserId_ClientEventId",
                table: "BehaviorLogs",
                columns: new[] { "UserId", "ClientEventId" },
                unique: true,
                filter: "[ClientEventId] IS NOT NULL AND [UserId] IS NOT NULL");

            // 1.7 (ออปชัน) ถ้าคุณต้องการกันซ้ำฝั่ง guest ด้วย clientEventId ตามที่คุณเขียน logic
            // ถ้าไม่ต้องการ ให้ลบบล็อกนี้ออกได้
            migrationBuilder.CreateIndex(
                name: "IX_BehaviorLogs_AnonymousId_ClientEventId",
                table: "BehaviorLogs",
                columns: new[] { "AnonymousId", "ClientEventId" },
                unique: true,
                filter: "[ClientEventId] IS NOT NULL AND [AnonymousId] IS NOT NULL");


            // ============================================================
            // 2) Create LocalDishes
            // ============================================================

            migrationBuilder.CreateTable(
                name: "LocalDishes",
                columns: table => new
                {
                    DishId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),

                    NameTH = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    NameEN = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),

                    Description = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    Origin = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),

                    SpicyLevel = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    IsHalal = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    IsVegetarian = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),

                    ImageUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),

                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LocalDishes", x => x.DishId);
                });

            // กันชื่อเมนูซ้ำ (ถ้าไม่อยาก unique ลบได้)
            migrationBuilder.CreateIndex(
                name: "IX_LocalDishes_NameTH",
                table: "LocalDishes",
                column: "NameTH",
                unique: true);


            // ============================================================
            // 3) Create PlaceDishes (join table Place <-> LocalDish)
            // ============================================================

            migrationBuilder.CreateTable(
                name: "PlaceDishes",
                columns: table => new
                {
                    PlaceId = table.Column<int>(type: "int", nullable: false),
                    DishId = table.Column<int>(type: "int", nullable: false),

                    PriceMin = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    PriceMax = table.Column<decimal>(type: "decimal(18,2)", nullable: true),

                    IsSignature = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    Note = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlaceDishes", x => new { x.PlaceId, x.DishId });

                    table.ForeignKey(
                        name: "FK_PlaceDishes_Places_PlaceId",
                        column: x => x.PlaceId,
                        principalTable: "Places",
                        principalColumn: "PlaceId",
                        onDelete: ReferentialAction.Cascade);

                    table.ForeignKey(
                        name: "FK_PlaceDishes_LocalDishes_DishId",
                        column: x => x.DishId,
                        principalTable: "LocalDishes",
                        principalColumn: "DishId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PlaceDishes_DishId",
                table: "PlaceDishes",
                column: "DishId");


            // ============================================================
            // 4) PlaceReviews -> Users (ตาม migration เดิมของคุณ)
            // ============================================================

            migrationBuilder.CreateIndex(
                name: "IX_PlaceReviews_UserId",
                table: "PlaceReviews",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_PlaceReviews_Users_UserId",
                table: "PlaceReviews",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // ============================================================
            // 4) rollback FK PlaceReviews -> Users
            // ============================================================
            migrationBuilder.DropForeignKey(
                name: "FK_PlaceReviews_Users_UserId",
                table: "PlaceReviews");

            migrationBuilder.DropIndex(
                name: "IX_PlaceReviews_UserId",
                table: "PlaceReviews");


            // ============================================================
            // 3) drop PlaceDishes / LocalDishes
            // ============================================================
            migrationBuilder.DropTable(
                name: "PlaceDishes");

            migrationBuilder.DropTable(
                name: "LocalDishes");


            // ============================================================
            // 1) rollback ClientEventId: uniqueidentifier -> nvarchar(64)
            // ============================================================

            // drop indexes ที่ผูกกับ GUID column
            migrationBuilder.DropIndex(
                name: "IX_BehaviorLogs_UserId_ClientEventId",
                table: "BehaviorLogs");

            // ถ้าคุณเอาออปชัน anonymous index ออกใน Up() ให้ลบอันนี้ออกด้วย
            migrationBuilder.DropIndex(
                name: "IX_BehaviorLogs_AnonymousId_ClientEventId",
                table: "BehaviorLogs");

            // เพิ่มคอลัมน์ string กลับมา
            migrationBuilder.AddColumn<string>(
                name: "ClientEventId_Old",
                table: "BehaviorLogs",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            // convert guid -> string
            migrationBuilder.Sql(@"
UPDATE dbo.BehaviorLogs
SET ClientEventId_Old = CONVERT(nvarchar(64), ClientEventId);
");

            // ลบคอลัมน์ guid
            migrationBuilder.DropColumn(
                name: "ClientEventId",
                table: "BehaviorLogs");

            // rename กลับเป็น ClientEventId
            migrationBuilder.RenameColumn(
                name: "ClientEventId_Old",
                table: "BehaviorLogs",
                newName: "ClientEventId");

            // สร้าง index กลับแบบ string (เหมือนเดิมที่คุณตั้งไว้)
            migrationBuilder.CreateIndex(
                name: "IX_BehaviorLogs_UserId_ClientEventId",
                table: "BehaviorLogs",
                columns: new[] { "UserId", "ClientEventId" },
                unique: true,
                filter: "[ClientEventId] IS NOT NULL AND [UserId] IS NOT NULL");

            // ถ้าคุณต้องการ anonymous index ตอน rollback ด้วย ก็สร้างกลับได้
            migrationBuilder.CreateIndex(
                name: "IX_BehaviorLogs_AnonymousId_ClientEventId",
                table: "BehaviorLogs",
                columns: new[] { "AnonymousId", "ClientEventId" },
                unique: true,
                filter: "[ClientEventId] IS NOT NULL AND [AnonymousId] IS NOT NULL");
        }
    }
}
