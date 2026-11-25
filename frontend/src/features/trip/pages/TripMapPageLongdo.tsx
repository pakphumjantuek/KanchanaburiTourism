// src/pages/TripMapPageLongdo.tsx
import { useMemo, useRef, useState } from "react";
import type { LatLng } from "../../../lib/longdo";
import { LongdoMap } from "../../../components/LongdoMap";


export default function TripMapPageLongdo() {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const routePanelRef = useRef<HTMLDivElement | null>(null);

  // DEMO points
  const markers = useMemo(() => {
    return [
      { id: 1, lat: 13.764953, lng: 100.538316, title: "Victory monument", badge: "เริ่ม" },
      { id: 2, lat: 15.0, lng: 100.0, title: "Point B", badge: "จบ" },
    ];
  }, []);

  const center: LatLng = [markers[0].lat, markers[0].lng];

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

          <div className="mt-4">
            <div className="font-semibold mb-2">Route Result</div>
            <div ref={routePanelRef} className="h-[260px] overflow-auto border rounded-xl bg-white" />
          </div>
        </div>

        {/* Map */}
        <div className="lg:col-span-8 bg-white rounded-2xl border shadow-sm overflow-hidden">
          <LongdoMap
            center={center}
            markers={markers}
            hoveredId={hoveredId}
            routeMode="longdo"
            routePanelEl={routePanelRef.current}
            heightClass="h-[75vh]"
          />
        </div>
      </div>
    </div>
  );
}
