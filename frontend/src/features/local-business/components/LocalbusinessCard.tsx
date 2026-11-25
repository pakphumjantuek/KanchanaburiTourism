// src/features/place/components/place-list/PlaceCard.tsx
import { useNavigate } from "react-router-dom";
import { MapPin, Clock, Tag, ArrowRight, Utensils } from "lucide-react";
import type { PlaceDto } from "../../places/placeTypes";
import { getPlaceImageUrl } from "../../places/Components/place-list/placeListUtils";


type Props = {
  place: PlaceDto;
  onClickLog: (placeId: number) => Promise<void>;
};

export function LocalbusinessCard({ place, onClickLog }: Props) {
  const navigate = useNavigate();
  const imageUrl = getPlaceImageUrl(place);

  const handleClick = async () => {
    await onClickLog(place.placeId).catch(() => {});
    navigate(`/placeDetails/${place.placeId}`, { state: { place } });
  };

  return (
    <div
      onClick={handleClick}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={imageUrl}
          alt={place.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-80 transition-opacity" />

        {/* Price Tag */}
        {place.priceRange !== undefined && place.priceRange > 0 && (
          <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-sm shadow-sm flex items-center gap-1 border border-orange-100">
            <span className="text-xs font-bold text-orange-500">฿</span>
            <span className="text-sm font-bold text-slate-900">
              {place.priceRange.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        {/* Header (Category) */}
        <div className="flex justify-between items-start mb-3">
          {place.categoryName ? (
            <span className="flex items-center gap-1 px-2.5 py-1 text-[12px] font-bold uppercase tracking-wider text-orange-700 bg-orange-50 border border-orange-100 rounded-lg">
              <Utensils className="w-3 h-3" />
              {place.categoryName}
            </span>
          ) : <div />}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
          {place.name}
        </h3>

        {/* Details */}
        <div className="space-y-2 mb-4 flex-1">
          {/* Address */}
          {place.address && (
            <div className="flex items-start gap-2 text-slate-500">
              <MapPin className="w-4 h-4 shrink-0 text-orange-500 mt-0.5" />
              <span className="text-sm line-clamp-1 group-hover:text-slate-700 transition-colors">
                {place.address.split(",")[0] || place.address}
              </span>
            </div>
          )}

          {/* Duration */}
          {place.avgVisitMinutes && (
            <div className="flex items-center gap-2 text-slate-500">
              <Clock className="w-4 h-4 shrink-0 text-slate-400" />
              <span className="text-sm">
                ใช้เวลาประมาณ {Math.ceil(place.avgVisitMinutes / 60)} ชม.
              </span>
            </div>
          )}
        </div>

        {/* Footer (HashTags & Action) */}
        <div className="pt-4 mt-auto border-t border-slate-100 flex items-center justify-between">
          <div className="flex gap-2 overflow-hidden">
            {place.tags && place.tags.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 text-slate-500 rounded-md text-xs font-medium">
                <Tag className="w-3 h-3" />
                {place.tags[0]}
              </span>
            )}
          </div>

          <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300 shadow-sm">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
