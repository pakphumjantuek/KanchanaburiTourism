import { SectionTitle } from "./ui";
import type { TripSegment } from "./types";

export function TripSegmentsPanel({
  segmentsAllCount,
  filteredSegments,
  dayFilter,
  itemById,
  onGoMap,
}: {
  tripId: number;
  segmentsAllCount: number;
  filteredSegments: TripSegment[];
  dayFilter: number;
  itemById: Map<number, { order: number; day: number; placeId: number; name: string }>;
  onGoMap: () => void;
}) {
  return (
    <>
      <SectionTitle
        title="เส้นทางการเดินทาง"
        subtitle={dayFilter === 0 ? "แสดงเส้นทางทั้งหมด (เรียงตามลำดับสถานที่)" : `แสดงเฉพาะเส้นทางของ “วันที่ ${dayFilter}”`}
      />

      {segmentsAllCount === 0 ? (
        <div className="rounded-2xl border bg-gray-50 p-6 text-center">
          <div className="text-5xl">🚗</div>
          <div className="mt-2 font-extrabold text-gray-900">ยังไม่มีข้อมูลเส้นทาง</div>
          <div className="mt-1 text-sm text-gray-600">จะมีเมื่อมีสถานที่อย่างน้อย 2 จุด และคำนวณเส้นทาง</div>
          <button
            onClick={onGoMap}
            className="mt-4 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
          >
            🗺️ ไปหน้าแผนที่
          </button>
        </div>
      ) : filteredSegments.length === 0 ? (
        <div className="rounded-2xl border bg-gray-50 p-6 text-center">
          <div className="text-5xl">🧭</div>
          <div className="mt-2 font-extrabold text-gray-900">ไม่มีเส้นทางใน “วันที่ {dayFilter}”</div>
          <div className="mt-1 text-sm text-gray-600">ลองเลือก “ทั้งหมด” หรือคำนวณเส้นทางของวันนั้นก่อน</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSegments.map((s) => {
            const from = itemById.get(s.fromTripItemId);
            const to = itemById.get(s.toTripItemId);

            return (
              <div
                key={s.tripSegmentId ?? `${s.fromTripItemId}-${s.toTripItemId}`}
                className="rounded-xl border border-gray-200 bg-white p-4 hover:border-purple-300 hover:shadow-sm transition"
              >
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <div className="font-bold text-gray-900 text-sm">
                    <span className="text-blue-600">#{from?.order ?? "?"}</span> {from?.name ?? s.fromTripItemId}
                    <span className="mx-2 text-gray-400">→</span>
                    <span className="text-blue-600">#{to?.order ?? "?"}</span> {to?.name ?? s.toTripItemId}
                  </div>

                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                    {String(s.transportMode ?? "รถยนต์")}
                  </span>

                  {from?.day && (
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                      วันที่ {from.day}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                    <div className="text-xs text-emerald-700 font-semibold mb-1">ระยะทาง</div>
                    <div className="font-extrabold text-emerald-900">{(s.distanceKm ?? 0).toFixed(2)} กม.</div>
                  </div>

                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <div className="text-xs text-amber-700 font-semibold mb-1">เวลาเดินทาง</div>
                    <div className="font-extrabold text-amber-900">{s.travelMinutes ?? 0} นาที</div>
                  </div>

                  <div className="rounded-lg bg-purple-50 border border-purple-200 p-3">
                    <div className="text-xs text-purple-700 font-semibold mb-1">พาหนะ</div>
                    <div className="font-extrabold text-purple-900 capitalize">{String(s.transportMode ?? "รถยนต์")}</div>
                  </div>
                </div>
              </div>
            );
          })}

          <button
            onClick={onGoMap}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all shadow-sm"
          >
            🗺️ <span>ดูแผนที่ทั้งหมด</span>
          </button>
        </div>
      )}
    </>
  );
}
