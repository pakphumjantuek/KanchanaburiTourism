using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KanjanaburiTravel.Migrations
{
    /// <inheritdoc />
    public partial class TagDescription : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TagDescription",
                table: "Tags",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TagDescription",
                table: "Tags");
        }
    }
}
