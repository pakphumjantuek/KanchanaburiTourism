import { useEffect, useRef } from "react";
import { Crosshair, Maximize2, Minimize2, Scan } from "lucide-react";
import type { LatLng } from "../../utils/osrm";
import {
  initLongdoMap,
  renderMarkers,
  renderLegs,
  type LegView,
  setCenter,
  zoomTo,
} from "./longdoMapAdapter";

type MarkerModel = {
  placeId: number;
  lat: number;
  lng: number;
  title: string;
  badge: string;
  tone: "start" | "end" | "num";
};

type Props = {
  center: LatLng;
  markers: MarkerModel[];
  legs: LegView[];
  activeLeg: number | null;
  hoveredPlaceId: number | null;

  isFullscreen: boolean;
  onToggleFullscreen: () => void;

  onClickPlace: (placeId: number) => void;

  onMapReady?: (map: any) => void;

  onFit: () => void;
  onCenter: () => void;

  bottomOverlay?: React.ReactNode;
};

const HOVER_ZOOM_DELAY = 200;

export function TripMapView({
  center,
  markers,
  legs,
  activeLeg,
  hoveredPlaceId,
  isFullscreen,
  onToggleFullscreen,
  onClickPlace,
  onMapReady,
  onFit,
  onCenter,
  bottomOverlay,
}: Props) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerById = useRef<Map<number, any>>(new Map());
  const polylineRef = useRef<any>(null);

  // debounce hover zoom
  const hoverTimerRef = useRef<number | null>(null);
  const lastHoveredIdRef = useRef<number | null>(null);

  // init once
  useEffect(() => {
    if (!mapDivRef.current) return;
    if (!window.longdo) return;
    if (mapRef.current) return;

    const map = initLongdoMap(mapDivRef.current, center);
    mapRef.current = map;

    if (map && onMapReady) onMapReady(map);

    return () => {
      if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
      lastHoveredIdRef.current = null;

      mapRef.current = null;
      markerById.current.clear();
      polylineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep center on changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    setCenter(map, center);
  }, [center]);

  // render markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    renderMarkers({
      map,
      markers,
      markerById: markerById.current,
      onClickPlace,
      activeId: hoveredPlaceId,
    });
  }, [markers, onClickPlace, hoveredPlaceId]);

  // render polyline
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    renderLegs({ map, legs, activeLeg, polylineRef });
  }, [legs, activeLeg]);

  // hovered -> zoom (debounced)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = null;

    if (!hoveredPlaceId) {
      lastHoveredIdRef.current = null;
      return;
    }
    if (lastHoveredIdRef.current === hoveredPlaceId) return;

    hoverTimerRef.current = window.setTimeout(() => {
      const mk = markerById.current.get(hoveredPlaceId);
      const loc = mk?.location?.() ?? mk?._location;
      if (!loc) return;

      zoomTo(map, loc.lat, loc.lon, 15);
      lastHoveredIdRef.current = hoveredPlaceId;
    }, HOVER_ZOOM_DELAY);

    return () => {
      if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    };
  }, [hoveredPlaceId]);

  return (
    <div className="relative h-full rounded-3xl overflow-hidden border border-[#e2bfb5]/50 bg-[#f3ede7] shadow-md">
      <div className="absolute z-20 top-3 right-3 flex flex-col gap-2">
        {[
          { onClick: onFit, label: "ดูทุกจุด", Icon: Scan },
          { onClick: onCenter, label: "กลับจุดเริ่ม", Icon: Crosshair },
          {
            onClick: onToggleFullscreen,
            label: isFullscreen ? "ออกจากเต็มจอ" : "เต็มจอ",
            Icon: isFullscreen ? Minimize2 : Maximize2,
          },
        ].map(({ onClick, label, Icon }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            title={label}
            aria-label={label}
            className="w-11 h-11 rounded-full bg-white/95 backdrop-blur shadow-md text-[#141c23] flex items-center justify-center hover:text-[#d84a1b] transition-colors"
          >
            <Icon className="w-5 h-5" />
          </button>
        ))}
      </div>

      {bottomOverlay && (
        <div className="absolute z-20 bottom-3 inset-x-3 flex justify-center pointer-events-none [&>*]:pointer-events-auto">
          {bottomOverlay}
        </div>
      )}

      <div className="absolute z-20 top-3 left-3 rounded-full bg-white/95 backdrop-blur px-3.5 py-2 text-[13px] font-bold text-[#5a413a] shadow-md flex items-center gap-3">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#16693c]" />เริ่ม</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#d84a1b]" />แวะ</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#141c23]" />จบ</span>
      </div>

      {window.longdo ? (
        <div ref={mapDivRef} className="h-full w-full" />
      ) : (
        <div className="h-full w-full flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border p-4 bg-white">
            <div className="font-extrabold text-red-700">
              Longdo Map SDK ยังไม่ถูกโหลด
            </div>
            <div className="text-sm text-gray-600 mt-2">
              เพิ่ม script ใน{" "}
              <span className="font-mono">public/index.html</span>:
              <div className="mt-2 rounded bg-gray-100 p-2 text-xs font-mono">
                {
                  '<script src="https://api.longdo.com/map3/?key=YOUR-KEY"></script>'
                }
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
