using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KanjanaburiTravel.Migrations
{
    /// <inheritdoc />
    public partial class trip : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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

            migrationBuilder.CreateTable(
                name: "Trips",
                columns: table => new
                {
                    TripId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    StartDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    StartLat = table.Column<double>(type: "float", nullable: true),
                    StartLng = table.Column<double>(type: "float", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Trips", x => x.TripId);
                });

            migrationBuilder.CreateTable(
                name: "TripItems",
                columns: table => new
                {
                    TripItemId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TripId = table.Column<int>(type: "int", nullable: false),
                    PlaceId = table.Column<int>(type: "int", nullable: false),
                    DayIndex = table.Column<int>(type: "int", nullable: false),
                    OrderIndex = table.Column<int>(type: "int", nullable: false),
                    PlannedArrivalTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PlannedDurationMinutes = table.Column<int>(type: "int", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TripItems", x => x.TripItemId);
                    table.ForeignKey(
                        name: "FK_TripItems_Trips_TripId",
                        column: x => x.TripId,
                        principalTable: "Trips",
                        principalColumn: "TripId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TripSegments",
                columns: table => new
                {
                    TripSegmentId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TripId = table.Column<int>(type: "int", nullable: false),
                    FromTripItemId = table.Column<int>(type: "int", nullable: false),
                    ToTripItemId = table.Column<int>(type: "int", nullable: false),
                    DistanceKm = table.Column<double>(type: "float", nullable: false),
                    TravelMinutes = table.Column<int>(type: "int", nullable: false),
                    TransportMode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    RoutePolyline = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TripSegments", x => x.TripSegmentId);
                    table.ForeignKey(
                        name: "FK_TripSegments_TripItems_FromTripItemId",
                        column: x => x.FromTripItemId,
                        principalTable: "TripItems",
                        principalColumn: "TripItemId");
                    table.ForeignKey(
                        name: "FK_TripSegments_TripItems_ToTripItemId",
                        column: x => x.ToTripItemId,
                        principalTable: "TripItems",
                        principalColumn: "TripItemId");
                    table.ForeignKey(
                        name: "FK_TripSegments_Trips_TripId",
                        column: x => x.TripId,
                        principalTable: "Trips",
                        principalColumn: "TripId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PlaceCategoryMap_CategoryId",
                table: "PlaceCategoryMap",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_TripItems_TripId_DayIndex_OrderIndex",
                table: "TripItems",
                columns: new[] { "TripId", "DayIndex", "OrderIndex" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TripItems_TripId_PlaceId",
                table: "TripItems",
                columns: new[] { "TripId", "PlaceId" });

            migrationBuilder.CreateIndex(
                name: "IX_Trips_UserId_CreatedAt",
                table: "Trips",
                columns: new[] { "UserId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_TripSegments_FromTripItemId",
                table: "TripSegments",
                column: "FromTripItemId");

            migrationBuilder.CreateIndex(
                name: "IX_TripSegments_ToTripItemId",
                table: "TripSegments",
                column: "ToTripItemId");

            migrationBuilder.CreateIndex(
                name: "IX_TripSegments_TripId_FromTripItemId_ToTripItemId",
                table: "TripSegments",
                columns: new[] { "TripId", "FromTripItemId", "ToTripItemId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PlaceCategoryMap");

            migrationBuilder.DropTable(
                name: "TripSegments");

            migrationBuilder.DropTable(
                name: "TripItems");

            migrationBuilder.DropTable(
                name: "Trips");
        }
    }
}
