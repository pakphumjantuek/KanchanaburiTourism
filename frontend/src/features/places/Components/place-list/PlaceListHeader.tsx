import { Search, X } from "lucide-react";
import heroBg from "../../../../assets/hero-bridge.jpg";

type Props = {
  search: string;
  setSearch: (v: string) => void;
  setPage: (v: number) => void;
  kicker?: string;
  title?: React.ReactNode;
  subtitle?: string;
  placeholder?: string;
};

export function PlaceListHeader({
  search,
  setSearch,
  setPage,
  kicker = "Explore Kanchanaburi",
  title = (
    <>
      สถานที่ท่องเที่ยว<span className="text-[#ffb59c]">กาญจนบุรี</span>
    </>
  ),
  subtitle = "ธรรมชาติ น้ำตก เขื่อน และประวัติศาสตร์ พร้อมให้คุณออกไปค้นพบ",
  placeholder = "ค้นหาสถานที่ เช่น น้ำตก, วัด, คาเฟ่...",
}: Props) {
  return (
    <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 pt-5 sm:pt-8">
      <div className="relative rounded-3xl sm:rounded-[28px] overflow-hidden min-h-[260px] sm:min-h-[320px] flex items-end shadow-xl shadow-[#141c23]/10">
        <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#141c23]/90 via-[#141c23]/60 to-[#141c23]/10" />

        <div className="relative w-full p-5 sm:p-10 text-left">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-1 rounded-full bg-[#d84a1b]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#ffdbd1]">{kicker}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            {title}
          </h1>
          <p className="mt-2 text-sm sm:text-lg text-white/80 max-w-xl">
            {subtitle}
          </p>

          <div className="mt-5 relative max-w-2xl">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#d84a1b]" />
            <input
              type="text"
              aria-label="ค้นหาสถานที่"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={placeholder}
              className="w-full h-14 pl-13 pr-12 rounded-full bg-white text-[#141c23] placeholder:text-[#8e7068] shadow-xl focus:outline-none focus:ring-4 focus:ring-[#d84a1b]/30 text-base"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full hover:bg-[#f3ede7] flex items-center justify-center text-[#8e7068]"
                aria-label="ล้างคำค้นหา"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
