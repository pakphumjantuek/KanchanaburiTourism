using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KanjanaburiTravel.Migrations
{
    /// <inheritdoc />
    public partial class fkPlaceCategoryd : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Places_PlaceCategories_PlactCategoryId",
                table: "Places");

            migrationBuilder.DropColumn(
                name: "PlaceType",
                table: "Places");

            migrationBuilder.RenameColumn(
                name: "PlactCategoryId",
                table: "Places",
                newName: "CategoryId");

            migrationBuilder.RenameIndex(
                name: "IX_Places_PlactCategoryId",
                table: "Places",
                newName: "IX_Places_CategoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_Places_PlaceCategories_CategoryId",
                table: "Places",
                column: "CategoryId",
                principalTable: "PlaceCategories",
                principalColumn: "CategoryId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Places_PlaceCategories_CategoryId",
                table: "Places");

            migrationBuilder.RenameColumn(
                name: "CategoryId",
                table: "Places",
                newName: "PlactCategoryId");

            migrationBuilder.RenameIndex(
                name: "IX_Places_CategoryId",
                table: "Places",
                newName: "IX_Places_PlactCategoryId");

            migrationBuilder.AddColumn<int>(
                name: "PlaceType",
                table: "Places",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddForeignKey(
                name: "FK_Places_PlaceCategories_PlactCategoryId",
                table: "Places",
                column: "PlactCategoryId",
                principalTable: "PlaceCategories",
                principalColumn: "CategoryId");
        }
    }
}
