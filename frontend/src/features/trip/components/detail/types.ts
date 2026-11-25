export type TripItem = {
  tripItemId: number;
  placeId: number;
  dayIndex: number; // 1..N
  orderIndex: number;
};

export type TripSegment = {
  tripSegmentId?: number;
  fromTripItemId: number;
  toTripItemId: number;
  distanceKm?: number;
  travelMinutes?: number;
  transportMode?: string;
};

export type TripDetail = {
  tripId?: number;
  title: string;
  description?: string | null;
  startDateTime?: string | null;
  endDateTime?: string | null;
  items: TripItem[];
  segments: TripSegment[];
};
