import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Car,
  Clock,
  ImageOff,
  Loader2,
  Map as MapIcon,
  MapPin,
  Pencil,
  Route,
  Trash2,
} from "lucide-react";
import { useGetTripDetailQuery, useDeleteTripMutation } from "../tripApi";
import { usePlacesByIds } from "../hooks/usePlacesByIds";

import { useLazyGetPlaceOpeningQuery } from "../../placeOpening/placeOpenApi";
import type { PlaceType as OpeningHourDto } from "../../placeOpening/placetype";

import type { TripDetail, TripItem, TripSegment } from "../components/detail/types";
import { toHHMM, getTripDayOfWeek } from "../components/detail/helpers";

function imageUrl(p: any): string | undefined {
  const img = p?.images?.find((x: any) => x.isCover) ?? p?.images?.[0];
  if (!img?.imageUrl) return undefined;
  return img.imageUrl.startsWith("http") ? img.imageUrl : `${import.meta.env.VITE_API_BASE_URLS ?? ""}${img.imageUrl}`;
}

const fmtDate = (iso?: string | null, opts?: Intl.DateTimeFormatOptions) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString("th-TH", opts ?? { day: "numeric", month: "short", year: "numeric" });
};

const fmtDur = (min: number) => (min < 60 ? `${min} นาที` : `${Math.floor(min / 60)} ชม.${min % 60 ? ` ${min % 60} น.` : ""}`);

export default function TripDetailPage() {
  const { id } = useParams();
  const tripId = Number(id);
  const navigate = useNavigate();

  const baseSkip = !Number.isFinite(tripId) || tripId <= 0;

  const { data, isLoading, isError, error, refetch } = useGetTripDetailQuery(tripId, {
    skip: baseSkip,
  }) as {
    data?: TripDetail;
    isLoading: boolean;
    isError: boolean;
    error: unknown;
    refetch?: () => any;
  };

  const [deleteTrip, { isLoading: isDeleting }] = useDeleteTripMutation();

  const handleDelete = async () => {
    const ok = window.confirm("ลบทริปนี้ใช่ไหม? (ลบแล้วกู้คืนไม่ได้)");
    if (!ok) return;

    try {
      await deleteTrip(tripId).unwrap();
      navigate("/trip");
    } catch (err: any) {
      console.error(err);
      alert(err?.data?.errorMessages?.[0] ?? "ลบทริปไม่สำเร็จ");
    }
  };

  const itemsSorted = useMemo(() => {
    const items = data?.items ?? [];
    return items
      .slice()
      .sort((a, b) => (a.dayIndex ?? 1) - (b.dayIndex ?? 1) || (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
  }, [data?.items]);

  const itemsByDay = useMemo(() => {
    const m = new Map<number, TripItem[]>();
    for (const it of itemsSorted) {
      const d = it.dayIndex ?? 1;
      m.set(d, [...(m.get(d) ?? []), it]);
    }
    return m;
  }, [itemsSorted]);

  const days = useMemo(() => {
    const max = itemsSorted.length ? Math.max(...itemsSorted.map((x) => x.dayIndex || 1)) : 1;
    return Array.from({ length: Math.max(max, 1) }, (_, i) => i + 1);
  }, [itemsSorted]);

  // เส้นทางที่ "มาถึง" item นี้
  const segmentTo = useMemo(() => {
    const m = new Map<number, TripSegment>();
    for (const s of data?.segments ?? []) m.set(s.toTripItemId, s);
    return m;
  }, [data?.segments]);

  const placeIds = useMemo(() => Array.from(new Set(itemsSorted.map((x) => x.placeId))), [itemsSorted]);

  const { map: placeMap, isLoading: isPlacesLoading } = usePlacesByIds(placeIds);

  const [triggerOpening] = useLazyGetPlaceOpeningQuery();
  const [openingByPlace, setOpeningByPlace] = useState<Map<number, OpeningHourDto[]>>(() => new Map());

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
        }),
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

  const segTotals = useMemo(() => {
    const segs = data?.segments ?? [];
    const km = segs.reduce((a, s) => a + (s.distanceKm ?? 0), 0);
    const min = segs.reduce((a, s) => a + (s.travelMinutes ?? 0), 0);
    return { km, min };
  }, [data?.segments]);

  const coverImages = useMemo(
    () => placeIds.map((pid) => imageUrl(placeMap.get(pid))).filter(Boolean).slice(0, 3) as string[],
    [placeIds, placeMap],
  );

  const renderOpeningText = (placeId: number, dayIndex: number) => {
    const dow = getTripDayOfWeek(data?.startDateTime ?? null, dayIndex);
    const list = openingByPlace.get(placeId) ?? [];
    const oh = dow == null ? null : list.find((x) => (x as any).dayOfWeek === dow);

    if (!oh) return null;
    if ((oh as any).isClosed) return "ปิดทำการวันนี้";
    return `เปิด ${toHHMM((oh as any).openTime)}–${toHHMM((oh as any).closeTime)}`;
  };

  // ----- states -----
  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#fbf8f5] flex items-center justify-center px-4">
        <Loader2 className="w-8 h-8 text-[#d84a1b] animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen w-full bg-[#fbf8f5] flex items-center justify-center px-4">
        <div className="bg-white border border-[#e2bfb5]/50 rounded-3xl shadow-sm p-8 max-w-md w-full text-center">
          <p className="text-xl font-black text-[#141c23]">{isError ? "โหลดทริปไม่สำเร็จ" : "ไม่พบทริป"}</p>
          {isError && (
            <p className="mt-2 text-sm text-[#b3261e]">
              {(error as any)?.data?.errorMessages?.[0] ?? "เกิดข้อผิดพลาดที่ไม่รู้จัก"}
            </p>
          )}
          <div className="mt-5 flex justify-center gap-2">
            <button onClick={() => navigate("/trip")} className="px-5 py-2.5 rounded-full border border-[#e2bfb5] font-bold">
              กลับไปหน้าทริป
            </button>
            {isError && (
              <button onClick={() => refetch?.()} className="px-5 py-2.5 rounded-full bg-[#d84a1b] text-white font-bold">
                ลองใหม่
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const totalDays = days.length;
  const stats = [
    { icon: CalendarDays, label: "ระยะเวลา", value: `${totalDays} วัน` },
    { icon: MapPin, label: "สถานที่", value: `${data.items.length} แห่ง` },
    { icon: Route, label: "ระยะทางรวม", value: segTotals.km ? `${segTotals.km.toFixed(1)} กม.` : "-" },
    { icon: Car, label: "เวลาบนถนน", value: segTotals.min ? fmtDur(segTotals.min) : "-" },
  ];

  return (
    <div className="min-h-screen w-full bg-[#fbf8f5] text-[#141c23] text-left">
      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 pt-5 sm:pt-8 pb-28 lg:pb-12">
        <button
          type="button"
          onClick={() => navigate("/trip")}
          className="inline-flex items-center gap-1.5 text-sm text-[#8e7068] hover:text-[#d84a1b] mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> ทริปของฉัน
        </button>

        {/* HERO */}
        <header className="relative rounded-3xl sm:rounded-[28px] overflow-hidden bg-gradient-to-br from-[#1c242b] via-[#293139] to-[#00210e] min-h-[260px] sm:min-h-[320px] flex items-end shadow-xl shadow-[#141c23]/10">
          {coverImages.length > 0 && (
            <div className={`absolute inset-0 grid gap-0.5 ${coverImages.length === 1 ? "grid-cols-1" : coverImages.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
              {coverImages.map((src) => (
                <img key={src} src={src} alt="" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
              ))}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#141c23]/95 via-[#141c23]/55 to-[#141c23]/15" />

          <div className="relative w-full p-5 sm:p-8 lg:p-10 flex flex-col lg:flex-row lg:items-end justify-between gap-5">
            <div className="min-w-0 max-w-3xl">
              <p className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-amber-300">
                <CalendarDays className="w-4 h-4" />
                {fmtDate(data.startDateTime)} – {fmtDate(data.endDateTime)}
              </p>
              <h1 className="mt-2 text-3xl sm:text-5xl font-black text-white leading-tight break-words">{data.title}</h1>
              {data.description && <p className="mt-2 text-sm sm:text-base text-white/75 line-clamp-2">{data.description}</p>}
            </div>

            <div className="hidden lg:flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => navigate(`/trip/${tripId}/planner`)}
                className="h-12 px-6 rounded-full bg-[#d84a1b] hover:bg-[#b83c13] text-white font-bold flex items-center gap-2 shadow-lg shadow-[#d84a1b]/30"
              >
                <Pencil className="w-4 h-4" /> แก้แผนเที่ยว
              </button>
              <button
                type="button"
                onClick={() => navigate(`/trip/${tripId}/map`)}
                className="h-12 px-6 rounded-full bg-white text-[#141c23] font-bold flex items-center gap-2 hover:bg-[#ffdbd1]"
              >
                <MapIcon className="w-4 h-4" /> ดูแผนที่
              </button>
            </div>
          </div>
        </header>

        {/* STATS */}
        <div className="relative -mt-6 sm:-mt-8 mx-2 sm:mx-8 lg:mx-12 grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 bg-white rounded-2xl p-2.5 sm:p-3 shadow-lg shadow-[#141c23]/8 border border-[#e2bfb5]/40">
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 p-2 sm:p-3">
              <span className="w-10 h-10 rounded-xl bg-[#ffdbd1]/60 text-[#d84a1b] flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] sm:text-xs text-[#8e7068]">{label}</p>
                <p className="text-sm sm:text-base font-black truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* DAYS */}
        <main className="mt-10 space-y-10">
          {data.items.length === 0 && (
            <div className="rounded-3xl border-2 border-dashed border-[#e2bfb5] bg-white p-10 text-center">
              <p className="text-lg font-black">ทริปนี้ยังไม่มีสถานที่</p>
              <p className="text-sm text-[#8e7068] mt-1">เริ่มเพิ่มสถานที่ในหน้าวางแผน</p>
              <button
                type="button"
                onClick={() => navigate(`/trip/${tripId}/planner`)}
                className="mt-5 px-6 py-3 rounded-full bg-[#d84a1b] hover:bg-[#b83c13] text-white font-bold"
              >
                ไปวางแผนเที่ยว
              </button>
            </div>
          )}

          {days.map((d) => {
            const items = itemsByDay.get(d) ?? [];
            if (items.length === 0 && data.items.length === 0) return null;
            const date = data.startDateTime
              ? fmtDate(new Date(new Date(data.startDateTime).getTime() + (d - 1) * 86400000).toISOString(), { weekday: "long", day: "numeric", month: "long" })
              : "";

            return (
              <section key={d}>
                <div className="flex items-end justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-6 h-1 rounded-full bg-[#d84a1b]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#d84a1b]">Day {d}</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black">
                      วันที่ {d} <span className="text-[#8e7068] font-semibold text-base sm:text-lg">· {date}</span>
                    </h2>
                  </div>
                  <span className="text-sm text-[#8e7068] shrink-0">{items.length} สถานที่</span>
                </div>

                {items.length === 0 ? (
                  <p className="text-sm text-[#8e7068] bg-white rounded-2xl border border-[#e2bfb5]/40 px-5 py-4">วันนี้ยังว่าง — เป็นวันพักผ่อน หรือเพิ่มสถานที่ในหน้าวางแผน</p>
                ) : (
                  <ol className="flex gap-3 overflow-x-auto snap-x pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 sm:overflow-visible">
                    {items.map((it, idx) => {
                      const p: any = placeMap.get(it.placeId);
                      const cover = imageUrl(p);
                      const seg = segmentTo.get(it.tripItemId);
                      const opening = renderOpeningText(it.placeId, d);

                      return (
                        <li key={it.tripItemId} className="snap-start shrink-0 w-[78%] sm:w-auto">
                          <button
                            type="button"
                            onClick={() => navigate(`/placeDetails/${it.placeId}`)}
                            className="group w-full h-full text-left bg-white rounded-2xl border border-[#e2bfb5]/50 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all overflow-hidden"
                          >
                            <div className="relative h-36 bg-[#f3ede7] flex items-center justify-center text-[#e2bfb5]">
                              {cover ? (
                                <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
                              ) : (
                                <ImageOff className="w-8 h-8" />
                              )}
                              <span className="absolute top-2.5 left-2.5 w-8 h-8 rounded-full bg-[#d84a1b] text-white text-sm font-black flex items-center justify-center ring-2 ring-white">
                                {idx + 1}
                              </span>
                              {idx > 0 && seg && (seg.travelMinutes || seg.distanceKm) ? (
                                <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 text-[13px] font-bold text-[#2c5c8a]">
                                  <Car className="w-3 h-3" />
                                  {seg.distanceKm ? `${seg.distanceKm.toFixed(1)} กม.` : ""}
                                  {seg.travelMinutes ? ` · ${seg.travelMinutes} นาที` : ""}
                                </span>
                              ) : null}
                            </div>
                            <div className="p-3.5">
                              <p className="font-bold leading-snug line-clamp-1 group-hover:text-[#d84a1b]">
                                {p?.name ?? (isPlacesLoading ? "กำลังโหลด..." : `สถานที่ #${it.placeId}`)}
                              </p>
                              <p className="mt-1 flex items-center gap-1.5 text-xs text-[#8e7068]">
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">
                                  {opening ?? "ไม่ระบุเวลาเปิด"}
                                  {p?.avgVisitMinutes ? ` · ใช้เวลา ~${p.avgVisitMinutes} นาที` : ""}
                                </span>
                              </p>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </section>
            );
          })}

          <div className="pt-6 border-t border-[#e2bfb5]/50 flex justify-end">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-[#b3261e] hover:bg-[#fdecea] disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              ลบทริปนี้
            </button>
          </div>
        </main>
      </div>

      {/* MOBILE ACTIONS */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#e2bfb5]/50 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => navigate(`/trip/${tripId}/map`)}
          className="h-12 rounded-full border border-[#e2bfb5] font-bold flex items-center justify-center gap-2"
        >
          <MapIcon className="w-4 h-4" /> แผนที่
        </button>
        <button
          type="button"
          onClick={() => navigate(`/trip/${tripId}/planner`)}
          className="h-12 rounded-full bg-[#d84a1b] text-white font-bold flex items-center justify-center gap-2 shadow-md shadow-[#d84a1b]/25"
        >
          <Pencil className="w-4 h-4" /> แก้แผนเที่ยว
        </button>
      </div>
    </div>
  );
}
