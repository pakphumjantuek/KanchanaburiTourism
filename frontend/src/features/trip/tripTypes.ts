// ---- Types (แนะนำแยกไฟล์ tripTypes.ts ก็ได้) ----
export type TripDto = {
  tripId: number;
  userId: number;
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  startLat?: number;
  startLng?: number;
  createdAt?: string;
  updatedAt?: string | null;
};

export type TripItemDto = {
  tripItemId: number;
  tripId: number;
  placeId: number;
  dayIndex: number;
  orderIndex: number;
  plannedArrivalTime?: string | null;
  plannedDurationMinutes?: number | null;
  notes?: string | null;
};

export type TripSegmentDto = {
  tripSegmentId: number;
  tripId: number;
  fromTripItemId: number;
  toTripItemId: number;
  distanceKm: number;
  travelMinutes: number;
  transportMode: string;
  routePolyline?: string | null;
};

export type TripDetailDto = TripDto & {
  items: TripItemDto[];
  segments: TripSegmentDto[];
};

// ---- Requests ----
export type CreateTripRequest = {
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  startLat?: number;
  startLng?: number;
};

export type AddTripItemRequest = {
  placeId: number;
  dayIndex: number;
  orderIndex: number;
  plannedArrivalTime?: string | null;
  plannedDurationMinutes?: number | null;
  notes?: string | null;
};

export type UpdateTripItemRequest = {
  dayIndex: number;
  orderIndex: number;
  plannedArrivalTime?: string | null;
  plannedDurationMinutes?: number | null;
  notes?: string | null;
};

export type ReorderTripItemsRequest = {
  dayIndex: number;
  items: Array<{ tripItemId: number; orderIndex: number }>;
};

// ---- AutoTrip ----
export type TransportMode = "driving" | "walking" | "cycling";

export type AutoTripRequest = {
  startDateTime: string; // ISO เช่น "2025-12-28T08:00:00Z"
  days?: number; // default 1
  hoursPerDay?: number; // default 8
  startLat?: number | null;
  startLng?: number | null;
  transportMode?: TransportMode;

  preferredCategoryIds?: number[]; // เช่น ["ธรรมชาติ","คาเฟ่"]

  // ✅ เพิ่มใหม่: 0..1 (0 แน่น / 1 ชิล)
  relaxedPace?: number; // default 0.5

  // ✅ เพิ่มใหม่: 0..1 (0 ประหยัด / 1 แพงได้)
  budgetLevel?: number; // default 0.5

  // ✅ เพิ่มใหม่: มีเด็ก/ผู้สูงอายุ
  withElderOrKids?: boolean; // default false
};

export type TripMapViewDto = {
  tripId: number;
  title: string;
  dayIndex: number;
  maxDay?: number;

  stops: Array<{
    tripItemId: number;
    placeId: number;
    orderIndex: number;
    name: string;
    latitude: number;
    longitude: number;
    address?: string | null;
    type: "start" | "end" | "normal";

    // ===== NEW (ETA) =====
    /** เวลาขับสะสมจากจุดเริ่ม (นาที) */
    etaTravelMinutesFromStart?: number;

    /** เวลาสะสมรวมขับ + แวะ (นาที) */
    etaTotalMinutesFromStart?: number;

    /** เวลาขับจากจุดก่อนหน้ามาจุดนี้ (นาที) */
    legMinutesFromPrev?: number;

    /** เวลาที่แวะ ณ จุดก่อนหน้า (นาที) */
    stayMinutesAtPrev?: number;
  }>;

  route?: {
    totalDistanceKm: number;
    totalTravelMinutes: number;
    polyline: number[][]; // [[lng,lat], ...]
  };
};

// ถ้า backend คืน TripDto (ส่วนใหญ่จะเป็นแบบนี้)
export type AutoTripResponse = TripDto;
