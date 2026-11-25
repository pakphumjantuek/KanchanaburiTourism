// src/features/trip/planner/timeline.ts
import type { TripItemDto, TripSegmentDto, TripDetailDto } from "../../tripTypes";
import type { PlaceType as OpeningHourDto } from "../../../placeOpening/placetype";

export type PlaceLite = {
  placeId: number;
  name: string;
  avgVisitMinutes?: number | null;
  coverUrl?: string;
};

export type TimelineRowStatus =
  | "ok"
  | "arrive_before_open"
  | "arrive_after_close"
  | "stay_exceed_close"
  | "closed"
  | "exceed_trip_end";

export type TimelineRow = {
  tripItemId: number;
  placeId: number;
  name: string;

  arriveAt: Date;
  departAt: Date;

  stayMinutes: number;
  travelFromPrevMinutes: number;

  openAt?: Date;
  closeAt?: Date;

  isClosed?: boolean;
  status: TimelineRowStatus;

  exceedTripEndMinutes?: number;
};

export type IssuesSummary = {
  closed: number;
  beforeOpen: number;
  afterClose: number;
  exceedClose: number;
  exceedTrip: number;
  totalIssues: number;
};

export const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);

export const safeTripResult = (d: any) => d?.result ?? d;

export const sortItems = (trip?: TripDetailDto) =>
  (trip?.items ?? [])
    .slice()
    .sort(
      (a, b) =>
        (a.dayIndex ?? 1) - (b.dayIndex ?? 1) ||
        (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
    );

export const toHHMM = (t?: string | null) => {
  if (!t) return null;
  const s = String(t).trim();
  if (!s) return null;
  const parts = s.split(":");
  if (parts.length < 2) return null;
  const hh = (parts[0] ?? "00").padStart(2, "0");
  const mm = (parts[1] ?? "00").padStart(2, "0");
  return `${hh}:${mm}`;
};

export const hhmmFromDateTime = (dt?: string | null, fallback = "09:00") => {
  if (!dt) return fallback;
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return fallback;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

export const atDayTime = (day: Date, hhmm: string) => {
  const [hh, mm] = hhmm.split(":").map((n) => Number(n));
  const d = new Date(day);
  d.setHours(hh || 0, mm || 0, 0, 0);
  return d;
};

export const fmtHHMM = (d: Date) =>
  d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });

export const dayOfWeekFromTripDay = (
  tripStart?: string | null,
  dayIndex?: number | null
) => {
  if (!tripStart) return null;
  const start = new Date(tripStart);
  if (Number.isNaN(start.getTime())) return null;
  const offset = Math.max((dayIndex ?? 1) - 1, 0);
  const d = new Date(start);
  d.setDate(d.getDate() + offset);
  return d.getDay(); // 0-6
};

export const getOpeningForTripDay = (
  openingByPlace: Map<number, OpeningHourDto[]>,
  placeId: number,
  tripStart: string | null | undefined,
  dayIndex: number
) => {
  const dow = dayOfWeekFromTripDay(tripStart, dayIndex);
  if (dow == null) return null;
  const list = openingByPlace.get(placeId) ?? [];
  return list.find((x) => x.dayOfWeek === dow) ?? null;
};

export function buildTimeline(params: {
  dayBaseDate: Date;
  startTimeHHMM: string;
  tripStart?: string | null;
  tripEndAt?: Date | null;

  items: TripItemDto[];
  places: Map<number, PlaceLite>;
  segments?: TripSegmentDto[];
  openingByPlace: Map<number, OpeningHourDto[]>;
}) {
  const {
    dayBaseDate,
    startTimeHHMM,
    tripStart,
    tripEndAt,
    items,
    places,
    segments = [],
    openingByPlace,
  } = params;

  const segMap = new Map<string, TripSegmentDto>();
  for (const s of segments) segMap.set(`${s.fromTripItemId}->${s.toTripItemId}`, s);

  const startAt = atDayTime(dayBaseDate, startTimeHHMM);
  let cursor = new Date(startAt);

  const rows: TimelineRow[] = [];

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const p = places.get(it.placeId);

    // travel
    const prev = items[i - 1];
    let travelMin = 0;
    if (prev) {
      const seg = segMap.get(`${prev.tripItemId}->${it.tripItemId}`);
      travelMin = seg?.travelMinutes ?? 0;
      cursor = new Date(cursor.getTime() + travelMin * 60_000);
    }

    const arriveAt = new Date(cursor);

    // stay
    const stayMinutes = Math.max(10, p?.avgVisitMinutes ?? 60);
    const departAt = new Date(arriveAt.getTime() + stayMinutes * 60_000);

    // opening
    const oh = getOpeningForTripDay(openingByPlace, it.placeId, tripStart, it.dayIndex);
    const isClosed = Boolean(oh?.isClosed);

    const openHHMM = toHHMM(oh?.openTime ?? null);
    const closeHHMM = toHHMM(oh?.closeTime ?? null);

    const openAt = !isClosed && openHHMM ? atDayTime(dayBaseDate, openHHMM) : undefined;
    let closeAt = !isClosed && closeHHMM ? atDayTime(dayBaseDate, closeHHMM) : undefined;

    // close across midnight
    if (openAt && closeAt && closeAt < openAt) {
      closeAt = new Date(closeAt);
      closeAt.setDate(closeAt.getDate() + 1);
    }

    let status: TimelineRowStatus = "ok";

    if (isClosed) {
      status = "closed";
    } else {
      if (openAt && arriveAt < openAt) status = "arrive_before_open";
      if (closeAt && arriveAt > closeAt) status = "arrive_after_close";
      if (closeAt && arriveAt <= closeAt && departAt > closeAt) status = "stay_exceed_close";
    }

    let exceedTripEndMinutes: number | undefined;
    if (tripEndAt) {
      const diffMs = departAt.getTime() - tripEndAt.getTime();
      if (diffMs > 0) exceedTripEndMinutes = Math.ceil(diffMs / 60_000);
    }

    if (!isClosed && tripEndAt && departAt > tripEndAt) status = "exceed_trip_end";

    rows.push({
      tripItemId: it.tripItemId,
      placeId: it.placeId,
      name: p?.name ?? `Place #${it.placeId}`,
      arriveAt,
      departAt,
      stayMinutes,
      travelFromPrevMinutes: travelMin,
      openAt,
      closeAt,
      isClosed,
      status,
      exceedTripEndMinutes,
    });

    cursor = new Date(departAt);
  }

  return {
    rows,
    totalStay: rows.reduce((a, r) => a + r.stayMinutes, 0),
    totalTravel: rows.reduce((a, r) => a + r.travelFromPrevMinutes, 0),
    startAt,
  };
}

export function summarizeIssues(rows: TimelineRow[]): IssuesSummary {
  const count = (s: TimelineRowStatus) => rows.filter((r) => r.status === s).length;

  const closed = count("closed");
  const beforeOpen = count("arrive_before_open");
  const afterClose = count("arrive_after_close");
  const exceedClose = count("stay_exceed_close");
  const exceedTrip = count("exceed_trip_end");
  const totalIssues = closed + beforeOpen + afterClose + exceedClose + exceedTrip;

  return { closed, beforeOpen, afterClose, exceedClose, exceedTrip, totalIssues };
}

export const swapReorderPayload = (items: TripItemDto[], idx: number, swapIdx: number) => {
  const reordered = items.slice();
  [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
  return reordered.map((it, i) => ({ tripItemId: it.tripItemId, orderIndex: i + 1 }));
};
