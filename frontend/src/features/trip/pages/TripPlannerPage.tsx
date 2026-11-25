// src/features/trip/pages/TripPlannerPage.tsx
import  { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Loading } from "../../../components/Loading";
import { showSuccessOk, confirmDelete } from "../../../utils";

import {
  useGetTripDetailQuery,
  useDeleteTripItemMutation,
  useReorderTripItemsMutation,
  useGetTripSegmentsQuery,
} from "../tripApi";

import { usePlacesByIds } from "../hooks/usePlacesByIds";
import type { TripDetailDto } from "../tripTypes";

import { useLazyGetPlaceOpeningQuery } from "../../placeOpening/placeOpenApi";
import type { PlaceType as OpeningHourDto } from "../../placeOpening/placetype";

import PlannerDayTabs from "../components/planner/PlannerDayTabs";
import PlannerItinerary from "../components/planner/PlannerItinerary";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Info,
  Loader2,
  Map as MapIcon,
  TriangleAlert,
} from "lucide-react";

import {
  buildTimeline,
  summarizeIssues,
  clamp,
  safeTripResult,
  sortItems,
  hhmmFromDateTime,
  swapReorderPayload,
  type PlaceLite,
} from "../components/planner/timeline";


function coverOf(p?: { images?: { imageUrl: string; isCover?: boolean }[] }) {
  const img = p?.images?.find((x) => x.isCover) ?? p?.images?.[0];
  if (!img?.imageUrl) return undefined;
  return img.imageUrl.startsWith("http") ? img.imageUrl : `${import.meta.env.VITE_API_BASE_URLS ?? ""}${img.imageUrl}`;
}

export default function TripPlannerPage() {
  const { id } = useParams<{ id: string }>();
  const tripId = Number(id);
  const navigate = useNavigate();

  const baseSkip = !Number.isFinite(tripId) || tripId <= 0;

  const { data, isLoading, isError, error, refetch } = useGetTripDetailQuery(tripId, {
    skip: baseSkip,
  });

  const trip = safeTripResult(data) as TripDetailDto | undefined;

  const [removeTripItem, { isLoading: isRemoving }] = useDeleteTripItemMutation();
  const [reorderTripItems, { isLoading: isReordering }] = useReorderTripItemsMutation();

  const itemsSorted = useMemo(() => sortItems(trip), [trip]);
  const maxDay = useMemo(
    () => (itemsSorted.length ? Math.max(...itemsSorted.map((x) => x.dayIndex || 1)) : 1),
    [itemsSorted]
  );

  const [selectedDay, setSelectedDay] = useState(1);
  useEffect(() => setSelectedDay((d) => clamp(d, 1, maxDay)), [maxDay]);

  const dayItems = useMemo(
    () => itemsSorted.filter((x) => x.dayIndex === selectedDay),
    [itemsSorted, selectedDay]
  );

  const placeIds = useMemo(() => Array.from(new Set(dayItems.map((x) => x.placeId))), [dayItems]);
  const { map: placeMapRaw, isLoading: isPlacesLoading } = usePlacesByIds(placeIds);

  const placeMap = useMemo(() => {
    const m = new Map<number, PlaceLite>();
    for (const [pid, p] of placeMapRaw.entries()) {
      m.set(pid, {
        placeId: pid,
        name: (p as any)?.name ?? `Place #${pid}`,
        avgVisitMinutes: (p as any)?.avgVisitMinutes ?? null,
        coverUrl: coverOf(p as any),
      });
    }
    return m;
  }, [placeMapRaw]);

  const dayBaseDate = useMemo(() => {
    const base = trip?.startDateTime ? new Date(trip.startDateTime) : new Date();
    base.setHours(0, 0, 0, 0);
    base.setDate(base.getDate() + (selectedDay - 1));
    return base;
  }, [selectedDay, trip?.startDateTime]);

  const startTimeHHMM = useMemo(
    () => hhmmFromDateTime(trip?.startDateTime ?? null, "09:00"),
    [trip?.startDateTime]
  );

  const tripEndAt = useMemo(() => {
    if (!trip?.endDateTime) return null;
    const end = new Date(trip.endDateTime);
    return Number.isNaN(end.getTime()) ? null : end;
  }, [trip?.endDateTime]);

  const { data: segments = [] } = useGetTripSegmentsQuery(
    { tripId, dayIndex: selectedDay },
    { skip: baseSkip }
  );

  // opening hours cache (no hook order issue)
  const [triggerOpening] = useLazyGetPlaceOpeningQuery();
  const [openingByPlace, setOpeningByPlace] = useState<Map<number, OpeningHourDto[]>>(
    () => new Map()
  );

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!placeIds.length) {
        if (!cancelled) setOpeningByPlace(new Map());
        return;
      }

      const needFetch = placeIds.filter((pid) => !openingByPlace.has(pid));
      if (!needFetch.length) return;

      const results: Array<readonly [number, OpeningHourDto[]]> = await Promise.all(
        needFetch.map(async (pid) => {
          try {
            const list = await triggerOpening(pid, true).unwrap();
            return [pid, list] as const;
          } catch {
            return [pid, [] as OpeningHourDto[]] as const;
          }
        })
      );

      if (cancelled) return;

      setOpeningByPlace((prev) => {
        const next = new Map(prev);
        for (const [pid, list] of results) next.set(pid, list);
        return next;
      });
    };

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeIds, triggerOpening]);

  const timeline = useMemo(
    () =>
      buildTimeline({
        dayBaseDate,
        startTimeHHMM,
        tripStart: trip?.startDateTime ?? null,
        tripEndAt,
        items: dayItems,
        places: placeMap,
        segments,
        openingByPlace,
      }),
    [
      dayBaseDate,
      startTimeHHMM,
      trip?.startDateTime,
      tripEndAt,
      dayItems,
      placeMap,
      segments,
      openingByPlace,
    ]
  );

  const issuesSummary = useMemo(() => summarizeIssues(timeline.rows), [timeline.rows]);

  const overTripEndMinutes = useMemo(() => {
    if (!tripEndAt || timeline.rows.length === 0) return 0;
    const last = timeline.rows[timeline.rows.length - 1];
    const diffMs = last.departAt.getTime() - tripEndAt.getTime();
    return diffMs > 0 ? Math.ceil(diffMs / 60_000) : 0;
  }, [timeline.rows, tripEndAt]);


  // actions
  const onRemove = async (tripItemId: number) => {
    const ok = await confirmDelete();
    if (!ok) return;

    try {
      await removeTripItem({ tripId, tripItemId }).unwrap();
      showSuccessOk("ลบออกจากทริปแล้ว");
    } catch (e: any) {
      alert(e?.data?.errorMessages?.[0] ?? "ลบไม่สำเร็จ");
    }
  };

  const onMove = async (tripItemId: number, dir: "up" | "down") => {
    const idx = dayItems.findIndex((x) => x.tripItemId === tripItemId);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || swapIdx < 0 || swapIdx >= dayItems.length) return;

    try {
      await reorderTripItems({
        tripId,
        body: { dayIndex: selectedDay, items: swapReorderPayload(dayItems, idx, swapIdx) },
      }).unwrap();
      showSuccessOk("จัดลำดับแล้ว");
    } catch (e: any) {
      alert(e?.data?.errorMessages?.[0] ?? "จัดลำดับไม่สำเร็จ");
    }
  };

  // render guards (NO hooks here)
  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="min-h-screen w-full px-4 py-8">
        <div className="max-w-4xl mx-auto border rounded-xl p-5 text-red-600">
          โหลดทริปไม่สำเร็จ: {(error as any)?.data?.errorMessages?.[0] ?? "unknown"}
          <div className="mt-3 flex gap-2">
            <button className="px-4 py-2 rounded-lg border" onClick={() => navigate(-1)}>
              กลับ
            </button>
            <button className="px-4 py-2 rounded-lg bg-blue-600 text-white" onClick={() => refetch()}>
              ลองใหม่
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!trip) return <div className="p-6">ไม่พบทริป</div>;

  const busy = isRemoving || isReordering;
  const totalMinutes = timeline.totalStay + timeline.totalTravel;
  const range = (() => {
    const s = trip.startDateTime ? new Date(trip.startDateTime) : null;
    const e = trip.endDateTime ? new Date(trip.endDateTime) : null;
    const f = (d: Date) => d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
    return s && e ? `${f(s)} – ${f(e)}` : "";
  })();
  const issueList = (
    [
      [issuesSummary.beforeOpen, "ยังไม่เปิด"],
      [issuesSummary.afterClose, "ปิดแล้ว"],
      [issuesSummary.exceedClose, "เที่ยวเกินเวลาปิด"],
      [issuesSummary.closed, "ปิดทำการ"],
      [issuesSummary.exceedTrip, "เกินเวลาทริป"],
    ] as [number, string][]
  ).filter(([n]) => n > 0);

  return (
    <div className="min-h-screen w-full bg-[#fbf8f5] text-[#141c23] text-left">
      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 pt-5 sm:pt-8 pb-12 space-y-5">
        {/* Header */}
        <header className="rounded-3xl bg-gradient-to-br from-[#1c242b] via-[#293139] to-[#00210e] text-white p-5 sm:p-7 shadow-xl flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => navigate("/trip")}
              className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> ทริปของฉัน
            </button>
            <h1 className="text-2xl sm:text-4xl font-black leading-tight break-words">{trip.title}</h1>
            <p className="mt-1 text-sm text-white/70 flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-amber-300" /> {range} · {maxDay} วัน
            </p>
          </div>
          <div className="grid grid-cols-2 md:flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => navigate(`/trip/${tripId}/map`)}
              className="h-11 px-5 rounded-full bg-[#d84a1b] hover:bg-[#b83c13] text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#d84a1b]/30"
            >
              <MapIcon className="w-4 h-4" /> แผนที่เส้นทาง
            </button>
            <button
              type="button"
              onClick={() => navigate(`/trip/${tripId}`)}
              className="h-11 px-5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-bold flex items-center justify-center gap-2"
            >
              <Info className="w-4 h-4" /> ข้อมูลทริป
            </button>
          </div>
        </header>

        <PlannerDayTabs
          maxDay={maxDay}
          selectedDay={selectedDay}
          itemsSorted={itemsSorted}
          onSelectDay={setSelectedDay}
          tripStart={trip.startDateTime}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8">
          {/* Summary */}
          <aside className="lg:col-span-4 lg:order-2">
            <div className="lg:sticky lg:top-24 space-y-3">
              <div className="bg-white rounded-3xl border border-[#e2bfb5]/40 p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-[#8e7068]">สรุปวันที่ {selectedDay}</p>
                <div className="mt-3 grid grid-cols-3 lg:grid-cols-1 gap-2">
                  <Stat label="สถานที่" value={`${dayItems.length}`} unit="จุด" />
                  <Stat label="เวลาเที่ยว" value={fmtDur(timeline.totalStay)} />
                  <Stat label="เดินทาง" value={fmtDur(timeline.totalTravel)} />
                </div>
                {dayItems.length > 0 && (
                  <p className="mt-3 text-sm text-[#5a413a]">
                    รวมทั้งวัน <b className="text-[#141c23]">{fmtDur(totalMinutes)}</b>
                    {overTripEndMinutes > 0 && (
                      <span className="text-[#b3261e] font-bold"> · เกินเวลาทริป {overTripEndMinutes} นาที</span>
                    )}
                  </p>
                )}
              </div>

              {issueList.length > 0 ? (
                <div className="rounded-3xl bg-[#ffdcbd]/50 border border-[#e88d14]/40 p-5">
                  <p className="flex items-center gap-2 font-bold text-[#8a5100]">
                    <TriangleAlert className="w-4 h-4" /> ควรตรวจสอบ {issuesSummary.totalIssues} จุด
                  </p>
                  <ul className="mt-2 text-sm text-[#5a413a] space-y-0.5">
                    {issueList.map(([n, label]) => (
                      <li key={label}>• {label} {n} จุด</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-[#8a5100]">ลองสลับลำดับ หรือลดจำนวนสถานที่ในวันนี้</p>
                </div>
              ) : dayItems.length > 0 ? (
                <div className="rounded-3xl bg-[#16693c]/10 border border-[#16693c]/25 p-4 text-sm font-semibold text-[#16693c] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> ตารางวันนี้ไปได้ทุกจุด
                </div>
              ) : null}

              {(isPlacesLoading || busy) && (
                <p className="text-xs text-[#8e7068] flex items-center gap-1.5 px-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {isRemoving ? "กำลังลบ..." : isReordering ? "กำลังบันทึกลำดับ..." : "กำลังโหลดข้อมูลสถานที่..."}
                </p>
              )}
            </div>
          </aside>

          {/* Itinerary */}
          <section className="lg:col-span-8 lg:order-1">
            <PlannerItinerary
              dayItems={dayItems}
              rows={timeline.rows}
              placeMap={placeMap}
              startAt={timeline.startAt}
              isBusy={busy}
              onAddPlace={() => navigate("/places")}
              onOpenPlace={(placeId) => navigate(`/placeDetails/${placeId}`)}
              onMove={onMove}
              onRemove={onRemove}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

function fmtDur(min: number) {
  if (min < 60) return `${min} นาที`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} ชม. ${m} น.` : `${h} ชม.`;
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-2xl bg-[#fbf8f5] px-3 py-2.5 lg:flex lg:items-center lg:justify-between">
      <p className="text-[13px] text-[#8e7068]">{label}</p>
      <p className="font-black">
        {value} {unit && <span className="text-xs font-semibold text-[#8e7068]">{unit}</span>}
      </p>
    </div>
  );
}
