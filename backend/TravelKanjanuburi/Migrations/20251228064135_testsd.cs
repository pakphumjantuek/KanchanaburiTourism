using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KanjanaburiTravel.Migrations
{
    /// <inheritdoc />
    public partial class testsd : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TripTemplateItems");

            migrationBuilder.DropTable(
                name: "TripTemplates");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TripTemplates",
                columns: table => new
                {
                    TripTemplateId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BaseCity = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CoverImageUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Days = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TripTemplates", x => x.TripTemplateId);
                });

            migrationBuilder.CreateTable(
                name: "TripTemplateItems",
                columns: table => new
                {
                    TripTemplateItemId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PlaceId = table.Column<int>(type: "int", nullable: false),
                    TripTemplateId = table.Column<int>(type: "int", nullable: false),
                    DayIndex = table.Column<int>(type: "int", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    OrderIndex = table.Column<int>(type: "int", nullable: false),
                    PlannedDurationMinutes = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TripTemplateItems", x => x.TripTemplateItemId);
                    table.ForeignKey(
                        name: "FK_TripTemplateItems_Places_PlaceId",
                        column: x => x.PlaceId,
                        principalTable: "Places",
                        principalColumn: "PlaceId");
                    table.ForeignKey(
                        name: "FK_TripTemplateItems_TripTemplates_TripTemplateId",
                        column: x => x.TripTemplateId,
                        principalTable: "TripTemplates",
                        principalColumn: "TripTemplateId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TripTemplateItems_PlaceId",
                table: "TripTemplateItems",
                column: "PlaceId");

            migrationBuilder.CreateIndex(
                name: "IX_TripTemplateItems_TripTemplateId_DayIndex_OrderIndex",
                table: "TripTemplateItems",
                columns: new[] { "TripTemplateId", "DayIndex", "OrderIndex" });

            migrationBuilder.CreateIndex(
                name: "IX_TripTemplates_IsActive",
                table: "TripTemplates",
                column: "IsActive");
        }
    }
}
