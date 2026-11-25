using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KanjanaburiTravel.Migrations
{
    /// <inheritdoc />
    public partial class LocalDishesImageก : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LocalDishesImage_LocalDishes_LocalDishDishId",
                table: "LocalDishesImage");

            migrationBuilder.DropIndex(
                name: "IX_LocalDishesImage_LocalDishDishId",
                table: "LocalDishesImage");

            migrationBuilder.DropColumn(
                name: "LocalDishDishId",
                table: "LocalDishesImage");

            migrationBuilder.CreateIndex(
                name: "IX_LocalDishesImage_DishId",
                table: "LocalDishesImage",
                column: "DishId");

            migrationBuilder.AddForeignKey(
                name: "FK_LocalDishesImage_LocalDishes_DishId",
                table: "LocalDishesImage",
                column: "DishId",
                principalTable: "LocalDishes",
                principalColumn: "DishId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LocalDishesImage_LocalDishes_DishId",
                table: "LocalDishesImage");

            migrationBuilder.DropIndex(
                name: "IX_LocalDishesImage_DishId",
                table: "LocalDishesImage");

            migrationBuilder.AddColumn<int>(
                name: "LocalDishDishId",
                table: "LocalDishesImage",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_LocalDishesImage_LocalDishDishId",
                table: "LocalDishesImage",
                column: "LocalDishDishId");

            migrationBuilder.AddForeignKey(
                name: "FK_LocalDishesImage_LocalDishes_LocalDishDishId",
                table: "LocalDishesImage",
                column: "LocalDishDishId",
                principalTable: "LocalDishes",
                principalColumn: "DishId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
