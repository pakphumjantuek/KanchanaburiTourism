import { SearchX } from "lucide-react";

type Props = {
  onReset?: () => void;
  title?: string;
  description?: string;
  resetLabel?: string;
};

export function EmptyState({
  onReset,
  title = "ไม่พบสถานที่ที่ค้นหา",
  description = "ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่น",
  resetLabel = "ดูสถานที่ทั้งหมด",
}: Props) {
  return (
    <div className="text-center py-16 px-5 bg-white rounded-3xl border-2 border-dashed border-[#e2bfb5]">
      <span className="mx-auto w-16 h-16 rounded-2xl bg-[#ffdbd1]/60 text-[#d84a1b] flex items-center justify-center mb-4">
        <SearchX className="w-8 h-8" />
      </span>
      <h3 className="text-xl font-black text-[#141c23]">{title}</h3>
      <p className="text-[#8e7068] mt-1">{description}</p>
      {onReset && (
      <button
        type="button"
        onClick={onReset}
        className="mt-6 px-6 py-3 rounded-full bg-[#d84a1b] hover:bg-[#b83c13] text-white font-bold shadow-md shadow-[#d84a1b]/25"
      >
        {resetLabel}
      </button>
      )}
    </div>
  );
}
