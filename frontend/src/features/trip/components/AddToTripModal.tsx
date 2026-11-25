import { useEffect } from "react";
import {
  CalendarDays,
  Check,
  Loader2,
  MapPin,
  Plus,
  Route,
  X,
} from "lucide-react";
import type { TripDto } from "../tripTypes";

type DayOption = { dayIndex: number; label: string };

type Props = {
  open: boolean;
  onClose: () => void;

  placeName: string;
  placeImageUrl?: string;
  placeSubtitle?: string;

  // Trip list
  trips: TripDto[];
  isTripListLoading: boolean;
  selectedTripId: number | "";
  setSelectedTripId: (v: number | "") => void;

  // Trip detail/day options
  dayIndex: number;
  setDayIndex: (v: number) => void;
  dayOptions: DayOption[];
  isTripDetailLoading: boolean;
  hasTripDates: boolean;
  tripIdNum: number | null;

  // Submit
  isAddingToTrip: boolean;
  onSubmit: () => void;

  // Create trip
  onCreateTrip: () => void;
};

function formatRange(start?: string, end?: string) {
  const s = start ? new Date(start) : null;
  const e = end ? new Date(end) : null;
  if (!s || Number.isNaN(s.getTime())) return "ยังไม่ได้ตั้งวันที่";
  const fmt = (d: Date) =>
    d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
  if (!e || Number.isNaN(e.getTime())) return fmt(s);
  const days = Math.round((e.setHours(0, 0, 0, 0) - new Date(s).setHours(0, 0, 0, 0)) / 86400000) + 1;
  return `${fmt(s)} – ${fmt(new Date(end!))} · ${days} วัน`;
}

export default function AddToTripModal({
  open,
  onClose,
  placeName,
  placeImageUrl,
  placeSubtitle,
  trips,
  isTripListLoading,
  selectedTripId,
  setSelectedTripId,
  dayIndex,
  setDayIndex,
  dayOptions,
  isTripDetailLoading,
  hasTripDates,
  tripIdNum,
  isAddingToTrip,
  onSubmit,
  onCreateTrip,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const selectedTrip = trips.find((t) => t.tripId === tripIdNum);
  const selectedDay = dayOptions.find((d) => d.dayIndex === dayIndex);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-[#141c23]/55 backdrop-blur-sm sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-trip-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg bg-[#fbf8f5] rounded-t-[28px] sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden text-left text-[#141c23]"
      >
        {/* Grab handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-2.5">
          <span className="w-10 h-1.5 rounded-full bg-[#e2bfb5]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 pt-3 sm:pt-5 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-[#d84a1b] text-white flex items-center justify-center shadow-md shadow-[#d84a1b]/25">
              <Route className="w-5 h-5" />
            </span>
            <h3 id="add-trip-title" className="text-lg sm:text-xl font-black">
              เพิ่มเข้าทริป
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="w-9 h-9 rounded-full hover:bg-[#f3ede7] flex items-center justify-center text-[#5a413a] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 pb-4 space-y-6">
          {/* Place preview */}
          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white border border-[#e2bfb5]/50 shadow-sm">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#f3ede7] shrink-0 flex items-center justify-center">
              {placeImageUrl ? (
                <img
                  src={placeImageUrl}
                  alt={placeName}
                  className="w-full h-full object-cover"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              ) : (
                <MapPin className="w-6 h-6 text-[#d84a1b]/50" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold truncate">{placeName}</p>
              {placeSubtitle && (
                <p className="text-xs text-[#8e7068] truncate">{placeSubtitle}</p>
              )}
            </div>
          </div>

          {/* Step 1: trip */}
          <section>
            <StepLabel n={1} title="เลือกทริป" done={!!tripIdNum} />

            {isTripListLoading ? (
              <div className="space-y-2.5">
                {[0, 1].map((i) => (
                  <div key={i} className="h-[68px] rounded-2xl bg-[#f3ede7] animate-pulse" />
                ))}
              </div>
            ) : trips.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-[#e2bfb5] bg-white p-6 text-center">
                <p className="font-bold">ยังไม่มีทริป</p>
                <p className="text-sm text-[#8e7068] mt-1">
                  สร้างทริปแรกของคุณ แล้วกลับมาเพิ่มสถานที่นี้ได้เลย
                </p>
                <button
                  type="button"
                  onClick={onCreateTrip}
                  className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#d84a1b] hover:bg-[#b83c13] text-white text-sm font-bold"
                >
                  <Plus className="w-4 h-4" /> สร้างทริปใหม่
                </button>
              </div>
            ) : (
              <div className="space-y-2.5" role="radiogroup">
                {trips.map((t) => {
                  const active = t.tripId === selectedTripId;
                  return (
                    <button
                      key={t.tripId}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setSelectedTripId(active ? "" : t.tripId)}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all ${
                        active
                          ? "border-[#d84a1b] bg-white shadow-md shadow-[#d84a1b]/10"
                          : "border-transparent bg-white hover:border-[#e2bfb5] shadow-sm"
                      }`}
                    >
                      <span
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          active ? "bg-[#d84a1b] text-white" : "bg-[#ffdbd1]/60 text-[#d84a1b]"
                        }`}
                      >
                        <CalendarDays className="w-5 h-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold truncate">{t.title}</span>
                        <span className="block text-xs text-[#8e7068] truncate">
                          {formatRange(t.startDateTime, t.endDateTime)}
                        </span>
                      </span>
                      <span
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          active ? "bg-[#d84a1b] border-[#d84a1b] text-white" : "border-[#e2bfb5]"
                        }`}
                      >
                        {active && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                      </span>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={onCreateTrip}
                  className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl border-2 border-dashed border-[#e2bfb5] text-sm font-bold text-[#8e7068] hover:text-[#d84a1b] hover:border-[#d84a1b] transition-colors"
                >
                  <Plus className="w-4 h-4" /> สร้างทริปใหม่
                </button>
              </div>
            )}
          </section>

          {/* Step 2: day */}
          {tripIdNum && (
            <section>
              <StepLabel n={2} title="เลือกวัน" done={!!selectedDay} />
              {isTripDetailLoading ? (
                <div className="flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-[72px] w-24 rounded-2xl bg-[#f3ede7] animate-pulse" />
                  ))}
                </div>
              ) : !hasTripDates || dayOptions.length === 0 ? (
                <p className="text-sm text-[#b86e00] bg-[#ffdcbd]/50 rounded-xl px-4 py-3">
                  ทริปนี้ยังไม่ได้ตั้งวันเริ่ม/วันจบ จะเพิ่มไว้ในวันที่ 1
                </p>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
                  {dayOptions.map((d) => {
                    const active = d.dayIndex === dayIndex;
                    const date = d.label.split("•")[1]?.trim() ?? "";
                    return (
                      <button
                        key={d.dayIndex}
                        type="button"
                        onClick={() => setDayIndex(d.dayIndex)}
                        className={`snap-start shrink-0 min-w-[88px] px-3 py-2.5 rounded-2xl border-2 text-center transition-all ${
                          active
                            ? "bg-[#d84a1b] border-[#d84a1b] text-white shadow-md shadow-[#d84a1b]/25"
                            : "bg-white border-transparent hover:border-[#e2bfb5] shadow-sm"
                        }`}
                      >
                        <span className={`block text-[13px] font-semibold ${active ? "text-white/80" : "text-[#8e7068]"}`}>
                          วันที่
                        </span>
                        <span className="block text-xl font-black leading-tight">{d.dayIndex}</span>
                        <span className={`block text-[13px] ${active ? "text-white/90" : "text-[#5a413a]"}`}>
                          {date}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] bg-white border-t border-[#e2bfb5]/40">
          {selectedTrip && (
            <p className="text-xs text-[#8e7068] mb-2.5 truncate">
              เพิ่มใน <span className="font-bold text-[#141c23]">{selectedTrip.title}</span>
              {selectedDay && <> · วันที่ {selectedDay.dayIndex}</>}
            </p>
          )}
          <button
            type="button"
            disabled={isAddingToTrip || !tripIdNum}
            onClick={onSubmit}
            className="w-full h-13 py-3.5 rounded-full bg-[#d84a1b] hover:bg-[#b83c13] text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#d84a1b]/25 transition-all active:scale-[0.98] disabled:bg-[#e2bfb5] disabled:shadow-none disabled:cursor-not-allowed"
          >
            {isAddingToTrip ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> กำลังเพิ่ม...
              </>
            ) : tripIdNum ? (
              <>
                <Plus className="w-5 h-5" /> เพิ่มเข้าทริป
              </>
            ) : (
              "เลือกทริปก่อน"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function StepLabel({ n, title, done }: { n: number; title: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span
        className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center ${
          done ? "bg-[#16693c] text-white" : "bg-[#141c23] text-white"
        }`}
      >
        {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : n}
      </span>
      <h4 className="font-bold">{title}</h4>
    </div>
  );
}
