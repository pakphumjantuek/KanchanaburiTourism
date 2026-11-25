import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGetTripDetailQuery,
  useSaveRouteMutation,
  useGetTripMapViewQuery, // ✅ NEW
} from "../tripApi";
import { usePlacesByIds } from "../hooks/usePlacesByIds";

type LatLng = [number, number];

type OsrmResponse = {
  routes?: Array<{
    distance: number;
    duration: number;
    geometry: { coordinates: Array<[number, number]>; type: "LineString" };
    legs?: Array<{ duration: number; distance: number }>;
  }>;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

type EtaInfo = {
  etaTravel?: number; // minutes (สะสมเฉพาะเดินทาง)
  etaTotal?: number; // minutes (เดินทาง+แวะ)
  legMin?: number; // minutes (ช่วงก่อนหน้า -> จุดนี้)
  stayMin?: number; // minutes (แวะที่จุดก่อนหน้า)
};

export function useTripMapController(tripId: number) {
  const navigate = useNavigate();

  const {
    data: trip,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetTripDetailQuery(tripId, {
    skip: !Number.isFinite(tripId) || tripId <= 0,
  });

  const [saveRoute, { isLoading: isSaving }] = useSaveRouteMutation();

  const [selectedDay, setSelectedDay] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [onlyWithCoords, setOnlyWithCoords] = useState(true);
  const [hoveredPlaceId, setHoveredPlaceId] = useState<number | null>(null);

  // ✅ NEW: transport mode (ไว้ต่อยอด)
  const transportMode = "driving";

  // ✅ NEW: fetch MapView from backend (มี stops + route + eta)
  const {
    data: mapViewResp,
    isFetching: mapViewLoading,
    isError: mapViewIsError,
    error: mapViewError,
    refetch: refetchMapView,
  } = useGetTripMapViewQuery(
    { tripId, dayIndex: selectedDay, transportMode },
    { skip: !Number.isFinite(tripId) || tripId <= 0 },
  );

  const mapView = useMemo(
    () => (mapViewResp as any)?.result ?? mapViewResp,
    [mapViewResp],
  );

  // ✅ mapStops (backend)
  const mapStops = useMemo(() => {
    const stops = (mapView as any)?.stops;
    return Array.isArray(stops) ? stops : [];
  }, [mapView]);

  // ✅ etaByPlaceId (ใช้ใน UI/markers/sidebar)
  const etaByPlaceId = useMemo(() => {
    const m = new Map<number, EtaInfo>();
    for (const s of mapStops as any[]) {
      m.set(s.placeId, {
        etaTravel:
          s.etaTravelMinutesFromStart ?? s.etaMinutesFromStart ?? undefined,
        etaTotal: s.etaTotalMinutesFromStart ?? undefined,
        legMin: s.legMinutesFromPrev ?? undefined,
        stayMin: s.stayMinutesAtPrev ?? undefined,
      });
    }
    return m;
  }, [mapStops]);

  // ---- route state (เดิม) ----
  const [routePoints, setRoutePoints] = useState<LatLng[]>([]);
  // เวลาเดินทางแต่ละช่วง (นาที) จาก OSRM — ว่างเมื่อใช้เส้นทางจาก backend (ใช้ legMin ของ backend แทน)
  const [legMinutes, setLegMinutes] = useState<number[]>([]);
  const [routeInfo, setRouteInfo] = useState<{
    km: number;
    min: number;
  } | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // ---- items sorted / max day ----
  const itemsSorted = useMemo(() => {
    const items = (trip as any)?.items ?? [];
    return items
      .slice()
      .sort(
        (a: any, b: any) =>
          (a.dayIndex ?? 1) - (b.dayIndex ?? 1) ||
          (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
      );
  }, [(trip as any)?.items]);

  const maxDay = useMemo(() => {
    if (!itemsSorted.length) return 1;
    return Math.max(...itemsSorted.map((x: any) => x.dayIndex ?? 1));
  }, [itemsSorted]);

  useEffect(() => {
    setSelectedDay((d) => clamp(d, 1, maxDay));
  }, [maxDay]);

  // ---- day items ----
  const dayItemsRaw = useMemo(() => {
    return itemsSorted.filter((x: any) => (x.dayIndex ?? 1) === selectedDay);
  }, [itemsSorted, selectedDay]);

  const placeIds = useMemo(
    () => dayItemsRaw.map((x: any) => x.placeId),
    [dayItemsRaw],
  );
  const { map: placeMap } = usePlacesByIds(placeIds);

  const dayItems = useMemo(() => {
    if (!onlyWithCoords) return dayItemsRaw;
    return dayItemsRaw.filter((it: any) => {
      const p: any = placeMap.get(it.placeId);
      return (
        typeof p?.latitude === "number" && typeof p?.longitude === "number"
      );
    });
  }, [dayItemsRaw, onlyWithCoords, placeMap]);

  const coordStats = useMemo(() => {
    let withCoords = 0;
    let withoutCoords = 0;
    for (const it of dayItemsRaw) {
      const p: any = placeMap.get(it.placeId);
      const ok =
        typeof p?.latitude === "number" && typeof p?.longitude === "number";
      if (ok) withCoords++;
      else withoutCoords++;
    }
    return { total: dayItemsRaw.length, withCoords, withoutCoords };
  }, [dayItemsRaw, placeMap]);

  // ordered points
  const orderedLatLng = useMemo(() => {
    const pts: LatLng[] = [];
    for (const it of dayItems) {
      const p: any = placeMap.get(it.placeId);
      if (!p) continue;
      if (typeof p.latitude === "number" && typeof p.longitude === "number") {
        pts.push([p.latitude, p.longitude]);
      }
    }
    return pts;
  }, [dayItems, placeMap]);

  const canRoute = orderedLatLng.length >= 2;

  // default center
  const center: LatLng = orderedLatLng[0] ?? [13.7563, 100.5018];

  // ---- markers model (✅ ทำให้ “1 เริ่ม / 2 / 3 / N จบ”) ----
  const markerModels = useMemo(() => {
    const firstId = dayItems[0]?.placeId;
    const lastId = dayItems[dayItems.length - 1]?.placeId;

    return dayItems
      .map((it: any, idx: number) => {
        const p: any = placeMap.get(it.placeId);
        if (!p) return null;
        if (typeof p.latitude !== "number" || typeof p.longitude !== "number")
          return null;

        const isStart = it.placeId === firstId;
        const isEnd = it.placeId === lastId;

        const orderNo = String(idx + 1);
        const baseBadge = isStart
          ? `${orderNo}\nเริ่ม`
          : isEnd
            ? `${orderNo}\nจบ`
            : orderNo;

        // ✅ ใส่ ETA ลงหมุด (เฉพาะจุดกลาง)
        const etaTravel = etaByPlaceId.get(it.placeId)?.etaTravel;
        const badge =
          !isStart && !isEnd && typeof etaTravel === "number"
            ? `${baseBadge}\n${etaTravel} น`
            : baseBadge;

        return {
          placeId: it.placeId,
          lat: p.latitude,
          lng: p.longitude,
          title: p?.name ?? `สถานที่ #${it.placeId}`,
          badge,
          tone: isStart ? "start" : isEnd ? "end" : "num",
        };
      })
      .filter(Boolean) as Array<{
      placeId: number;
      lat: number;
      lng: number;
      title: string;
      badge: string;
      tone: "start" | "end" | "num";
    }>;
  }, [dayItems, placeMap, etaByPlaceId]);

  // ---- OSRM compute (เดิม) ----
  const computeOsrm = useCallback(async () => {
    if (orderedLatLng.length < 2)
      throw new Error("ต้องมีอย่างน้อย 2 สถานที่ที่มีพิกัด");

    const coordStr = orderedLatLng
      .map(([lat, lng]) => `${lng},${lat}`)
      .join(";");
    const url =
      `https://router.project-osrm.org/route/v1/${transportMode}/${coordStr}` +
      `?overview=full&geometries=geojson&steps=false`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`OSRM error: ${res.status}`);

    const json = (await res.json()) as OsrmResponse;
    const r = json?.routes?.[0];
    if (!r) throw new Error("OSRM ไม่คืนค่าเส้นทาง");

    const pts = r.geometry.coordinates.map(
      ([lng, lat]) => [lat, lng] as LatLng,
    );

    return {
      polylineLngLat: r.geometry.coordinates as number[][], // [lng,lat]
      pointsLatLng: pts, // [lat,lng]
      totalDistanceKm: r.distance / 1000,
      totalTravelMinutes: Math.round(r.duration / 60),
      legMinutes: (r.legs ?? []).map((l) => Math.round(l.duration / 60)),
    };
  }, [orderedLatLng, transportMode]);

  // ✅ NEW: ถ้า backend ส่ง route มาแล้ว ให้ใช้มันก่อน (เสถียรกว่า/ตรงกับ ETA)
  useEffect(() => {
    const poly = (mapView as any)?.route?.polyline;
    const km = (mapView as any)?.route?.totalDistanceKm;
    const min = (mapView as any)?.route?.totalTravelMinutes;

    if (Array.isArray(poly) && poly.length > 0) {
      const pts = poly.map(([lng, lat]: number[]) => [lat, lng] as LatLng);
      setRoutePoints(pts);
      if (typeof km === "number" && typeof min === "number") {
        setRouteInfo({ km, min });
      }
    }
  }, [mapView]);

  // auto compute when points change (เดิม) — ทำงานเมื่อไม่มี backend route
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setRouteError(null);

      // ถ้า backend ส่ง polyline มาแล้ว ไม่ต้องคำนวณซ้ำ
      const hasBackendPolyline =
        Array.isArray((mapView as any)?.route?.polyline) &&
        (mapView as any).route.polyline.length > 0;

      if (hasBackendPolyline) return;

      setRouteInfo(null);
      setRoutePoints([]);
      setLegMinutes([]);

      if (orderedLatLng.length < 2) return;

      try {
        setRouteLoading(true);
        const r = await computeOsrm();
        if (cancelled) return;

        setRoutePoints(r.pointsLatLng);
        setLegMinutes(r.legMinutes);
        setRouteInfo({ km: r.totalDistanceKm, min: r.totalTravelMinutes });
      } catch (e: any) {
        if (!cancelled) setRouteError(e?.message ?? "โหลดเส้นทางไม่สำเร็จ");
      } finally {
        if (!cancelled) setRouteLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [orderedLatLng, computeOsrm, mapView]);

  // save route (เดิม) + หลัง save ให้ refetch map view เพื่อได้ ETA ใหม่
  const handleComputeAndSave = useCallback(async () => {
    try {
      setRouteError(null);
      setRouteLoading(true);

      const r = await computeOsrm();

      setRoutePoints(r.pointsLatLng);
      setRouteInfo({ km: r.totalDistanceKm, min: r.totalTravelMinutes });

      await saveRoute({
        tripId,
        body: {
          dayIndex: selectedDay,
          transportMode,
          totalDistanceKm: r.totalDistanceKm,
          totalTravelMinutes: r.totalTravelMinutes,
          polyline: r.polylineLngLat,
        },
      }).unwrap();

      // ✅ สำคัญ: save แล้วดึง map view ใหม่ (จะได้ stops+eta)
      refetchMapView();
    } catch (e: any) {
      console.error(e);
      setRouteError(
        e?.data?.errorMessages?.[0] ?? e?.message ?? "คำนวณ/บันทึกไม่สำเร็จ",
      );
    } finally {
      setRouteLoading(false);
    }
  }, [
    computeOsrm,
    saveRoute,
    tripId,
    selectedDay,
    transportMode,
    refetchMapView,
  ]);

  const saveDisabledReason = !canRoute
    ? onlyWithCoords
      ? "ต้องมีอย่างน้อย 2 สถานที่ที่มีพิกัด"
      : "ต้องมีอย่างน้อย 2 สถานที่"
    : routeLoading
      ? "กำลังคำนวณเส้นทาง"
      : isSaving
        ? "กำลังบันทึก"
        : undefined;

  const dayCounts = useMemo(() => {
    const m = new Map<number, number>();
    for (const it of itemsSorted as any[])
      m.set(it.dayIndex ?? 1, (m.get(it.dayIndex ?? 1) ?? 0) + 1);
    return m;
  }, [itemsSorted]);

  const goPlace = useCallback(
    (placeId: number) => navigate(`/placeDetails/${placeId}`),
    [navigate],
  );

  return {
    // query
    trip,
    isLoading,
    isError,
    error,
    refetch,

    // ✅ map view from backend
    mapView,
    mapStops,
    etaByPlaceId,
    mapViewLoading,
    mapViewIsError,
    mapViewError,
    refetchMapView,

    // ui state
    selectedDay,
    setSelectedDay,
    isFullscreen,
    setIsFullscreen,
    onlyWithCoords,
    setOnlyWithCoords,
    hoveredPlaceId,
    setHoveredPlaceId,

    // derived data
    itemsSorted,
    maxDay,
    dayCounts,
    dayItemsRaw,
    dayItems,
    placeMap,
    coordStats,
    orderedLatLng,
    center,
    canRoute,
    markerModels,

    // route
    routePoints,
    routeInfo,
    legMinutes,
    routeLoading: routeLoading || mapViewLoading, // ✅ รวม loading ให้ UI เห็น
    routeError:
      routeError || (mapViewIsError ? "โหลดข้อมูลแผนที่ไม่สำเร็จ" : null),

    // actions
    handleComputeAndSave,
    isSaving,
    saveDisabledReason,
    goPlace,
  };
}
