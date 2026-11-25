// src/features/trip/pages/TripMapPage.tsx
import { useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Loading } from "../../../components/Loading";
import { ArrowLeft, Navigation, Route } from "lucide-react";

// ✅ controller: รวม state + data + handlers
import { useTripMapController } from "../hooks/useTripMapController";

// ✅ UI blocks
import { TripMapSidebar } from "../components/map/TripMapSidebar";
import { TripMapView } from "../components/map/TripMapView";
import { TripStopStepper } from "../components/map/TripStopStepper";
import { PlacePreviewSheet } from "../components/map/PlacePreviewSheet";

// ✅ longdo adapter
import { fitPoints, setCenter, type LegView } from "../components/map/longdoMapAdapter";
import { splitRouteIntoLegs } from "../utils/routeLegs";
import type { LatLng } from "../utils/osrm";
import type { LegInfo } from "../components/map/TripMapSidebar";

type EtaInfo = {
  etaTravel?: number;
  etaTotal?: number;
  legMin?: number;
  stayMin?: number;
};

export default function TripMapPage() {
  const { id } = useParams<{ id: string }>();
  const tripId = Number(id);
  const navigate = useNavigate();

  const c = useTripMapController(tripId);

  // ✅ hold map instance in page (ไม่ใช้ window global)
  const mapRef = useRef<any>(null);

  // ✅ NEW: drawer state (สวยกว่าเด้งไปหน้าอื่นทันที)
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);

  // ✅ IMPORTANT: hooks must be called before any conditional return
  const fitPts = useMemo(() => {
    const route = c.routePoints ?? [];
    const pts = c.orderedLatLng ?? [];
    return route.length ? route : pts;
  }, [c.routePoints, c.orderedLatLng]);

  // ✅ ETA map: placeId -> eta info (มาจาก backend: c.trip.stops)
  const etaByPlaceId = useMemo(() => {
    const m = new Map<number, EtaInfo>();
    const stops = (c.trip as any)?.stops ?? [];

    for (const s of stops) {
      m.set(s.placeId, {
        etaTravel: s.etaTravelMinutesFromStart,
        etaTotal: s.etaTotalMinutesFromStart,
        legMin: s.legMinutesFromPrev,
        stayMin: s.stayMinutesAtPrev,
      });
    }
    return m;
  }, [c.trip]);

  // โหมดดูทีละจุด (controller ใส่ป้าย เริ่ม/จบ/ETA ใน markerModels ให้แล้ว)
  const [stepId, setStepId] = useState<number | null>(null);
  // เปลี่ยนวันแล้ว stepId เก่าไม่อยู่ในวันนี้ → ไม่ให้หมุดทั้งหมดถูกทำให้จาง
  const stepActive = c.markerModels.some((m) => m.placeId === stepId) ? stepId : null;
  const activeId = c.hoveredPlaceId ?? stepActive;

  const coverOf = (placeId: number) => {
    const p: any = c.placeMap.get(placeId);
    const img = p?.images?.find((x: any) => x.isCover) ?? p?.images?.[0];
    if (!img?.imageUrl) return undefined;
    return img.imageUrl.startsWith("http")
      ? img.imageUrl
      : `${import.meta.env.VITE_API_BASE_URLS ?? ""}${img.imageUrl}`;
  };


  // ---------- เส้นทางแยกสีต่อช่วง + ระยะ/เวลา/เวลาถึง ----------
  const routeLegs = useMemo(
    () => splitRouteIntoLegs(c.routePoints ?? [], c.markerModels.map((m) => [m.lat, m.lng] as LatLng)),
    [c.routePoints, c.markerModels]
  );

  // key = placeId ปลายทางของช่วง
  const legInfo = useMemo(() => {
    const m = new Map<number, LegInfo>();
    routeLegs.forEach((leg, i) => {
      const to = c.markerModels[i + 1];
      if (!to) return;
      const min =
        etaByPlaceId.get(to.placeId)?.legMin ??
        c.legMinutes[i] ??
        Math.round((leg.km / 40) * 60); // ไม่มีข้อมูลเวลา → ประมาณจากความเร็วรถ 40 กม./ชม.
      m.set(to.placeId, { color: leg.color, km: leg.km, min, approx: leg.straight, from: i + 1, to: i + 2 });
    });
    return m;
  }, [routeLegs, c.markerModels, c.legMinutes, etaByPlaceId]);

  // เวลาถึงแต่ละจุด: ใช้ etaTotal ของ backend ถ้ามี ไม่งั้นสะสม (เวลาแวะจุดก่อน + เวลาเดินทาง)
  const arriveAt = useMemo(() => {
    const m = new Map<number, string>();
    const s = c.trip?.startDateTime ? new Date(c.trip.startDateTime) : null;
    if (!s || Number.isNaN(s.getTime())) return m;
    const dayStart = new Date(s);
    dayStart.setDate(dayStart.getDate() + c.selectedDay - 1);

    let t = dayStart.getTime();
    c.markerModels.forEach((mk, i) => {
      if (i > 0) {
        const stay = (c.placeMap.get(c.markerModels[i - 1].placeId) as any)?.avgVisitMinutes ?? 60;
        t += (stay + (legInfo.get(mk.placeId)?.min ?? 0)) * 60_000;
      }
      const total = etaByPlaceId.get(mk.placeId)?.etaTotal;
      if (typeof total === "number") t = dayStart.getTime() + total * 60_000;
      m.set(mk.placeId, new Date(t).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }));
    });
    return m;
  }, [c.trip?.startDateTime, c.selectedDay, c.markerModels, c.placeMap, legInfo, etaByPlaceId]);

  const legViews: LegView[] = useMemo(
    () =>
      routeLegs.map((leg, i) => {
        const info = legInfo.get(c.markerModels[i + 1]?.placeId);
        const km = `${leg.straight ? "~" : ""}${leg.km.toFixed(1)} กม.`;
        return { ...leg, label: `${i + 1}→${i + 2} · ${km}${info ? ` · ${info.min} นาที` : ""}` };
      }),
    [routeLegs, legInfo, c.markerModels]
  );

  // หมุด: ป้ายใต้หมุดเป็นเวลา "ออก 09:00" / "ถึง 10:35"
  const markers = useMemo(
    () =>
      c.markerModels.map((m, i) => {
        const time = arriveAt.get(m.placeId);
        if (!time) return m;
        return { ...m, badge: `${m.badge.split("\n")[0]}\n${i === 0 ? "ออก" : "ถึง"} ${time}` };
      }),
    [c.markerModels, arriveAt]
  );

  // ---------------- Render guards (after all hooks) ----------------
  if (c.isLoading) return <Loading />;

  if (c.isError) {
    return (
      <div className="min-h-screen w-full px-4 py-10 bg-gray-50">
        <div className="max-w-4xl mx-auto border rounded-2xl p-6 text-rose-700 bg-white shadow-sm">
          <div className="font-extrabold text-lg">โหลดทริปไม่สำเร็จ</div>
          <div className="mt-1 text-sm text-gray-600">
            {(c.error as any)?.data?.errorMessages?.[0] ?? "unknown"}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              className="px-4 py-2 rounded-lg border"
              onClick={() => navigate(-1)}
            >
              ← กลับ
            </button>
            <button
              className="px-4 py-2 rounded-lg border"
              onClick={() => c.refetch()}
            >
              ↻ ลองใหม่
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!c.trip) return <div className="p-6">ไม่พบทริป</div>;

  // สำหรับ drawer
  const selectedOrder = selectedPlaceId
    ? c.dayItemsRaw.findIndex((x: { placeId: number }) => x.placeId === selectedPlaceId) + 1 || undefined
    : undefined;
  const selectedEta = selectedPlaceId
    ? etaByPlaceId.get(selectedPlaceId)
    : undefined;

  // ---------------- UI ----------------
  const routeText = c.routeLoading
    ? "กำลังคำนวณเส้นทาง..."
    : c.routeInfo
    ? `${c.routeInfo.km.toFixed(1)} กม. · ~${c.routeInfo.min} นาที`
    : c.canRoute
    ? "พร้อมคำนวณเส้นทาง"
    : "ต้องมีพิกัดอย่างน้อย 2 จุด";

  // Google Maps รับ waypoint ได้สูงสุด 9 จุดผ่าน URL → ปลายทาง + 9 จุดแวะ = 10 จุดแรกของวัน
  // ไม่ใส่ origin เพื่อให้ Google เริ่มจากตำแหน่งปัจจุบันของผู้ใช้
  const NAV_MAX = 10;
  const navStops = c.markerModels.slice(0, NAV_MAX);
  const navUrl =
    navStops.length > 0
      ? "https://www.google.com/maps/dir/?api=1&travelmode=driving" +
        `&destination=${navStops[navStops.length - 1].lat},${navStops[navStops.length - 1].lng}` +
        (navStops.length > 1
          ? `&waypoints=${encodeURIComponent(navStops.slice(0, -1).map((m) => `${m.lat},${m.lng}`).join("|"))}`
          : "")
      : null;

  return (
    <div className="min-h-screen w-full bg-[#fbf8f5] text-[#141c23] text-left">
      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 pt-5 sm:pt-8 pb-10 space-y-4">
        {/* Header */}
        <header className="rounded-3xl bg-gradient-to-br from-[#1c242b] via-[#293139] to-[#00210e] text-white p-5 sm:p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => navigate(`/trip/${tripId}/planner`)}
                className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white mb-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> กลับไปวางแผน
              </button>
              <h1 className="text-2xl sm:text-3xl font-black leading-tight break-words">{c.trip.title}</h1>
              <p className="mt-1.5 inline-flex items-center gap-2 text-sm text-white/80">
                <Route className="w-4 h-4 text-amber-300" />
                {routeText}
              </p>
              {c.routeError && <p className="mt-1 text-xs text-[#ffb4a8]">{c.routeError}</p>}
              {navUrl && (
                <a
                  href={navUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 h-11 px-5 rounded-full bg-white text-[#141c23] text-sm font-bold shadow-lg hover:bg-[#ffdbd1]"
                >
                  <Navigation className="w-4 h-4 text-[#d84a1b]" />
                  นำทางวันที่ {c.selectedDay} ใน Google Maps
                </a>
              )}
              {c.markerModels.length > NAV_MAX && (
                <p className="mt-1.5 text-xs text-white/60">
                  Google Maps รับได้ {NAV_MAX} จุดต่อครั้ง · ส่งไป {NAV_MAX} จุดแรก ที่เหลือกดนำทางรายจุดจากหมุด
                </p>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
              {Array.from({ length: Math.max(c.maxDay, 1) }).map((_, i) => {
                const d = i + 1;
                const active = d === c.selectedDay;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => c.setSelectedDay(d)}
                    aria-pressed={active}
                    className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                      active ? "bg-[#d84a1b] text-white shadow-lg shadow-[#d84a1b]/30" : "bg-white/10 hover:bg-white/20 text-white/85"
                    }`}
                  >
                    วันที่ {d}
                    <span className="ml-1.5 text-xs opacity-75">· {c.dayCounts.get(d) ?? 0}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
          {/* Map */}
          <div
            className={
              c.isFullscreen
                ? "fixed inset-0 z-[9999] bg-[#141c23] p-2"
                : "lg:col-span-8 xl:col-span-9 lg:order-2 h-[55vh] min-h-[340px] lg:h-[calc(100vh-15rem)] lg:min-h-[520px]"
            }
          >
            <TripMapView
              center={c.center}
              markers={markers}
              legs={legViews}
              activeLeg={(() => { const i = c.markerModels.findIndex((m) => m.placeId === activeId); return i > 0 ? i - 1 : null; })()}
              hoveredPlaceId={activeId}
              bottomOverlay={
                <TripStopStepper
                  stops={c.markerModels}
                  activeId={stepId}
                  onChange={(id) => {
                    setStepId(id);
                    if (id == null && mapRef.current) fitPoints(mapRef.current, fitPts);
                  }}
                  coverOf={coverOf}
                  legOf={(id) => legInfo.get(id)}
                  arriveOf={(id) => arriveAt.get(id)}
                  onOpen={(id) => setSelectedPlaceId(id)}
                />
              }
              isFullscreen={c.isFullscreen}
              onToggleFullscreen={() => c.setIsFullscreen((v) => !v)}
              onClickPlace={(placeId) => setSelectedPlaceId(placeId)}
              onMapReady={(map) => {
                mapRef.current = map;
                if (fitPts.length) fitPoints(map, fitPts);
              }}
              onFit={() => {
                const map = mapRef.current;
                if (!map) return;
                fitPoints(map, fitPts);
              }}
              onCenter={() => {
                const map = mapRef.current;
                if (!map) return;
                setCenter(map, c.center);
              }}
            />
          </div>

          {/* List */}
          <div className="lg:col-span-4 xl:col-span-3 lg:order-1 lg:h-[calc(100vh-15rem)] lg:min-h-[520px]">
            <TripMapSidebar
              tripId={tripId}
              selectedDay={c.selectedDay}
              onlyWithCoords={c.onlyWithCoords}
              onToggleOnlyWithCoords={() => c.setOnlyWithCoords((v) => !v)}
              dayItemsRaw={c.dayItemsRaw}
              dayItems={c.dayItems}
              placeMap={c.placeMap}
              coordStats={c.coordStats}
              hoveredPlaceId={c.hoveredPlaceId}
              onHover={c.setHoveredPlaceId}
              onClickPlace={(placeId) => setSelectedPlaceId(placeId)}
              onGoPlanner={() => navigate(`/trip/${tripId}/planner`)}
              legInfo={legInfo}
              arriveAt={arriveAt}
            />
          </div>
        </div>
      </div>

      {selectedPlaceId && (
        <PlacePreviewSheet
          placeId={selectedPlaceId}
          place={c.placeMap.get(selectedPlaceId) as any}
          orderNo={selectedOrder}
          coverUrl={coverOf(selectedPlaceId)}
          eta={selectedEta}
          onClose={() => setSelectedPlaceId(null)}
          onZoom={() => {
            setStepId(selectedPlaceId);
            setSelectedPlaceId(null);
          }}
          onOpenDetail={() => c.goPlace(selectedPlaceId)}
        />
      )}
    </div>
  );
}
