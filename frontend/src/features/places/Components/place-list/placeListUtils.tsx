import type { PlaceDto } from "../../placeTypes";

export function getCoverImage(place: PlaceDto) {
  const coverImage = place.images?.find((img) => img.isCover);
  const firstImage = place.images?.[0];
  return coverImage || firstImage;
}

// คืน "" เมื่อไม่มีรูป → การ์ดแสดงไอคอนแทน (via.placeholder.com ปิดบริการแล้ว)
export function getPlaceImageUrl(place: PlaceDto) {
  const url = getCoverImage(place)?.imageUrl;
  if (!url) return "";
  return url.startsWith("http") ? url : `${import.meta.env.VITE_API_BASE_URLS ?? ""}${url}`;
}
