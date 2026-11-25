// src/lib/longdo.ts
declare global {
  interface Window {
    longdo?: any;
  }
}

export function ensureLongdoLoaded(): any {
  if (!window.longdo) {
    throw new Error(
      "Longdo Map SDK not loaded. Add <script src='https://api.longdo.com/map3/?key=...'></script> in public/index.html"
    );
  }
  return window.longdo;
}

export type LatLng = [number, number]; // [lat, lng]
export type LonLat = { lon: number; lat: number };

export function toLonLat([lat, lng]: LatLng): LonLat {
  return { lon: lng, lat };
}
