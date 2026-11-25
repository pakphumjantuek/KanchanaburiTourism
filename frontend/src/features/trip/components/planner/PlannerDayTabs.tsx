import type { TripItemDto } from "../../tripTypes";

type Props = {
  maxDay: number;
  selectedDay: number;
  itemsSorted: TripItemDto[];
  onSelectDay: (day: number) => void;
  tripStart?: string | null;
};

export default function PlannerDayTabs({
  maxDay,
  selectedDay,
  itemsSorted,
  onSelectDay,
  tripStart,
}: Props) {
  const days = Array.from({ length: Math.max(maxDay, 1) }, (_, i) => i + 1);
  const start = tripStart ? new Date(tripStart) : null;
  const validStart = start && !Number.isNaN(start.getTime());

  return (
    <div role="tablist" aria-label="เลือกวัน" className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
      {days.map((d) => {
        const active = d === selectedDay;
        const count = itemsSorted.filter((x) => x.dayIndex === d).length;
        const date = validStart ? new Date(start!.getTime() + (d - 1) * 86400000) : null;

        return (
          <button
            key={d}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelectDay(d)}
            className={`snap-start shrink-0 min-w-[104px] px-4 py-2.5 rounded-2xl border-2 text-left transition-all ${
              active
                ? "bg-[#d84a1b] border-[#d84a1b] text-white shadow-md shadow-[#d84a1b]/25"
                : "bg-white border-transparent shadow-sm hover:border-[#e2bfb5]"
            }`}
          >
            <span className={`block text-[13px] font-semibold ${active ? "text-white/80" : "text-[#8e7068]"}`}>
              {date ? date.toLocaleDateString("th-TH", { weekday: "short", day: "numeric", month: "short" }) : " "}
            </span>
            <span className="block font-black">วันที่ {d}</span>
            <span className={`block text-[13px] ${active ? "text-white/90" : "text-[#5a413a]"}`}>{count} สถานที่</span>
          </button>
        );
      })}
    </div>
  );
}
