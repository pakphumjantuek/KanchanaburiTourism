import { SectionTitle, Badge } from "./ui";
import type { TripItem } from "./types";

export function TripItemsPanel({
  itemsAllCount,
  filteredItems,
  dayFilter,
  placeMap,
  renderOpeningText,
  onGoPlanner,
  onGoPlace,
}: {
  tripId: number;
  itemsAllCount: number;
  filteredItems: TripItem[];
  dayFilter: number;
  placeMap: Map<number, any>;
  renderOpeningText: (placeId: number, dayIndex: number) => string;
  onGoPlanner: () => void;
  onGoPlace: (placeId: number) => void;
}) {
  return (
    <>
      <SectionTitle
        title="สถานที่ในทริป"
        subtitle={
          dayFilter === 0 ? "แสดงสถานที่ทั้งหมด (เรียงตามวันและลำดับ)" : `แสดงเฉพาะ “วันที่ ${dayFilter}”`
        }
      />

      {itemsAllCount === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-10 text-center">
          <div className="text-5xl mb-2">🧳</div>
          <div className="text-lg font-extrabold text-gray-900">ยังไม่มีสถานที่ท่องเที่ยวในทริป</div>
          <div className="mt-2 text-sm text-gray-600">เริ่มต้นวางแผนการเดินทางโดยเพิ่มสถานที่ที่ต้องการไป</div>
          <button
            onClick={onGoPlanner}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-sm"
          >
            ✏️ <span>ไปหน้าวางแผน</span>
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border bg-gray-50 p-6 text-center">
          <div className="text-5xl">📭</div>
          <div className="mt-2 font-extrabold text-gray-900">ไม่มีสถานที่ใน “วันที่ {dayFilter}”</div>
          <div className="mt-1 text-sm text-gray-600">
            ลองเลือก “ทั้งหมด” หรือเพิ่มสถานที่ในวันนั้นจากหน้า “ไปหน้าวางแผน”
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((it) => {
            const p: any = placeMap.get(it.placeId);
            const name = p?.name ?? `Place #${it.placeId}`;

            return (
              <div
                key={it.tripItemId}
                className="rounded-2xl border border-gray-200 bg-white p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 text-blue-700 font-extrabold flex items-center justify-center shrink-0">
                    {it.orderIndex ?? "-"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-extrabold text-gray-900 truncate">{name}</div>
                      <Badge tone="blue">วันที่ {it.dayIndex}</Badge>
                      <Badge>ลำดับ {it.orderIndex}</Badge>
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                        <div className="text-xs text-gray-600 font-semibold mb-1">เวลาทำการ (ตามวันในทริป)</div>
                        <div className="font-extrabold text-gray-900">{renderOpeningText(it.placeId, it.dayIndex)}</div>
                      </div>

                      <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                        <div className="text-xs text-gray-600 font-semibold mb-1">เวลาเที่ยวแนะนำ</div>
                        <div className="font-extrabold text-gray-900">
                          {p?.avgVisitMinutes ? `${p.avgVisitMinutes} นาที` : "60 นาที"}
                        </div>
                      </div>
                    </div>

                    {p?.address && (
                      <div className="mt-2 text-xs text-gray-600">
                        📍 <span className="line-clamp-2">{p.address}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onGoPlace(it.placeId)}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border-2 border-gray-300 bg-white hover:border-blue-500 hover:text-blue-700 text-sm font-semibold shrink-0 transition-all"
                    title="ดูรายละเอียดสถานที่"
                  >
                    <span>ดูรายละเอียด</span>
                    <span>›</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
