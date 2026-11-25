// import { type PlaceCategory } from "./../placeCategory/placeCategoryTypes";
export interface PlaceDto {
  placeId: number;
  ownerId?: number | null;
  isEvent?: boolean;
  eventStartAt?: string | null;
  eventEndAt?: string | null;
  /** null = ไม่ใช่อีเวนต์ | upcoming | active | ended */
  eventStatus?: "upcoming" | "active" | "ended" | null;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  address?: string;
  // openTime?: string;
  // closeTime?: string;
  avgVisitMinutes?: number;
  priceRange?: number;
  popularityScore: number;
  categoryId?: number;
  categoryName?: string;
  isActive?: boolean;
  averageRating?: number;
  reviewCount?: number;

  categories: string[];
  tags: string[];
  images: PlaceImageDto[];
}

export interface CreatePlaceRequest {
  placeId?: number;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  address?: string;
  avgVisitMinutes?: number;
  priceRange?: number;
  isActive?: boolean;
  categoryId?: number;
  tagIds?: number[];
  isEvent?: boolean;
  eventStartAt?: string;
  eventEndAt?: string;
}

export interface PlaceImageDto {
  imageId: number;
  imageUrl: string;
  isCover: boolean;
}

export type UpsertPlaceDishPayload = {
  dishId: number;
  price?: number | null;
  isAvailable: boolean;
};

// รายการเมนูของร้าน (ตอนอ่านกลับ)
export type DishForPlaceDto = {
  dishId: number;
  nameTH: string;
  nameEN?: string | null;
  spicyLevel: number;
  isHalal: boolean;
  isVegetarian: boolean;
  price?: number | null;
  isAvailable: boolean;
  coverImageUrl?: string | null;
};


export const BehaviorActionType = {
  View: 1,
  Click: 2,
  AddToTrip: 3,
  Favorite: 4,
  Review: 5,
  Search: 6,
} as const;

export type BehaviorActionType =
  typeof BehaviorActionType[keyof typeof BehaviorActionType];

export interface PlaceActionCountDto {
  actionType: BehaviorActionType;
  count: number;
}

export interface PlaceBehaviorDashboardDto {
  placeId: number;
  views: number;
  favorites: number;
  addToTrips: number;
  reviews: number;
  uniqueUsers: number;
  actions: PlaceActionCountDto[];
}

export const BehaviorActionLabel: Record<number, string> = {
  1: "View",
  2: "Click",
  3: "AddToTrip",
  4: "Favorite",
  5: "Review",
  6: "Search",
};