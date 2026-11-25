import { Star, Share2, Bookmark } from "lucide-react";

type Props = {
  name: string;
  categoryName?: string | null;
  isOpenText?: string;
  averageRating?: number;
  reviewCount?: number;
};

export function PlaceHeader({
  name,
  categoryName,
  isOpenText = "เปิดอยู่",
  averageRating,
  reviewCount,
}: Props) {
  return (
    <div className="bg-white border-b border-slate-100 shadow-sm relative z-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-4">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {categoryName && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-100 uppercase tracking-wide">
                  {categoryName}
                </span>
              )}
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wide ${
                  isOpenText === "ปิดอยู่"
                    ? "bg-red-50 text-red-700 border-red-100"
                    : "bg-emerald-50 text-emerald-700 border-emerald-100"
                }`}
              >
                {isOpenText}
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight leading-tight">
              {name}
            </h1>

            <div className="flex items-center gap-4 text-sm flex-wrap text-slate-600 font-medium">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-50 text-yellow-700 border border-yellow-100">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-bold">
                  {averageRating?.toFixed(1) || "0.0"}
                </span>
                <span className="opacity-75">({reviewCount || 0} รีวิว)</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 transition-all font-semibold shadow-sm active:scale-95">
              <Bookmark className="w-4 h-4" />
              <span>บันทึก</span>
            </button>

            <button className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 transition-all font-semibold shadow-sm active:scale-95">
              <Share2 className="w-4 h-4" />
              <span>แชร์</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
