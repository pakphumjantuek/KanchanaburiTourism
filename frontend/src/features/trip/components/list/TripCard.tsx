import { CalendarDays, Clock, Route, Trash2 } from "lucide-react";
import {
  formatThaiRange,
  getTripDuration,
  getTripStatus,
} from "../../utils/tripUi";

type Trip = {
  tripId: number;
  title: string;
  description?: string | null;
  startDateTime: string;
  endDateTime: string;
};

type Props = {
  trip: Trip;
  onOpen: (tripId: number) => void;
  onPlanner: (tripId: number) => void;
  onDelete: (tripId: number, title: string) => void;
};

export function TripCard({ trip, onOpen, onPlanner, onDelete }: Props) {
  const duration = getTripDuration(trip.startDateTime, trip.endDateTime);
  const status = getTripStatus(trip.startDateTime, trip.endDateTime);
  const range = formatThaiRange(trip.startDateTime, trip.endDateTime);
  const start = new Date(trip.startDateTime);
  const validStart = !Number.isNaN(start.getTime());

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(trip.tripId);
        }
      }}
      onClick={() => onOpen(trip.tripId)}
      className="group bg-white rounded-3xl border border-[#e2bfb5]/50 shadow-md shadow-[#141c23]/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col overflow-hidden text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-[#d84a1b]/30"
    >
      {/* Top band */}
      <div className="relative bg-gradient-to-br from-[#1c242b] via-[#293139] to-[#00210e] p-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {validStart && (
            <div className="w-14 shrink-0 rounded-2xl bg-white text-center overflow-hidden shadow-md">
              <p className="bg-[#d84a1b] text-white text-[12px] font-bold py-0.5">
                {start.toLocaleDateString("th-TH", { month: "short" })}
              </p>
              <p className="text-2xl font-black text-[#141c23] leading-tight py-1">
                {start.getDate()}
              </p>
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-black text-lg text-white leading-snug line-clamp-2 group-hover:text-[#ffdbd1] transition-colors">
              {trip.title}
            </h3>
            <p className="text-xs text-white/60 mt-0.5">
              {validStart && start.toLocaleDateString("th-TH", { weekday: "long" })}
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-bold border ${status.className}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-4">
        {trip.description ? (
          <p className="text-sm text-[#5a413a] line-clamp-2">{trip.description}</p>
        ) : (
          <p className="text-sm text-[#8e7068] italic">ยังไม่มีคำอธิบายทริป</p>
        )}

        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#fbf8f5] border border-[#e2bfb5]/50 text-[#5a413a]">
            <CalendarDays className="w-3.5 h-3.5 text-[#d84a1b]" />
            {range}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ffdbd1]/50 text-[#ab2f00]">
            <Clock className="w-3.5 h-3.5" />
            {duration} วัน
          </span>
        </div>

        <div className="mt-auto pt-4 border-t border-[#f3ede7] flex gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPlanner(trip.tripId);
            }}
            className="flex-1 h-11 rounded-full bg-[#d84a1b] hover:bg-[#b83c13] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-[#d84a1b]/20 transition-colors"
          >
            <Route className="w-4 h-4" />
            จัดแผนเที่ยว
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(trip.tripId, trip.title);
            }}
            aria-label={`ลบทริป ${trip.title}`}
            title="ลบทริป"
            className="w-11 h-11 rounded-full border border-[#e2bfb5]/60 text-[#8e7068] hover:text-[#b3261e] hover:border-[#b3261e]/40 hover:bg-[#fdecea] flex items-center justify-center transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
