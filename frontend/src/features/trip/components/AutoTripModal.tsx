import { useEffect, useMemo, useState } from "react";
import {
  Baby,
  CalendarDays,
  LocateFixed,
  Check,
  ChevronLeft,
  Clock,
  Loader2,
  Minus,
  Plus,
  Search,
  Sparkles,
  Sun,
  Wallet,
  Wind,
  X,
} from "lucide-react";
import { useGetAllPlaceCategoryQuery } from "../../placeCategory/placeCategoryApi";

type Props = {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (data: {
    startDate: string; // yyyy-mm-dd (เวลาไทย)
    start: { lat: number; lng: number } | null;
    days: number;
    hoursPerDay: number;
    preferredCategoryNames: string[];
    preferredCategoryIds: number[]; // หลังบ้านของ New รับรหัสหมวด (tagId = categoryId)
    relaxedPace: number;
    budgetLevel: number;
    withElderOrKids: boolean;
  }) => void;
};

type UiTag = { tagId: number; tagName: string };

const toYmd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDaysYmd = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toYmd(d);
};

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

const PACE_OPTIONS = [
  { value: 0.2, label: "แน่น", hint: "เที่ยวให้คุ้ม" },
  { value: 0.6, label: "พอดี", hint: "สมดุล" },
  { value: 0.9, label: "ชิล", hint: "ไม่รีบ" },
];

const BUDGET_OPTIONS = [
  { value: 0.2, label: "ประหยัด", hint: "฿" },
  { value: 0.5, label: "กลาง ๆ", hint: "฿฿" },
  { value: 0.9, label: "จัดเต็ม", hint: "฿฿฿" },
];

const steps = [
  { key: "time", title: "เวลา" },
  { key: "tags", title: "แนวที่ชอบ" },
  { key: "style", title: "สไตล์" },
  { key: "summary", title: "สรุป" },
] as const;

const labelOf = (opts: { value: number; label: string }[], v: number) =>
  opts.find((o) => o.value === v)?.label ?? "-";

const AutoTripModalWizard = ({ open, loading, onClose, onConfirm }: Props) => {
  const { data: placeTagPaged, isLoading } = useGetAllPlaceCategoryQuery({
    page: 1,
    pageSize: 500,
    search: "",
  });

  const tags: UiTag[] = useMemo(() => {
    const items: any[] = (placeTagPaged as any)?.items ?? [];
    const map = new Map<number, UiTag>();
    for (const c of items) {
      if (c?.categoryId && c?.categoryName && !map.has(c.categoryId))
        map.set(c.categoryId, { tagId: c.categoryId, tagName: c.categoryName });
    }
    return Array.from(map.values());
  }, [placeTagPaged]);

  const [stepIndex, setStepIndex] = useState(0);
  const [startDate, setStartDate] = useState(() => addDaysYmd(1));
  const [start, setStart] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");
  const [days, setDays] = useState(2);
  const [hoursPerDay, setHoursPerDay] = useState(8);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [relaxedPace, setRelaxedPace] = useState(0.6);
  const [budgetLevel, setBudgetLevel] = useState(0.5);
  const [withElderOrKids, setWithElderOrKids] = useState(false);
  const [tagSearch, setTagSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    setStepIndex(0);
    setStartDate(addDaysYmd(1));
    setStart(null);
    setLocError("");
    setDays(2);
    setHoursPerDay(8);
    setSelectedTags([]);
    setRelaxedPace(0.6);
    setBudgetLevel(0.5);
    setWithElderOrKids(false);
    setTagSearch("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !loading && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, loading, onClose]);

  const filteredTags = useMemo(() => {
    const q = tagSearch.trim().toLowerCase();
    if (!q) return tags.slice(0, 40);
    return tags.filter((t) => t.tagName.toLowerCase().includes(q)).slice(0, 60);
  }, [tags, tagSearch]);

  const locateMe = () => {
    if (!navigator.geolocation) return setLocError("เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง");
    setLocating(true);
    setLocError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStart({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocError("ไม่ได้รับอนุญาตให้ใช้ตำแหน่ง");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  };

  const toggleTag = (name: string) =>
    setSelectedTags((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );

  const step = steps[stepIndex].key;
  const isLast = step === "summary";
  const goNext = () => setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));

  const submit = () =>
    onConfirm({
      startDate,
      start,
      days,
      hoursPerDay,
      preferredCategoryNames: selectedTags,
      preferredCategoryIds: selectedTags
        .map((name) => tags.find((t) => t.tagName === name)?.tagId)
        .filter((id): id is number => id != null),
      relaxedPace,
      budgetLevel,
      withElderOrKids,
    });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-[#141c23]/55 backdrop-blur-sm sm:p-4"
      onClick={() => !loading && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auto-trip-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-xl bg-[#fbf8f5] rounded-t-[28px] sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden text-left text-[#141c23]"
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-[#1c242b] via-[#293139] to-[#00210e] text-white px-5 sm:px-6 pt-3 sm:pt-5 pb-5">
          <div className="sm:hidden flex justify-center mb-2">
            <span className="w-10 h-1.5 rounded-full bg-white/30" />
          </div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-xl bg-[#e88d14] flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h2 id="auto-trip-title" className="text-lg sm:text-xl font-black">
                  ให้ระบบช่วยจัดทริป
                </h2>
                <p className="text-xs text-white/60">ตอบ 3 ข้อ เราจัดเส้นทางให้</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              aria-label="ปิด"
              className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center disabled:opacity-40"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress */}
          <div className="mt-5 grid grid-cols-4 gap-1.5">
            {steps.map((s, i) => (
              <button
                key={s.key}
                type="button"
                disabled={loading || i > stepIndex}
                onClick={() => setStepIndex(i)}
                className="text-left disabled:cursor-default"
              >
                <span
                  className={`block h-1.5 rounded-full transition-colors ${
                    i <= stepIndex ? "bg-[#e88d14]" : "bg-white/15"
                  }`}
                />
                <span
                  className={`block mt-1.5 text-[13px] font-semibold ${
                    i === stepIndex ? "text-white" : "text-white/45"
                  }`}
                >
                  {s.title}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-6">
          {step === "time" && (
            <section className="space-y-4">
              <StepTitle title="ไปวันไหน เที่ยวกี่วัน?" />
              <label className="flex items-center gap-3 p-4 rounded-2xl bg-white shadow-sm border border-[#e2bfb5]/40">
                <span className="w-11 h-11 rounded-xl bg-[#ffdbd1]/60 text-[#d84a1b] flex items-center justify-center shrink-0">
                  <CalendarDays className="w-5 h-5" />
                </span>
                <span className="flex-1 text-sm font-bold">วันเริ่มทริป</span>
                <input
                  type="date"
                  value={startDate}
                  min={addDaysYmd(0)}
                  onChange={(e) => e.target.value && setStartDate(e.target.value)}
                  className="h-11 px-3 rounded-xl border border-[#e2bfb5] text-sm font-semibold focus:outline-none focus:border-[#d84a1b]"
                />
              </label>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white shadow-sm border border-[#e2bfb5]/40">
                <span className="w-11 h-11 rounded-xl bg-[#ffdbd1]/60 text-[#d84a1b] flex items-center justify-center shrink-0">
                  <LocateFixed className="w-5 h-5" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-bold">จุดเริ่มต้น</span>
                  <span className={`block text-xs truncate ${locError ? "text-[#b3261e]" : "text-[#8e7068]"}`}>
                    {locError || (start ? "ใช้ตำแหน่งปัจจุบันแล้ว ✓" : "ไม่บังคับ · ช่วยจัดเส้นทางให้ใกล้คุณ")}
                  </span>
                </span>
                {start ? (
                  <button type="button" onClick={() => setStart(null)} className="h-10 px-4 rounded-full border border-[#e2bfb5] text-sm font-semibold text-[#5a413a] hover:border-[#d84a1b] shrink-0">
                    ล้าง
                  </button>
                ) : (
                  <button type="button" onClick={locateMe} disabled={locating} className="h-10 px-4 rounded-full bg-[#141c23] text-white text-sm font-semibold flex items-center gap-1.5 disabled:opacity-60 shrink-0">
                    {locating && <Loader2 className="w-4 h-4 animate-spin" />}
                    ใช้ตำแหน่งฉัน
                  </button>
                )}
              </div>
              <Counter
                icon={Sun}
                label="จำนวนวัน"
                value={days}
                unit="วัน"
                min={1}
                max={7}
                onChange={setDays}
              />
              <Counter
                icon={Clock}
                label="เวลาเที่ยวต่อวัน"
                value={hoursPerDay}
                unit="ชม."
                min={4}
                max={14}
                onChange={setHoursPerDay}
              />
            </section>
          )}

          {step === "tags" && (
            <section className="space-y-4">
              <StepTitle
                title="ชอบเที่ยวแนวไหน?"
                hint="เลือกได้หลายแนว หรือข้ามไปเลยก็ได้ ระบบจะจัดให้เหมาะ"
              />
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e7068]" />
                <input
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  placeholder="ค้นหา เช่น คาเฟ่, น้ำตก..."
                  aria-label="ค้นหาแนวที่ชอบ"
                  className="w-full h-11 pl-10 pr-4 rounded-full bg-white border border-[#e2bfb5]/70 text-sm focus:outline-none focus:border-[#d84a1b] focus:ring-4 focus:ring-[#d84a1b]/10"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {isLoading ? (
                  [0, 1, 2, 3, 4, 5].map((i) => (
                    <span key={i} className="h-9 w-24 rounded-full bg-[#f3ede7] animate-pulse" />
                  ))
                ) : filteredTags.length === 0 ? (
                  <p className="text-sm text-[#8e7068]">ไม่พบแนวที่ค้นหา</p>
                ) : (
                  filteredTags.map((tag) => {
                    const active = selectedTags.includes(tag.tagName);
                    return (
                      <button
                        key={tag.tagId}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleTag(tag.tagName)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                          active
                            ? "bg-[#d84a1b] border-[#d84a1b] text-white shadow-md shadow-[#d84a1b]/20"
                            : "bg-white border-[#e2bfb5]/60 text-[#5a413a] hover:border-[#d84a1b] hover:text-[#d84a1b]"
                        }`}
                      >
                        {active && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                        {tag.tagName}
                      </button>
                    );
                  })
                )}
              </div>

              {selectedTags.length > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#5a413a]">
                    เลือกแล้ว <b className="text-[#d84a1b]">{selectedTags.length}</b> แนว
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedTags([])}
                    className="font-semibold text-[#8e7068] hover:text-[#d84a1b]"
                  >
                    ล้างทั้งหมด
                  </button>
                </div>
              )}
            </section>
          )}

          {step === "style" && (
            <section className="space-y-6">
              <StepTitle title="สไตล์ทริปแบบไหน?" />
              <Segmented
                icon={Wind}
                label="จังหวะการเที่ยว"
                options={PACE_OPTIONS}
                value={relaxedPace}
                onChange={setRelaxedPace}
              />
              <Segmented
                icon={Wallet}
                label="งบประมาณ"
                options={BUDGET_OPTIONS}
                value={budgetLevel}
                onChange={setBudgetLevel}
              />

              <button
                type="button"
                role="switch"
                aria-checked={withElderOrKids}
                onClick={() => setWithElderOrKids((v) => !v)}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-colors ${
                  withElderOrKids
                    ? "border-[#16693c] bg-[#16693c]/5"
                    : "border-transparent bg-white shadow-sm"
                }`}
              >
                <span className="w-11 h-11 rounded-xl bg-[#16693c]/10 text-[#16693c] flex items-center justify-center shrink-0">
                  <Baby className="w-5 h-5" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-bold">ไปกับเด็กหรือผู้สูงอายุ</span>
                  <span className="block text-xs text-[#8e7068]">
                    จัดให้ชิลขึ้น จุดแวะน้อยลง
                  </span>
                </span>
                <span
                  className={`relative w-12 h-7 rounded-full shrink-0 transition-colors ${
                    withElderOrKids ? "bg-[#16693c]" : "bg-[#e2bfb5]"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${
                      withElderOrKids ? "left-6" : "left-1"
                    }`}
                  />
                </span>
              </button>
            </section>
          )}

          {step === "summary" && (
            <section className="space-y-4">
              <StepTitle title="พร้อมแล้ว! ตรวจดูอีกครั้ง" />
              <div className="grid grid-cols-2 gap-2.5">
                <SummaryItem
                  label="เริ่ม"
                  value={new Date(`${startDate}T00:00:00`).toLocaleDateString("th-TH", { weekday: "short", day: "numeric", month: "short" })}
                  onEdit={() => setStepIndex(0)}
                />
                <SummaryItem label="ระยะเวลา" value={`${days} วัน`} onEdit={() => setStepIndex(0)} />
                <SummaryItem label="ต่อวัน" value={`${hoursPerDay} ชม.`} onEdit={() => setStepIndex(0)} />
                <SummaryItem label="จังหวะ" value={labelOf(PACE_OPTIONS, relaxedPace)} onEdit={() => setStepIndex(2)} />
                <SummaryItem label="งบ" value={labelOf(BUDGET_OPTIONS, budgetLevel)} onEdit={() => setStepIndex(2)} />
              </div>
              <SummaryItem
                label="แนวที่ชอบ"
                value={selectedTags.length ? selectedTags.join(", ") : "ให้ระบบเลือกให้"}
                onEdit={() => setStepIndex(1)}
              />
              <SummaryItem label="จุดเริ่มต้น" value={start ? "ตำแหน่งปัจจุบัน" : "ให้ระบบเลือก"} onEdit={() => setStepIndex(0)} />
              {withElderOrKids && (
                <p className="text-sm text-[#16693c] bg-[#16693c]/10 rounded-xl px-4 py-2.5 font-semibold">
                  ✓ จัดให้เหมาะกับเด็ก / ผู้สูงอายุ
                </p>
              )}
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] bg-white border-t border-[#e2bfb5]/40 flex items-center gap-2.5">
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={goBack}
              disabled={loading}
              aria-label="ย้อนกลับ"
              className="w-12 h-12 rounded-full border border-[#e2bfb5] flex items-center justify-center text-[#5a413a] hover:border-[#d84a1b] hover:text-[#d84a1b] disabled:opacity-40 shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {step === "tags" && selectedTags.length === 0 && (
            <button
              type="button"
              onClick={goNext}
              className="h-12 px-4 rounded-full text-sm font-bold text-[#8e7068] hover:text-[#d84a1b] shrink-0"
            >
              ข้าม
            </button>
          )}
          <button
            type="button"
            onClick={isLast ? submit : goNext}
            disabled={loading}
            className="flex-1 h-12 rounded-full bg-[#d84a1b] hover:bg-[#b83c13] text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#d84a1b]/25 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> กำลังจัดทริป...
              </>
            ) : isLast ? (
              <>
                <Sparkles className="w-5 h-5" /> สร้างทริปเลย
              </>
            ) : (
              "ถัดไป"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

function StepTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div>
      <h3 className="text-xl font-black">{title}</h3>
      {hint && <p className="text-sm text-[#8e7068] mt-1">{hint}</p>}
    </div>
  );
}

function Counter({
  icon: Icon,
  label,
  value,
  unit,
  min,
  max,
  onChange,
}: {
  icon: typeof Sun;
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const btn =
    "w-11 h-11 rounded-full border border-[#e2bfb5] flex items-center justify-center text-[#5a413a] hover:border-[#d84a1b] hover:text-[#d84a1b] disabled:opacity-30 disabled:pointer-events-none";
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-white shadow-sm border border-[#e2bfb5]/40">
      <span className="w-11 h-11 rounded-xl bg-[#ffdbd1]/60 text-[#d84a1b] flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold">{label}</p>
        <p className="text-xs text-[#8e7068]">
          {min}–{max} {unit}
        </p>
      </div>
      <button type="button" aria-label={`ลด${label}`} disabled={value <= min} onClick={() => onChange(clamp(value - 1, min, max))} className={btn}>
        <Minus className="w-4 h-4" />
      </button>
      <span className="w-14 text-center">
        <span className="text-2xl font-black">{value}</span>
        <span className="text-xs text-[#8e7068] ml-0.5">{unit}</span>
      </span>
      <button type="button" aria-label={`เพิ่ม${label}`} disabled={value >= max} onClick={() => onChange(clamp(value + 1, min, max))} className={btn}>
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

function Segmented({
  icon: Icon,
  label,
  options,
  value,
  onChange,
}: {
  icon: typeof Sun;
  label: string;
  options: { value: number; label: string; hint: string }[];
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <p className="flex items-center gap-2 text-sm font-bold mb-2.5">
        <Icon className="w-4 h-4 text-[#d84a1b]" /> {label}
      </p>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={label}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(o.value)}
              className={`py-3 rounded-2xl border-2 text-center transition-all ${
                active
                  ? "bg-[#d84a1b] border-[#d84a1b] text-white shadow-md shadow-[#d84a1b]/20"
                  : "bg-white border-transparent shadow-sm hover:border-[#e2bfb5]"
              }`}
            >
              <span className="block font-bold">{o.label}</span>
              <span className={`block text-[13px] ${active ? "text-white/80" : "text-[#8e7068]"}`}>
                {o.hint}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SummaryItem({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <button
      type="button"
      onClick={onEdit}
      className="w-full p-3.5 rounded-2xl bg-white border border-[#e2bfb5]/40 shadow-sm text-left hover:border-[#d84a1b] transition-colors group"
    >
      <span className="flex items-center justify-between text-[13px] text-[#8e7068]">
        {label}
        <span className="opacity-0 group-hover:opacity-100 text-[#d84a1b] font-semibold">แก้ไข</span>
      </span>
      <span className="block font-bold mt-0.5 break-words">{value}</span>
    </button>
  );
}

export default AutoTripModalWizard;
