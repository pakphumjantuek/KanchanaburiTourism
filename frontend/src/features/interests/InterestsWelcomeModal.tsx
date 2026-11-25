import { useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { useReplaceMyInterestsMutation } from "./interestApi";

// key ต้องตรงกับ backend (เหมือนหน้า /profile/interests)
const TOPICS = [
  { key: "nature", emoji: "🌿", label: "ธรรมชาติ" },
  { key: "history", emoji: "📚", label: "ประวัติศาสตร์" },
  { key: "culture", emoji: "🎭", label: "วัฒนธรรม" },
  { key: "food", emoji: "🍜", label: "อาหารพื้นถิ่น" },
  { key: "community", emoji: "👥", label: "ชุมชน/วิถีชีวิต" },
];

export const INTEREST_KEYS = TOPICS.map((t) => t.key);

// เลือก = ชอบมาก (1), ไม่เลือก = นิดหน่อย (0.33) — ระดับเดียวกับหน้าตั้งค่าละเอียด
const PICKED = 1;
const NOT_PICKED = 0.33;

export function InterestsWelcomeModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [save, { isLoading }] = useReplaceMyInterestsMutation();

  const toggle = (key: string) =>
    setPicked((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key]));

  const onSubmit = async () => {
    setError("");
    try {
      await save({
        items: TOPICS.map((t) => ({ interestKey: t.key, weight: picked.includes(t.key) ? PICKED : NOT_PICKED })),
      }).unwrap();
      onSaved();
    } catch (e: any) {
      setError(e?.data?.errorMessages?.[0] ?? "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-6 shadow-2xl text-left text-[#141c23]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="ปิด"
          className="absolute top-4 right-4 w-9 h-9 rounded-full hover:bg-[#f3ede7] flex items-center justify-center text-[#8e7068]"
        >
          <X className="w-5 h-5" />
        </button>

        <p className="text-sm font-semibold text-[#d84a1b]">ยินดีต้อนรับ 👋</p>
        <h2 id="welcome-title" className="mt-1 text-2xl font-black">ชอบเที่ยวแนวไหน?</h2>
        <p className="mt-1 text-sm text-[#8e7068]">เลือกได้หลายข้อ เราจะแนะนำที่เที่ยวให้ตรงใจ</p>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          {TOPICS.map((t) => {
            const on = picked.includes(t.key);
            return (
              <button
                key={t.key}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(t.key)}
                className={`relative flex items-center gap-2.5 p-3 rounded-2xl border-2 text-sm font-semibold transition-all ${
                  on ? "border-[#d84a1b] bg-[#ffdbd1]/50 text-[#141c23]" : "border-[#e2bfb5]/60 text-[#5a413a] hover:border-[#d84a1b]/60"
                }`}
              >
                <span className="text-2xl" aria-hidden>{t.emoji}</span>
                {t.label}
                {on && (
                  <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#d84a1b] text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={onSubmit}
          disabled={isLoading || picked.length === 0}
          className="mt-5 w-full inline-flex items-center justify-center gap-2 py-3 rounded-full bg-[#d84a1b] hover:bg-[#b83c13] disabled:bg-[#e2bfb5] text-white font-bold"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {picked.length === 0 ? "เลือกอย่างน้อย 1 ข้อ" : "เริ่มเที่ยวเลย"}
        </button>
        <button type="button" onClick={onClose} className="mt-2 w-full py-2 text-sm font-semibold text-[#8e7068] hover:text-[#5a413a]">
          ไว้ทีหลัง
        </button>
      </div>
    </div>
  );
}
