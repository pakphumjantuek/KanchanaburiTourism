import { Loader2, Plus, Search, Sparkles, X } from "lucide-react";

type Props = {
  search: string;
  onSearchChange: (v: string) => void;
  onClearSearch: () => void;

  onOpenAutoTrip: () => void;
  isAutoTripLoading: boolean;

  onCreate: () => void;
};

export function TripControls({
  search,
  onSearchChange,
  onClearSearch,
  onOpenAutoTrip,
  isAutoTripLoading,
  onCreate,
}: Props) {
  return (
    <div className="relative -mt-7 sm:-mt-9 mx-2 sm:mx-8 lg:mx-12 mb-8 sm:mb-10 bg-white rounded-2xl sm:rounded-3xl shadow-lg shadow-[#141c23]/8 border border-[#e2bfb5]/40 p-2.5 sm:p-3">
      <div className="flex flex-col md:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#d84a1b]" />
          <input
            type="text"
            aria-label="ค้นหาทริป"
            className="w-full h-12 pl-12 pr-11 rounded-full bg-[#fbf8f5] border border-transparent text-[#141c23] placeholder:text-[#8e7068] focus:outline-none focus:bg-white focus:border-[#d84a1b] focus:ring-4 focus:ring-[#d84a1b]/10 transition-all"
            placeholder="ค้นหาชื่อทริป หรือคำอธิบาย..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {search.trim().length > 0 && (
            <button
              type="button"
              onClick={onClearSearch}
              aria-label="ล้างคำค้นหา"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full hover:bg-[#f3ede7] flex items-center justify-center text-[#8e7068]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:flex gap-2.5">
          <button
            type="button"
            onClick={onOpenAutoTrip}
            disabled={isAutoTripLoading}
            className="h-12 px-5 rounded-full border-2 border-dashed border-[#e88d14]/60 bg-[#ffdcbd]/30 text-[#8a5100] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#ffdcbd]/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAutoTripLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isAutoTripLoading ? "กำลังสร้าง..." : "ให้ระบบช่วยจัด"}
          </button>
          <button
            type="button"
            onClick={onCreate}
            className="h-12 px-6 rounded-full bg-[#d84a1b] hover:bg-[#b83c13] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#d84a1b]/25 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            สร้างทริปใหม่
          </button>
        </div>
      </div>
    </div>
  );
}
