import type { PlaceType as OpeningHourDto } from "../../../placeOpening/placetype";
import { getOpeningForTripDay, toHHMM } from "./timeline";

export function openingText(params: {
  openingByPlace: Map<number, OpeningHourDto[]>;
  placeId: number;
  tripStart?: string | null;
  dayIndex: number;
}) {
  const { openingByPlace, placeId, tripStart, dayIndex } = params;

  const oh = getOpeningForTripDay(openingByPlace, placeId, tripStart, dayIndex);
  if (!oh) return "เวลาเปิดทำการ: ไม่ระบุ";
  if (oh.isClosed) return "เวลาเปิดทำการ: ปิดทำการ";
  return `เวลาเปิดทำการ: ${toHHMM(oh.openTime) ?? "-"} - ${toHHMM(oh.closeTime) ?? "-"} น.`;
}
