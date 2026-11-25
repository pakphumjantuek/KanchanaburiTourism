import { CalendarClock, CalendarX } from "lucide-react";
import type { PlaceDto } from "../../placeTypes";
import { formatFullDateTime, remainingText } from "../../../../utils/eventTime";

// แถบแจ้งสถานะอีเวนต์ในหน้ารายละเอียดสถานที่ (แสดงเมื่อสถานที่นี้ถูกตั้งเป็นอีเวนต์)
export function EventBanner({ place }: { place: PlaceDto }) {
  if (!place.isEvent) return null;

  if (place.eventStatus === "ended") {
    return (
      <div role="status" className="mb-4 flex items-start gap-3 rounded-2xl border border-[#e2bfb5] bg-white px-4 py-3.5 text-[#5a413a] shadow-sm">
        <CalendarX className="mt-0.5 h-5 w-5 shrink-0 text-[#8e7068]" aria-hidden />
        <div>
          <p className="font-bold text-[#141c23]">อีเวนต์นี้จบแล้ว</p>
          <p className="text-sm">จบเมื่อ {formatFullDateTime(place.eventEndAt)} ข้อมูลนี้เก็บไว้เพื่อให้ดูย้อนหลังเท่านั้น</p>
        </div>
      </div>
    );
  }

  if (place.eventStatus === "upcoming") {
    return (
      <div role="status" className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-amber-900">
        <CalendarClock className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div>
          <p className="font-bold">อีเวนต์ยังไม่เริ่ม</p>
          <p className="text-sm">เริ่มแสดง {formatFullDateTime(place.eventStartAt)} (ตอนนี้เห็นเฉพาะแอดมินและเจ้าของ)</p>
        </div>
      </div>
    );
  }

  const remain = remainingText(place.eventEndAt);
  return (
    <div role="status" className="mb-4 flex items-start gap-3 rounded-2xl border border-[#d84a1b]/30 bg-[#fff1ea] px-4 py-3.5 text-[#5a413a]">
      <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-[#d84a1b]" aria-hidden />
      <div>
        <p className="font-bold text-[#141c23]">อีเวนต์ชั่วคราว</p>
        <p className="text-sm">
          จัดถึง {formatFullDateTime(place.eventEndAt)}
          {remain && <span className="font-semibold text-[#d84a1b]"> · {remain}</span>}
        </p>
      </div>
    </div>
  );
}
