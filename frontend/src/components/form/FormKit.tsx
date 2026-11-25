// ชุดส่วนประกอบฟอร์มแบบขั้นตอน ใช้ร่วมกันระหว่างฟอร์มสถานที่และฟอร์มเมนูอาหาร
import { useEffect, useMemo, useRef, useState } from "react";
import { useField, useFormikContext } from "formik";
import { Check, ImagePlus, X } from "lucide-react";

export const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

export const INPUT =
  "h-[50px] w-full rounded-xl border bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2";

export const inputTone = (bad: boolean) =>
  bad
    ? "border-rose-500 focus:ring-rose-300"
    : "border-slate-300 focus:border-blue-600 focus:ring-blue-600/25";

export const chipCls = (on: boolean) =>
  `rounded-full border px-4 py-2 text-base transition-colors ${FOCUS} ${
    on
      ? "border-blue-600 bg-blue-600 text-white"
      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
  }`;

export function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-base font-semibold text-slate-900">{label}</span>
        <span className={`text-sm ${required ? "text-rose-700" : "text-slate-500"}`}>
          {required ? "จำเป็น" : "ไม่บังคับ"}
        </span>
      </div>
      {children}
      {error ? (
        <p role="alert" className="text-sm text-rose-700">
          {error}
        </p>
      ) : (
        hint && <p className="text-sm text-slate-600">{hint}</p>
      )}
    </div>
  );
}

export function TextField({
  name,
  label,
  required,
  hint,
  placeholder,
  type = "text",
}: {
  name: string;
  label: string;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  type?: string;
}) {
  const [field, meta] = useField(name);
  const bad = !!(meta.touched && meta.error);
  return (
    <Field label={label} required={required} hint={hint} error={bad ? meta.error : undefined}>
      <input
        {...field}
        id={name}
        type={type}
        placeholder={placeholder}
        aria-invalid={bad}
        className={`${INPUT} ${inputTone(bad)}`}
      />
    </Field>
  );
}

export function TextAreaField({
  name,
  label,
  required,
  hint,
  placeholder,
  rows = 5,
}: {
  name: string;
  label: string;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  rows?: number;
}) {
  const [field, meta] = useField(name);
  const bad = !!(meta.touched && meta.error);
  return (
    <Field label={label} required={required} hint={hint} error={bad ? meta.error : undefined}>
      <textarea
        {...field}
        id={name}
        rows={rows}
        placeholder={placeholder}
        aria-invalid={bad}
        className={`${INPUT} h-auto ${inputTone(bad)}`}
      />
    </Field>
  );
}

export function StepCard({
  id,
  step,
  title,
  subtitle,
  children,
}: {
  id?: string;
  step: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="mb-5 flex items-start gap-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-lg font-semibold text-white">
          {step}
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-600">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

// เลื่อนไปหาข้อความ "ยังกรอกไม่ครบ" ทุกครั้งที่กดบันทึกแล้วไม่ผ่าน
export function ErrorSummary({ serverError }: { serverError: string | null }) {
  const { errors, submitCount } = useFormikContext<any>();
  const ref = useRef<HTMLDivElement>(null);
  const messages = Object.values(errors).filter((m): m is string => typeof m === "string");
  const show = (submitCount > 0 && messages.length > 0) || !!serverError;

  useEffect(() => {
    if (show) ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [submitCount, serverError]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!show) return null;
  return (
    <div
      ref={ref}
      role="alert"
      className="rounded-2xl border border-rose-300 bg-rose-50 p-5 text-sm text-rose-900"
    >
      {serverError ? (
        <p className="text-base font-semibold">ยังบันทึกไม่ได้: {serverError}</p>
      ) : (
        <>
          <p className="text-base font-semibold">ยังกรอกไม่ครบ กรุณาตรวจสอบ {messages.length} ข้อ</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            {messages.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export function ChecklistCard({
  title,
  items,
  children,
}: {
  title: string;
  items: { label: string; done: boolean; required: boolean }[];
  children?: React.ReactNode; // ปุ่มบันทึก/ยกเลิก
}) {
  const missing = items.filter((c) => c.required && !c.done).length;
  return (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 @5xl:sticky @5xl:top-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-600">
          {missing === 0 ? "ข้อมูลที่จำเป็นครบแล้ว กดบันทึกได้เลย" : `ยังเหลือข้อที่จำเป็นอีก ${missing} ข้อ`}
        </p>
      </div>
      <ul className="space-y-2.5">
        {items.map((c) => (
          <li key={c.label} className="flex items-center gap-3 text-base">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                c.done ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white text-transparent"
              }`}
              aria-hidden
            >
              <Check className="h-4 w-4" />
            </span>
            <span className={c.done ? "text-slate-900" : "text-slate-600"}>{c.label}</span>
            {!c.done && (
              <span className={`ml-auto text-sm ${c.required ? "text-rose-700" : "text-slate-500"}`}>
                {c.required ? "จำเป็น" : "แนะนำ"}
              </span>
            )}
          </li>
        ))}
      </ul>
      {children}
    </div>
  );
}

// เลือก/ลากรูป + ตัวอย่าง + เลือกรูปปก + เอารูปออก
export function PhotoPicker({
  files,
  setFiles,
  coverIndex,
  setCoverIndex,
}: {
  files: File[];
  setFiles: (updater: (prev: File[]) => File[]) => void;
  coverIndex: number;
  setCoverIndex: (updater: (prev: number) => number) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const add = (list: FileList | File[] | null) => {
    const imgs = Array.from(list ?? []).filter((f) => f.type.startsWith("image/"));
    if (imgs.length) setFiles((prev) => [...prev, ...imgs]);
  };

  const remove = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setCoverIndex((c) => (idx < c ? c - 1 : idx === c ? 0 : c));
  };

  return (
    <div className="space-y-4">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          add(e.dataTransfer.files);
        }}
        className={`relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-blue-600 ${
          dragging
            ? "border-blue-600 bg-blue-50"
            : "border-slate-300 bg-slate-50 hover:border-blue-500 hover:bg-blue-50/50"
        }`}
      >
        <ImagePlus className="h-9 w-9 text-blue-600" aria-hidden />
        <span className="text-lg font-semibold text-slate-900">กดเพื่อเลือกรูป หรือลากรูปมาวางที่นี่</span>
        <span className="text-sm text-slate-600">เลือกได้หลายรูปพร้อมกัน</span>
        <input
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => {
            add(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      {files.length > 0 && (
        <div className="space-y-3">
          <p className="text-base text-slate-700">
            เลือกแล้ว <b>{files.length}</b> รูป — กดที่รูปเพื่อตั้งเป็น <b>รูปปก</b>
          </p>
          <div className="grid grid-cols-2 gap-3 @xl:grid-cols-3 @3xl:grid-cols-4">
            {files.map((file, idx) => {
              const isCover = idx === coverIndex;
              return (
                <div
                  key={`${file.name}-${file.lastModified}-${idx}`}
                  className={`relative overflow-hidden rounded-xl border bg-slate-50 ${
                    isCover ? "border-blue-600 ring-2 ring-blue-600" : "border-slate-200"
                  }`}
                >
                  <button
                    type="button"
                    aria-pressed={isCover}
                    onClick={() => setCoverIndex(() => idx)}
                    className={`block w-full ${FOCUS}`}
                  >
                    <img src={previews[idx]} alt={file.name} className="h-32 w-full object-cover" />
                    <span
                      className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-sm font-medium shadow-sm ${
                        isCover ? "bg-blue-600 text-white" : "bg-white text-slate-900"
                      }`}
                    >
                      {isCover ? "รูปปก" : "ตั้งเป็นรูปปก"}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={`เอารูป ${file.name} ออก`}
                    onClick={() => remove(idx)}
                    className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm hover:bg-rose-50 hover:text-rose-700 ${FOCUS}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
