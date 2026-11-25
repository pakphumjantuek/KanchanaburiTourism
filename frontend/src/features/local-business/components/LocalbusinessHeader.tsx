import { Search, X, UtensilsCrossed } from "lucide-react";

type Props = {
  search: string;
  setSearch: (v: string) => void;
  setPage: (v: number) => void;
};

export function LocalbusinessHeader({ search, setSearch, setPage }: Props) {
  return (
    <div className="relative bg-orange-600 text-white overflow-hidden shadow-lg mb-10">
      {/* background image */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30 blur-[2px]" />

      {/* gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-orange-900/50 via-red-900/60 to-orange-950/90" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
        {/* badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-md text-orange-50 text-sm font-medium mb-6 shadow-lg border border-white/20">
          <UtensilsCrossed className="w-4 h-4 text-orange-200" />
          ร้านอาหารและของกินพื้นเมือง
        </div>

        {/* title */}
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 drop-shadow-lg">
          อร่อยทั่ว
          <span className="text-orange-300"> เมืองกาญจน์</span>
        </h1>

        {/* subtitle */}
        <p className="text-lg text-orange-100 max-w-2xl mx-auto mb-10 font-light leading-relaxed">
          สัมผัสรสชาติที่เป็นเอกลักษณ์ วัตถุดิบสดใหม่จากธรรมชาติ
          <br className="hidden sm:block" />
          รวมร้านเด็ดร้านดังที่ชาวกาญจนบุรีแนะนำ
        </p>

        {/* search */}
        <div className="max-w-2xl mx-auto relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="ค้นหาร้านอาหาร, เมนูเด็ด..."
            className="block w-full pl-12 pr-12 py-4 rounded-full text-slate-900 placeholder:text-slate-400 bg-white shadow-xl border-2 border-transparent focus:border-orange-400 focus:ring-4 focus:ring-orange-500/20 focus:outline-none transition-all text-base"
          />

          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
              aria-label="clear search"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
