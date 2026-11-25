using TravelKanjanuburi.Services.Interface;

public class LocalFileStorage : IFileStorage
{
    private readonly IWebHostEnvironment _env;

    public LocalFileStorage(IWebHostEnvironment env)
    {
        _env = env;
    }

    public async Task<string> SaveImageAsync(IFormFile file, string folder, CancellationToken ct = default)
    {
        if (file == null || file.Length == 0)
            throw new InvalidOperationException("ไฟล์ว่าง");

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowed = new HashSet<string> { ".jpg", ".jpeg", ".png", ".webp" };
        if (!allowed.Contains(ext))
            throw new InvalidOperationException("ชนิดไฟล์ไม่รองรับ");

        // โฟลเดอร์จริงบนดิสก์: wwwroot/uploads/avatars
        var root = _env.WebRootPath ?? "wwwroot";
        var physicalFolder = Path.Combine(root, folder.Replace("/", Path.DirectorySeparatorChar.ToString()));
        Directory.CreateDirectory(physicalFolder);

        var fileName = $"{Guid.NewGuid()}{ext}";
        var physicalPath = Path.Combine(physicalFolder, fileName);

        await using var stream = new FileStream(physicalPath, FileMode.Create);
        await file.CopyToAsync(stream, ct);

        // คืนค่าเป็น url สำหรับเก็บใน DB
        // เช่น "/uploads/avatars/xxxx.jpg"
        return "/" + folder.Trim('/').Replace("\\", "/") + "/" + fileName;
    }

    public void DeleteByRelativeUrl(string? relativeUrl)
    {
        if (string.IsNullOrWhiteSpace(relativeUrl)) return;

        // ป้องกันลบไฟล์มั่ว ๆ: ต้องเป็น path ภายใต้ wwwroot เท่านั้น
        if (!relativeUrl.StartsWith("/")) return;

        var root = _env.WebRootPath ?? "wwwroot";
        var physicalPath = Path.Combine(
            root,
            relativeUrl.TrimStart('/').Replace("/", Path.DirectorySeparatorChar.ToString())
        );

        if (File.Exists(physicalPath))
            File.Delete(physicalPath);
    }
}
