namespace TravelKanjanuburi.Services.Interface
{
    public interface IFileStorage
    {
        Task<string> SaveImageAsync(IFormFile file, string folder, CancellationToken ct = default);
        void DeleteByRelativeUrl(string? relativeUrl);
    }
}
