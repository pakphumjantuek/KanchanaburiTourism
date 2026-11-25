import { PillButton } from "./ui";

export function TripDetailTabs({
  tab,
  onTab,
  dayFilter,
  onDay,
  days,
  countByDay,
}: {
  tab: "items" | "segments";
  onTab: (t: "items" | "segments") => void;

  dayFilter: number;
  onDay: (d: number) => void;

  days: number[];
  countByDay: Map<number, number>;
}) {
  return (
    <div className="p-4 border-b border-gray-200 bg-white">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => onTab("items")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border-2 transition ${
              tab === "items"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white hover:bg-gray-50 border-gray-300 text-gray-700"
            }`}
          >
            📍 <span>รายการสถานที่</span>
          </button>

          <button
            onClick={() => onTab("segments")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border-2 transition ${
              tab === "segments"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white hover:bg-gray-50 border-gray-300 text-gray-700"
            }`}
          >
            🛣️ <span>เส้นทางการเดินทาง</span>
          </button>
        </div>

        <div className="md:ml-auto flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">กรองตามวัน:</span>
          <PillButton active={dayFilter === 0} onClick={() => onDay(0)}>
            ทั้งหมด
          </PillButton>
          {days.map((d) => (
            <PillButton key={d} active={dayFilter === d} onClick={() => onDay(d)}>
              วันที่ {d} <span className="opacity-80">({countByDay.get(d) ?? 0})</span>
            </PillButton>
          ))}
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-500">
        เคล็ดลับ: ถ้าตารางเวลาไม่ลงตัว ให้ไปที่{" "}
        <span className="font-semibold text-blue-700">ไปหน้าวางแผน</span> แล้วสลับลำดับสถานที่
      </div>
    </div>
  );
}
