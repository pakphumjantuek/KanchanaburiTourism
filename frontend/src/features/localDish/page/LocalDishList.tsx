import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Utensils } from "lucide-react";
import Pagination from "../../../components/Table/Pagination";
import { useDebounce } from "../../../utils/useDebounce";
import { confirmDelete, showSuccessOk } from "../../../utils";
import { useGetProfileQuery } from "../../auth/authApi";
import { useDeleteLocalDishMutation, useGetAllLocalDishQuery } from "../LocalDishApi";
import type { LocalDishType } from "../LocalDishType";

const PAGE_SIZE = 12;
const SPICY_LABEL = ["ไม่เผ็ด", "เผ็ดน้อย", "เผ็ดปานกลาง", "เผ็ด", "เผ็ดมาก", "เผ็ดสุด"];

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

function SpicyDots({ level }: { level: number }) {
  const n = Math.max(0, Math.min(5, level || 0));
  return (
    <span className="inline-flex items-center gap-2 text-sm text-slate-600" title={`ระดับความเผ็ด ${n} จาก 5`}>
      <span className="flex gap-0.5" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className={`h-2 w-2 rounded-full ${i < n ? "bg-rose-500" : "bg-slate-200"}`} />
        ))}
      </span>
      {SPICY_LABEL[n]}
    </span>
  );
}

function DishCard({
  dish,
  onEdit,
  onDelete,
}: {
  dish: LocalDishType;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const cover = dish.images?.find((i) => i.isCover) ?? dish.images?.[0];
  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative h-48 shrink-0 overflow-hidden bg-slate-100">
        {cover ? (
          <img
            src={`${import.meta.env.VITE_API_BASE_URLS ?? ""}${cover.imageUrl}`}
            alt={dish.nameTH}
            loading="lazy"
            className={`h-full w-full object-cover ${dish.isActive ? "" : "opacity-50"}`}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400">
            <Utensils className="h-9 w-9" aria-hidden />
            <span className="text-sm">ยังไม่มีรูป</span>
          </div>
        )}
        {!dish.isActive && (
          <span className="absolute left-3 top-3 rounded-full bg-slate-900/80 px-3 py-1 text-sm text-white">
            ซ่อนอยู่
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-slate-900" title={dish.nameTH}>
            {dish.nameTH}
          </h2>
          {dish.nameEN && <p className="truncate text-sm text-slate-500">{dish.nameEN}</p>}
        </div>

        {dish.description && <p className="line-clamp-2 text-sm text-slate-600">{dish.description}</p>}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <SpicyDots level={dish.spicyLevel} />
          {dish.isHalal && (
            <span className="rounded-full border border-slate-200 px-2.5 py-0.5 text-sm text-slate-700">ฮาลาล</span>
          )}
          {dish.isVegetarian && (
            <span className="rounded-full border border-slate-200 px-2.5 py-0.5 text-sm text-slate-700">
              มังสวิรัติ
            </span>
          )}
        </div>

        <div className="mt-auto flex gap-2.5 pt-1">
          <button
            type="button"
            onClick={onEdit}
            className={`flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-base font-medium text-slate-800 transition-colors hover:bg-slate-50 ${FOCUS}`}
          >
            แก้ไข
          </button>
          <button
            type="button"
            onClick={onDelete}
            className={`rounded-xl border border-slate-200 bg-white px-4 py-2 text-base font-medium text-rose-700 transition-colors hover:bg-rose-50 ${FOCUS}`}
          >
            ลบ
          </button>
        </div>
      </div>
    </li>
  );
}

const LocalDishList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const navigate = useNavigate();

  const [deleteLocalDish] = useDeleteLocalDishMutation();
  const { data: me } = useGetProfileQuery();
  const isOperator = me?.roleName === "Operator";

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data, isLoading, isError } = useGetAllLocalDishQuery({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch,
    mine: isOperator,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const onDelete = async (dish: LocalDishType) => {
    if (!(await confirmDelete(`ต้องการลบเมนู “${dish.nameTH}” ใช่หรือไม่?`))) return;
    try {
      await deleteLocalDish(dish.dishId!).unwrap();
      showSuccessOk("ลบเมนูเรียบร้อยแล้ว");
    } catch {
      showSuccessOk("ลบไม่สำเร็จ ลองใหม่อีกครั้ง");
    }
  };

  return (
    <div className="@container min-h-screen bg-slate-50 px-4 py-6 text-base text-slate-800 sm:px-6 lg:px-10 lg:py-8">
      <div className="mx-auto w-full max-w-[1680px] space-y-6">
        <header className="flex flex-col gap-4 @3xl:flex-row @3xl:items-end @3xl:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {isOperator ? "เมนูอาหารของฉัน" : "อาหารท้องถิ่น"}
            </h1>
            <p className="mt-1 text-base text-slate-600">
              {isLoading ? "กำลังโหลด…" : `ทั้งหมด ${total} เมนู`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/admin/localDish/add")}
            className={`inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-base font-semibold text-white transition-colors hover:bg-blue-700 ${FOCUS}`}
          >
            <Plus className="h-5 w-5" aria-hidden />
            เพิ่มเมนู
          </button>
        </header>

        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อเมนู"
            aria-label="ค้นหาชื่อเมนู"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-base placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/25"
          />
        </div>

        {isError ? (
          <p className="text-base text-rose-700">โหลดรายการเมนูไม่สำเร็จ ลองรีเฟรชหน้านี้</p>
        ) : isLoading ? (
          <ul className="grid grid-cols-1 gap-5 @xl:grid-cols-2 @4xl:grid-cols-3 @6xl:grid-cols-4" aria-hidden>
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i} className="h-72 animate-pulse rounded-2xl bg-slate-200/70" />
            ))}
          </ul>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Utensils className="h-10 w-10 text-slate-400" aria-hidden />
            <p className="text-lg font-semibold text-slate-900">
              {debouncedSearch ? "ไม่พบเมนูที่ค้นหา" : "ยังไม่มีเมนู"}
            </p>
            {!debouncedSearch && (
              <>
                <p className="text-base text-slate-600">เริ่มจากเพิ่มเมนูแรกของคุณ ใช้เวลาไม่ถึงนาที</p>
                <button
                  type="button"
                  onClick={() => navigate("/admin/localDish/add")}
                  className={`mt-1 rounded-xl bg-blue-600 px-5 py-2.5 text-base font-semibold text-white hover:bg-blue-700 ${FOCUS}`}
                >
                  เพิ่มเมนูแรก
                </button>
              </>
            )}
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-5 @xl:grid-cols-2 @4xl:grid-cols-3 @6xl:grid-cols-4">
            {items.map((d) => (
              <DishCard
                key={d.dishId}
                dish={d}
                onEdit={() => navigate(`/admin/localDish/edit/${d.dishId}`, { state: { dish: d } })}
                onDelete={() => onDelete(d)}
              />
            ))}
          </ul>
        )}

        {total > PAGE_SIZE && (
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        )}
      </div>
    </div>
  );
};

export default LocalDishList;
