import type { ReactNode, ComponentType } from "react";
import { AlertCircle } from "lucide-react";

/**
 * ชุดส่วนประกอบหน้าแอดมิน (แดชบอร์ด / ระบบแนะนำ)
 * ใช้ชุดสีเดิมของหน้า: น้ำเงิน (แดชบอร์ด) / คราม–ม่วง (ระบบแนะนำ), สีประจำตัวชี้วัดและสีกราฟเดิม
 */

type IconType = ComponentType<{ className?: string }>;
export type Tone = "blue" | "indigo";

/* ---------- สีกลาง ---------- */

export const ACTION_META: Record<string, { label: string; color: string }> = {
  View: { label: "เข้าชม", color: "#3b82f6" },
  Click: { label: "คลิก", color: "#f43f5e" },
  AddToTrip: { label: "เพิ่มลงทริป", color: "#10b981" },
  Favorite: { label: "กดถูกใจ", color: "#f59e0b" },
  Review: { label: "รีวิว", color: "#8b5cf6" },
};
export const ACTION_ORDER = ["View", "Click", "AddToTrip", "Favorite", "Review"];
export const ACCENT = "#3b82f6";
export const ACCENT_2 = "#10b981";

export const tooltipStyle = {
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.1)",
  fontSize: 14,
};
export const axisTick = { fontSize: 13, fill: "#64748B" };
export const gridStroke = "#E2E8F0";

/** สีประจำตัวชี้วัด/ไอคอน (ชุดเดิม) */
export const COLORS: Record<string, string> = {
  blue: "text-blue-600 bg-blue-50",
  emerald: "text-emerald-600 bg-emerald-50",
  amber: "text-amber-600 bg-amber-50",
  violet: "text-violet-600 bg-violet-50",
  indigo: "text-indigo-600 bg-indigo-50",
  rose: "text-rose-600 bg-rose-50",
  slate: "text-slate-600 bg-slate-100",
};
const TOP_BORDER: Record<string, string> = {
  blue: "border-t-blue-500",
  emerald: "border-t-emerald-500",
  amber: "border-t-amber-500",
  violet: "border-t-violet-500",
  indigo: "border-t-indigo-500",
  rose: "border-t-rose-500",
  slate: "border-t-slate-400",
};
const TILE: Record<Tone, string> = {
  blue: "from-blue-500 to-indigo-600 shadow-blue-500/30",
  indigo: "from-violet-500 to-indigo-600 shadow-indigo-500/30",
};
const ACCENT_TEXT: Record<Tone, string> = { blue: "text-blue-600", indigo: "text-indigo-700" };
const ACCENT_BORDER: Record<Tone, string> = { blue: "border-blue-600", indigo: "border-indigo-600" };
const ACCENT_BTN: Record<Tone, string> = {
  blue: "bg-blue-600 hover:bg-blue-700",
  indigo: "bg-indigo-600 hover:bg-indigo-700",
};

/* ---------- โครงหน้า ---------- */

export function PageHeader({
  title,
  description,
  icon: Icon,
  tone = "blue",
  actions,
  children,
}: {
  title: string;
  description?: string;
  icon?: IconType;
  tone?: Tone;
  actions?: ReactNode;
  children?: ReactNode; // วางแท็บใต้หัวเรื่อง
}) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="flex flex-col justify-between gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:px-10">
        <div className="flex min-w-0 items-center gap-4">
          {Icon && (
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${TILE[tone]}`}
            >
              <Icon className="h-6 w-6" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            {description && <p className="text-base text-slate-500">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
      {children && <div className="px-4 sm:px-6 lg:px-10">{children}</div>}
    </header>
  );
}

export function PageBody({ children }: { children: ReactNode }) {
  return <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</div>;
}

/* ---------- ปุ่มและตัวควบคุม ---------- */

export function PrimaryButton({
  children,
  tone = "blue",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone }) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-base font-medium text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${ACCENT_BTN[tone]} ${rest.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 ${rest.className ?? ""}`}
    >
      {children}
    </button>
  );
}

/** ตัวเลือกแบบแบ่งช่อง (เช่น 7 วัน / 30 วัน / 90 วัน) */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  fullWidth = false,
  tone = "blue",
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  fullWidth?: boolean;
  tone?: Tone;
}) {
  return (
    <div className={`rounded-xl bg-slate-100 p-1 ${fullWidth ? "flex w-full" : "inline-flex"}`}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 text-base font-medium transition-colors ${
              fullWidth ? "flex-1 px-2" : ""
            } ${active ? `bg-white shadow-sm ${ACCENT_TEXT[tone]}` : "text-slate-600 hover:text-slate-900"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  tone = "blue",
}: {
  tabs: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  tone?: Tone;
}) {
  return (
    <nav className="flex gap-6" role="tablist">
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={`-mb-px border-b-2 py-3 text-base font-medium transition-colors ${
              active
                ? `${ACCENT_BORDER[tone]} ${ACCENT_TEXT[tone]}`
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}

/* ---------- เนื้อหา ---------- */

/** แถบตัวชี้วัดหลัก: ช่องเรียงติดกัน แต่ละช่องมีสีประจำตัวที่ขอบบน */
export function KpiStrip({
  items,
}: {
  items: { label: string; value: ReactNode; color?: keyof typeof COLORS }[];
}) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 shadow-sm md:grid-cols-3 xl:grid-cols-6">
      {items.map((it) => (
        <div
          key={it.label}
          className={`border-t-4 bg-white px-5 py-5 ${TOP_BORDER[it.color ?? "slate"]}`}
        >
          <dd className="text-3xl font-bold leading-none tracking-tight text-slate-900 tabular-nums">
            {it.value}
          </dd>
          <dt className="mt-2.5 text-base text-slate-500">{it.label}</dt>
        </div>
      ))}
    </dl>
  );
}

export function Panel({
  title,
  subtitle,
  action,
  icon: Icon,
  color = "slate",
  children,
  className = "",
  minHeight = true,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: IconType;
  color?: keyof typeof COLORS;
  children: ReactNode;
  className?: string;
  minHeight?: boolean;
}) {
  return (
    <section
      className={`flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && (
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${COLORS[color]}`}>
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className={`flex-1 ${minHeight ? "min-h-[260px]" : ""}`}>{children}</div>
    </section>
  );
}

/** รายการอันดับ: อันดับ 1–3 เป็นป้ายสี ที่เหลือเป็นป้ายเทา + แถบสีบาง */
export function RankList({
  title,
  subtitle = "10 อันดับแรก",
  data,
  barColor = ACCENT,
  icon,
  color = "blue",
}: {
  title: string;
  subtitle?: string;
  data: { name: string; logs: number }[];
  barColor?: string;
  icon?: IconType;
  color?: keyof typeof COLORS;
}) {
  const max = Math.max(1, ...data.map((d) => d.logs));
  return (
    <Panel title={title} subtitle={subtitle} icon={icon} color={color}>
      {data.length > 0 ? (
        <ol className="space-y-3">
          {data.map((d, i) => (
            <li key={d.name + i} className="flex items-center gap-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-bold tabular-nums ${
                  i < 3 ? "text-white" : "bg-slate-100 text-slate-500"
                }`}
                style={i < 3 ? { background: barColor } : undefined}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2 text-base">
                  <span className="truncate font-medium text-slate-700" title={d.name}>
                    {d.name}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums text-slate-900">
                    {d.logs.toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(d.logs / max) * 100}%`, background: barColor }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState />
      )}
    </Panel>
  );
}

/** สัดส่วนประเภทกิจกรรม: แท่งเดียวแบ่งส่วน + ตารางตัวเลข */
export function ShareBar({
  items,
}: {
  items: { key: string; label: string; value: number; color: string }[];
}) {
  const total = Math.max(1, items.reduce((s, x) => s + x.value, 0));
  return (
    <div>
      <div className="flex h-4 overflow-hidden rounded-full bg-slate-100" role="img" aria-label="สัดส่วนประเภทกิจกรรม">
        {items.map((x) => (
          <div key={x.key} style={{ width: `${(x.value / total) * 100}%`, background: x.color }} title={x.label} />
        ))}
      </div>
      <table className="mt-5 w-full text-base">
        <tbody className="divide-y divide-slate-100">
          {items.map((x) => (
            <tr key={x.key}>
              <td className="py-2.5">
                <span className="inline-flex items-center gap-2.5 text-slate-700">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: x.color }} />
                  {x.label}
                </span>
              </td>
              <td className="py-2.5 text-right font-semibold tabular-nums text-slate-900">{x.value.toLocaleString()}</td>
              <td className="w-20 py-2.5 text-right tabular-nums text-slate-500">
                {((x.value / total) * 100).toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** รายการหัวข้อ–ค่า */
export function DataList({
  rows,
}: {
  rows: { label: string; value: ReactNode; mono?: boolean }[];
}) {
  return (
    <dl className="divide-y divide-slate-100">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-1 gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[14rem_1fr] sm:gap-6">
          <dt className="text-base text-slate-500">{r.label}</dt>
          <dd className={`min-w-0 break-words text-base font-medium text-slate-900 ${r.mono ? "font-mono text-sm" : ""}`}>
            {r.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* ---------- สถานะว่าง / ผิดพลาด / กำลังโหลด ---------- */

export function EmptyState({ text = "ยังไม่มีข้อมูลในช่วงเวลานี้" }: { text?: string }) {
  return (
    <div className="flex h-full min-h-[180px] w-full items-center justify-center text-base text-slate-400">
      {text}
    </div>
  );
}

export function ErrorState({ text, onRetry }: { text: string; onRetry: () => void }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-red-100 bg-white p-10 text-center">
      <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-400" aria-hidden />
      <div className="mb-1 text-lg font-bold text-slate-900">{text}</div>
      <p className="mb-4 text-base text-slate-500">กรุณาตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง</p>
      <button onClick={onRetry} className="rounded-xl bg-red-50 px-4 py-2 font-medium text-red-600 hover:bg-red-100">
        ลองใหม่อีกครั้ง
      </button>
    </div>
  );
}

export function SkeletonStrip() {
  return <div className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />;
}

export function SkeletonPanel({ h = "h-72" }: { h?: string }) {
  return <div className={`${h} animate-pulse rounded-2xl border border-slate-200 bg-white`} />;
}
