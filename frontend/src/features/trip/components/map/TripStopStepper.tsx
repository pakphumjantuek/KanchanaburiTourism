import { Car, ChevronLeft, ChevronRight, ImageOff, Play, X } from "lucide-react";

type Stop = { placeId: number; title: string; tone: "start" | "end" | "num" };

type Props = {
  stops: Stop[];
  activeId: number | null;
  onChange: (placeId: number | null) => void;
  coverOf: (placeId: number) => string | undefined;
  legOf: (placeId: number) => { color: string; km: number; min: number; approx: boolean } | undefined;
  arriveOf: (placeId: number) => string | undefined;
  onOpen: (placeId: number) => void;
};

const toneBg = { start: "bg-[#16693c]", end: "bg-[#141c23]", num: "bg-[#d84a1b]" } as const;

export function TripStopStepper({ stops, activeId, onChange, coverOf, legOf, arriveOf, onOpen }: Props) {
  if (stops.length === 0) return null;

  const idx = stops.findIndex((s) => s.placeId === activeId);

  if (idx < 0) {
    return (
      <button
        type="button"
        onClick={() => onChange(stops[0].placeId)}
        className="h-12 px-5 rounded-full bg-[#141c23] text-white text-sm font-bold flex items-center gap-2 shadow-xl hover:bg-[#293139]"
      >
        <Play className="w-4 h-4 fill-white" /> ดูทีละจุด ({stops.length} จุด)
      </button>
    );
  }

  const s = stops[idx];
  const cover = coverOf(s.placeId);
  const leg = legOf(s.placeId);
  const time = arriveOf(s.placeId);
  const go = (d: number) => onChange(stops[(idx + d + stops.length) % stops.length].placeId);

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-2.5 flex items-center gap-2 text-left text-[#141c23]">
      <button type="button" onClick={() => go(-1)} aria-label="จุดก่อนหน้า" className="w-10 h-10 rounded-full hover:bg-[#f3ede7] flex items-center justify-center shrink-0">
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button type="button" onClick={() => onOpen(s.placeId)} className="flex-1 min-w-0 flex items-center gap-3 text-left">
        <span className="relative w-16 h-16 rounded-2xl overflow-hidden bg-[#f3ede7] shrink-0 flex items-center justify-center text-[#e2bfb5]">
          {cover ? <img src={cover} alt="" className="w-full h-full object-cover" /> : <ImageOff className="w-6 h-6" />}
          <span className={`absolute top-1 left-1 w-6 h-6 rounded-full text-white text-xs font-black flex items-center justify-center ${toneBg[s.tone]}`}>
            {idx + 1}
          </span>
        </span>
        <span className="min-w-0">
          <span className="block text-[13px] font-semibold text-[#8e7068]">
            จุดที่ {idx + 1} จาก {stops.length}
            {time && <> · {idx === 0 ? "ออก" : "ถึง"} <b className="text-[#141c23]">{time}</b></>}
          </span>
          <span className="block font-black leading-snug line-clamp-2">{s.title}</span>
          {leg && (
            <span className="mt-0.5 flex items-center gap-1 text-[13px] font-bold" style={{ color: leg.color }}>
              <Car className="w-3 h-3" /> {leg.approx ? "~" : ""}{leg.km.toFixed(1)} กม. · {leg.min} นาทีจากจุดก่อน
            </span>
          )}
        </span>
      </button>

      <div className="flex flex-col gap-1 shrink-0">
        <button type="button" onClick={() => go(1)} aria-label="จุดถัดไป" className="w-10 h-10 rounded-full bg-[#d84a1b] hover:bg-[#b83c13] text-white flex items-center justify-center">
          <ChevronRight className="w-5 h-5" />
        </button>
        <button type="button" onClick={() => onChange(null)} aria-label="ดูทั้งหมด" className="w-10 h-6 rounded-full text-[#8e7068] hover:text-[#141c23] flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
