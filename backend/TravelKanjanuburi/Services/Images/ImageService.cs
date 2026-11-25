using TravelKanjanuburi.Services.Images;

public class ImageService : IImageService
{
    private readonly IWebHostEnvironment _env;

    public ImageService(IWebHostEnvironment env)
    {
        _env = env;
    }

    public async Task<List<string>> UploadAsync(
        List<IFormFile> files,
        string folder,
        CancellationToken ct)
    {
        var urls = new List<string>();
        var root = _env.WebRootPath ?? "wwwroot";
        var uploadPath = Path.Combine(root, folder);

        Directory.CreateDirectory(uploadPath);

        foreach (var file in files)
        {
            if (file.Length == 0) continue;

            var ext = Path.GetExtension(file.FileName);
            var fileName = $"{Guid.NewGuid()}{ext}";
            var physicalPath = Path.Combine(uploadPath, fileName);

            await using var stream = new FileStream(physicalPath, FileMode.Create);
            await file.CopyToAsync(stream, ct);

            var url = "/" + Path.Combine(folder, fileName)
                .Replace("\\", "/");

            urls.Add(url);
        }

        return urls;
    }

    public void DeletePhysical(string? imageUrl)
    {
        if (string.IsNullOrWhiteSpace(imageUrl)) return;

        var root = _env.WebRootPath ?? "wwwroot";
        var physical = Path.Combine(
            root,
            imageUrl.TrimStart('/')
                    .Replace("/", Path.DirectorySeparatorChar.ToString())
        );

        if (File.Exists(physical))
            File.Delete(physical);
    }
}
