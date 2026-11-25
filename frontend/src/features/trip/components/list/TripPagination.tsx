import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
};

const btn =
  "w-11 h-11 rounded-full bg-white border border-[#e2bfb5]/60 text-[#5a413a] flex items-center justify-center hover:border-[#d84a1b] hover:text-[#d84a1b] transition-colors disabled:opacity-40 disabled:pointer-events-none";

export function TripPagination({ page, totalPages, onPrev, onNext }: Props) {
  if (totalPages <= 1) return null;

  return (
    <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Pagination">
      <button type="button" onClick={onPrev} disabled={page === 1} aria-label="หน้าก่อนหน้า" className={btn}>
        <ChevronLeft className="w-5 h-5" />
      </button>
      <span className="px-4 text-sm font-semibold text-[#5a413a]">
        หน้า <span className="text-[#141c23] font-black">{page}</span> / {totalPages}
      </span>
      <button type="button" onClick={onNext} disabled={page === totalPages} aria-label="หน้าถัดไป" className={btn}>
        <ChevronRight className="w-5 h-5" />
      </button>
    </nav>
  );
}
