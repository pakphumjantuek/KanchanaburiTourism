import { useCallback, useEffect, useState } from "react";

type GeoState = {
  lat: number | null;
  lng: number | null;
  loading: boolean;
  error: string | null;
  permission: "prompt" | "granted" | "denied" | "unknown";
};

export function useGeoLocation(auto = true) {
  const [state, setState] = useState<GeoState>({
    lat: null,
    lng: null,
    loading: false,
    error: null,
    permission: "unknown",
  });

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({
        ...s,
        error: "เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง (geolocation)",
        permission: "unknown",
      }));
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState((s) => ({
          ...s,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          loading: false,
          error: null,
          permission: "granted",
        }));
      },
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? "คุณปฏิเสธการเข้าถึงตำแหน่ง (Location denied)"
            : err.code === err.POSITION_UNAVAILABLE
            ? "ไม่สามารถระบุตำแหน่งได้ (Position unavailable)"
            : "หมดเวลาในการขอตำแหน่ง (Timeout)";

        setState((s) => ({
          ...s,
          loading: false,
          error: msg,
          permission: err.code === err.PERMISSION_DENIED ? "denied" : "unknown",
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  }, []);

  // auto request once
  useEffect(() => {
    if (!auto) return;
    request();
  }, [auto, request]);

  return { ...state, request };
}
