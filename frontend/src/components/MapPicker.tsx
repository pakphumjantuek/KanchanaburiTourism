import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

type Props = {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number, address?: string) => void;
  /** โหมดง่าย: ซ่อนละติจูด/ลองจิจูด/สถานะ (สำหรับผู้ใช้ทั่วไป) */
  simple?: boolean;
};

function ClickToPick({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { duration: 0.6 });
  }, [lat, lng, map]);
  return null;
}

async function reverseGeocode(lat: number, lng: number) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
    { headers: { "Accept-Language": "th" } }
  );
  if (!res.ok) return undefined;
  const data = await res.json();
  return (data?.display_name as string | undefined) ?? undefined;
}

type SearchItem = {
  display_name: string;
  lat: string;
  lon: string;
};

async function searchPlaces(q: string, signal?: AbortSignal) {
  const url =
    `https://nominatim.openstreetmap.org/search?` +
    new URLSearchParams({
      format: "jsonv2",
      q,
      limit: "12", // เพิ่มจำนวน
      addressdetails: "1",
      "accept-language": "th",
      countrycodes: "th", // ✅ ล็อคไทย
      viewbox: "98.16,15.73,99.94,13.70", // กรอบประมาณๆ กาญจนบุรี
    }).toString();

  const res = await fetch(url, {
    signal,
    headers: {
      "User-Agent": "YourAppName/1.0 (contact@example.com)", // ✅ สำคัญมาก
    },
  });
  if (!res.ok) return [];
  return (await res.json()) ?? [];
}

function fmt(n: number) {
  return Number.isFinite(n) ? n.toFixed(6) : "-";
}

export default function MapPicker({ lat, lng, onChange, simple = false }: Props) {
  const [isLocating, setIsLocating] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  // search UI
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchItem[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const latTxt = useMemo(() => fmt(lat), [lat]);
  const lngTxt = useMemo(() => fmt(lng), [lng]);

  const pickAndResolve = async (la: number, lo: number) => {
    setIsResolving(true);
    setHint(null);
    try {
      const addr = await reverseGeocode(la, lo);
      onChange(la, lo, addr);
      if (!addr) setHint("หาที่อยู่ไม่เจอ ลองปักหมุดใหม่ หรือพิมพ์ที่อยู่เองในช่องด้านล่าง");
    } catch {
      onChange(la, lo);
      setHint("ดึงที่อยู่ไม่สำเร็จ พิมพ์ที่อยู่เองในช่องด้านล่างได้");
    } finally {
      setIsResolving(false);
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setHint("เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง");
      return;
    }
    setIsLocating(true);
    setHint(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const la = pos.coords.latitude;
        const lo = pos.coords.longitude;
        await pickAndResolve(la, lo);
        setIsLocating(false);
      },
      (err) => {
        setHint("ไม่สามารถดึงตำแหน่งได้: " + err.message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // debounce search
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      setIsSearching(false);
      abortRef.current?.abort();
      return;
    }

    setIsSearching(true);
    setHint(null);

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    const t = setTimeout(async () => {
      try {
        const r = await searchPlaces(q, ac.signal);
        setResults(r);
      } catch (e: any) {
        if (e?.name !== "AbortError") setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [query]);

  const handlePickResult = async (item: SearchItem) => {
    const la = Number(item.lat);
    const lo = Number(item.lon);
    setResults([]);
    // ตั้ง query ให้เป็นชื่อที่เลือก (ดูดี)
    setQuery(item.display_name);
    await pickAndResolve(la, lo);
  };

  return (
    <div className="rounded-2xl border bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
        <div>
          <div className="text-lg font-semibold text-gray-900">
            เลือกตำแหน่งบนแผนที่
          </div>
          <div className="text-sm text-gray-500">
            ค้นหา / คลิกเพื่อปักหมุด หรือใช้ GPS ปัจจุบัน
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            className="rounded-lg bg-emerald-600 px-4 py-2.5 text-base font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70 active:scale-[0.99]"
          >
            {isLocating ? "กำลังหา..." : "ใช้ตำแหน่งฉัน"}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาสถานที่/ที่อยู่ (พิมพ์อย่างน้อย 3 ตัวอักษร)"
            className="h-[50px] w-full rounded-xl border px-3.5 py-2.5 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
          />

          {/* Dropdown results */}
          {(isSearching || results.length > 0) && (
            <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border bg-white shadow-lg">
              {isSearching && (
                <div className="px-4 py-3 text-base text-gray-600">
                  กำลังค้นหา...
                </div>
              )}

              {!isSearching &&
                results.length === 0 &&
                query.trim().length >= 3 && (
                  <div className="px-4 py-3 text-base text-gray-600">
                    ไม่พบผลลัพธ์
                  </div>
                )}

              {!isSearching &&
                results.map((r, idx) => (
                  <button
                    key={`${r.lat}-${r.lon}-${idx}`}
                    type="button"
                    onClick={() => void handlePickResult(r)}
                    className="w-full text-left px-4 py-3 text-base hover:bg-gray-50"
                  >
                    <div className="font-medium text-gray-900 line-clamp-1">
                      {r.display_name}
                    </div>
                    <div className="mt-0.5 font-mono text-sm text-gray-500">
                      {Number(r.lat).toFixed(6)}, {Number(r.lon).toFixed(6)}
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Info bar */}
        {!simple && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-xl bg-gray-50 px-3 py-2">
            <div className="text-sm text-gray-500">ละติจูด</div>
            <div className="font-mono text-base text-gray-900">{latTxt}</div>
          </div>
          <div className="rounded-xl bg-gray-50 px-3 py-2">
            <div className="text-sm text-gray-500">ลองจิจูด</div>
            <div className="font-mono text-base text-gray-900">{lngTxt}</div>
          </div>
          <div className="rounded-xl bg-gray-50 px-3 py-2">
            <div className="text-sm text-gray-500">สถานะ</div>
            <div className="text-base text-gray-900">
              {isResolving ? "กำลังดึงที่อยู่..." : "พร้อมใช้งาน"}
            </div>
          </div>
        </div>
        )}

        {/* Map */}
        <div className="relative overflow-hidden rounded-2xl border">
          <div className="h-[360px] w-full sm:h-[440px] 2xl:h-[540px]">
            <MapContainer
              center={[lat, lng]}
              zoom={14}
              zoomControl={false}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <ZoomControl position="bottomright" />
              <FlyTo lat={lat} lng={lng} />

              <ClickToPick onPick={(la, lo) => void pickAndResolve(la, lo)} />

              <Marker position={[lat, lng]} />
            </MapContainer>
          </div>

          {/* overlay helper */}
          <div className="pointer-events-none absolute left-3 top-3 rounded-xl bg-white/90 px-3 py-2 text-sm text-gray-700 shadow-sm ring-1 ring-black/5">
            คลิกเพื่อปักหมุด
          </div>

          {/* loading overlay */}
          {isResolving && (
            <div className="absolute inset-0 grid place-items-center bg-white/40 backdrop-blur-[1px]">
              <div className="rounded-xl bg-white px-4 py-3 text-base text-gray-800 shadow-md ring-1 ring-black/5">
                กำลังดึงที่อยู่จากพิกัด...
              </div>
            </div>
          )}
        </div>

        {/* Hint / error */}
        {hint && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {hint}
          </div>
        )}

        <div className="text-sm text-gray-500">
          • เคล็ดลับ: ซูมเข้าแล้วคลิกใกล้จุดจริง จะได้ที่อยู่แม่นขึ้น
        </div>
      </div>
    </div>
  );
}
