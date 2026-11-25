import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Img = { imageId?: number; imageUrl: string };

type Props = {
  placeName: string;
  images: Img[];
  selectedImageIndex: number;
  onSelect: (index: number) => void;
};

export function PlaceGallery({
  placeName,
  images,
  selectedImageIndex,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // ✅ ถ้าข้างนอกส่ง selectedImageIndex มา ให้ sync เข้ามา
  useEffect(() => {
    if (
      typeof selectedImageIndex === "number" &&
      selectedImageIndex >= 0 &&
      selectedImageIndex < images.length
    ) {
      setCurrentIndex(selectedImageIndex);
    }
  }, [selectedImageIndex, images.length]);

  const base = import.meta.env.VITE_API_BASE_URLS ?? "";

  const rawUrl = useMemo(() => {
    const u = images?.[currentIndex]?.imageUrl ?? "";
    return `${base}${u}`;
  }, [base, images, currentIndex]);

  // ตัวเลือก: เปิดใช้ถ้าหลังบ้านรองรับ เช่น /img.jpg?w=1600&q=90
  const mainUrl = rawUrl; // เปลี่ยนเป็น `${rawUrl}?w=1600&q=90` ถ้ารองรับ

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  };

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((i) => (i === images.length - 1 ? 0 : i + 1));
  };


  if (!images || images.length === 0) {
    return (
      <div className="w-full h-full min-h-[400px] bg-slate-50 flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300">
        <div className="p-4 bg-white rounded-full shadow-sm mb-3">
          <span className="text-3xl">📷</span>
        </div>
        <span className="text-slate-400 font-medium">ไม่มีรูปภาพ</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col gap-4">
      {/* Main Image */}
      <div className="relative flex-1 w-full min-h-[300px] group rounded-3xl overflow-hidden shadow-lg border border-slate-100 bg-slate-900">
        <img
          src={mainUrl}
          alt={`${placeName} ${currentIndex + 1}`}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Counter Badge */}
        <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md text-white text-xs font-bold border border-white/10">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="h-20 lg:h-24 flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent px-1">
          {images.map((img, idx) => {
            const url = `${base}${img.imageUrl}`;
            const isActive = idx === currentIndex;

            return (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative flex-shrink-0 aspect-[4/3] rounded-xl overflow-hidden transition-all duration-300 border-2 ${
                  isActive
                    ? "border-emerald-500 opacity-100 scale-100 shadow-md"
                    : "border-transparent opacity-60 hover:opacity-100 hover:scale-95"
                }`}
              >
                <img
                  src={url}
                  alt={`Thumbnail ${idx}`}
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
