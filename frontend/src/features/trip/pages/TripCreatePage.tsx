import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Loader2,
  MapPinned,
  Moon,
  Sun,
  TriangleAlert,
} from "lucide-react";
import { useCreateTripMutation } from "../tripApi";
import DateTimeInput from "../../../components/Inputs/DateTimeInput";

const DURATION_PRESETS = [
  { days: 1, label: "ไปเช้าเย็นกลับ" },
  { days: 2, label: "2 วัน 1 คืน" },
  { days: 3, label: "3 วัน 2 คืน" },
  { days: 4, label: "4 วัน 3 คืน" },
];

const inputCls =
  "w-full bg-white border border-[#e2bfb5]/70 rounded-2xl px-4 py-3.5 text-[#141c23] placeholder:text-[#8e7068]/70 transition-all focus:outline-none focus:border-[#d84a1b] focus:ring-4 focus:ring-[#d84a1b]/10";

function calendarDays(start: Date, end: Date) {
  const s = new Date(start).setHours(0, 0, 0, 0);
  const e = new Date(end).setHours(0, 0, 0, 0);
  return Math.round((e - s) / 86400000) + 1;
}

export default function TripCreatePage() {
  const navigate = useNavigate();
  const [createTrip, { isLoading }] = useCreateTripMutation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const canSubmit = useMemo(() => {
    if (!title.trim()) return false;
    if (!startDate || !endDate) return false;
    return endDate.getTime() > startDate.getTime();
  }, [title, startDate, endDate]);

  const datesInvalid =
    !!startDate && !!endDate && endDate.getTime() <= startDate.getTime();
  const tripDays =
    startDate && endDate && !datesInvalid ? calendarDays(startDate, endDate) : 0;

  const applyPreset = (days: number) => {
    const start = startDate ?? (() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(8, 0, 0, 0);
      return d;
    })();
    const end = new Date(start);
    end.setDate(end.getDate() + days - 1);
    end.setHours(18, 0, 0, 0);
    setStartDate(start);
    setEndDate(end);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) {
      alert(
        "กรุณากรอกชื่อทริป และเลือกวันเวลาให้ถูกต้อง (จบทริปต้องหลังเริ่มทริป)"
      );
      return;
    }
    const toLocalISO = (date: Date) => {
      const offset = date.getTimezoneOffset() * 60000;
      const localDate = new Date(date.getTime() - offset);
      return localDate.toISOString().replace("Z", ""); // ตัด Z ออกเพื่อให้ API มองว่าเป็น Local Time
    };

    const body = {
      title: title.trim(),
      description: description.trim() || undefined,
      startDateTime: toLocalISO(startDate!), // ส่งแบบ 2026-01-07T00:00:00.000
      endDateTime: toLocalISO(endDate!),
    };

    try {
      const created = await createTrip(body).unwrap();
      navigate(`/trip/${created.tripId}`);
    } catch (err) {
      console.error(err);
      alert((err as any)?.data?.errorMessages?.[0] ?? "สร้างทริปไม่สำเร็จ");
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf8f5] text-[#141c23] text-left">
      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 pt-5 sm:pt-8 pb-32 lg:pb-12">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-[#8e7068] hover:text-[#d84a1b] mb-5"
        >
          <ArrowLeft className="w-4 h-4" /> ย้อนกลับ
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
          {/* FORM */}
          <form
            id="trip-create-form"
            onSubmit={handleSubmit}
            className="lg:col-span-7 xl:col-span-8 flex flex-col gap-5"
          >
            <header className="mb-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-8 h-1 rounded-full bg-[#d84a1b]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#d84a1b]">
                  New trip
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                สร้างทริปใหม่
              </h1>
              <p className="text-sm sm:text-base text-[#5a413a] mt-1">
                ตั้งชื่อและเลือกวันเดินทาง แล้วค่อยเพิ่มสถานที่ทีหลังได้
              </p>
            </header>

            {/* Step 1 */}
            <section className="bg-white rounded-3xl border border-[#e2bfb5]/40 p-4 sm:p-7 shadow-sm">
              <StepHeading n={1} title="ตั้งชื่อทริป" done={!!title.trim()} />
              <label htmlFor="trip-title" className="sr-only">ชื่อทริป</label>
              <input
                id="trip-title"
                className={`${inputCls} text-lg font-semibold`}
                placeholder="เช่น ตะลอนกินเมืองกาญจน์"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                required
              />
              <label htmlFor="trip-desc" className="block text-sm font-semibold text-[#5a413a] mt-5 mb-2">
                โน้ตเพิ่มเติม <span className="font-normal text-[#8e7068]">(ไม่บังคับ)</span>
              </label>
              <textarea
                id="trip-desc"
                className={`${inputCls} resize-none`}
                placeholder="ไปกับใคร อยากกินอะไร อยากไปที่ไหนเป็นพิเศษ..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </section>

            {/* Step 2 */}
            <section className="bg-white rounded-3xl border border-[#e2bfb5]/40 p-4 sm:p-7 shadow-sm">
              <StepHeading n={2} title="เลือกวันเดินทาง" done={tripDays > 0} />

              <p className="text-xs font-semibold text-[#8e7068] mb-2">เลือกเร็ว</p>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 mb-5">
                {DURATION_PRESETS.map((p) => {
                  const active = tripDays === p.days;
                  return (
                    <button
                      key={p.days}
                      type="button"
                      onClick={() => applyPreset(p.days)}
                      className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                        active
                          ? "bg-[#d84a1b] border-[#d84a1b] text-white shadow-md shadow-[#d84a1b]/20"
                          : "bg-[#fbf8f5] border-[#e2bfb5]/60 text-[#5a413a] hover:border-[#d84a1b] hover:text-[#d84a1b]"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>

              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 [&_label]:!text-sm [&_label]:!font-semibold [&_label]:!text-[#5a413a] [&_label]:block [&_label]:mb-2 [&_.react-datepicker-wrapper]:w-full">
                <DateTimeInput
                  label="เริ่มเดินทาง"
                  value={startDate}
                  onChange={(d) => {
                    setStartDate(d);
                    if (d && endDate && endDate.getTime() <= d.getTime()) {
                      setEndDate(null);
                    }
                  }}
                  minDate={new Date()}
                  className={inputCls}
                  required
                />
                <DateTimeInput
                  label="กลับถึงบ้าน"
                  value={endDate}
                  onChange={setEndDate}
                  minDate={startDate ?? undefined}
                  className={inputCls}
                  required
                />
              </div>

              {datesInvalid && (
                <p role="alert" className="mt-4 flex items-center gap-2 text-sm text-[#b3261e] bg-[#fdecea] rounded-xl px-4 py-3">
                  <TriangleAlert className="w-4 h-4 shrink-0" />
                  วันกลับต้องอยู่หลังวันเริ่มเดินทาง
                </p>
              )}
            </section>
          </form>

          {/* SUMMARY */}
          <aside className="lg:col-span-5 xl:col-span-4">
            <div className="lg:sticky lg:top-24 rounded-3xl overflow-hidden bg-gradient-to-br from-[#1c242b] via-[#293139] to-[#00210e] text-white p-5 sm:p-7 shadow-xl">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                <MapPinned className="w-4 h-4" /> ตัวอย่างทริปของคุณ
              </div>
              <p className={`mt-3 text-2xl font-black break-words ${title.trim() ? "" : "text-white/35"}`}>
                {title.trim() || "ชื่อทริปของคุณ"}
              </p>
              {description.trim() && (
                <p className="mt-1 text-sm text-white/70 line-clamp-2">{description}</p>
              )}

              <div className="mt-5 grid grid-cols-2 gap-2.5">
                <SummaryTile icon={Sun} label="จำนวนวัน" value={tripDays ? `${tripDays} วัน` : "–"} />
                <SummaryTile icon={Moon} label="จำนวนคืน" value={tripDays ? `${tripDays - 1} คืน` : "–"} />
              </div>

              <div className="mt-2.5 rounded-2xl bg-white/10 border border-white/10 p-4 text-sm space-y-2">
                <DateRow label="ออกเดินทาง" date={startDate} />
                <DateRow label="กลับถึงบ้าน" date={endDate} />
              </div>

              <button
                type="submit"
                form="trip-create-form"
                disabled={isLoading || !canSubmit}
                className="hidden lg:flex mt-6 w-full py-3.5 rounded-full bg-[#d84a1b] hover:bg-[#b83c13] text-white font-bold items-center justify-center gap-2 shadow-lg shadow-[#d84a1b]/30 transition-all active:scale-[0.98] disabled:bg-white/15 disabled:text-white/50 disabled:shadow-none disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                {isLoading ? "กำลังสร้าง..." : "สร้างทริป"}
              </button>
              <p className="hidden lg:block mt-3 text-xs text-white/50 text-center">
                สร้างแล้วเพิ่มสถานที่และจัดลำดับได้ในหน้าถัดไป
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* MOBILE SUBMIT BAR */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#e2bfb5]/50 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          type="submit"
          form="trip-create-form"
          disabled={isLoading || !canSubmit}
          className="w-full h-12 rounded-full bg-[#d84a1b] active:bg-[#b83c13] text-white font-bold flex items-center justify-center gap-2 shadow-md shadow-[#d84a1b]/25 disabled:bg-[#e2bfb5] disabled:shadow-none"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
          {isLoading ? "กำลังสร้าง..." : tripDays ? `สร้างทริป ${tripDays} วัน` : "สร้างทริป"}
        </button>
      </div>
    </div>
  );
}

function StepHeading({ n, title, done }: { n: number; title: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span
        className={`w-7 h-7 rounded-full text-xs font-black flex items-center justify-center text-white transition-colors ${
          done ? "bg-[#16693c]" : "bg-[#141c23]"
        }`}
      >
        {done ? <Check className="w-4 h-4" strokeWidth={3} /> : n}
      </span>
      <h2 className="text-lg sm:text-xl font-black">{title}</h2>
    </div>
  );
}

function SummaryTile({ icon: Icon, label, value }: { icon: typeof Sun; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 border border-white/10 p-3.5">
      <Icon className="w-4 h-4 text-amber-300" />
      <p className="mt-2 text-[13px] text-white/60">{label}</p>
      <p className="text-lg font-black">{value}</p>
    </div>
  );
}

function DateRow({ label, date }: { label: string; date: Date | null }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-1.5 text-white/60">
        <CalendarDays className="w-4 h-4" /> {label}
      </span>
      <span className="font-semibold text-right">
        {date
          ? date.toLocaleString("th-TH", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
          : "–"}
      </span>
    </div>
  );
}
