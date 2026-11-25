import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { message } from "antd";
import { ChevronDown, ChevronRight, RefreshCw, Save, Trash2, Undo2 } from "lucide-react";
import {
  useDeleteOpeningByPlaceMutation,
  useGetPlaceOpeningQuery,
  useUpsertOpeningWeeklyMutation,
} from "../placeOpenApi";
import { useGetByIdQuery } from "../../places/placeApi";
import {
  dayNames,
  type PlaceType,
  type UpsertOpeningHourDto,
  type UpsertWeeklyOpeningHoursDto,
} from "../placetype";
import { confirmDelete } from "../../../utils";

/* ---------- ค่าคงที่และตัวช่วย ---------- */

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

/** แสดงวันจันทร์ก่อน (ตามหน้าทำงานจริงของร้านส่วนใหญ่) ส่วนค่าที่ส่งหลังบ้านยังเป็น 0 = อาทิตย์ … 6 = เสาร์ */
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const WEEKDAYS = [1, 2, 3, 4, 5];
const WEEKEND = [6, 0];

const NO_SAVED_HOURS: PlaceType[] = [];

const DEFAULT_OPEN = "09:00";
const DEFAULT_CLOSE = "18:00";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTE_STEPS = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

// รองรับ "09:00", "09:00:00", "09:00:00.0000000"
function toHHmm(time?: string | null) {
  const t = (time ?? "").trim();
  const [h = "09", m = "00"] = t.split(":");
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

function buildDefaultWeek(): UpsertOpeningHourDto[] {
  return Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    openTime: DEFAULT_OPEN,
    closeTime: DEFAULT_CLOSE,
    isClosed: false,
  }));
}

function weekFromServer(data: PlaceType[]): UpsertOpeningHourDto[] {
  const map = new Map<number, PlaceType>();
  for (const oh of data) {
    const d = Number(oh.dayOfWeek);
    if (Number.isFinite(d)) map.set(d, oh);
  }
  return Array.from({ length: 7 }, (_, i) => {
    const oh = map.get(i);
    return {
      dayOfWeek: i,
      openTime: toHHmm(oh?.openTime ?? DEFAULT_OPEN),
      closeTime: toHHmm(oh?.closeTime ?? DEFAULT_CLOSE),
      isClosed: Boolean(oh?.isClosed),
    };
  });
}

const sameWeek = (a: UpsertOpeningHourDto[], b: UpsertOpeningHourDto[]) =>
  a.every((x, i) => x.isClosed === b[i].isClosed && (x.isClosed || (x.openTime === b[i].openTime && x.closeTime === b[i].closeTime)));

/** ข้อความปัญหาของวันนั้น (หลังบ้านบังคับว่าเวลาปิดต้องไม่น้อยกว่าเวลาเปิด) */
function problemOf(d: UpsertOpeningHourDto): string | null {
  if (d.isClosed) return null;
  if (!d.openTime || !d.closeTime) return "กรอกเวลาเปิดและเวลาปิดให้ครบ";
  if (d.closeTime < d.openTime) return "เวลาปิดต้องไม่น้อยกว่าเวลาเปิด (ถ้าเปิดข้ามเที่ยงคืน ให้แบ่งเป็น 2 วัน)";
  return null;
}

function durationText(d: UpsertOpeningHourDto) {
  if (d.isClosed) return "ปิดทั้งวัน";
  if (problemOf(d)) return "—";
  if (d.openTime === d.closeTime) return "เปิดตลอด 24 ชั่วโมง"; // หลังบ้านถือว่าเวลาเปิด = ปิด คือเปิดทั้งวัน
  const mins = toMinutes(d.closeTime) - toMinutes(d.openTime);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h > 0 ? `${h} ชม.` : ""}${h > 0 && m > 0 ? " " : ""}${m > 0 ? `${m} นาที` : ""}`;
}

/* ---------- ส่วนย่อย ---------- */

/** ช่องเลือกเวลาแบบ 24 ชั่วโมง (ชั่วโมง/นาที) ไม่ขึ้นกับภาษาของเบราว์เซอร์ (ช่อง time เดิมขึ้น AM/PM) */
function TimeField({
  value,
  onChange,
  label,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  disabled?: boolean;
}) {
  const [h, m] = value.split(":");
  const minutes = useMemo(
    () => (MINUTE_STEPS.includes(m) ? MINUTE_STEPS : [...MINUTE_STEPS, m].sort()),
    [m],
  );
  const select =
    "h-full cursor-pointer appearance-none bg-transparent text-base tabular-nums text-slate-900 outline-none disabled:cursor-not-allowed disabled:text-slate-400";
  return (
    <div
      role="group"
      aria-label={label}
      className={`inline-flex h-[50px] items-center rounded-xl border bg-white px-3.5 transition-colors ${
        disabled
          ? "border-slate-200 bg-slate-50"
          : "border-slate-300 hover:border-slate-400 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100"
      }`}
    >
      <select aria-label={`${label} ชั่วโมง`} value={h} disabled={disabled} onChange={(e) => onChange(`${e.target.value}:${m}`)} className={`${select} pr-0.5`}>
        {HOURS.map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
      <span aria-hidden className="px-0.5 text-slate-400">:</span>
      <select aria-label={`${label} นาที`} value={m} disabled={disabled} onChange={(e) => onChange(`${h}:${e.target.value}`)} className={`${select} pl-0.5`}>
        {minutes.map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
      <span className="pl-1.5 text-sm text-slate-500">น.</span>
      <ChevronDown className="ml-1 h-4 w-4 text-slate-400" aria-hidden />
    </div>
  );
}

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

/** แถบ 24 ชั่วโมงของวันนั้น (ช่วงที่เปิดเป็นสีน้ำเงิน) */
function DayBar({ d }: { d: UpsertOpeningHourDto }) {
  const bad = problemOf(d);
  let left = 0;
  let width = 0;
  if (!d.isClosed && !bad) {
    const start = toMinutes(d.openTime);
    const end = d.openTime === d.closeTime ? start + 1440 : toMinutes(d.closeTime);
    left = d.openTime === d.closeTime ? 0 : (start / 1440) * 100;
    width = d.openTime === d.closeTime ? 100 : ((end - start) / 1440) * 100;
  }
  return (
    <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-100" aria-hidden>
      {width > 0 && (
        <div
          className="absolute inset-y-0 rounded-full bg-blue-600 transition-[left,width] duration-200 ease-out motion-reduce:transition-none"
          style={{ left: `${left}%`, width: `${width}%` }}
        />
      )}
    </div>
  );
}

/** แบบสำเร็จรูป: กดครั้งเดียวได้ทั้งสัปดาห์ (ยังไม่บันทึกจนกว่าจะกด "บันทึก") */
const PRESETS: { label: string; build: () => UpsertOpeningHourDto[] }[] = [
  {
    label: "เปิดทุกวัน 09:00–18:00",
    build: () => Array.from({ length: 7 }, (_, i) => ({ dayOfWeek: i, openTime: "09:00", closeTime: "18:00", isClosed: false })),
  },
  {
    label: "เปิดทุกวัน 08:00–20:00",
    build: () => Array.from({ length: 7 }, (_, i) => ({ dayOfWeek: i, openTime: "08:00", closeTime: "20:00", isClosed: false })),
  },
  {
    label: "จันทร์–ศุกร์ 09:00–18:00 หยุดเสาร์–อาทิตย์",
    build: () =>
      Array.from({ length: 7 }, (_, i) => ({
        dayOfWeek: i,
        openTime: "09:00",
        closeTime: "18:00",
        isClosed: i === 0 || i === 6,
      })),
  },
  {
    label: "เปิด 24 ชั่วโมง ทุกวัน",
    build: () => Array.from({ length: 7 }, (_, i) => ({ dayOfWeek: i, openTime: "00:00", closeTime: "00:00", isClosed: false })),
  },
];

const ROW_GRID =
  "@3xl:grid-cols-[6.5rem_8.5rem_9rem_9rem_minmax(9rem,1fr)] @3xl:items-center";

/* ---------- หน้า ---------- */

export default function PlaceOpeningPage() {
  const placeId = Number(useParams().placeId);
  const validId = Number.isFinite(placeId) && placeId > 0;
  const stateName = useLocation().state?.placeName as string | undefined;

  // เข้าจากลิงก์ตรง (ไม่มีชื่อติดมากับการนำทาง) ให้ดึงชื่อจริงของสถานที่
  const { data: place } = useGetByIdQuery(placeId, { skip: !validId || Boolean(stateName) });
  const placeName = stateName ?? place?.name ?? "";

  const {
    data: rawData,
    isLoading,
    isFetching,
    error: rawError,
    refetch,
  } = useGetPlaceOpeningQuery(placeId, { skip: !validId });
  // เซิร์ฟเวอร์ตอบ 404 เมื่อสถานที่ยังไม่มีเวลาทำการเลย ถือเป็น "ยังไม่เคยบันทึก" ให้ตั้งค่าใหม่ได้
  const notSavedYet = (rawError as any)?.status === 404;
  const data = notSavedYet ? NO_SAVED_HOURS : rawData; // ต้องเป็นอาร์เรย์ตัวเดิมเสมอ ไม่งั้น useEffect ด้านล่างจะรีเซ็ตทุกรอบ
  const error = notSavedYet ? undefined : rawError;
  const [upsertWeekly, { isLoading: isSaving }] = useUpsertOpeningWeeklyMutation();
  const [deleteByPlace, { isLoading: isDeleting }] = useDeleteOpeningByPlaceMutation();

  const hasSaved = Array.isArray(data) && data.length > 0;
  const serverWeek = useMemo(() => (hasSaved ? weekFromServer(data!) : null), [data, hasSaved]);

  const [week, setWeek] = useState<UpsertOpeningHourDto[]>(buildDefaultWeek);
  const [bulkOpen, setBulkOpen] = useState(DEFAULT_OPEN);
  const [bulkClose, setBulkClose] = useState(DEFAULT_CLOSE);

  // โหลดค่าที่บันทึกไว้ (หรือค่าเริ่มต้นถ้ายังไม่เคยบันทึก) ทุกครั้งที่ข้อมูลจากเซิร์ฟเวอร์เปลี่ยน
  useEffect(() => {
    if (!Array.isArray(data)) return;
    setWeek(serverWeek ?? buildDefaultWeek());
  }, [data, serverWeek]);

  const dirty = serverWeek ? !sameWeek(week, serverWeek) : false;
  const problems = week.filter((d) => problemOf(d));
  const canSave = validId && !isSaving && !isLoading && problems.length === 0 && (dirty || !hasSaved);

  // เตือนก่อนปิดแท็บ/รีเฟรชเมื่อมีการแก้ไขที่ยังไม่บันทึก
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const patchDay = (day: number, patch: Partial<UpsertOpeningHourDto>) =>
    setWeek((prev) => prev.map((x) => (x.dayOfWeek === day ? { ...x, ...patch } : x)));

  const applyBulk = (days: number[]) =>
    setWeek((prev) =>
      prev.map((x) => (days.includes(x.dayOfWeek) ? { ...x, openTime: bulkOpen, closeTime: bulkClose, isClosed: false } : x)),
    );

  const closeDays = (days: number[]) =>
    setWeek((prev) => prev.map((x) => (days.includes(x.dayOfWeek) ? { ...x, isClosed: true } : x)));

  const discard = () => setWeek(serverWeek ?? buildDefaultWeek());

  const applyPreset = (build: () => UpsertOpeningHourDto[]) => setWeek(build());

  // แถบบันทึกด้านล่าง (จอแคบ) แสดงเมื่อมีสิ่งที่ต้องบันทึก
  const needsSave = dirty || !hasSaved;

  const handleSave = async () => {
    const toHHmmss = (t: string) => (t.length === 5 ? `${t}:00` : t);
    const payload: UpsertWeeklyOpeningHoursDto = {
      items: week.map((x) => ({ ...x, openTime: toHHmmss(x.openTime), closeTime: toHHmmss(x.closeTime) })),
    };
    try {
      await upsertWeekly({ placeId, body: payload }).unwrap();
      await refetch();
      message.success("บันทึกเวลาทำการเรียบร้อย");
    } catch (e: any) {
      message.error(e?.data?.errorMessages?.[0] ?? "บันทึกไม่สำเร็จ ลองอีกครั้ง");
    }
  };

  const handleClearAll = async () => {
    const ok = await confirmDelete(
      `ลบเวลาเปิด-ปิดที่บันทึกไว้ทั้งหมดของ${placeName ? ` "${placeName}"` : "สถานที่นี้"} ระบบจะถือว่าไม่ระบุเวลาทำการ`,
    );
    if (!ok) return;
    try {
      await deleteByPlace(placeId).unwrap();
      await refetch();
      message.success("ลบเวลาทำการทั้งหมดแล้ว");
    } catch (e: any) {
      message.error(e?.data?.errorMessages?.[0] ?? "ลบไม่สำเร็จ");
    }
  };

  const crumbs = (
    <nav aria-label="ตำแหน่งปัจจุบัน" className="mb-5 flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
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
      <span aria-current="page" className="text-slate-900">เวลาทำการ</span>
    </nav>
  );

  const shell = (children: React.ReactNode) => (
    <div className="@container min-h-screen bg-slate-50 selection:bg-blue-100 selection:text-blue-900">
      <div className="mx-auto w-full max-w-[1600px] px-4 pb-0 pt-6 sm:px-6 lg:px-10 lg:pb-8 lg:pt-8">
        {crumbs}
        {children}
      </div>
    </div>
  );

  if (!validId) {
    return shell(
      <div className="max-w-xl rounded-2xl border border-slate-200 bg-white p-8">
        <h1 className="text-lg font-semibold text-slate-900">ไม่พบสถานที่</h1>
        <p className="mt-2 text-base text-slate-600">รหัสสถานที่ไม่ถูกต้อง กลับไปเลือกสถานที่จากรายการอีกครั้ง</p>
        <Link to="/admin/place" className={`mt-4 inline-block rounded-xl bg-blue-600 px-4 py-2 text-base font-medium text-white hover:bg-blue-700 ${FOCUS}`}>
          ไปรายการสถานที่
        </Link>
      </div>,
    );
  }

  if (isLoading) {
    return shell(
      <div aria-busy="true" aria-label="กำลังโหลดเวลาทำการ" className="animate-pulse">
        <div className="h-8 w-56 rounded bg-slate-200" />
        <div className="mt-3 h-5 w-80 max-w-full rounded bg-slate-200" />
        <div className="mt-8 grid gap-6 @5xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="h-[28rem] rounded-2xl border border-slate-200 bg-white" />
          <div className="h-80 rounded-2xl border border-slate-200 bg-white" />
        </div>
      </div>,
    );
  }

  if (error) {
    return shell(
      <div className="max-w-xl rounded-2xl border border-slate-200 bg-white p-8">
        <h1 className="text-lg font-semibold text-slate-900">โหลดเวลาทำการไม่สำเร็จ</h1>
        <p className="mt-2 text-base text-slate-600">ตรวจสอบการเชื่อมต่อกับเซิร์ฟเวอร์ แล้วลองอีกครั้ง</p>
        <button
          onClick={() => refetch()}
          className={`mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-base font-medium text-white hover:bg-blue-700 ${FOCUS}`}
        >
          <RefreshCw className="h-4 w-4" aria-hidden /> ลองอีกครั้ง
        </button>
      </div>,
    );
  }

  const rows = DAY_ORDER.map((i) => week[i]);

  return shell(
    <>
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 @3xl:flex-row @3xl:items-end @3xl:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">เวลาทำการ</h1>
          <p className="mt-1 truncate text-base text-slate-500">
            {placeName ? <>กำหนดเวลาเปิด-ปิดของ <span className="font-medium text-slate-700">{placeName}</span></> : "กำหนดเวลาเปิด-ปิดรายวัน"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <p role="status" aria-live="polite" className="text-sm">
            {problems.length > 0 ? (
              <span className="font-medium text-rose-700">มี {problems.length} วันที่เวลาไม่ถูกต้อง แก้ไขก่อนบันทึก</span>
            ) : dirty ? (
              <span className="font-medium text-amber-700">มีการแก้ไขที่ยังไม่บันทึก</span>
            ) : hasSaved ? (
              <span className="text-slate-500">บันทึกล่าสุดแล้ว</span>
            ) : null}
          </p>
          {dirty && (
            <button
              onClick={discard}
              className={`inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50 ${FOCUS}`}
            >
              <Undo2 className="h-4 w-4" aria-hidden /> ยกเลิกการแก้ไข
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-base font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 ${FOCUS}`}
          >
            <Save className="h-4 w-4" aria-hidden /> {isSaving ? "กำลังบันทึก…" : "บันทึก"}
          </button>
        </div>
      </header>

      <div className="grid gap-x-10 gap-y-8 py-8 @5xl:grid-cols-[minmax(0,1fr)_22rem]">
        {/* ตารางรายวัน */}
        <section aria-labelledby="week-title">
          <h2 id="week-title" className="sr-only">เวลาทำการรายวัน</h2>

          {!hasSaved && (
            <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-base text-amber-900">
              สถานที่นี้ยังไม่เคยบันทึกเวลาทำการ ค่าที่เห็นคือค่าเริ่มต้น {DEFAULT_OPEN}–{DEFAULT_CLOSE} น. แก้ไขได้เลย แล้วกด “บันทึก”
            </p>
          )}

          <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-5 py-4">
            <p className="text-base font-semibold text-slate-900">เลือกแบบที่ใกล้เคียงกับร้านของคุณ</p>
            <p className="mt-0.5 text-sm text-slate-600">กดแล้วระบบกรอกเวลาให้ทั้งสัปดาห์ แก้รายวันต่อได้ แล้วกด “บันทึก”</p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {PRESETS.map((pr) => (
                <button
                  key={pr.label}
                  type="button"
                  onClick={() => applyPreset(pr.build)}
                  className={`rounded-full border border-slate-300 bg-white px-4 py-2 text-base text-slate-700 transition-colors hover:border-blue-600 hover:bg-blue-50 hover:text-blue-800 ${FOCUS}`}
                >
                  {pr.label}
                </button>
              ))}
            </div>
          </div>

          <div
            role="group"
            aria-label="ตั้งเวลาหลายวันพร้อมกัน"
            className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-3 rounded-2xl border border-slate-200 bg-white px-5 py-4"
          >
            <span className="text-base font-medium text-slate-900">หรือกำหนดเอง ตั้งพร้อมกัน</span>
            <TimeField label="เวลาเปิดที่จะตั้ง" value={bulkOpen} onChange={setBulkOpen} />
            <span className="text-slate-400" aria-hidden>ถึง</span>
            <TimeField label="เวลาปิดที่จะตั้ง" value={bulkClose} onChange={setBulkClose} />
            <span className="flex flex-wrap gap-2">
              {[
                { label: "ทุกวัน", days: DAY_ORDER },
                { label: "จันทร์–ศุกร์", days: WEEKDAYS },
                { label: "เสาร์–อาทิตย์", days: WEEKEND },
              ].map((b) => (
                <button
                  key={b.label}
                  type="button"
                  disabled={bulkClose < bulkOpen}
                  onClick={() => applyBulk(b.days)}
                  className={`rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`}
                >
                  ใช้กับ{b.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => closeDays(WEEKEND)}
                className={`rounded-xl px-3.5 py-2 text-base font-medium text-slate-700 transition-colors hover:bg-slate-100 ${FOCUS}`}
              >
                ปิดเสาร์–อาทิตย์
              </button>
            </span>
            {bulkClose < bulkOpen && (
              <p className="basis-full text-sm text-rose-700">เวลาปิดต้องไม่น้อยกว่าเวลาเปิด</p>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {/* หัวคอลัมน์ (เฉพาะจอกว้าง) */}
            <div className={`hidden gap-x-4 border-b border-slate-200 px-5 py-3 text-sm text-slate-500 @3xl:grid ${ROW_GRID}`} aria-hidden>
              <span>วัน</span>
              <span>สถานะ</span>
              <span>เวลาเปิด</span>
              <span>เวลาปิด</span>
              <span className="relative h-6 tabular-nums">
                {[0, 6, 12, 18, 24].map((h) => (
                  <span
                    key={h}
                    className="absolute top-0"
                    style={{ left: `${(h / 24) * 100}%`, transform: h === 0 ? "none" : h === 24 ? "translateX(-100%)" : "translateX(-50%)" }}
                  >
                    {String(h).padStart(2, "0")}
                  </span>
                ))}
              </span>
            </div>

            <ul className="divide-y divide-slate-100">
              {rows.map((d) => {
                const bad = problemOf(d);
                return (
                  <li key={d.dayOfWeek} className={`px-5 py-4 ${d.isClosed ? "bg-slate-50/70" : ""}`}>
                    <div className={`grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 ${ROW_GRID}`}>
                      <span className={`text-base font-medium ${d.isClosed ? "text-slate-400" : "text-slate-900"}`}>
                        วัน{dayNames[d.dayOfWeek]}
                      </span>

                      <span className="flex items-center gap-3 @3xl:justify-self-start">
                        <Switch
                          checked={!d.isClosed}
                          onChange={() => patchDay(d.dayOfWeek, { isClosed: !d.isClosed })}
                          label={`วัน${dayNames[d.dayOfWeek]} ${d.isClosed ? "ปิดทำการ" : "เปิดทำการ"}`}
                        />
                        <span className={`w-20 text-sm ${d.isClosed ? "text-slate-400" : "text-slate-700"}`}>
                          {d.isClosed ? "ปิดทำการ" : "เปิดทำการ"}
                        </span>
                      </span>

                      <div className="col-span-2 flex flex-wrap items-center gap-x-3 gap-y-2 @3xl:contents">
                        <span className="flex items-center gap-2">
                          <span className="text-sm text-slate-500 @3xl:sr-only">เปิด</span>
                          <TimeField
                            label={`วัน${dayNames[d.dayOfWeek]} เวลาเปิด`}
                            value={d.openTime}
                            disabled={d.isClosed}
                            onChange={(v) => patchDay(d.dayOfWeek, { openTime: v })}
                          />
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="text-sm text-slate-500 @3xl:sr-only">ปิด</span>
                          <TimeField
                            label={`วัน${dayNames[d.dayOfWeek]} เวลาปิด`}
                            value={d.closeTime}
                            disabled={d.isClosed}
                            onChange={(v) => patchDay(d.dayOfWeek, { closeTime: v })}
                          />
                        </span>

                        <span className="min-w-[9rem] flex-1">
                          <DayBar d={d} />
                          <span className={`mt-1 block text-sm ${bad ? "text-rose-700" : "text-slate-500"}`}>
                            {bad ?? durationText(d)}
                          </span>
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* เครื่องมือด้านข้าง */}
        <aside className="space-y-8 @5xl:sticky @5xl:top-6 @5xl:self-start" aria-label="เครื่องมือช่วยตั้งเวลา">
          <section aria-labelledby="tips-title">
            <h2 id="tips-title" className="text-lg font-semibold text-slate-900">ข้อควรรู้</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-base text-slate-600">
              <li>เวลาเป็นแบบ 24 ชั่วโมง เช่น 18:30 คือหกโมงครึ่งเย็น</li>
              <li>ตั้งเวลาเปิดและเวลาปิดเท่ากัน ระบบถือว่าเปิดตลอด 24 ชั่วโมง</li>
              <li>ถ้าเปิดข้ามเที่ยงคืน (เช่น 18:00–02:00) ให้แบ่งเป็น 2 วัน คือ 18:00–23:55 ของวันแรก และ 00:00–02:00 ของวันถัดไป</li>
              <li>เวลาที่บันทึกนี้ใช้เลือกสถานที่ตอนจัดทริปอัตโนมัติ และแสดงในหน้ารายละเอียดสถานที่</li>
            </ul>
          </section>

          <section aria-labelledby="data-title" className="border-t border-slate-200 pt-6">
            <h2 id="data-title" className="text-lg font-semibold text-slate-900">จัดการข้อมูล</h2>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className={`inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 ${FOCUS}`}
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} aria-hidden /> โหลดใหม่
              </button>
              {hasSaved && (
                <button
                  onClick={handleClearAll}
                  disabled={isDeleting}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-base font-medium text-rose-700 transition-colors hover:bg-rose-50 disabled:opacity-60 ${FOCUS}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden /> ลบเวลาทำการทั้งหมด
                </button>
              )}
            </div>
            {hasSaved && (
              <p className="mt-2 text-sm text-slate-500">ลบแล้วระบบจะถือว่าสถานที่นี้ไม่ระบุเวลาทำการ ต้องตั้งใหม่ถ้าต้องการใช้</p>
            )}
          </section>
        </aside>
      </div>

      {needsSave && (
        <div className="sticky bottom-0 z-20 -mx-4 flex items-center gap-3 border-t border-slate-200 bg-white/95 p-3 backdrop-blur sm:-mx-6 lg:-mx-10 @5xl:hidden">
          <p role="status" className="min-w-0 flex-1 text-base text-slate-700">
            {problems.length > 0 ? (
              <span className="font-medium text-rose-700">มี {problems.length} วันที่เวลาไม่ถูกต้อง</span>
            ) : hasSaved ? (
              <span className="font-medium text-amber-700">มีการแก้ไขที่ยังไม่บันทึก</span>
            ) : (
              "ยังไม่ได้บันทึกเวลาทำการ"
            )}
          </p>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 ${FOCUS}`}
          >
            <Save className="h-4 w-4" aria-hidden /> {isSaving ? "กำลังบันทึก…" : "บันทึก"}
          </button>
        </div>
      )}
    </>,
  );
}
