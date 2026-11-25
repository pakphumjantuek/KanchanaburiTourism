import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Clock, ImageOff, Star, CalendarClock } from "lucide-react";
import type { PlaceDto } from "../../placeTypes";
import { getPlaceImageUrl } from "./placeListUtils";
import { formatShortDate } from "../../../../utils/eventTime";

type Props = {
  place: PlaceDto;
  onClickLog: (placeId: number) => Promise<void>;
};

export function PlaceCard({ place, onClickLog }: Props) {
  const navigate = useNavigate();
  const imageUrl = getPlaceImageUrl(place);
  const [imgFailed, setImgFailed] = useState(false);
  const hasRating = !!place.averageRating && place.averageRating > 0;

  const handleClick = async () => {
    await onClickLog(place.placeId).catch(() => {});
    navigate(`/placeDetails/${place.placeId}`, { state: { place } });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group flex flex-col w-full h-full text-left bg-white rounded-2xl overflow-hidden border border-[#e2bfb5]/50 shadow-md shadow-[#141c23]/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#d84a1b]/30"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#f3ede7] flex items-center justify-center text-[#e2bfb5]">
        {imageUrl && !imgFailed ? (
          <img
            src={imageUrl}
            alt={place.name}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <ImageOff className="w-9 h-9" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

        {place.categoryName && (
          <span className="absolute top-3 left-3 px-2.5 py-0.5 bg-white/95 rounded-lg text-xs text-[#d84a1b] font-bold">
            {place.categoryName}
          </span>
        )}
        <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-white/95 text-xs font-bold text-[#141c23]">
          {place.priceRange ? `฿${place.priceRange.toLocaleString()}` : "ฟรี"}
        </span>
        {place.isEvent && (
          <span className="absolute bottom-2.5 right-3 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#d84a1b] text-xs font-bold text-white">
            <CalendarClock className="w-3.5 h-3.5" aria-hidden />
            อีเวนต์{place.eventEndAt ? ` · ถึง ${formatShortDate(place.eventEndAt)}` : ""}
          </span>
        )}
        <span className="absolute bottom-2.5 left-3 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/95 text-xs font-bold text-[#141c23]">
          {hasRating ? (
            <>
              <Star className="w-3.5 h-3.5 fill-[#e88d14] text-[#e88d14]" />
              {place.averageRating!.toFixed(1)}
              <span className="font-normal text-[#8e7068]">({place.reviewCount ?? 0})</span>
            </>
          ) : (
            <span className="text-[#8e7068] font-semibold">ยังไม่มีรีวิว</span>
          )}
        </span>
      </div>

      <div className="flex flex-col flex-1 p-4 gap-2">
        <h3 className="font-bold text-base leading-snug line-clamp-2 group-hover:text-[#d84a1b] transition-colors">
          {place.name}
        </h3>
        <div className="mt-auto space-y-1 text-xs text-[#8e7068]">
          {place.address && (
            <p className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-[#d84a1b]" />
              <span className="line-clamp-1">{place.address.split(",")[0] || place.address}</span>
            </p>
          )}
          {!!place.avgVisitMinutes && (
            <p className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 shrink-0 text-[#d84a1b]" />
              ใช้เวลาประมาณ {place.avgVisitMinutes >= 60 ? `${Math.round(place.avgVisitMinutes / 30) / 2} ชม.` : `${place.avgVisitMinutes} นาที`}
            </p>
          )}
        </div>
        {!!place.tags?.length && (
          <div className="flex gap-1.5 overflow-hidden pt-1">
            {place.tags.slice(0, 2).map((t) => (
              <span key={t} className="shrink-0 text-[13px] font-semibold text-[#16693c] bg-[#16693c]/10 px-2 py-0.5 rounded-md">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
