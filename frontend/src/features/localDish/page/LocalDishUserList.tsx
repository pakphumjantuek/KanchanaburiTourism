import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, ImageOff, Leaf, MapPin } from "lucide-react";
import { useDebounce } from "../../../utils/useDebounce";
import { useGetAllLocalDishQuery } from "../LocalDishApi";
import type { LocalDishType } from "../LocalDishType";
import { Footer } from "../../../components/Layout/Footer";
import { PlaceListHeader } from "../../places/Components/place-list/PlaceListHeader";
import { PaginationBar } from "../../places/Components/place-list/PaginationBar";
import { EmptyState } from "../../places/Components/place-list/EmptyState";

const PAGE_SIZE = 12;
// เมนูท้องถิ่นมีไม่กี่สิบรายการ → โหลดทั้งหมดครั้งเดียว แล้วกรอง/แบ่งหน้าฝั่ง client
// (เดิมกรองเฉพาะ 12 รายการของหน้าปัจจุบัน ทำให้ผลกรองและจำนวนผิด)
// 200 = เพดานของ backend (เกินนี้ LocalDishService รีเซ็ตเป็น 20)
// shortcut: ถ้าเมนูเกิน 200 รายการ ให้ย้ายตัวกรองความเผ็ด/ฮาลาล/มังสวิรัติไปทำที่ API
const FETCH_ALL = 200;

type Filter = "all" | "mild" | "spicy" | "halal" | "vegetarian";

const FILTERS: { key: Filter; label: string; icon?: React.ReactNode }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "mild", label: "ไม่เผ็ด" },
  { key: "spicy", label: "รสจัด", icon: <Flame className="w-3.5 h-3.5" /> },
  { key: "halal", label: "ฮาลาล" },
  { key: "vegetarian", label: "มังสวิรัติ", icon: <Leaf className="w-3.5 h-3.5" /> },
];

const matches = (d: LocalDishType, f: Filter) =>
  f === "all" ||
  (f === "mild" && !d.spicyLevel) ||
  (f === "spicy" && d.spicyLevel >= 3) ||
  (f === "halal" && d.isHalal) ||
  (f === "vegetarian" && d.isVegetarian);

const imageOf = (dish: LocalDishType) => {
  const raw = (dish.images?.find((img) => img.isCover) ?? dish.images?.[0])?.imageUrl?.trim();
  if (!raw) return "";
  if (raw.startsWith("http") || raw.startsWith("blob:")) return raw;
  return `${(import.meta.env.VITE_API_BASE_URLS ?? "").replace(/\/$/, "")}${raw.startsWith("/") ? raw : `/${raw}`}`;
};

const LocalDishUserListPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, isFetching } = useGetAllLocalDishQuery({
    page: 1,
    pageSize: FETCH_ALL,
    search: debouncedSearch,
  });

  const filtered = useMemo(() => (data?.items ?? []).filter((d) => matches(d, filter)), [data, filter]);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetAll = () => {
    setSearch("");
    setFilter("all");
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-[#fbf8f5] text-[#141c23] text-left">
      <PlaceListHeader
        search={search}
        setSearch={setSearch}
        setPage={setPage}
        kicker="Local dishes"
        title={
          <>
            ทำเนียบอาหาร<span className="text-[#ffb59c]">เมืองกาญจน์</span>
          </>
        }
        subtitle="เมนูพื้นบ้าน วัตถุดิบท้องถิ่น และรสมือที่สืบทอดกันมารุ่นสู่รุ่น"
        placeholder="ค้นหาเมนู เช่น แกงป่า, ปลาคัง, ผักหวาน..."
      />

      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 py-8">
        <div className="sticky top-0 z-20 -mx-3 px-3 sm:mx-0 sm:px-0 py-3 bg-[#fbf8f5]/95 backdrop-blur-md mb-4">
          <div role="group" aria-label="ตัวกรองเมนู" className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {FILTERS.map((f) => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setFilter(f.key);
                    setPage(1);
                  }}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                    active
                      ? "bg-[#d84a1b] border-[#d84a1b] text-white shadow-md shadow-[#d84a1b]/20"
                      : "bg-white border-[#e2bfb5]/60 text-[#5a413a] hover:border-[#d84a1b] hover:text-[#d84a1b]"
                  }`}
                >
                  {f.icon}
                  {f.label}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <p className="text-[#5a413a]">
              {isLoading ? "กำลังค้นหา..." : <>พบ <b className="text-[#141c23]">{filtered.length}</b> เมนู</>}
            </p>
            {(search || filter !== "all") && (
              <button type="button" onClick={resetAll} className="font-semibold text-[#d84a1b] hover:underline">
                ล้างตัวกรอง
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-80 rounded-2xl bg-[#e7e1db] animate-pulse" />
            ))}
          </div>
        ) : pageItems.length > 0 ? (
          <div
            className={`grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 transition-opacity ${isFetching ? "opacity-60" : ""}`}
          >
            {pageItems.map((dish) => (
              <DishCard key={dish.dishId} dish={dish} onOpen={() => navigate(`/localDishDetails/${dish.dishId}`)} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="ไม่พบเมนูที่ค้นหา"
            description="ลองเปลี่ยนคำค้นหา หรือเลือกตัวกรองอื่น"
            resetLabel="ดูเมนูทั้งหมด"
            onReset={resetAll}
          />
        )}

        <PaginationBar
          page={page}
          totalPages={totalPages}
          onPageChange={(p) => {
            setPage(p);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </div>
      <div className="mt-10">
        <Footer />
      </div>
    </div>
  );
};

function DishCard({ dish, onOpen }: { dish: LocalDishType; onOpen: () => void }) {
  const [imgFailed, setImgFailed] = useState(false);
  const img = imageOf(dish);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex flex-col w-full h-full text-left bg-white rounded-2xl overflow-hidden border border-[#e2bfb5]/50 shadow-md shadow-[#141c23]/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#d84a1b]/30"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#f3ede7] flex items-center justify-center text-[#e2bfb5]">
        {img && !imgFailed ? (
          <img
            src={img}
            alt={dish.nameTH}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <ImageOff className="w-9 h-9" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

        {dish.spicyLevel > 0 && (
          <span
            className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-white/95 text-xs"
            title={`ระดับความเผ็ด ${dish.spicyLevel}`}
            aria-label={`ระดับความเผ็ด ${dish.spicyLevel}`}
          >
            {"🌶️".repeat(Math.min(dish.spicyLevel, 5))}
          </span>
        )}
        <div className="absolute bottom-2.5 left-3 flex gap-1.5">
          {dish.isHalal && (
            <span className="px-2 py-0.5 rounded-full bg-[#16693c] text-white text-[13px] font-bold">ฮาลาล</span>
          )}
          {dish.isVegetarian && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-white/95 text-[#16693c] text-[13px] font-bold">
              <Leaf className="w-3 h-3" /> มังสวิรัติ
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col flex-1 p-4 gap-1">
        <h3 className="font-bold text-base leading-snug line-clamp-1 group-hover:text-[#d84a1b] transition-colors">{dish.nameTH}</h3>
        {dish.nameEN && <p className="text-xs text-[#8e7068] line-clamp-1">{dish.nameEN}</p>}
        {dish.description && <p className="mt-1 text-sm text-[#5a413a] line-clamp-2 leading-relaxed">{dish.description}</p>}
        {dish.origin && (
          <p className="mt-auto pt-2 flex items-center gap-1.5 text-xs text-[#8e7068]">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-[#d84a1b]" />
            <span className="line-clamp-1">{dish.origin}</span>
          </p>
        )}
      </div>
    </button>
  );
}

export default LocalDishUserListPage;
