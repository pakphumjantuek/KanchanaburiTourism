import React from "react";

export interface Column<T> {
  header: string;
  align?: "left" | "center" | "right";
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data?: T[];
  isLoading?: boolean;
  emptyText?: string;
}

export function DataTable<T>({
  columns,
  data = [],
  isLoading = false,
  emptyText = "ไม่มีข้อมูล",
}: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto text-sm border border-slate-300 border-collapse">
          <thead className="bg-blue-500/95 text-white">
            <tr>
              {columns.map((col, index) => (
                <th
                  key={index}
                  className={`px-6 py-3.5 text-[13px] font-semibold uppercase border-l border-slate-300 first:border-l-0
                    ${col.align === "center" ? "text-center" : "text-left"}
                  `}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="[&>tr:nth-child(even)]:bg-slate-100 [&>tr:hover]:bg-slate-50">
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-8 text-center text-slate-500"
                >
                  กำลังโหลด...
                </td>
              </tr>
            ) : data.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((col, colIndex) => (
                    <td
                      key={colIndex}
                      className={`px-6 py-3.5 border-t border-l border-slate-300 first:border-l-0
                        ${col.align === "center" ? "text-center" : ""}
                      `}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-8 text-center text-slate-500"
                >
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
