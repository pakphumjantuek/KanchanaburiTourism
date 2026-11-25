import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { message } from "antd";
import { ChevronRight, Plus, Search, Trash2, Utensils } from "lucide-react";
import { useDebounce } from "../../../utils/useDebounce";
import { confirmDelete } from "../../../utils";
import { useGetAllLocalDishQuery } from "../../localDish/LocalDishApi";
import { useGetProfileQuery } from "../../auth/authApi";
import {
  useGetByIdQuery,
  useGetDishesByPlaceIdQuery,
  useUpsertDishToPlaceMutation,
  useDeleteDishFromPlaceMutation,
} from "../placeApi";

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

type Tab = "in-shop" | "add";
type Edit = { price?: string; enabled?: boolean };

type Row = {
  id: number;
  nameTH: string;
  nameEN?: string | null;
  imageUrl?: string | null;
  // ค่าที่บันทึกอยู่ในร้าน (ไม่มี = ยังไม่อยู่ในร้าน)
  saved?: { price: string; enabled: boolean };
};

const ROW_GRID = "@3xl:grid-cols-[minmax(0,1fr)_10rem_12.5rem_17rem] @3xl:items-center";

function Switch({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${FOCUS} ${
        checked ? "bg-blue-600" : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform motion-reduce:transition-none ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

const PlaceMenuManagePage = () => {
  const navigate = useNavigate();
  const { placeId } = useParams<{ placeId: string }>();
  const loc = useLocation() as any;

  const pid = useMemo(() => {
    const n = Number(placeId);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [placeId]);

  const stateName = loc?.state?.placeName as string | undefined;
  const { data: place } = useGetByIdQuery(pid as number, { skip: pid === null || Boolean(stateName) });
  const placeName = stateName ?? place?.name ?? "";

  // ผู้ประกอบการเห็น/เพิ่มได้เฉพาะเมนูที่ตัวเองสร้าง
  const { data: me } = useGetProfileQuery();
  const isOperator = me?.roleName === "Operator";

  const [tab, setTab] = useState<Tab>("in-shop");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [edits, setEdits] = useState<Record<number, Edit>>({});

  const {
    data: shopDishes,
    isLoading: shopLoading,
    isError: shopError,
    refetch,
  } = useGetDishesByPlaceIdQuery(pid as number, { skip: pid === null });

  const { data: allPaged, isLoading: allLoading } = useGetAllLocalDishQuery(
    { page: 1, pageSize: 200, search: debouncedSearch, mine: isOperator },
    { skip: pid === null || tab !== "add" || me === undefined },
  );

  const [upsertDish, { isLoading: saving }] = useUpsertDishToPlaceMutation();
  const [deleteDish, { isLoading: deleting }] = useDeleteDishFromPlaceMutation();

  const apiBase = import.meta.env.VITE_API_BASE_URLS ?? "";

  const inShopIds = useMemo(() => new Set((shopDishes ?? []).map((d) => d.dishId)), [shopDishes]);

  const rows: Row[] = useMemo(() => {
    if (tab === "in-shop") {
      const s = debouncedSearch.trim().toLowerCase();
      return (shopDishes ?? [])
        .filter((d) => !s || d.nameTH.toLowerCase().includes(s) || (d.nameEN ?? "").toLowerCase().includes(s))
        .map((d) => ({
          id: d.dishId,
          nameTH: d.nameTH,
          nameEN: d.nameEN,
          imageUrl: d.coverImageUrl,
          saved: { price: d.price != null ? String(d.price) : "", enabled: d.isAvailable ?? true },
        }));
    }
    // แท็บเพิ่มเมนู: แสดงเฉพาะเมนูที่ยังไม่อยู่ในร้าน
    return (allPaged?.items ?? [])
      .filter((d) => !inShopIds.has(d.dishId!))
      .map((d) => ({
        id: d.dishId!,
        nameTH: d.nameTH,
        nameEN: d.nameEN,
        imageUrl: d.images?.find((i) => i.isCover)?.imageUrl ?? d.images?.[0]?.imageUrl,
      }));
  }, [tab, shopDishes, allPaged, inShopIds, debouncedSearch]);

  const valueOf = (r: Row) => ({
    price: edits[r.id]?.price ?? r.saved?.price ?? "",
    enabled: edits[r.id]?.enabled ?? r.saved?.enabled ?? true,
  });

  const patch = (id: number, e: Edit) => setEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...e } }));
  const clearEdit = (id: number) =>
    setEdits((prev) => {
      const { [id]: _drop, ...rest } = prev;
      return rest;
    });

  const errText = (e: any, fallback: string) => e?.data?.errorMessages?.[0] ?? fallback;

  const handleSave = async (r: Row, isAdd: boolean) => {
    const v = valueOf(r);
    const price = v.price.trim() === "" ? null : Number(v.price);
    if (price !== null && (!Number.isFinite(price) || price < 0)) {
      message.error("ราคาต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป");
      return;
    }
    try {
      await upsertDish({ placeId: pid as number, body: { dishId: r.id, price, isAvailable: v.enabled } }).unwrap();
      clearEdit(r.id);
      await refetch();
      message.success(isAdd ? `เพิ่ม “${r.nameTH}” เข้าร้านแล้ว` : "บันทึกเรียบร้อย");
    } catch (e) {
      message.error(errText(e, "บันทึกไม่สำเร็จ ลองอีกครั้ง"));
    }
  };

  const handleRemove = async (r: Row) => {
    if (!(await confirmDelete(`เอา “${r.nameTH}” ออกจากร้านใช่หรือไม่? (เมนูยังอยู่ในระบบ เพิ่มกลับได้)`))) return;
    try {
      await deleteDish({ placeId: pid as number, dishId: r.id }).unwrap();
      clearEdit(r.id);
      await refetch();
      message.success("เอาเมนูออกจากร้านแล้ว");
    } catch (e) {
      message.error(errText(e, "เอาออกไม่สำเร็จ"));
    }
  };

  if (pid === null) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-xl rounded-2xl border border-slate-200 bg-white p-8">
          <h1 className="text-lg font-semibold text-slate-900">ไม่พบสถานที่</h1>
          <p className="mt-2 text-base text-slate-600">รหัสสถานที่ไม่ถูกต้อง กลับไปเลือกร้านจากรายการอีกครั้ง</p>
          <Link
            to="/admin/place"
            className={`mt-4 inline-block rounded-xl bg-blue-600 px-4 py-2 text-base font-medium text-white hover:bg-blue-700 ${FOCUS}`}
          >
            ไปรายการสถานที่
          </Link>
        </div>
      </div>
    );
  }

  const loading = tab === "in-shop" ? shopLoading : allLoading;
  const shopCount = shopDishes?.length ?? 0;
  const tabBtn = (t: Tab, label: string) => (
    <button
      type="button"
      aria-pressed={tab === t}
      onClick={() => {
        setTab(t);
        setSearch("");
      }}
      className={`whitespace-nowrap rounded-lg px-4 py-2 text-base font-medium transition-colors ${FOCUS} ${
        tab === t ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="@container min-h-screen bg-slate-50 px-4 py-6 text-base text-slate-800 sm:px-6 lg:px-10 lg:py-8">
      <div className="mx-auto w-full max-w-[1500px] space-y-6">
        <div>
          <nav aria-label="ตำแหน่งปัจจุบัน" className="mb-3 flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
            <Link to="/admin/place" className={`rounded hover:text-slate-900 hover:underline ${FOCUS}`}>
              สถานที่
            </Link>
            <ChevronRight className="h-4 w-4" aria-hidden />
            {placeName && (
              <>
                <span className="max-w-[24rem] truncate">{placeName}</span>
                <ChevronRight className="h-4 w-4" aria-hidden />
              </>
            )}
            <span aria-current="page" className="text-slate-900">
              เมนูร้าน
            </span>
          </nav>

          <div className="flex flex-col gap-4 @3xl:flex-row @3xl:items-end @3xl:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">เมนูร้าน</h1>
              <p className="mt-1 truncate text-base text-slate-600">
                {placeName ? (
                  <>
                    ตั้งราคาและสถานะของเมนูใน <span className="font-medium text-slate-800">{placeName}</span>
                  </>
                ) : (
                  "ตั้งราคาและสถานะของเมนูในร้าน"
                )}
              </p>
            </div>

            <div className="inline-flex w-fit rounded-xl bg-slate-200/70 p-1" role="group" aria-label="เลือกรายการ">
              {tabBtn("in-shop", `เมนูในร้าน (${shopCount})`)}
              {tabBtn("add", "เพิ่มเมนูเข้าร้าน")}
            </div>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === "in-shop" ? "ค้นหาเมนูในร้าน" : isOperator ? "ค้นหาเมนูของฉัน" : "ค้นหาเมนูทั้งหมด"}
            aria-label="ค้นหาเมนู"
            className="h-[50px] w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-base placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/25"
          />
        </div>

        {tab === "add" && (
          <p className="text-base text-slate-600">
            {isOperator
              ? "แสดงเมนูที่คุณสร้างและยังไม่อยู่ในร้านนี้ ตั้งราคาแล้วกด “เพิ่มเข้าร้าน”"
              : "แสดงเมนูที่ยังไม่อยู่ในร้านนี้ ตั้งราคาแล้วกด “เพิ่มเข้าร้าน”"}
          </p>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div
            className={`hidden gap-x-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-sm font-medium text-slate-500 @3xl:grid ${ROW_GRID}`}
            aria-hidden
          >
            <span>เมนู</span>
            <span>ราคา (บาท)</span>
            <span>สถานะการขาย</span>
            <span className="text-right">จัดการ</span>
          </div>

          {shopError && tab === "in-shop" ? (
            <p className="px-5 py-10 text-base text-rose-700">โหลดเมนูของร้านไม่สำเร็จ ลองรีเฟรชหน้านี้</p>
          ) : loading ? (
            <ul aria-hidden className="divide-y divide-slate-100">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="flex animate-pulse items-center gap-4 px-5 py-4">
                  <div className="h-16 w-16 rounded-xl bg-slate-200" />
                  <div className="h-5 w-48 rounded bg-slate-200" />
                </li>
              ))}
            </ul>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
              <Utensils className="h-10 w-10 text-slate-400" aria-hidden />
              {tab === "in-shop" ? (
                <>
                  <p className="text-lg font-semibold text-slate-900">
                    {debouncedSearch ? "ไม่พบเมนูที่ค้นหา" : "ร้านนี้ยังไม่มีเมนู"}
                  </p>
                  {!debouncedSearch && (
                    <>
                      <p className="text-base text-slate-600">เลือกเมนูมาใส่ร้านพร้อมตั้งราคา</p>
                      <button
                        type="button"
                        onClick={() => setTab("add")}
                        className={`rounded-xl bg-blue-600 px-5 py-2.5 text-base font-semibold text-white hover:bg-blue-700 ${FOCUS}`}
                      >
                        เพิ่มเมนูเข้าร้าน
                      </button>
                    </>
                  )}
                </>
              ) : debouncedSearch ? (
                <p className="text-lg font-semibold text-slate-900">ไม่พบเมนูที่ค้นหา</p>
              ) : (
                <>
                  <p className="text-lg font-semibold text-slate-900">
                    {isOperator ? "ไม่มีเมนูที่ยังไม่ได้ใส่ร้าน" : "เมนูทั้งหมดอยู่ในร้านแล้ว"}
                  </p>
                  {isOperator && (
                    <>
                      <p className="text-base text-slate-600">สร้างเมนูใหม่ แล้วกลับมาเพิ่มเข้าร้านได้</p>
                      <button
                        type="button"
                        onClick={() => navigate("/admin/localDish/add")}
                        className={`rounded-xl bg-blue-600 px-5 py-2.5 text-base font-semibold text-white hover:bg-blue-700 ${FOCUS}`}
                      >
                        สร้างเมนูใหม่
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {rows.map((r) => {
                const v = valueOf(r);
                const isAdd = !r.saved;
                const dirty = !!r.saved && (v.price !== r.saved.price || v.enabled !== r.saved.enabled);
                return (
                  <li key={r.id} className="px-5 py-4">
                    <div className={`grid grid-cols-1 gap-x-4 gap-y-3 ${ROW_GRID}`}>
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                          {r.imageUrl ? (
                            <img src={`${apiBase}${r.imageUrl}`} alt="" loading="lazy" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-400">
                              <Utensils className="h-6 w-6" aria-hidden />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-lg font-semibold text-slate-900" title={r.nameTH}>
                            {r.nameTH}
                          </p>
                          {r.nameEN && <p className="truncate text-sm text-slate-500">{r.nameEN}</p>}
                        </div>
                      </div>

                      <label className="flex items-center gap-2">
                        <span className="text-sm text-slate-500 @3xl:sr-only">ราคา</span>
                        <input
                          type="number"
                          min={0}
                          inputMode="decimal"
                          value={v.price}
                          onChange={(e) => patch(r.id, { price: e.target.value })}
                          placeholder="ไม่ระบุ"
                          aria-label={`ราคา ${r.nameTH} (บาท)`}
                          className="h-[50px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-base placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/25"
                        />
                        <span className="text-base text-slate-500">฿</span>
                      </label>

                      <div className="flex items-center gap-3">
                        <Switch
                          checked={v.enabled}
                          onChange={() => patch(r.id, { enabled: !v.enabled })}
                          label={`${r.nameTH} ${v.enabled ? "พร้อมขาย" : "หมดชั่วคราว"}`}
                        />
                        <span className={`text-base ${v.enabled ? "text-slate-800" : "text-slate-500"}`}>
                          {v.enabled ? "พร้อมขาย" : "หมดชั่วคราว"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 @3xl:justify-end">
                        {isAdd ? (
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => handleSave(r, true)}
                            className={`inline-flex h-[46px] items-center gap-2 whitespace-nowrap rounded-xl bg-blue-600 px-5 text-base font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60 ${FOCUS}`}
                          >
                            <Plus className="h-4 w-4" aria-hidden />
                            เพิ่มเข้าร้าน
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              disabled={saving || !dirty}
                              onClick={() => handleSave(r, false)}
                              className={`inline-flex h-[46px] items-center whitespace-nowrap rounded-xl px-5 text-base font-semibold transition-colors ${FOCUS} ${
                                dirty
                                  ? "bg-blue-600 text-white hover:bg-blue-700"
                                  : "cursor-default border border-slate-200 bg-white text-slate-400"
                              }`}
                            >
                              {dirty ? "บันทึก" : "บันทึกแล้ว"}
                            </button>
                            <button
                              type="button"
                              disabled={deleting}
                              onClick={() => handleRemove(r)}
                              className={`inline-flex h-[46px] items-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-base font-medium text-rose-700 transition-colors hover:bg-rose-50 ${FOCUS}`}
                              aria-label={`เอา ${r.nameTH} ออกจากร้าน`}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                              เอาออก
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaceMenuManagePage;
