// src/pages/TripMapPageLongdoOsrm.tsx
import { useEffect, useMemo, useState } from "react";
import type { LatLng } from "../../../lib/longdo";
import { LongdoMap } from "../../../components/LongdoMap";

type OsrmResponse = {
  routes?: Array<{
    distance: number;
    duration: number;
    geometry: { coordinates: Array<[number, number]>; type: "LineString" };
  }>;
};

export default function TripMapPageLongdoOsrm() {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [routePoints, setRoutePoints] = useState<LatLng[]>([]);

  const markers = useMemo(() => {
    return [
      { id: 1, lat: 13.764953, lng: 100.538316, title: "Victory monument", badge: "1" },
      { id: 2, lat: 13.7563, lng: 100.5018, title: "Bangkok center", badge: "2" },
      { id: 3, lat: 13.736717, lng: 100.523186, title: "Silom", badge: "3" },
    ];
  }, []);

  const center: LatLng = [markers[0].lat, markers[0].lng];

  useEffect(() => {
    const run = async () => {
      if (markers.length < 2) return;

      const coordStr = markers.map((m) => `${m.lng},${m.lat}`).join(";");
      const url =
        `https://router.project-osrm.org/route/v1/driving/${coordStr}` +
        `?overview=full&geometries=geojson&steps=false`;

      const res = await fetch(url);
      const json = (await res.json()) as OsrmResponse;

      const r = json.routes?.[0];
      if (!r) return;

      const pts = r.geometry.coordinates.map(([lng, lat]) => [lat, lng] as LatLng);
      setRoutePoints(pts);
    };

    run();
  }, [markers]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left list */}
        <div className="lg:col-span-4 bg-white rounded-2xl border shadow-sm p-3">
          <div className="font-bold mb-2">Places</div>
          {markers.map((m) => (
            <div
              key={m.id}
              onMouseEnter={() => setHoveredId(m.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="p-3 rounded-xl border hover:bg-gray-50 cursor-pointer mb-2"
            >
              <div className="font-semibold">{m.title}</div>
              <div className="text-xs text-gray-600">
                {m.lat}, {m.lng}
              </div>
            </div>
          ))}
        </div>

        {/* Map */}
        <div className="lg:col-span-8 bg-white rounded-2xl border shadow-sm overflow-hidden">
          <LongdoMap
            center={center}
            markers={markers}
            hoveredId={hoveredId}
            routeMode="osrm"
            routePoints={routePoints}
            heightClass="h-[75vh]"
          />
        </div>
      </div>
    </div>
  );
}
