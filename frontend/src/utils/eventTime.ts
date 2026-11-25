// ตัวช่วยเรื่องเวลาอีเวนต์ของสถานที่ (backend เก็บ UTC · หน้าเว็บแสดงเป็นเวลาท้องถิ่นของผู้ใช้)

const shortFmt = new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short" });
const fullFmt = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** "30 พ.ย." */
export const formatShortDate = (iso?: string | null) => (iso ? shortFmt.format(new Date(iso)) : "");

/** "30 พ.ย. 2569 09:39 น." */
export const formatFullDateTime = (iso?: string | null) => (iso ? `${fullFmt.format(new Date(iso))} น.` : "");

/** ค่าสำหรับ <input type="datetime-local"> (เวลาท้องถิ่น) */
export function toLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** แปลงค่า datetime-local (เวลาท้องถิ่น) เป็น ISO UTC สำหรับส่ง backend */
export const fromLocalInput = (v: string): string | undefined => (v ? new Date(v).toISOString() : undefined);

/** "เหลืออีก ..." สำหรับอีเวนต์ที่กำลังแสดง */
export function remainingText(endIso?: string | null, now = Date.now()): string | null {
  if (!endIso) return null;
  const ms = new Date(endIso).getTime() - now;
  if (ms <= 0) return null;
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `เหลืออีก ${Math.max(mins, 1)} นาที`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `เหลืออีก ${hours} ชั่วโมง`;
  return `เหลืออีก ${Math.floor(hours / 24)} วัน`;
}

export type EventStatus = "upcoming" | "active" | "ended" | null | undefined;

/** ปุ่มลัดเวลาสิ้นสุด (คืนค่า datetime-local) */
export const endPresets: { key: string; label: string; build: () => string }[] = [
  {
    key: "today",
    label: "สิ้นสุดวันนี้",
    build: () => {
      const d = new Date();
      d.setHours(23, 59, 0, 0);
      return toLocalInput(d.toISOString());
    },
  },
  { key: "7d", label: "อีก 7 วัน", build: () => toLocalInput(new Date(Date.now() + 7 * 864e5).toISOString()) },
  { key: "30d", label: "อีก 30 วัน", build: () => toLocalInput(new Date(Date.now() + 30 * 864e5).toISOString()) },
];
