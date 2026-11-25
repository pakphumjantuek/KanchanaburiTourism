import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Check, Loader2, Sparkles, Wand2 } from "lucide-react";
import {
  useGetMyInterestsQuery,
  useReplaceMyInterestsMutation,
} from "../../features/interests/interestApi";

// key ต้องตรงกับ backend — คำอธิบาย/ตัวอย่างช่วยให้ผู้ใช้ใหม่เข้าใจว่าแต่ละหมวดคืออะไร
const TOPICS = [
  { key: "nature", emoji: "🌿", label: "ธรรมชาติ", hint: "น้ำตก ภูเขา เขื่อน ล่องแพ" },
  { key: "history", emoji: "📚", label: "ประวัติศาสตร์", hint: "สะพานข้ามแม่น้ำแคว ทางรถไฟสายมรณะ" },
  { key: "culture", emoji: "🎭", label: "วัฒนธรรม", hint: "วัด ศาสนสถาน ประเพณีท้องถิ่น" },
  { key: "food", emoji: "🍜", label: "อาหารพื้นถิ่น", hint: "ร้านท้องถิ่น เมนูขึ้นชื่อ คาเฟ่" },
  { key: "community", emoji: "👥", label: "ชุมชน/วิถีชีวิต", hint: "ตลาด หมู่บ้าน กิจกรรมกับชาวบ้าน" },
];

const LEVELS = [
  { value: 0, label: "ไม่สนใจ" },
  { value: 0.33, label: "นิดหน่อย" },
  { value: 0.66, label: "ชอบ" },
  { value: 1, label: "ชอบมาก" },
];

type InterestState = Record<string, number>;

// ค่าเก่าอาจเป็นทศนิยมใดๆ จาก slider เดิม → ปัดเข้าระดับที่ใกล้สุด
const nearestLevel = (v: number) =>
  LEVELS.reduce((a, b) => (Math.abs(b.value - v) < Math.abs(a.value - v) ? b : a)).value;

const UserInterestsPage: React.FC = () => {
  const { data, isLoading, error } = useGetMyInterestsQuery();
  const [replaceInterests, { isLoading: isSaving }] = useReplaceMyInterestsMutation();
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const initialMap = useMemo(() => {
    const map: InterestState = {};
    TOPICS.forEach((x) => (map[x.key] = 0.33));
    (data ?? []).forEach((x) => (map[x.interestKey] = nearestLevel(x.weight)));
    return map;
  }, [data]);

  const [local, setLocal] = useState<InterestState>({});
  useEffect(() => setLocal(initialMap), [initialMap]);

  const dirty = TOPICS.some((t) => local[t.key] !== initialMap[t.key]);
  const isNew = (data ?? []).length === 0;
  const errorMessage = (error as any)?.data?.errorMessages?.[0] ?? (error as any)?.error ?? "";

  const choose = (key: string, value: number) => {
    setSaved(false);
    setSaveError("");
    setLocal((prev) => ({ ...prev, [key]: value }));
  };

  const onSave = async () => {
    setSaveError("");
    try {
      await replaceInterests({
        items: Object.entries(local).map(([interestKey, weight]) => ({ interestKey, weight })),
      }).unwrap();
      setSaved(true);
    } catch (e: any) {
      setSaveError(e?.data?.errorMessages?.[0] ?? "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง");
    }
  };

  if (isLoading)
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-[#8e7068] gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> กำลังโหลด...
      </div>
    );

  if (errorMessage)
    return (
      <div className="max-w-3xl mx-auto mt-10 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-center">
        {errorMessage}
      </div>
    );

  return (
    <div className="min-h-screen bg-[#fbf8f5] text-[#141c23] text-left pb-28">
      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 pt-5 sm:pt-8">
        <header className="rounded-3xl bg-gradient-to-br from-[#1c242b] via-[#293139] to-[#00210e] text-white p-6 sm:p-8 shadow-xl">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#ffdbd1]">
            <Sparkles className="w-4 h-4" /> ความสนใจของฉัน
          </span>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black leading-tight">คุณชอบเที่ยวแบบไหน?</h1>
          <p className="mt-2 text-white/80 text-sm sm:text-base max-w-2xl">
            เลือกระดับความชอบของแต่ละหมวด ระบบจะใช้ข้อมูลนี้<b className="text-white">แนะนำสถานที่</b>และ
            <b className="text-white">จัดทริปอัตโนมัติ</b>ให้ตรงใจคุณ เปลี่ยนได้ตลอดเวลา
          </p>
          <ol className="mt-4 grid grid-cols-1 min-[420px]:grid-cols-3 gap-2 text-xs sm:text-sm max-w-3xl">
            {["เลือกระดับแต่ละหมวด", "กดบันทึก", "ไปสร้างทริปได้เลย"].map((s, i) => (
              <li key={s} className="flex items-center gap-2 rounded-xl bg-white/10 px-2.5 py-2">
                <span className="shrink-0 w-6 h-6 rounded-full bg-[#d84a1b] flex items-center justify-center font-bold">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </header>

        {isNew && (
          <p className="mt-4 rounded-2xl bg-[#ffdbd1]/50 border border-[#e2bfb5] px-4 py-3 text-sm text-[#5a413a]">
            ยังไม่เคยตั้งค่า — เราตั้งไว้ที่ "นิดหน่อย" ให้ทุกหมวด ปรับตามที่ชอบแล้วกดบันทึกได้เลย
          </p>
        )}

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {TOPICS.map((t) => (
            <section key={t.key} className="bg-white rounded-2xl border border-[#e2bfb5]/50 p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 shrink-0 rounded-xl bg-[#f3ede7] flex items-center justify-center text-2xl" aria-hidden>
                  {t.emoji}
                </span>
                <div className="min-w-0">
                  <h2 className="font-bold">{t.label}</h2>
                  <p className="text-xs sm:text-sm text-[#8e7068]">{t.hint}</p>
                </div>
              </div>
              <div role="radiogroup" aria-label={`ระดับความสนใจ ${t.label}`} className="mt-3 grid grid-cols-4 gap-1.5 sm:gap-2">
                {LEVELS.map((lv) => {
                  const active = local[t.key] === lv.value;
                  return (
                    <button
                      key={lv.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => choose(t.key, lv.value)}
                      className={`py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                        active
                          ? lv.value === 0
                            ? "bg-[#5a413a] border-[#5a413a] text-white"
                            : "bg-[#d84a1b] border-[#d84a1b] text-white shadow-md shadow-[#d84a1b]/20"
                          : "bg-white border-[#e2bfb5]/70 text-[#5a413a] hover:border-[#d84a1b] hover:text-[#d84a1b]"
                      }`}
                    >
                      {lv.label}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {saved && !dirty && (
          <div className="mt-5 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <p className="flex-1 text-emerald-800 font-semibold flex items-center gap-2">
              <Check className="w-5 h-5" /> บันทึกแล้ว! คำแนะนำจะปรับตามความชอบใหม่ของคุณ
            </p>
            <Link
              to="/trip"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#16693c] text-white text-sm font-bold"
            >
              <Wand2 className="w-4 h-4" /> ลองจัดทริปอัตโนมัติ
            </Link>
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 bg-white/95 backdrop-blur border-t border-[#e2bfb5]/50 pb-[env(safe-area-inset-bottom)]">
        <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 py-3 flex items-center gap-3">
          <p className="flex-1 text-sm text-[#5a413a]" role="status">
            {saveError ? <span className="text-red-600">{saveError}</span> : dirty ? "มีการเปลี่ยนแปลงที่ยังไม่บันทึก" : "ไม่มีการเปลี่ยนแปลง"}
          </p>
          {dirty && (
            <button
              type="button"
              onClick={() => setLocal(initialMap)}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-full text-sm font-semibold text-[#5a413a] hover:bg-[#f3ede7]"
            >
              ยกเลิก
            </button>
          )}
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving || (!dirty && !isNew)}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#d84a1b] hover:bg-[#b83c13] disabled:bg-[#e2bfb5] text-white text-sm font-bold"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />} บันทึก
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserInterestsPage;
