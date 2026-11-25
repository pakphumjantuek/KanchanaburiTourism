using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KanjanaburiTravel.Migrations
{
    /// <inheritdoc />
    public partial class log : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PlaceCategoryMap");

            migrationBuilder.CreateTable(
                name: "BehaviorLogs",
                columns: table => new
                {
                    BehaviorLogId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    PlaceId = table.Column<int>(type: "int", nullable: true),
                    ActionType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ActionValue = table.Column<double>(type: "float", nullable: true),
                    MetaJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BehaviorLogs", x => x.BehaviorLogId);
                    table.ForeignKey(
                        name: "FK_BehaviorLogs_Places_PlaceId",
                        column: x => x.PlaceId,
                        principalTable: "Places",
                        principalColumn: "PlaceId");
                    table.ForeignKey(
                        name: "FK_BehaviorLogs_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Recommendations",
                columns: table => new
                {
                    RecommendationId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    RecType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ContextLat = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    ContextLng = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    GeneratedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModelVersion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Note = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Recommendations", x => x.RecommendationId);
                    table.ForeignKey(
                        name: "FK_Recommendations_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TripTemplates",
                columns: table => new
                {
                    TripTemplateId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Days = table.Column<int>(type: "int", nullable: false),
                    CoverImageUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BaseCity = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TripTemplates", x => x.TripTemplateId);
                });

            migrationBuilder.CreateTable(
                name: "RecommendationItems",
                columns: table => new
                {
                    RecommendationItemId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RecommendationId = table.Column<int>(type: "int", nullable: false),
                    ItemType = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    PlaceId = table.Column<int>(type: "int", nullable: true),
                    TripTemplateId = table.Column<int>(type: "int", nullable: true),
                    Score = table.Column<double>(type: "float", nullable: false),
                    RankIndex = table.Column<int>(type: "int", nullable: false),
                    ReasonJson = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecommendationItems", x => x.RecommendationItemId);
                    table.ForeignKey(
                        name: "FK_RecommendationItems_Places_PlaceId",
                        column: x => x.PlaceId,
                        principalTable: "Places",
                        principalColumn: "PlaceId");
                    table.ForeignKey(
                        name: "FK_RecommendationItems_Recommendations_RecommendationId",
                        column: x => x.RecommendationId,
                        principalTable: "Recommendations",
                        principalColumn: "RecommendationId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TripTemplateItems",
                columns: table => new
                {
                    TripTemplateItemId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TripTemplateId = table.Column<int>(type: "int", nullable: false),
                    PlaceId = table.Column<int>(type: "int", nullable: false),
                    DayIndex = table.Column<int>(type: "int", nullable: false),
                    OrderIndex = table.Column<int>(type: "int", nullable: false),
                    PlannedDurationMinutes = table.Column<int>(type: "int", nullable: true),
                    Note = table.Column<string>(type: "nvarchar(max)", nullable: true)
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
                name: "IX_BehaviorLogs_PlaceId",
                table: "BehaviorLogs",
                column: "PlaceId");

            migrationBuilder.CreateIndex(
                name: "IX_BehaviorLogs_UserId_CreatedAt",
                table: "BehaviorLogs",
                columns: new[] { "UserId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_RecommendationItems_PlaceId",
                table: "RecommendationItems",
                column: "PlaceId");

            migrationBuilder.CreateIndex(
                name: "IX_RecommendationItems_RecommendationId_RankIndex",
                table: "RecommendationItems",
                columns: new[] { "RecommendationId", "RankIndex" });

            migrationBuilder.CreateIndex(
                name: "IX_Recommendations_UserId_RecType_GeneratedAt",
                table: "Recommendations",
                columns: new[] { "UserId", "RecType", "GeneratedAt" });

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BehaviorLogs");

            migrationBuilder.DropTable(
                name: "RecommendationItems");

            migrationBuilder.DropTable(
                name: "TripTemplateItems");

            migrationBuilder.DropTable(
                name: "Recommendations");

            migrationBuilder.DropTable(
                name: "TripTemplates");

            migrationBuilder.CreateTable(
                name: "PlaceCategoryMap",
                columns: table => new
                {
                    PlaceId = table.Column<int>(type: "int", nullable: false),
                    CategoryId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlaceCategoryMap", x => new { x.PlaceId, x.CategoryId });
                    table.ForeignKey(
                        name: "FK_PlaceCategoryMap_PlaceCategories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "PlaceCategories",
                        principalColumn: "CategoryId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlaceCategoryMap_Places_PlaceId",
                        column: x => x.PlaceId,
                        principalTable: "Places",
                        principalColumn: "PlaceId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PlaceCategoryMap_CategoryId",
                table: "PlaceCategoryMap",
                column: "CategoryId");
        }
    }
}
