type Props = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({ page, pageSize, total, onPageChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-slate-600">
        หน้า {page} / {totalPages} • ทั้งหมด {total} รายการ
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
        >
          ก่อนหน้า
        </button>

        <button
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
        >
          ถัดไป
        </button>
      </div>
    </div>
  );
}
