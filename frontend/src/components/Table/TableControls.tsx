type Props = {
  /** search */
  search?: string;
  searchLabel?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;

  /** page size */
  pageSize?: number;
  pageSizeLabel?: string;
  pageSizeOptions?: number[];
  onPageSizeChange?: (value: number) => void;
};

export default function TableControls({
  search,
  searchLabel = "ค้นหา",
  searchPlaceholder = "ค้นหา...",
  onSearchChange,

  pageSize,
  pageSizeLabel = "ต่อหน้า",
  pageSizeOptions = [5, 10, 20, 50],
  onPageSizeChange,
}: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Search */}
      {onSearchChange && (
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-700">{searchLabel} </label>
          <input
            value={search ?? ""}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full sm:w-80 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      )}

      {/* Page size */}
      {onPageSizeChange && pageSize !== undefined && (
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-700">{pageSizeLabel}</label>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
