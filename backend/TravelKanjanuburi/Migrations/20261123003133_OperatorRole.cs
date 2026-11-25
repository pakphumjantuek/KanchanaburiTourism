using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KanjanaburiTravel.Migrations
{
    /// <inheritdoc />
    public partial class OperatorRole : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserPlaceInteractions");

            migrationBuilder.AddColumn<int>(
                name: "OwnerId",
                table: "Places",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "OwnerId",
                table: "LocalDishes",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DishId",
                table: "BehaviorLogs",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "OperatorApplications",
                columns: table => new
                {
                    OperatorApplicationId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    BusinessName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ContactPhone = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    RejectReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReviewedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ReviewedByUserId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OperatorApplications", x => x.OperatorApplicationId);
                    table.ForeignKey(
                        name: "FK_OperatorApplications_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Roles",
                columns: new[] { "RoleId", "RoleName" },
                values: new object[] { 3, "Operator" });

            migrationBuilder.CreateIndex(
                name: "IX_Places_OwnerId",
                table: "Places",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_LocalDishes_OwnerId",
                table: "LocalDishes",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_BehaviorLogs_DishId",
                table: "BehaviorLogs",
                column: "DishId");

            migrationBuilder.CreateIndex(
                name: "IX_OperatorApplications_UserId_Status",
                table: "OperatorApplications",
                columns: new[] { "UserId", "Status" });

            migrationBuilder.AddForeignKey(
                name: "FK_BehaviorLogs_LocalDishes_DishId",
                table: "BehaviorLogs",
                column: "DishId",
                principalTable: "LocalDishes",
                principalColumn: "DishId");

            migrationBuilder.AddForeignKey(
                name: "FK_LocalDishes_Users_OwnerId",
                table: "LocalDishes",
                column: "OwnerId",
                principalTable: "Users",
                principalColumn: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Places_Users_OwnerId",
                table: "Places",
                column: "OwnerId",
                principalTable: "Users",
                principalColumn: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BehaviorLogs_LocalDishes_DishId",
                table: "BehaviorLogs");

            migrationBuilder.DropForeignKey(
                name: "FK_LocalDishes_Users_OwnerId",
                table: "LocalDishes");

            migrationBuilder.DropForeignKey(
                name: "FK_Places_Users_OwnerId",
                table: "Places");

            migrationBuilder.DropTable(
                name: "OperatorApplications");

            migrationBuilder.DropIndex(
                name: "IX_Places_OwnerId",
                table: "Places");

            migrationBuilder.DropIndex(
                name: "IX_LocalDishes_OwnerId",
                table: "LocalDishes");

            migrationBuilder.DropIndex(
                name: "IX_BehaviorLogs_DishId",
                table: "BehaviorLogs");

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "RoleId",
                keyValue: 3);

            migrationBuilder.DropColumn(
                name: "OwnerId",
                table: "Places");

            migrationBuilder.DropColumn(
                name: "OwnerId",
                table: "LocalDishes");

            migrationBuilder.DropColumn(
                name: "DishId",
                table: "BehaviorLogs");

            migrationBuilder.CreateTable(
                name: "UserPlaceInteractions",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "int", nullable: false),
                    PlaceId = table.Column<int>(type: "int", nullable: false),
                    InteractionScore = table.Column<float>(type: "real", nullable: false),
                    LastActionAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserPlaceInteractions", x => new { x.UserId, x.PlaceId });
                });
        }
    }
}
