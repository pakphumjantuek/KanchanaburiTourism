using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KanjanaburiTravel.Migrations
{
    /// <inheritdoc />
    public partial class LocalDishesImage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "LocalDishes");

            migrationBuilder.CreateTable(
                name: "LocalDishesImage",
                columns: table => new
                {
                    ImageId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DishId = table.Column<int>(type: "int", nullable: false),
                    LocalDishDishId = table.Column<int>(type: "int", nullable: false),
                    ImageUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    IsCover = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LocalDishesImage", x => x.ImageId);
                    table.ForeignKey(
                        name: "FK_LocalDishesImage_LocalDishes_LocalDishDishId",
                        column: x => x.LocalDishDishId,
                        principalTable: "LocalDishes",
                        principalColumn: "DishId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LocalDishesImage_LocalDishDishId",
                table: "LocalDishesImage",
                column: "LocalDishDishId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LocalDishesImage");

            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "LocalDishes",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);
        }
    }
}
