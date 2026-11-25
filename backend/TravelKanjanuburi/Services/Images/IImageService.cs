namespace TravelKanjanuburi.Services.Images
{
    public interface IImageService
    {
        Task<List<string>> UploadAsync(
            List<IFormFile> files,
            string folder,
            CancellationToken ct);

        void DeletePhysical(string? imageUrl);
    }

}
