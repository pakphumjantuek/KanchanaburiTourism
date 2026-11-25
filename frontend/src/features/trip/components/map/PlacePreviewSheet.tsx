import { useEffect, useState } from "react";
import { ArrowRight, Car, Clock, ImageOff, MapPin, Navigation, Star, Ticket, X, ZoomIn } from "lucide-react";

type Place = {
  placeId: number;
  name?: string | null;
  address?: string | null;
  description?: string | null;
  categoryName?: string | null;
  averageRating?: number | null;
  reviewCount?: number | null;
  avgVisitMinutes?: number | null;
  priceRange?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  tags?: string[];
};

type Props = {
  place: Place | undefined;
  placeId: number;
  orderNo?: number;
  coverUrl?: string;
  eta?: { legMin?: number; etaTravel?: number };
  onClose: () => void;
  onZoom: () => void;
  onOpenDetail: () => void;
};

export function PlacePreviewSheet({ place, placeId, orderNo, coverUrl, eta, onClose, onZoom, onOpenDetail }: Props) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const name = place?.name ?? `สถานที่ #${placeId}`;
  const hasRating = !!place?.averageRating && place.averageRating > 0;
  const hasCoord = typeof place?.latitude === "number" && typeof place?.longitude === "number";
  const navUrl = hasCoord
    ? `https://www.google.com/maps/dir/?api=1&destination=${place!.latitude},${place!.longitude}`
    : null;

  const facts = [
    place?.avgVisitMinutes ? { icon: Clock, text: `ใช้เวลา ~${place.avgVisitMinutes} นาที` } : null,
    { icon: Ticket, text: place?.priceRange ? `฿${place.priceRange.toLocaleString()}` : "เข้าชมฟรี" },
    typeof eta?.legMin === "number" ? { icon: Car, text: `${eta.legMin} นาทีจากจุดก่อนหน้า` } : null,
  ].filter(Boolean) as { icon: typeof Clock; text: string }[];

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-end md:items-center justify-center bg-[#141c23]/45 backdrop-blur-sm md:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={name}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full md:max-w-md bg-white rounded-t-[28px] md:rounded-3xl shadow-2xl overflow-hidden text-left text-[#141c23] max-h-[90vh] flex flex-col"
      >
        {/* Cover */}
        <div className="relative h-48 sm:h-56 shrink-0 bg-gradient-to-br from-[#2a3640] to-[#00210e]">
          {coverUrl && !imgFailed ? (
            <img src={coverUrl} alt={name} onError={() => setImgFailed(true)} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <ImageOff className="absolute inset-0 m-auto w-10 h-10 text-white/25" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#141c23]/85 via-[#141c23]/10 to-transparent" />

          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-md"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute top-3 left-3 flex gap-1.5">
            {orderNo != null && (
              <span className="h-7 px-2.5 rounded-full bg-[#d84a1b] text-white text-xs font-black flex items-center shadow-md">
                จุดที่ {orderNo}
              </span>
            )}
            {place?.categoryName && (
              <span className="h-7 px-2.5 rounded-full bg-white/90 text-[#141c23] text-xs font-bold flex items-center">
                {place.categoryName}
              </span>
            )}
          </div>

          <div className="absolute bottom-3 left-4 right-4">
            <h2 className="text-xl sm:text-2xl font-black text-white leading-snug line-clamp-2">{name}</h2>
            <div className="mt-1 flex items-center gap-3 text-xs text-white/85">
              {hasRating ? (
                <span className="flex items-center gap-1 font-bold">
                  <Star className="w-3.5 h-3.5 fill-[#e88d14] text-[#e88d14]" />
                  {place!.averageRating!.toFixed(1)}
                  <span className="font-normal text-white/70">({place?.reviewCount ?? 0})</span>
                </span>
              ) : (
                <span className="text-white/70">ยังไม่มีรีวิว</span>
              )}
              {place?.address && (
                <span className="flex items-center gap-1 min-w-0">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-amber-300" />
                  <span className="truncate">{place.address}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {facts.map(({ icon: Icon, text }) => (
              <span key={text} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#fbf8f5] border border-[#e2bfb5]/50 text-xs font-semibold text-[#5a413a]">
                <Icon className="w-3.5 h-3.5 text-[#d84a1b]" /> {text}
              </span>
            ))}
          </div>

          {place?.description && (
            <p className="text-sm text-[#5a413a] leading-relaxed line-clamp-4">{place.description}</p>
          )}

          {!!place?.tags?.length && (
            <div className="flex flex-wrap gap-1.5">
              {place.tags.slice(0, 5).map((t) => (
                <span key={t} className="text-[13px] font-semibold text-[#16693c] bg-[#16693c]/10 px-2 py-0.5 rounded-md">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 sm:p-5 pt-0 pb-[max(1rem,env(safe-area-inset-bottom))] grid grid-cols-[auto_auto_1fr] gap-2">
          <button
            type="button"
            onClick={onZoom}
            aria-label="ซูมไปที่หมุด"
            title="ซูมไปที่หมุด"
            className="w-12 h-12 rounded-full border border-[#e2bfb5] flex items-center justify-center hover:border-[#d84a1b] hover:text-[#d84a1b]"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          {navUrl ? (
            <a
              href={navUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="นำทางด้วย Google Maps"
              title="นำทางด้วย Google Maps"
              className="w-12 h-12 rounded-full border border-[#e2bfb5] flex items-center justify-center hover:border-[#d84a1b] hover:text-[#d84a1b]"
            >
              <Navigation className="w-5 h-5" />
            </a>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onOpenDetail}
            className="h-12 rounded-full bg-[#d84a1b] hover:bg-[#b83c13] text-white font-bold flex items-center justify-center gap-2 shadow-md shadow-[#d84a1b]/25"
          >
            ดูรายละเอียด <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
