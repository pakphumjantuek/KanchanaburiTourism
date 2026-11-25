import type { PlaceType as OpeningHourDto } from "../../../placeOpening/placetype";

export const toHHMM = (t?: string | null) => {
  if (!t) return "-";
  const s = String(t).trim();
  if (!s) return "-";
  return s.length >= 5 ? s.substring(0, 5) : s;
};

/**
 * dayOfWeek (0-6) ของ “วันในทริป”
 * dayIndex: 1 = วันแรก, 2 = วันที่สอง ...
 */
export const getTripDayOfWeek = (tripStart?: string | null, dayIndex?: number | null) => {
  if (!tripStart) return null;
  const start = new Date(tripStart);
  if (Number.isNaN(start.getTime())) return null;

  const offsetDays = Math.max((dayIndex ?? 1) - 1, 0);
  const d = new Date(start);
  d.setDate(d.getDate() + offsetDays);
  return d.getDay(); // 0-6
};

export const renderOpeningText = (args: {
  placeId: number;
  dayIndex: number;
  tripStartDateTime?: string | null;
  openingByPlace: Map<number, OpeningHourDto[]>;
}) => {
  const { placeId, dayIndex, tripStartDateTime, openingByPlace } = args;
  const dow = getTripDayOfWeek(tripStartDateTime ?? null, dayIndex);
  const list = openingByPlace.get(placeId) ?? [];
  const oh = dow == null ? null : list.find((x) => x.dayOfWeek === dow);

  if (!oh) return "ไม่ระบุ";
  if (oh.isClosed) return "ปิดทำการ";
  return `${toHHMM(oh.openTime)} - ${toHHMM(oh.closeTime)} น.`;
};
