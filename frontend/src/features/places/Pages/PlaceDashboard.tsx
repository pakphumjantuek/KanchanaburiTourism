import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useGetByIdQuery, useGetPlaceDashboardQuery } from "../placeApi";
import {
  ACTION_META,
  EmptyState,
  ErrorState,
  Panel,
  Segmented,
  SkeletonPanel,
  axisTick,
  gridStroke,
  tooltipStyle,
} from "../../../components/admin/AdminUi";

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

/* ---------- ช่วงวันที่ ----------
 * หลังบ้านกรอง CreatedAt >= from และ CreatedAt <= to โดยเก็บเวลาเป็น UTC
 * จึงส่งขอบเขต "ต้นวัน-ท้ายวัน ตามเวลาท้องถิ่น" แปลงเป็นเวลา UTC แบบไม่มี Z (เซิร์ฟเวอร์จะได้ไม่แปลงเขตเวลาซ้ำ)
 * เดิมส่งแค่วันที่ (เที่ยงคืน) ทำให้วันสิ้นสุดไม่รวมข้อมูลของวันนั้น และ "วันนี้" ว่างเสมอ
 */
type Preset = "today" | "7d" | "30d" | "90d" | "custom";

const PRESETS: { value: Preset; label: string }[] = [
  { value: "today", label: "วันนี้" },
  { value: "7d", label: "7 วัน" },
  { value: "30d", label: "30 วัน" },
  { value: "90d", label: "90 วัน" },
  { value: "custom", label: "กำหนดเอง" },
];
const PRESET_DAYS: Record<Exclude<Preset, "custom">, number> = { today: 1, "7d": 7, "30d": 30, "90d": 90 };

const pad = (n: number) => String(n).padStart(2, "0");
const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseLocal = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const startParam = (s: string) => parseLocal(s).toISOString().slice(0, 23);
const endParam = (s: string) => {
  const d = parseLocal(s);
  d.setHours(23, 59, 59, 999);
  return d.toISOString().slice(0, 23);
};
const thaiDate = (s: string) => parseLocal(s).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
const num = (n: number) => n.toLocaleString("th-TH");

/* ---------- ชื่อการกระทำเป็นภาษาไทย ---------- */

const ACTION_THAI: Record<number, { label: string; metaKey?: string }> = {
  1: { label: "เปิดดู", metaKey: "View" },
  2: { label: "คลิก", metaKey: "Click" },
  3: { label: "เพิ่มลงทริป", metaKey: "AddToTrip" },
  4: { label: "ถูกใจ", metaKey: "Favorite" },
  5: { label: "รีวิว", metaKey: "Review" },
  6: { label: "ค้นหา" },
  7: { label: "ระบบแสดงรายการแนะนำ" },
  8: { label: "ข้าม" },
  9: { label: "ไม่สนใจ" },
  10: { label: "ออกจากหน้าเร็ว" },
};
const NEUTRAL = "#94a3b8";

/* ---------- การเปลี่ยนแปลงเทียบช่วงก่อนหน้า ---------- */

function Delta({ now, before }: { now: number; before: number | undefined }) {
  if (before === undefined) return <span className="text-slate-400">—</span>;
  if (before === 0 && now === 0) return <span className="text-slate-400">—</span>;
  if (before === 0) return <span className="font-medium text-emerald-700">ใหม่</span>;
  const pct = ((now - before) / before) * 100;
  if (Math.abs(pct) < 0.05) return <span className="text-slate-500">เท่าเดิม</span>;
  const up = pct > 0;
  return (
    <span className={`font-medium tabular-nums ${up ? "text-emerald-700" : "text-rose-700"}`}>
      {up ? "▲" : "▼"} {Math.abs(pct).toFixed(0)}%
    </span>
  );
}

function Meter({ label, hint, value, of }: { label: string; hint: string; value: number; of: number }) {
  const pct = of > 0 ? (value / of) * 100 : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-base font-medium text-slate-900">{label}</span>
        <span className="text-base font-semibold tabular-nums text-slate-900">{of > 0 ? `${pct.toFixed(1)}%` : "—"}</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100" aria-hidden>
        <div
          className="h-full rounded-full bg-blue-600 transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <p className="mt-1.5 text-sm text-slate-500">
        {hint} {num(value)} ครั้ง จากการเข้าชม {num(of)} ครั้ง
      </p>
    </div>
  );
}

type ActionDatum = { type: number; name: string; count: number; color: string };

function ActionTooltip({ active, payload }: { active?: boolean; payload?: { payload: ActionDatum }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={tooltipStyle} className="bg-white px-4 py-3">
      <div className="font-semibold text-slate-900">{d.name}</div>
      <div className="mt-0.5 text-slate-600">
        <span className="font-semibold tabular-nums text-slate-900">{num(d.count)}</span> ครั้ง
      </div>
    </div>
  );
}

/* ---------- หน้า ---------- */

export default function PlaceDashboard() {
  const id = Number(useParams().placeId);
  const validId = Number.isFinite(id) && id > 0;

  const today = useMemo(() => toDateStr(new Date()), []);
  const [preset, setPreset] = useState<Preset>("30d");
  const [customFrom, setCustomFrom] = useState(() => toDateStr(addDays(new Date(), -29)));
  const [customTo, setCustomTo] = useState(today);

  const from = preset === "custom" ? customFrom : toDateStr(addDays(parseLocal(today), -(PRESET_DAYS[preset] - 1)));
  const to = preset === "custom" ? customTo : today;
  const rangeValid = Boolean(from && to) && from <= to;

  // ช่วงก่อนหน้า (ยาวเท่ากัน ติดกับช่วงนี้) ไว้เทียบแนวโน้ม
  const spanDays = rangeValid ? Math.round((parseLocal(to).getTime() - parseLocal(from).getTime()) / 86400000) + 1 : 1;
  const prevTo = toDateStr(addDays(parseLocal(from || today), -1));
  const prevFrom = toDateStr(addDays(parseLocal(prevTo), -(spanDays - 1)));

  const { data: place } = useGetByIdQuery(id, { skip: !validId });
  const { data, isLoading, isFetching, isError, refetch } = useGetPlaceDashboardQuery(
    { placeId: id, from: startParam(from), to: endParam(to) },
    { skip: !validId || !rangeValid },
  );
  const { data: prev } = useGetPlaceDashboardQuery(
    { placeId: id, from: startParam(prevFrom), to: endParam(prevTo) },
    { skip: !validId || !rangeValid },
  );

  const placeName = place?.name ?? "";

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
      <span aria-current="page" className="text-slate-900">สถิติ</span>
    </nav>
  );

  const shell = (children: React.ReactNode) => (
    <div className="@container selection:bg-blue-100 selection:text-blue-900">
      <div className="mx-auto w-full max-w-[1680px] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        {crumbs}
        {children}
      </div>
    </div>
  );

  if (!validId) {
    return shell(<ErrorState text="รหัสสถานที่ไม่ถูกต้อง" onRetry={() => history.back()} />);
  }

  if (isLoading && rangeValid) {
    return shell(
      <div aria-busy="true" aria-label="กำลังโหลดสถิติ">
        <div className="mb-8 h-8 w-64 animate-pulse rounded bg-slate-200" />
        <div className="grid gap-6 @5xl:grid-cols-12">
          <div className="@5xl:col-span-7"><SkeletonPanel h="h-[24rem]" /></div>
          <div className="@5xl:col-span-5"><SkeletonPanel h="h-[24rem]" /></div>
        </div>
      </div>,
    );
  }

  if (isError && rangeValid) {
    return shell(<ErrorState text="โหลดสถิติของสถานที่ไม่สำเร็จ" onRetry={refetch} />);
  }

  const d = data;
  const views = d?.views ?? 0;
  const engaged = (d?.favorites ?? 0) + (d?.addToTrips ?? 0);

  const actionData: ActionDatum[] = (d?.actions ?? [])
    .map((a) => {
      const t = ACTION_THAI[a.actionType];
      return {
        type: a.actionType,
        name: t?.label ?? `ประเภท ${a.actionType}`,
        count: a.count,
        color: (t?.metaKey && ACTION_META[t.metaKey]?.color) || NEUTRAL,
      };
    })
    .sort((x, y) => y.count - x.count);

  const periodLabel =
    preset === "today" ? "วันนี้" : preset === "custom" ? `${thaiDate(from)} – ${thaiDate(to)}` : `${spanDays} วันล่าสุด`;

  const rows: { label: string; now: number; before?: number }[] = d
    ? [
        { label: "ยอดเข้าชม", now: d.views, before: prev?.views },
        { label: "ผู้ใช้ที่ไม่ซ้ำ", now: d.uniqueUsers, before: prev?.uniqueUsers },
        { label: "ถูกใจ", now: d.favorites, before: prev?.favorites },
        { label: "เพิ่มลงทริป", now: d.addToTrips, before: prev?.addToTrips },
        { label: "รีวิว", now: d.reviews, before: prev?.reviews },
      ]
    : [];

  const noActivity = d ? d.actions.length === 0 && views === 0 : false;
  // "วันนี้ มีการเข้าชม…" / "ช่วง 30 วันล่าสุด มีการเข้าชม…" (เว้นวรรคให้อ่านง่าย)
  const periodPhrase = preset === "today" ? "วันนี้" : `ช่วง ${periodLabel}`;

  return shell(
    <>
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 @3xl:flex-row @3xl:items-end @3xl:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">สถิติของสถานที่</h1>
          <p className="mt-1 truncate text-base text-slate-500">
            {placeName ? <span className="font-medium text-slate-700">{placeName}</span> : `สถานที่ #${id}`}
            {" · "}
            {periodLabel}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Segmented options={PRESETS} value={preset} onChange={setPreset} />
          {preset === "custom" && (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                aria-label="วันเริ่มต้น"
                value={customFrom}
                max={customTo || today}
                onChange={(e) => setCustomFrom(e.target.value)}
                className={`rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 hover:border-slate-400 ${FOCUS}`}
              />
              <span className="text-slate-400" aria-hidden>ถึง</span>
              <input
                type="date"
                aria-label="วันสิ้นสุด"
                value={customTo}
                min={customFrom}
                max={today}
                onChange={(e) => setCustomTo(e.target.value)}
                className={`rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 hover:border-slate-400 ${FOCUS}`}
              />
            </div>
          )}
        </div>
      </header>

      {!rangeValid ? (
        <p className="py-8 text-base text-rose-700">วันเริ่มต้นต้องไม่อยู่หลังวันสิ้นสุด กรุณาเลือกช่วงวันที่ใหม่</p>
      ) : (
        <div className={`transition-opacity ${isFetching ? "opacity-60" : ""}`}>
          {/* สรุปผลเป็นประโยค */}
          <section aria-label="สรุปผล" className="border-b border-slate-200 py-8">
            <div className="max-w-4xl">
              {noActivity ? (
                <>
                  <p className="text-xl font-semibold text-slate-900">ยังไม่มีการใช้งานสถานที่นี้ในช่วงนี้</p>
                  <p className="mt-2 text-base text-slate-600">ลองเลือกช่วงเวลาที่ยาวขึ้น</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-semibold leading-snug tracking-tight text-slate-900 [text-wrap:balance]">
                    {periodPhrase} มีการเข้าชม <span className="tabular-nums text-blue-700">{num(views)}</span> ครั้ง
                    จากผู้ใช้ <span className="tabular-nums">{num(d?.uniqueUsers ?? 0)}</span> คน
                  </p>
                  <ul className="mt-3 space-y-1 text-base text-slate-600">
                    <li>
                      ผู้ใช้กดถูกใจหรือเพิ่มลงทริป {num(engaged)} ครั้ง
                      {views > 0 && <> (คิดเป็น {((engaged / views) * 100).toFixed(1)}% ของการเข้าชม)</>}
                    </li>
                    {prev && prev.views + views > 0 && (
                      <li>
                        เทียบกับช่วงก่อนหน้า ({thaiDate(prevFrom)} – {thaiDate(prevTo)}): การเข้าชม{" "}
                        <Delta now={views} before={prev.views} />
                      </li>
                    )}
                  </ul>
                </>
              )}
            </div>
          </section>

          <div className="grid gap-6 py-8 @5xl:grid-cols-12">
            {/* การกระทำทั้งหมด */}
            <div className="@5xl:col-span-7">
              <Panel title="การกระทำของผู้ใช้" subtitle={`จำนวนครั้งแยกตามประเภท · ${periodLabel}`}>
                {actionData.length > 0 ? (
                  <div
                    role="img"
                    aria-label={`กราฟแท่งการกระทำของผู้ใช้: ${actionData.map((x) => `${x.name} ${num(x.count)} ครั้ง`).join(", ")}`}
                    style={{ height: actionData.length * 44 + 36 }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={actionData} layout="vertical" margin={{ top: 4, right: 56, left: 4, bottom: 4 }} barCategoryGap={10}>
                        <CartesianGrid horizontal={false} stroke={gridStroke} />
                        <XAxis type="number" domain={[0, "dataMax"]} allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="type" width={150} tick={axisTick} axisLine={false} tickLine={false} tickFormatter={(t: number) => ACTION_THAI[t]?.label ?? `ประเภท ${t}`} />
                        <Tooltip content={<ActionTooltip />} cursor={{ fill: "#f1f5f9" }} />
                        <Bar dataKey="count" barSize={22} radius={[0, 6, 6, 0]} animationDuration={500}>
                          {actionData.map((x) => (
                            <Cell key={x.type} fill={x.color} />
                          ))}
                          <LabelList dataKey="count" position="right" formatter={(v: unknown) => num(Number(v))} style={{ fontSize: 14, fill: "#334155" }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState text="ไม่มีการกระทำในช่วงเวลานี้" />
                )}
              </Panel>
            </div>

            {/* เทียบกับช่วงก่อนหน้า */}
            <div className="@5xl:col-span-5">
              <Panel title="เทียบกับช่วงก่อนหน้า" subtitle={`${thaiDate(prevFrom)} – ${thaiDate(prevTo)}`}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[24rem] text-left text-base">
                    <thead className="border-b border-slate-200 text-sm text-slate-500">
                      <tr>
                        <th scope="col" className="py-2 pr-3 font-medium">ตัวชี้วัด</th>
                        <th scope="col" className="px-3 py-2 text-right font-medium">ช่วงนี้</th>
                        <th scope="col" className="px-3 py-2 text-right font-medium">ก่อนหน้า</th>
                        <th scope="col" className="py-2 pl-3 text-right font-medium">เปลี่ยนแปลง</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((r) => (
                        <tr key={r.label}>
                          <th scope="row" className="py-3 pr-3 font-medium text-slate-900">{r.label}</th>
                          <td className="px-3 py-3 text-right font-semibold tabular-nums text-slate-900">{num(r.now)}</td>
                          <td className="px-3 py-3 text-right tabular-nums text-slate-500">{r.before === undefined ? "—" : num(r.before)}</td>
                          <td className="py-3 pl-3 text-right"><Delta now={r.now} before={r.before} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </div>

            {/* อัตราการมีส่วนร่วม */}
            <div className="@5xl:col-span-12">
              <Panel
                title="การมีส่วนร่วมต่อการเข้าชม"
                subtitle="ในการเข้าชม 100 ครั้ง มีผู้ใช้ทำอะไรต่อกี่ครั้ง"
                minHeight={false}
              >
                <div className="grid gap-x-10 gap-y-6 @3xl:grid-cols-2 @6xl:grid-cols-4">
                  <Meter label="ถูกใจหรือเพิ่มลงทริป" hint="รวม" value={engaged} of={views} />
                  <Meter label="ถูกใจ" hint="ถูกใจ" value={d?.favorites ?? 0} of={views} />
                  <Meter label="เพิ่มลงทริป" hint="เพิ่มลงทริป" value={d?.addToTrips ?? 0} of={views} />
                  <Meter label="รีวิว" hint="รีวิว" value={d?.reviews ?? 0} of={views} />
                </div>
              </Panel>
            </div>
          </div>
        </div>
      )}
    </>,
  );
}
