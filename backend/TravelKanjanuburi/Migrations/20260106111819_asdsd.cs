using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KanjanaburiTravel.Migrations
{
    /// <inheritdoc />
    public partial class asdsd : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CloseTime",
                table: "Places");

            migrationBuilder.DropColumn(
                name: "OpenTime",
                table: "Places");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<TimeOnly>(
                name: "CloseTime",
                table: "Places",
                type: "time",
                nullable: true);

            migrationBuilder.AddColumn<TimeOnly>(
                name: "OpenTime",
                table: "Places",
                type: "time",
                nullable: true);
        }
    }
}
