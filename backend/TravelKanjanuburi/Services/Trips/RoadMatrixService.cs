using System.Globalization;
using System.Net.Http.Json;

namespace TravelKanjanuburi.Services.Trips
{
    public sealed class OsrmTableResponse
    {
        public string? code { get; set; }
        public List<List<double?>>? durations { get; set; }
        public List<List<double?>>? distances { get; set; }
    }

    /// <summary>ระยะ/เวลาขับรถจริงระหว่างสถานที่ (อ่านอย่างเดียว)</summary>
    public sealed class RoadMatrix
    {
        private readonly Dictionary<(int, int), (double km, int min)> _d;
        internal RoadMatrix(Dictionary<(int, int), (double km, int min)> d) => _d = d;

        public bool TryGet(int fromId, int toId, out double km, out int minutes)
        {
            if (fromId == toId) { km = 0; minutes = 0; return true; }
            if (_d.TryGetValue((fromId, toId), out var v)) { km = v.km; minutes = v.min; return true; }
            km = 0; minutes = 0; return false;
        }
    }

    /// <summary>
    /// ดึงระยะ/เวลาขับรถจริงจาก OSRM table API ทีเดียวแล้วแคชในหน่วยความจำ
    /// ล้มเหลวเมื่อไรจะคืน null ให้ผู้เรียก fallback เป็นเส้นตรง และไม่ยิง OSRM ซ้ำภายใน 10 นาที
    /// </summary>
    public sealed class RoadMatrixService : IRoadMatrixProvider
    {
        private const int Chunk = 50; // demo server จำกัดราว 100 พิกัดต่อคำขอ
        private static readonly TimeSpan RetryAfterFail = TimeSpan.FromMinutes(10);

        private readonly IHttpClientFactory _http;
        private readonly ILogger<RoadMatrixService> _log;
        private readonly SemaphoreSlim _lock = new(1, 1);

        private readonly Dictionary<int, (double lat, double lng)> _coords = new();
        private RoadMatrix? _matrix;
        private DateTime _failedAtUtc = DateTime.MinValue;

        public RoadMatrixService(IHttpClientFactory http, ILogger<RoadMatrixService> log)
        {
            _http = http;
            _log = log;
        }

        public async Task<RoadMatrix?> EnsureAsync(IEnumerable<Place> places, CancellationToken ct)
        {
            var wanted = places.GroupBy(p => p.PlaceId).Select(g => g.First()).ToList();

            await _lock.WaitAsync(ct);
            try
            {
                if (_matrix != null && wanted.All(p => _coords.TryGetValue(p.PlaceId, out var c)
                        && c.lat == p.Latitude && c.lng == p.Longitude))
                    return _matrix;

                if (DateTime.UtcNow - _failedAtUtc < RetryAfterFail) return null;

                // รวมของเดิม + ใหม่ แล้วสร้างใหม่ทั้งหมด (สถานที่มีหลักร้อย)
                var all = new Dictionary<int, (double lat, double lng)>(_coords);
                foreach (var p in wanted) all[p.PlaceId] = (p.Latitude, p.Longitude);

                var built = await BuildAsync(all, ct);
                if (built == null)
                {
                    _failedAtUtc = DateTime.UtcNow;
                    return null;
                }

                _coords.Clear();
                foreach (var kv in all) _coords[kv.Key] = kv.Value;
                _matrix = built;
                return _matrix;
            }
            finally { _lock.Release(); }
        }

        private async Task<RoadMatrix?> BuildAsync(Dictionary<int, (double lat, double lng)> all, CancellationToken ct)
        {
            try
            {
                var ids = all.Keys.OrderBy(x => x).ToList();
                var result = new Dictionary<(int, int), (double km, int min)>(ids.Count * ids.Count);
                var http = _http.CreateClient("osrm");

                for (int i = 0; i < ids.Count; i += Chunk)
                    for (int j = 0; j < ids.Count; j += Chunk)
                    {
                        var src = ids.Skip(i).Take(Chunk).ToList();
                        var dst = ids.Skip(j).Take(Chunk).ToList();
                        var coords = string.Join(";", src.Concat(dst).Select(id =>
                            $"{all[id].lng.ToString(CultureInfo.InvariantCulture)},{all[id].lat.ToString(CultureInfo.InvariantCulture)}"));
                        var sources = string.Join(";", Enumerable.Range(0, src.Count));
                        var dests = string.Join(";", Enumerable.Range(src.Count, dst.Count));
                        var url = $"table/v1/driving/{coords}" +
                                  $"?sources={sources}&destinations={dests}&annotations=duration,distance";

                        var r = await http.GetFromJsonAsync<OsrmTableResponse>(url, ct);
                        if (r?.code != "Ok" || r.durations == null || r.distances == null)
                        {
                            _log.LogWarning("[OSRM] table failed: code={Code}", r?.code);
                            return null;
                        }

                        for (int a = 0; a < src.Count; a++)
                            for (int b = 0; b < dst.Count; b++)
                            {
                                var sec = r.durations[a][b];
                                var m = r.distances[a][b];
                                if (sec == null || m == null) continue; // ถึงไม่ได้ → fallback รายคู่
                                result[(src[a], dst[b])] = (m.Value / 1000.0, (int)Math.Round(sec.Value / 60.0));
                            }
                    }

                _log.LogInformation("[OSRM] road matrix built: {N} places, {Pairs} pairs", ids.Count, result.Count);
                return new RoadMatrix(result);
            }
            catch (OperationCanceledException) { throw; }
            catch (Exception ex)
            {
                _log.LogWarning(ex, "[OSRM] road matrix unavailable; falling back to straight-line estimates");
                return null;
            }
        }
    }
}
