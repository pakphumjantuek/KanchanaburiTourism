import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, CalendarClock, Clock, MapPin, Pencil, Plus, Search, Star, Trash2, UtensilsCrossed } from "lucide-react";
import { formatShortDate } from "../../../utils/eventTime";
import Pagination from "../../../components/Table/Pagination";
import { useDebounce } from "../../../utils/useDebounce";
import { confirmDelete, showSuccessOk } from "../../../utils";
import { useDeletePlaceMutation, useGetAllPlaceQuery } from "../placeApi";
import type { PlaceDto } from "../placeTypes";
import { useGetAllPlaceCategoryQuery } from "../../placeCategory/placeCategoryApi";
import { useGetProfileQuery } from "../../auth/authApi";

const PAGE_SIZE = 12;
const FOOD = "อาหาร";

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

const BTN = `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-3 py-2 text-base font-medium transition-colors ${FOCUS}`;
const actionCls = `${BTN} border-slate-300 bg-white text-slate-800 hover:bg-slate-50`;
const primaryCls = `${BTN} w-full border-blue-600 bg-blue-600 text-white hover:bg-blue-700`;

function PlaceCard({
  place,
  onEdit,
  onOpening,
  onMenus,
  onStats,
  onDelete,
}: {
  place: PlaceDto;
  onEdit: () => void;
  onOpening: () => void;
  onMenus: () => void;
  onStats: () => void;
  onDelete: () => void;
}) {
  const cover = place.images?.find((i) => i.isCover) ?? place.images?.[0];
  const isFood = place.categoryName === FOOD;
  const eventEnded = place.eventStatus === "ended";
  const hidden = place.isActive === false || eventEnded;

  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative h-48 shrink-0 overflow-hidden bg-slate-100">
        {cover ? (
          <img
            src={`${import.meta.env.VITE_API_BASE_URLS ?? ""}${cover.imageUrl}`}
            alt={place.name}
            loading="lazy"
            className={`h-full w-full object-cover ${hidden ? "opacity-50" : ""}`}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400">
            <MapPin className="h-9 w-9" aria-hidden />
            <span className="text-sm">ยังไม่มีรูป</span>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-900 shadow-sm">
          {place.categoryName || "ไม่ระบุหมวด"}
        </span>
        {place.isEvent && (
          <span
            className={`absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium shadow-sm ${
              eventEnded
                ? "bg-slate-900/80 text-white"
                : place.eventStatus === "upcoming"
                  ? "bg-amber-100 text-amber-900"
                  : "bg-white text-slate-900"
            }`}
          >
            <CalendarClock className="h-4 w-4" aria-hidden />
            {eventEnded
              ? "อีเวนต์จบแล้ว"
              : place.eventStatus === "upcoming"
                ? `อีเวนต์ · เริ่ม ${formatShortDate(place.eventStartAt)}`
                : `อีเวนต์ · ถึง ${formatShortDate(place.eventEndAt)}`}
          </span>
        )}
        {place.isActive === false && (
          <span className="absolute right-3 top-3 rounded-full bg-slate-900/80 px-3 py-1 text-sm text-white">
            ซ่อนอยู่
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-slate-900" title={place.name}>
            {place.name}
          </h2>
          <p className="mt-0.5 line-clamp-2 min-h-[2.5rem] text-sm text-slate-600">
            {place.address || "ยังไม่ได้ระบุที่อยู่"}
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <Star className="h-4 w-4 text-amber-500" aria-hidden />
          {place.reviewCount ? (
            <span>
              {(place.averageRating ?? 0).toFixed(1)} · {place.reviewCount} รีวิว
            </span>
          ) : (
            <span>ยังไม่มีรีวิว</span>
          )}
        </div>

        <div className="mt-auto space-y-2.5 pt-1">
          <button type="button" onClick={onEdit} className={primaryCls}>
            <Pencil className="h-4 w-4" aria-hidden />
            แก้ไขข้อมูล
          </button>
          <div className="grid grid-cols-2 gap-2.5">
            <button type="button" onClick={onOpening} className={actionCls}>
              <Clock className="h-4 w-4" aria-hidden />
              เวลาทำการ
            </button>
            {isFood ? (
              <button type="button" onClick={onMenus} className={actionCls}>
                <UtensilsCrossed className="h-4 w-4" aria-hidden />
                เมนูร้าน
              </button>
            ) : (
              <button type="button" onClick={onStats} className={actionCls}>
                <BarChart3 className="h-4 w-4" aria-hidden />
                สถิติ
              </button>
            )}
          </div>
          <div className="flex items-center justify-between">
            {isFood ? (
              <button
                type="button"
                onClick={onStats}
                className={`inline-flex items-center gap-1.5 rounded px-1 text-sm font-medium text-blue-700 hover:underline ${FOCUS}`}
              >
                <BarChart3 className="h-4 w-4" aria-hidden />
                ดูสถิติ
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={onDelete}
              className={`inline-flex items-center gap-1.5 rounded px-1 text-sm font-medium text-rose-700 hover:underline ${FOCUS}`}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              ลบ
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

const PlaceListPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const debouncedSearch = useDebounce(search, 400);
  const navigate = useNavigate();

  const { data: me } = useGetProfileQuery();
  const mine = me?.roleName === "Operator";

  const [deletePlace] = useDeletePlaceMutation();
  const { data: categoryData } = useGetAllPlaceCategoryQuery({ page: 1, pageSize: 100 });
  const categories = categoryData?.items ?? [];

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedCategory]);

  const { data, isLoading, isError } = useGetAllPlaceQuery({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch,
    category: selectedCategory,
    mine,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const onDelete = async (place: PlaceDto) => {
    if (!(await confirmDelete(`ต้องการลบ “${place.name}” ใช่หรือไม่? ข้อมูลที่เกี่ยวข้องจะถูกลบด้วย`))) return;
    try {
      await deletePlace(place.placeId).unwrap();
      showSuccessOk("ลบสถานที่เรียบร้อยแล้ว");
    } catch {
      showSuccessOk("ลบไม่สำเร็จ ลองใหม่อีกครั้ง");
    }
  };

  const go = (path: string, place: PlaceDto, withPlace = false) =>
    navigate(path, { state: withPlace ? { place, placeName: place.name } : { placeName: place.name } });

  return (
    <div className="@container min-h-screen bg-slate-50 px-4 py-6 text-base text-slate-800 sm:px-6 lg:px-10 lg:py-8">
      <div className="mx-auto w-full max-w-[1680px] space-y-6">
        <header className="flex flex-col gap-4 @3xl:flex-row @3xl:items-end @3xl:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {mine ? "สถานที่ของฉัน" : "สถานที่ท่องเที่ยว"}
            </h1>
            <p className="mt-1 text-base text-slate-600">
              {isLoading ? "กำลังโหลด…" : `ทั้งหมด ${total} แห่ง`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/admin/place/add")}
            className={`inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-base font-semibold text-white transition-colors hover:bg-blue-700 ${FOCUS}`}
          >
            <Plus className="h-5 w-5" aria-hidden />
            เพิ่มสถานที่
          </button>
        </header>

        <div className="flex flex-col gap-3 @xl:flex-row">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อสถานที่"
              aria-label="ค้นหาชื่อสถานที่"
              className="h-[50px] w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-base placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/25"
            />
          </div>
          {!mine && (
            <select
              value={selectedCategory ?? ""}
              onChange={(e) => setSelectedCategory(e.target.value || undefined)}
              aria-label="กรองตามหมวดหมู่"
              className="h-[50px] rounded-xl border border-slate-300 bg-white px-3.5 text-base focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/25"
            >
              <option value="">ทุกหมวดหมู่</option>
              {categories.map((c) => (
                <option key={c.categoryId} value={c.categoryName}>
                  {c.categoryName}
                </option>
              ))}
            </select>
          )}
        </div>

        {isError ? (
          <p className="text-base text-rose-700">โหลดรายการสถานที่ไม่สำเร็จ ลองรีเฟรชหน้านี้</p>
        ) : isLoading ? (
          <ul className="grid grid-cols-1 gap-5 @xl:grid-cols-2 @4xl:grid-cols-3 @6xl:grid-cols-4" aria-hidden>
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i} className="h-96 animate-pulse rounded-2xl bg-slate-200/70" />
            ))}
          </ul>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <MapPin className="h-10 w-10 text-slate-400" aria-hidden />
            <p className="text-lg font-semibold text-slate-900">
              {debouncedSearch || selectedCategory ? "ไม่พบสถานที่ที่ค้นหา" : "ยังไม่มีสถานที่"}
            </p>
            {!debouncedSearch && !selectedCategory && (
              <>
                <p className="text-base text-slate-600">เริ่มจากเพิ่มสถานที่แรกของคุณ ใช้เวลาไม่กี่นาที</p>
                <button
                  type="button"
                  onClick={() => navigate("/admin/place/add")}
                  className={`mt-1 rounded-xl bg-blue-600 px-5 py-2.5 text-base font-semibold text-white hover:bg-blue-700 ${FOCUS}`}
                >
                  เพิ่มสถานที่แรก
                </button>
              </>
            )}
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-5 @xl:grid-cols-2 @4xl:grid-cols-3 @6xl:grid-cols-4">
            {items.map((p) => (
              <PlaceCard
                key={p.placeId}
                place={p}
                onEdit={() => go(`/admin/place/edit/${p.placeId}`, p, true)}
                onOpening={() => go(`/admin/places/${p.placeId}/opening`, p)}
                onMenus={() => go(`/admin/places/${p.placeId}/menus`, p)}
                onStats={() => go(`/admin/place/dashboard/${p.placeId}/`, p)}
                onDelete={() => onDelete(p)}
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

export default PlaceListPage;
