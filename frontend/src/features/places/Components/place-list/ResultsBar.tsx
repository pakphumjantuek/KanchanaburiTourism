import { Trash2, Sparkles } from "lucide-react";

type Props = {
  isLoading: boolean;
  filteredCount: number;
  total: number;
  hasFilters: boolean;
  onClear: () => void;
};

export function ResultsBar({
  isLoading,
  filteredCount,
  total,
  hasFilters,
  onClear,
}: Props) {
  if (isLoading) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-teal-50 text-teal-600">
          <Sparkles size={20} />
        </div>
        <div className="text-sm text-slate-600">
          พบผลลัพธ์{" "}
          <span className="font-bold text-slate-900 text-xl mx-0.5">
            {filteredCount}
          </span>{" "}
          รายการ
          <span className="text-slate-400 text-xs ml-2 hidden sm:inline-block">
            (จากทั้งหมด {total} สถานที่)
          </span>
        </div>
      </div>

      {hasFilters && (
        <button
          onClick={onClear}
          className="group flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 rounded-xl transition-all duration-200 border border-red-100"
        >
          <Trash2
            size={16}
            className="group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300"
          />
          ล้างตัวกรอง
        </button>
      )}
    </div>
  );
}
