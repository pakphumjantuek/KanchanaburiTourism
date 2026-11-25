import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  page: number;
  totalPages: number;
  onPageChange: (next: number) => void;
};

const navBtn =
  "w-11 h-11 rounded-full bg-white border border-[#e2bfb5]/60 text-[#5a413a] flex items-center justify-center hover:border-[#d84a1b] hover:text-[#d84a1b] disabled:opacity-40 disabled:pointer-events-none transition-colors";

export function PaginationBar({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);

  return (
    <nav aria-label="เปลี่ยนหน้า" className="flex justify-center items-center gap-2 mt-10">
      <button type="button" onClick={() => onPageChange(page - 1)} disabled={page === 1} aria-label="หน้าก่อนหน้า" className={navBtn}>
        <ChevronLeft className="w-5 h-5" />
      </button>
      {pages.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onPageChange(n)}
          aria-current={page === n ? "page" : undefined}
          className={`w-11 h-11 rounded-full font-bold transition-colors ${
            page === n ? "bg-[#d84a1b] text-white shadow-md shadow-[#d84a1b]/25" : "text-[#5a413a] hover:bg-white"
          }`}
        >
          {n}
        </button>
      ))}
      <button type="button" onClick={() => onPageChange(page + 1)} disabled={page === totalPages} aria-label="หน้าถัดไป" className={navBtn}>
        <ChevronRight className="w-5 h-5" />
      </button>
    </nav>
  );
}
