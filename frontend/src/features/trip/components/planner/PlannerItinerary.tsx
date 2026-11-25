import {
  ArrowDown,
  ArrowUp,
  Car,
  Clock,
  Flag,
  ImageOff,
  MapPin,
  Plus,
  Trash2,
} from "lucide-react";
import type { TripItemDto } from "../../tripTypes";
import type { PlaceLite, TimelineRow } from "./timeline";
import { fmtHHMM } from "./timeline";

type Props = {
  dayItems: TripItemDto[];
  rows: TimelineRow[];
  placeMap: Map<number, PlaceLite>;
  startAt: Date;
  isBusy: boolean;
  onAddPlace: () => void;
  onOpenPlace: (placeId: number) => void;
  onMove: (tripItemId: number, dir: "up" | "down") => void;
  onRemove: (tripItemId: number) => void;
};

const STATUS: Record<string, { label: string; cls: string; card: string }> = {
  arrive_before_open: { label: "ยังไม่เปิด", cls: "bg-[#ffdcbd] text-[#8a5100]", card: "border-[#e88d14]/50" },
  arrive_after_close: { label: "ปิดแล้ว", cls: "bg-[#fdecea] text-[#b3261e]", card: "border-[#b3261e]/40" },
  stay_exceed_close: { label: "เที่ยวเกินเวลาปิด", cls: "bg-[#fdecea] text-[#b3261e]", card: "border-[#b3261e]/40" },
  closed: { label: "ปิดทำการวันนี้", cls: "bg-slate-200 text-slate-700", card: "border-slate-300" },
  exceed_trip_end: { label: "เกินเวลาทริป", cls: "bg-[#b3261e] text-white", card: "border-[#b3261e]/40" },
};

const iconBtn =
  "w-9 h-9 rounded-full flex items-center justify-center text-[#5a413a] hover:bg-[#f3ede7] disabled:opacity-30 disabled:pointer-events-none transition-colors";

export default function PlannerItinerary({
  dayItems,
  rows,
  placeMap,
  startAt,
  isBusy,
  onAddPlace,
  onOpenPlace,
  onMove,
  onRemove,
}: Props) {
  const rowById = new Map(rows.map((r) => [r.tripItemId, r]));

  if (dayItems.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-[#e2bfb5] bg-white p-10 text-center">
        <span className="mx-auto w-14 h-14 rounded-2xl bg-[#ffdbd1]/60 text-[#d84a1b] flex items-center justify-center mb-3">
          <MapPin className="w-7 h-7" />
        </span>
        <p className="font-black text-lg">ยังไม่มีสถานที่ในวันนี้</p>
        <p className="text-sm text-[#8e7068] mt-1">เพิ่มสถานที่แรกเพื่อเริ่มจัดตาราง</p>
        <button
          type="button"
          onClick={onAddPlace}
          className="mt-5 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#d84a1b] hover:bg-[#b83c13] text-white text-sm font-bold"
        >
          <Plus className="w-4 h-4" /> เพิ่มสถานที่
        </button>
      </div>
    );
  }

  const last = rows[rows.length - 1];

  return (
    <ol className="relative">
      {/* vertical rail */}
      <span className="absolute left-[27px] sm:left-[31px] top-6 bottom-6 w-0.5 bg-[#e2bfb5]" aria-hidden />

      <Marker icon={<Flag className="w-4 h-4" />} tone="bg-[#16693c]" label="ออกเดินทาง" time={fmtHHMM(startAt)} />

      {dayItems.map((it, idx) => {
        const r = rowById.get(it.tripItemId);
        const p = placeMap.get(it.placeId);
        const st = r && r.status !== "ok" ? STATUS[r.status] : null;

        return (
          <li key={it.tripItemId} className="relative">
            {r && idx > 0 && r.travelFromPrevMinutes > 0 && (
              <div className="flex items-center gap-2 pl-[60px] sm:pl-[68px] py-2 text-xs font-semibold text-[#2c5c8a]">
                <Car className="w-3.5 h-3.5" /> เดินทาง {r.travelFromPrevMinutes} นาที
              </div>
            )}

            <div className="flex gap-3 sm:gap-4 py-2">
              <span className="relative z-10 w-14 sm:w-16 shrink-0 flex flex-col items-center pt-3">
                <span className="w-9 h-9 rounded-full bg-[#d84a1b] text-white text-sm font-black flex items-center justify-center ring-4 ring-[#fbf8f5]">
                  {idx + 1}
                </span>
                {r && <span className="mt-1 text-xs font-bold text-[#141c23]">{fmtHHMM(r.arriveAt)}</span>}
              </span>

              <div className={`flex-1 min-w-0 bg-white rounded-2xl border shadow-sm overflow-hidden ${st?.card ?? "border-[#e2bfb5]/50"}`}>
                <div className="flex">
                  <button
                    type="button"
                    onClick={() => onOpenPlace(it.placeId)}
                    className="w-20 sm:w-28 shrink-0 bg-[#f3ede7] flex items-center justify-center text-[#e2bfb5]"
                    aria-label={`ดูข้อมูล ${p?.name ?? ""}`}
                  >
                    {p?.coverUrl ? (
                      <img src={p.coverUrl} alt="" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                    ) : (
                      <ImageOff className="w-6 h-6" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0 p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenPlace(it.placeId)}
                        className="font-bold text-left leading-snug hover:text-[#d84a1b] line-clamp-2"
                      >
                        {p?.name ?? r?.name ?? `สถานที่ #${it.placeId}`}
                      </button>
                      {st && (
                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[13px] font-bold ${st.cls}`}>
                          {st.label}
                          {r?.status === "exceed_trip_end" && r.exceedTripEndMinutes ? ` ${r.exceedTripEndMinutes} น.` : ""}
                        </span>
                      )}
                    </div>

                    {r && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#5a413a]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#d84a1b]" />
                          {fmtHHMM(r.arriveAt)}–{fmtHHMM(r.departAt)} · {r.stayMinutes} นาที
                        </span>
                        <span className="text-[#8e7068]">
                          {r.status === "closed"
                            ? "ปิดทำการ"
                            : r.openAt || r.closeAt
                            ? `เปิด ${r.openAt ? fmtHHMM(r.openAt) : "-"}–${r.closeAt ? fmtHHMM(r.closeAt) : "-"}`
                            : "ไม่ระบุเวลาเปิด"}
                        </span>
                      </div>
                    )}

                    <div className="mt-2 -mb-1 -mr-1 flex justify-end gap-0.5">
                      <button type="button" className={iconBtn} disabled={idx === 0 || isBusy} onClick={() => onMove(it.tripItemId, "up")} aria-label="เลื่อนขึ้น">
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button type="button" className={iconBtn} disabled={idx === dayItems.length - 1 || isBusy} onClick={() => onMove(it.tripItemId, "down")} aria-label="เลื่อนลง">
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className={`${iconBtn} hover:!bg-[#fdecea] hover:text-[#b3261e]`}
                        disabled={isBusy}
                        onClick={() => onRemove(it.tripItemId)}
                        aria-label="ลบออกจากวันนี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </li>
        );
      })}

      {last && (
        <Marker icon={<Flag className="w-4 h-4" />} tone="bg-[#141c23]" label="จบวัน" time={fmtHHMM(last.departAt)} />
      )}

      <li className="pl-[60px] sm:pl-[68px] pt-2">
        <button
          type="button"
          onClick={onAddPlace}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-[#e2bfb5] text-sm font-bold text-[#8e7068] hover:text-[#d84a1b] hover:border-[#d84a1b] flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" /> เพิ่มสถานที่ในวันนี้
        </button>
      </li>
    </ol>
  );
}

function Marker({ icon, tone, label, time }: { icon: React.ReactNode; tone: string; label: string; time: string }) {
  return (
    <li className="relative flex items-center gap-3 sm:gap-4 py-2">
      <span className="relative z-10 w-14 sm:w-16 shrink-0 flex justify-center">
        <span className={`w-9 h-9 rounded-full text-white flex items-center justify-center ring-4 ring-[#fbf8f5] ${tone}`}>
          {icon}
        </span>
      </span>
      <span className="text-sm">
        <span className="text-[#8e7068]">{label}</span>{" "}
        <span className="font-black text-[#141c23]">{time} น.</span>
      </span>
    </li>
  );
}
