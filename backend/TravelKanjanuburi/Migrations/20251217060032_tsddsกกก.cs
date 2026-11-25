using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KanjanaburiTravel.Migrations
{
    /// <inheritdoc />
    public partial class tsddsกกก : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RecommendationItems_Places_PlaceId",
                table: "RecommendationItems");

            migrationBuilder.DropForeignKey(
                name: "FK_RecommendationItems_Recommendations_RecommendationId",
                table: "RecommendationItems");

            migrationBuilder.DropForeignKey(
                name: "FK_Recommendations_Users_UserId",
                table: "Recommendations");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Recommendations",
                table: "Recommendations");

            migrationBuilder.DropPrimaryKey(
                name: "PK_RecommendationItems",
                table: "RecommendationItems");

            migrationBuilder.RenameTable(
                name: "Recommendations",
                newName: "Recommendation");

            migrationBuilder.RenameTable(
                name: "RecommendationItems",
                newName: "RecommendationItem");

            migrationBuilder.RenameIndex(
                name: "IX_Recommendations_UserId_RecType_GeneratedAt",
                table: "Recommendation",
                newName: "IX_Recommendation_UserId_RecType_GeneratedAt");

            migrationBuilder.RenameIndex(
                name: "IX_RecommendationItems_RecommendationId_RankIndex",
                table: "RecommendationItem",
                newName: "IX_RecommendationItem_RecommendationId_RankIndex");

            migrationBuilder.RenameIndex(
                name: "IX_RecommendationItems_PlaceId",
                table: "RecommendationItem",
                newName: "IX_RecommendationItem_PlaceId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Recommendation",
                table: "Recommendation",
                column: "RecommendationId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_RecommendationItem",
                table: "RecommendationItem",
                column: "RecommendationItemId");

            migrationBuilder.AddForeignKey(
                name: "FK_Recommendation_Users_UserId",
                table: "Recommendation",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_RecommendationItem_Places_PlaceId",
                table: "RecommendationItem",
                column: "PlaceId",
                principalTable: "Places",
                principalColumn: "PlaceId");

            migrationBuilder.AddForeignKey(
                name: "FK_RecommendationItem_Recommendation_RecommendationId",
                table: "RecommendationItem",
                column: "RecommendationId",
                principalTable: "Recommendation",
                principalColumn: "RecommendationId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Recommendation_Users_UserId",
                table: "Recommendation");

            migrationBuilder.DropForeignKey(
                name: "FK_RecommendationItem_Places_PlaceId",
                table: "RecommendationItem");

            migrationBuilder.DropForeignKey(
                name: "FK_RecommendationItem_Recommendation_RecommendationId",
                table: "RecommendationItem");

            migrationBuilder.DropPrimaryKey(
                name: "PK_RecommendationItem",
                table: "RecommendationItem");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Recommendation",
                table: "Recommendation");

            migrationBuilder.RenameTable(
                name: "RecommendationItem",
                newName: "RecommendationItems");

            migrationBuilder.RenameTable(
                name: "Recommendation",
                newName: "Recommendations");

            migrationBuilder.RenameIndex(
                name: "IX_RecommendationItem_RecommendationId_RankIndex",
                table: "RecommendationItems",
                newName: "IX_RecommendationItems_RecommendationId_RankIndex");

            migrationBuilder.RenameIndex(
                name: "IX_RecommendationItem_PlaceId",
                table: "RecommendationItems",
                newName: "IX_RecommendationItems_PlaceId");

            migrationBuilder.RenameIndex(
                name: "IX_Recommendation_UserId_RecType_GeneratedAt",
                table: "Recommendations",
                newName: "IX_Recommendations_UserId_RecType_GeneratedAt");

            migrationBuilder.AddPrimaryKey(
                name: "PK_RecommendationItems",
                table: "RecommendationItems",
                column: "RecommendationItemId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Recommendations",
                table: "Recommendations",
                column: "RecommendationId");

            migrationBuilder.AddForeignKey(
                name: "FK_RecommendationItems_Places_PlaceId",
                table: "RecommendationItems",
                column: "PlaceId",
                principalTable: "Places",
                principalColumn: "PlaceId");

            migrationBuilder.AddForeignKey(
                name: "FK_RecommendationItems_Recommendations_RecommendationId",
                table: "RecommendationItems",
                column: "RecommendationId",
                principalTable: "Recommendations",
                principalColumn: "RecommendationId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Recommendations_Users_UserId",
                table: "Recommendations",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
