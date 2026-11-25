import type { TripItemDto } from "../../tripTypes";
import type { PlaceLite } from "./timeline";

type Props = {
  tripId: number;
  selectedDay: number;

  dayItems: TripItemDto[];
  placeMap: Map<number, PlaceLite>;

  isRemoving: boolean;
  isReordering: boolean;

  openingText: (placeId: number) => string;

  onAddPlace: () => void;
  onOpenPlace: (placeId: number) => void;
  onMove: (tripItemId: number, dir: "up" | "down") => void;
  onRemove: (tripItemId: number) => void;
};

export default function PlannerList({
  selectedDay,
  dayItems,
  placeMap,
  isRemoving,
  isReordering,
  openingText,
  onAddPlace,
  onOpenPlace,
  onMove,
  onRemove,
}: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <div className="text-lg font-bold text-gray-900">ขั้นตอนที่ 2: จัดลำดับสถานที่</div>
          <div className="text-xs text-gray-600">วันที่ {selectedDay} • กด ↑ ↓ เพื่อเปลี่ยนลำดับ</div>
        </div>

        <button
          onClick={onAddPlace}
          className="text-sm font-semibold px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
        >
          + เพิ่มสถานที่ในวันนี้
        </button>
      </div>

      {dayItems.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50">
          <div className="text-gray-900 font-bold">ยังไม่มีสถานที่ในวันนี้</div>
          <div className="text-sm text-gray-600 mt-1">กดปุ่ม “เพิ่มสถานที่ในวันนี้” เพื่อเริ่มวางแผน</div>
        </div>
      ) : (
        <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
          {dayItems.map((it, idx) => {
            const p = placeMap.get(it.placeId);
            const name = p?.name ?? `Place #${it.placeId}`;

            return (
              <div
                key={it.tripItemId}
                className="border border-gray-200 rounded-xl p-4 hover:border-blue-200 hover:shadow-sm transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div className="font-bold text-gray-900 truncate">{name}</div>
                    </div>

                    <div className="mt-2 text-sm text-gray-700 space-y-1">
                      <div className="text-gray-600">{openingText(it.placeId)}</div>
                      <div className="text-gray-600">
                        เวลาเที่ยวแนะนำ:{" "}
                        <span className="font-semibold text-gray-800">{p?.avgVisitMinutes ?? 60} นาที</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenPlace(it.placeId)}
                      className="mt-2 text-sm font-semibold text-blue-600 hover:underline"
                    >
                      ดูข้อมูลสถานที่ →
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <div className="flex gap-1">
                      <button
                        onClick={() => onMove(it.tripItemId, "up")}
                        disabled={idx === 0 || isReordering}
                        className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-30"
                        title="เลื่อนขึ้น"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => onMove(it.tripItemId, "down")}
                        disabled={idx === dayItems.length - 1 || isReordering}
                        className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-30"
                        title="เลื่อนลง"
                      >
                        ↓
                      </button>
                    </div>

                    <button
                      onClick={() => onRemove(it.tripItemId)}
                      disabled={isRemoving}
                      className="px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-40"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(isRemoving || isReordering) && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 font-semibold">
          {isRemoving ? "กำลังลบสถานที่..." : "กำลังบันทึกลำดับใหม่..."}
        </div>
      )}
    </div>
  );
}
