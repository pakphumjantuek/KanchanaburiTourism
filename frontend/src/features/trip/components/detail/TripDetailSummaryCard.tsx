import { Badge } from "./ui";

export function TripDetailSummaryCard({
  title,
  description,
  startText,
  endText,
  totalDays,
  totalPlaces,
  totalSegments,
  totalKmText,
  totalMinText,
  isPlacesLoading,
  isDeleting,
  onDelete,
}: {
  title: string;
  description?: string | null;
  startText: string;
  endText: string;
  totalDays: number;
  totalPlaces: number;
  totalSegments: number;
  totalKmText?: string;
  totalMinText?: string;
  isPlacesLoading: boolean;
  isDeleting: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>ภาพรวมทริป</span>
        </div>

        <div className="mt-2 text-2xl font-extrabold text-gray-900 break-words">{title}</div>

        <div className="mt-2 text-xs text-gray-500">
          แนะนำ: หากอยากแก้ “ลำดับ/เวลาเที่ยว” ให้ไปที่ปุ่ม{" "}
          <span className="font-semibold text-blue-700">ไปหน้าวางแผน</span>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-start gap-2 text-sm">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <div className="text-xs text-gray-600 font-semibold">เริ่มต้น</div>
              <div className="font-bold text-gray-900">{startText}</div>
            </div>
          </div>

          <div className="flex items-start gap-2 text-sm">
            <svg className="w-5 h-5 text-green-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="text-xs text-gray-600 font-semibold">สิ้นสุด</div>
              <div className="font-bold text-gray-900">{endText}</div>
            </div>
          </div>
        </div>

        {description && (
          <div className="mt-4 text-sm text-gray-700 leading-relaxed bg-gray-50 border border-gray-200 rounded-2xl p-4">
            {description}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge>📅 {totalDays} วัน</Badge>
          <Badge tone="blue">📍 {totalPlaces} สถานที่</Badge>
          <Badge tone="purple">🛣️ {totalSegments} เส้นทาง</Badge>
          {totalSegments > 0 && (
            <>
              {totalKmText && <Badge tone="emerald">📏 {totalKmText}</Badge>}
              {totalMinText && <Badge tone="emerald">⏱ {totalMinText}</Badge>}
            </>
          )}
        </div>

        {isPlacesLoading && <div className="mt-3 text-xs text-gray-500">กำลังโหลดชื่อสถานที่...</div>}
      </div>

      <div className="p-5 bg-gray-50 border-t border-gray-200">
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isDeleting ? "กำลังดำเนินการ..." : "ลบทริปนี้"}
        </button>

        <div className="mt-2 text-xs text-center text-gray-600 flex items-center justify-center gap-1">
          <span className="text-amber-600">⚠️</span>
          <span>การลบจะไม่สามารถกู้คืนได้</span>
        </div>
      </div>
    </div>
  );
}
