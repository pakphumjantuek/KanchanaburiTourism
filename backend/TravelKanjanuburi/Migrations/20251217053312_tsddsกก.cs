using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KanjanaburiTravel.Migrations
{
    /// <inheritdoc />
    public partial class tsddsกก : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BehaviorLogs_Users_UserId",
                table: "BehaviorLogs");

            migrationBuilder.AlterColumn<int>(
                name: "UserId",
                table: "BehaviorLogs",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<string>(
                name: "AnonymousId",
                table: "BehaviorLogs",
                type: "nvarchar(36)",
                maxLength: 36,
                nullable: true);

          

        

            migrationBuilder.CreateIndex(
                name: "IX_BehaviorLogs_AnonymousId_CreatedAt",
                table: "BehaviorLogs",
                columns: new[] { "AnonymousId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_BehaviorLogs_UserId_ClientEventId",
                table: "BehaviorLogs",
                columns: new[] { "UserId", "ClientEventId" },
                unique: true,
                filter: "[ClientEventId] IS NOT NULL AND [UserId] IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_BehaviorLogs_Users_UserId",
                table: "BehaviorLogs",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BehaviorLogs_Users_UserId",
                table: "BehaviorLogs");

            migrationBuilder.DropIndex(
                name: "IX_BehaviorLogs_AnonymousId_ClientEventId",
                table: "BehaviorLogs");

            migrationBuilder.DropIndex(
                name: "IX_BehaviorLogs_AnonymousId_CreatedAt",
                table: "BehaviorLogs");

            migrationBuilder.DropIndex(
                name: "IX_BehaviorLogs_UserId_ClientEventId",
                table: "BehaviorLogs");

            migrationBuilder.DropColumn(
                name: "AnonymousId",
                table: "BehaviorLogs");

            migrationBuilder.DropColumn(
                name: "ClientEventId",
                table: "BehaviorLogs");

            migrationBuilder.AlterColumn<int>(
                name: "UserId",
                table: "BehaviorLogs",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_BehaviorLogs_Users_UserId",
                table: "BehaviorLogs",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
