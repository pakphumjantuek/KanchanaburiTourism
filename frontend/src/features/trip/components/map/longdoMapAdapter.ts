import type { LatLng } from "../../utils/osrm";
import { makeBadgeHtml } from "./makeBadgeHtml";

declare global {
  interface Window {
    longdo?: any;
  }
}

export function initLongdoMap(placeholder: HTMLDivElement, center: LatLng) {
  const longdo = window.longdo;
  if (!longdo) return null;

  const map = new longdo.Map({ placeholder });

  map.Event.bind("ready", () => {
    // พื้นหลังโทนเทา ให้หมุด/เส้นทางเด่น + ซ่อน UI ที่ซ้ำกับปุ่มของเรา
    if (longdo.Layers?.GRAY) map.Layers?.setBase?.(longdo.Layers.GRAY);
    else placeholder.style.filter = "saturate(0.35)";
    map.Ui?.Toolbar?.visible?.(false);
    map.Ui?.LayerSelector?.visible?.(false);
    map.Ui?.Crosshair?.visible?.(false);
    map.Ui?.DPad?.visible?.(false);

    map.location({ lon: center[1], lat: center[0] }, true);
    map.zoom(12, true);
  });

  return map;
}

export function clearOverlays(map: any, markerById: Map<number, any>, polylineRef: { current: any | null }) {
  for (const [, mk] of markerById) map.Overlays.remove(mk);
  markerById.clear();

  removeLines(map, polylineRef);
}

// polylineRef เก็บ [เส้นขอบขาว, เส้นสี]
function removeLines(map: any, polylineRef: { current: any | null }) {
  for (const pl of polylineRef.current ?? []) map.Overlays.remove(pl);
  polylineRef.current = null;
}

export function renderMarkers(params: {
  map: any;
  markers: Array<{ placeId: number; lat: number; lng: number; title: string; badge: string; tone: "start" | "end" | "num" }>;
  markerById: Map<number, any>;
  onClickPlace?: (placeId: number) => void;
  activeId?: number | null;
}) {
  const { map, markers, markerById, onClickPlace, activeId } = params;
  const longdo = window.longdo;
  if (!longdo) return;

  // Longdo ส่ง click ของหมุดผ่าน map "overlayClick" — bind ครั้งเดียว แล้วอัปเดต handler ทุก render
  map.__onPlaceClick = onClickPlace;
  if (!map.__overlayClickBound) {
    map.Event.bind("overlayClick", (overlay: any) => {
      if (overlay?.__placeId != null) map.__onPlaceClick?.(overlay.__placeId);
    });
    map.__overlayClickBound = true;
  }

  // clear old markers only
  for (const [, mk] of markerById) map.Overlays.remove(mk);
  markerById.clear();

  for (const m of markers) {
    const mk = new longdo.Marker(
      { lon: m.lng, lat: m.lat },
      {
        // ไม่ใส่ title/detail → ไม่ให้ Longdo เปิด popup ของตัวเองทับการ์ดสถานที่ของเรา
        icon: {
          html: makeBadgeHtml(
            m.badge,
            m.tone,
            activeId == null ? "normal" : activeId === m.placeId ? "active" : "dim",
            m.title
          ),
          // ปลายหมุด: กึ่งกลางกล่องกว้าง 64px, ใต้หัวหมุด 38px + ปลายแหลม ~8px
          offset: { x: 32, y: 46 },
        },
      }
    );

    mk.__placeId = m.placeId;
    map.Overlays.add(mk);
    markerById.set(m.placeId, mk);
  }
}

export type LegView = {
  points: LatLng[];
  color: string;
  straight: boolean;
  label: string; // "1→2 · 12.4 กม. · 18 นาที"
};

const hexToRgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

// วาดทีละช่วง (ขอบขาว + สีของช่วง) + ป้ายกลางเส้น; ช่วงที่ไม่ active จะจาง
export function renderLegs(params: {
  map: any;
  legs: LegView[];
  activeLeg: number | null;
  polylineRef: { current: any | null };
}) {
  const { map, legs, activeLeg, polylineRef } = params;
  const longdo = window.longdo;
  if (!longdo) return;

  removeLines(map, polylineRef);
  const overlays: any[] = [];
  const dashed = longdo.LineStyle?.Dashed;
  // ป้ายเยอะจะทับกันตอนซูมออก → แสดงทุกป้ายเมื่อ ≤ 6 ช่วง ไม่งั้นเฉพาะช่วงที่ดูอยู่
  const showAllLabels = legs.length <= 6;

  legs.forEach((leg, i) => {
    const line = leg.points.map(([lat, lng]) => ({ lon: lng, lat }));
    const dim = activeLeg != null && activeLeg !== i;
    const style = leg.straight && dashed ? { lineStyle: dashed } : {};

    const outline = new longdo.Polyline(line, { lineWidth: 9, lineColor: `rgba(255,255,255,${dim ? 0.5 : 0.95})`, ...style });
    const main = new longdo.Polyline(line, { lineWidth: activeLeg === i ? 7 : 5, lineColor: hexToRgba(leg.color, dim ? 0.3 : 1), ...style });
    overlays.push(outline, main);

    if ((showAllLabels && activeLeg == null) || activeLeg === i) {
      const [lat, lng] = leg.points[Math.floor(leg.points.length / 2)];
      overlays.push(
        new longdo.Marker(
          { lon: lng, lat },
          {
            icon: {
              html: `<div style="transform:translate(-50%,-50%);white-space:nowrap;padding:3px 9px;border-radius:999px;
                       background:${leg.color};color:#fff;font-size:11px;font-weight:800;border:2px solid #fff;
                       box-shadow:0 3px 8px rgba(20,28,35,.3);font-family:inherit;">${leg.label}</div>`,
              offset: { x: 0, y: 0 },
            },
          }
        )
      );
    }
  });

  for (const o of overlays) map.Overlays.add(o);
  polylineRef.current = overlays;
}

export function setCenter(map: any, center: LatLng) {
  map.location({ lon: center[1], lat: center[0] }, true);
}

export function zoomTo(map: any, lat: number, lng: number, minZoom = 15) {
  map.location({ lon: lng, lat }, true);
  map.zoom(Math.max(map.zoom(), minZoom), true);
}

export function fitPoints(map: any, points: LatLng[]) {
  if (!points.length) return;

  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  for (const [lat, lng] of points) {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  }

  const midLat = (minLat + maxLat) / 2;
  const midLng = (minLng + maxLng) / 2;
  const span = Math.max(maxLat - minLat, maxLng - minLng);

  const zoomFromSpan = (s: number) => {
    if (s > 10) return 6;
    if (s > 5) return 7;
    if (s > 3) return 8;
    if (s > 1.5) return 9;
    if (s > 0.8) return 10;
    if (s > 0.35) return 11;
    if (s > 0.18) return 12;
    return 13;
  };

  map.location({ lon: midLng, lat: midLat }, true);
  map.zoom(Math.max(3, Math.min(18, zoomFromSpan(span))), true);
}
