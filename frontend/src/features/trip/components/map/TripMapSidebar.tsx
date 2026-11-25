import { Car, ChevronRight, MapPinOff, Route } from "lucide-react";
import type { TripItemDto } from "../../tripTypes";

type PlaceLike = {
  placeId: number;
  name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
};

export type LegInfo = { color: string; km: number; min: number; approx: boolean; from: number; to: number };

export type TripMapSidebarProps = {
  tripId: number;
  selectedDay: number;

  onlyWithCoords: boolean;
  onToggleOnlyWithCoords: () => void;

  dayItemsRaw: TripItemDto[];
  dayItems: TripItemDto[];

  placeMap: Map<number, PlaceLike>;

  coordStats: { total: number; withCoords: number; withoutCoords: number };

  hoveredPlaceId: number | null;

  onHover: (placeId: number | null) => void;
  onClickPlace: (placeId: number) => void;

  onGoPlanner: () => void;

  legInfo: Map<number, LegInfo>; // key = placeId ปลายทางของช่วง
  arriveAt: Map<number, string>;
};

export function TripMapSidebar(props: TripMapSidebarProps) {
  const {
    selectedDay,
    onlyWithCoords,
    onToggleOnlyWithCoords,
    dayItemsRaw,
    dayItems,
    placeMap,
    coordStats,
    hoveredPlaceId,
    onHover,
    onClickPlace,
    onGoPlanner,
    legInfo,
    arriveAt,
  } = props;

  const list = onlyWithCoords ? dayItems : dayItemsRaw;

  return (
    <div className="h-full flex flex-col rounded-3xl border border-[#e2bfb5]/40 bg-white shadow-sm overflow-hidden text-left">
      <div className="px-5 pt-5 pb-3">
        <p className="text-xs font-bold uppercase tracking-wider text-[#8e7068]">ลำดับการไป · วันที่ {selectedDay}</p>
        <p className="text-[13px] text-[#8e7068] mt-0.5 hidden lg:block">ชี้เพื่อซูมบนแผนที่ · กดเพื่อดูรายละเอียด</p>
      </div>

      {coordStats.withoutCoords > 0 && (
        <div className="mx-4 mb-2 rounded-2xl bg-[#ffdcbd]/50 border border-[#e88d14]/40 p-3 flex items-center gap-3">
          <MapPinOff className="w-4 h-4 text-[#8a5100] shrink-0" />
          <p className="flex-1 text-xs text-[#8a5100]">
            <b>{coordStats.withoutCoords} จุดไม่มีพิกัด</b> จึงไม่แสดงบนแผนที่
          </p>
          <button
            type="button"
            role="switch"
            aria-checked={!onlyWithCoords}
            onClick={onToggleOnlyWithCoords}
            className="text-xs font-bold text-[#8a5100] underline underline-offset-2 shrink-0"
          >
            {onlyWithCoords ? "แสดงในรายการ" : "ซ่อน"}
          </button>
        </div>
      )}

      {dayItemsRaw.length === 0 ? (
        <div className="flex-1 p-8 text-center">
          <Route className="w-8 h-8 mx-auto text-[#e2bfb5]" />
          <p className="mt-2 font-bold">ยังไม่มีสถานที่ในวันนี้</p>
          <button
            type="button"
            onClick={onGoPlanner}
            className="mt-4 px-5 py-2.5 rounded-full bg-[#d84a1b] hover:bg-[#b83c13] text-white text-sm font-bold"
          >
            ไปหน้าวางแผน
          </button>
        </div>
      ) : (
        <ol className="flex-1 overflow-y-auto px-3 pb-4">
          {list.map((it, idx) => {
            const p = placeMap.get(it.placeId);
            const title = p?.name ?? `สถานที่ #${it.placeId}`;
            const hasCoord = typeof p?.latitude === "number" && typeof p?.longitude === "number";
            const isStart = idx === 0;
            const isEnd = idx === list.length - 1 && list.length > 1;
            const leg = legInfo.get(it.placeId);
            const time = arriveAt.get(it.placeId);
            const active = hoveredPlaceId === it.placeId;
            const tone = !hasCoord ? "bg-[#e2bfb5]" : isStart ? "bg-[#16693c]" : isEnd ? "bg-[#141c23]" : "bg-[#d84a1b]";

            return (
              <li key={it.tripItemId}>
                {leg && (
                  <div className="flex items-center gap-2 pl-[26px] py-0.5 text-[13px] font-bold" style={{ color: leg.color }}>
                    <span className={`w-1 h-6 rounded-full mr-2.5 ${leg.approx ? "opacity-60" : ""}`} style={{ background: leg.color }} />
                    <Car className="w-3.5 h-3.5" />
                    {leg.approx ? "~" : ""}{leg.km.toFixed(1)} กม. · {leg.min} นาที
                  </div>
                )}
                <button
                  type="button"
                  onMouseEnter={() => onHover(it.placeId)}
                  onMouseLeave={() => onHover(null)}
                  onFocus={() => onHover(it.placeId)}
                  onBlur={() => onHover(null)}
                  onClick={() => onClickPlace(it.placeId)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-left transition-colors ${
                    active ? "bg-[#ffdbd1]/50" : "hover:bg-[#fbf8f5]"
                  }`}
                >
                  <span className={`w-9 h-9 rounded-full text-white text-sm font-black flex items-center justify-center shrink-0 ${tone}`}>
                    {idx + 1}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-bold truncate">{title}</span>
                    <span className="block text-[13px] text-[#8e7068] truncate">
                      {!hasCoord
                        ? "ไม่มีพิกัด"
                        : time
                        ? `${isStart ? "ออกเดินทาง" : "ถึงประมาณ"} ${time} น.`
                        : isStart
                        ? "จุดเริ่มต้น"
                        : isEnd
                        ? "ปลายทาง"
                        : p?.address ?? ""}
                    </span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#e2bfb5] shrink-0" />
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
