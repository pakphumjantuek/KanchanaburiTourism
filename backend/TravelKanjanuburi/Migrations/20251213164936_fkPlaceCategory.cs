using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KanjanaburiTravel.Migrations
{
    /// <inheritdoc />
    public partial class fkPlaceCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PlaceCategoryMaps");

            migrationBuilder.AddColumn<int>(
                name: "PlactCategoryId",
                table: "Places",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Places_PlactCategoryId",
                table: "Places",
                column: "PlactCategoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_Places_PlaceCategories_PlactCategoryId",
                table: "Places",
                column: "PlactCategoryId",
                principalTable: "PlaceCategories",
                principalColumn: "CategoryId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Places_PlaceCategories_PlactCategoryId",
                table: "Places");

            migrationBuilder.DropIndex(
                name: "IX_Places_PlactCategoryId",
                table: "Places");

            migrationBuilder.DropColumn(
                name: "PlactCategoryId",
                table: "Places");

            migrationBuilder.CreateTable(
                name: "PlaceCategoryMaps",
                columns: table => new
                {
                    PlaceId = table.Column<int>(type: "int", nullable: false),
                    CategoryId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlaceCategoryMaps", x => new { x.PlaceId, x.CategoryId });
                    table.ForeignKey(
                        name: "FK_PlaceCategoryMaps_PlaceCategories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "PlaceCategories",
                        principalColumn: "CategoryId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlaceCategoryMaps_Places_PlaceId",
                        column: x => x.PlaceId,
                        principalTable: "Places",
                        principalColumn: "PlaceId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PlaceCategoryMaps_CategoryId",
                table: "PlaceCategoryMaps",
                column: "CategoryId");
        }
    }
}
