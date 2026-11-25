// src/components/LongdoMap.tsx
import { useEffect, useMemo, useRef } from "react";
import { ensureLongdoLoaded, type LatLng, toLonLat } from "../lib/longdo";

type MarkerItem = {
  id: number;
  lat: number;
  lng: number;
  title: string;
  detail?: string;
  badge?: string; // เช่น "1", "เริ่ม", "จบ"
};

export function LongdoMap({
  center,
  markers,
  hoveredId,
  heightClass = "h-[70vh]",
  // ----- Route mode -----
  routeMode,
  routePoints, // ใช้เมื่อ routeMode="osrm"
  routePanelEl, // ใช้เมื่อ routeMode="longdo"
}: {
  center: LatLng;
  markers: MarkerItem[];
  hoveredId: number | null;
  heightClass?: string;

  routeMode: "none" | "longdo" | "osrm";
  routePoints?: LatLng[];
  routePanelEl?: HTMLDivElement | null;
}) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);

  const markerRefById = useRef<Map<number, any>>(new Map());
  const polylineRef = useRef<any>(null);

  const longdo = useMemo(() => {
    try {
      return ensureLongdoLoaded();
    } catch {
      return null;
    }
  }, []);

  // init map once
  useEffect(() => {
    if (!mapDivRef.current) return;
    if (!longdo) return;
    if (mapRef.current) return;

    const map = new longdo.Map({ placeholder: mapDivRef.current });
    mapRef.current = map;

    map.Event.bind("ready", () => {
      map.location(toLonLat(center), true);
      map.zoom(12, true);
    });

    return () => {
      mapRef.current = null;
      markerRefById.current.clear();
      polylineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [longdo]);

  // set center when center changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !longdo) return;
    map.location(toLonLat(center), true);
  }, [center, longdo]);

  // render markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !longdo) return;

    // clear old markers
    for (const [, mk] of markerRefById.current) {
      map.Overlays.remove(mk);
    }
    markerRefById.current.clear();

    markers.forEach((m) => {
      const mk = new longdo.Marker(
        { lon: m.lng, lat: m.lat },
        {
          title: m.title,
          detail: m.detail ?? "",
          // ทำ icon เป็น badge (optional)
          icon: m.badge
            ? {
                html: `<div style="
                  width:36px;height:36px;border-radius:9999px;
                  background:#111827;color:white;font-weight:900;
                  display:flex;align-items:center;justify-content:center;
                  border:2px solid rgba(255,255,255,.95);
                  box-shadow:0 10px 22px rgba(0,0,0,.22);
                ">${m.badge}</div>`,
                offset: { x: 18, y: 36 },
              }
            : undefined,
        }
      );

      map.Overlays.add(mk);
      markerRefById.current.set(m.id, mk);
    });
  }, [markers, longdo]);

  // hover -> flyTo
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !longdo) return;
    if (!hoveredId) return;

    const mk = markerRefById.current.get(hoveredId);
    if (!mk) return;

    const loc = mk.location?.() ?? mk._location;
    if (!loc) return;

    map.location(loc, true);
    map.zoom(Math.max(map.zoom(), 15), true);
  }, [hoveredId, longdo]);

  // ----- Route: Longdo Route mode -----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !longdo) return;
    if (routeMode !== "longdo") return;

    const run = () => {
      map.Route.clear();

      if (routePanelEl) {
        map.Route.placeholder(routePanelEl);
      }

      // add points (ตาม marker order)
      markers.forEach((m) => {
        map.Route.add({ lon: m.lng, lat: m.lat });
      });

      if (markers.length >= 2) map.Route.search();
    };

    map.Event.bind("ready", run);
    // บางเวอร์ชัน ready มาแล้วก็เรียกได้เลย
    try {
      run();
    } catch {}

    // ไม่ unbind ง่าย ๆ ในบางเวอร์ชัน เลยไม่ทำ
  }, [routeMode, markers, routePanelEl, longdo]);

  // ----- Route: OSRM polyline mode -----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !longdo) return;
    if (routeMode !== "osrm") return;

    // remove old polyline
    if (polylineRef.current) {
      map.Overlays.remove(polylineRef.current);
      polylineRef.current = null;
    }

    if (!routePoints || routePoints.length === 0) return;

    const line = routePoints.map(([lat, lng]) => ({ lon: lng, lat }));
    const pl = new longdo.Polyline(line, { lineWidth: 6 });

    map.Overlays.add(pl);
    polylineRef.current = pl;
  }, [routeMode, routePoints, longdo]);

  if (!longdo) {
    return (
      <div className={`${heightClass} w-full rounded-2xl border bg-white p-4`}>
        <div className="font-semibold text-red-700">Longdo SDK ยังไม่ถูกโหลด</div>
        <div className="text-sm text-gray-600 mt-1">
          เพิ่ม script ใน public/index.html:
          <div className="mt-2 rounded bg-gray-100 p-2 text-xs font-mono">
            {"<script src=\"https://api.longdo.com/map3/?key=YOUR_KEY\"></script>"}
          </div>
        </div>
      </div>
    );
  }

  return <div ref={mapDivRef} className={`${heightClass} w-full`} />;
}
