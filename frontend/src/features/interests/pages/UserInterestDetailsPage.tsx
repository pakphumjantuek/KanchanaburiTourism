import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronRight, RefreshCw } from "lucide-react";
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
import { useGetUserInterestDetailsQuery } from "../interestApi";
import {
  ACTION_META,
  EmptyState,
  ErrorState,
  Panel,
  RankList,
  Segmented,
  ShareBar,
  SkeletonPanel,
  axisTick,
  gridStroke,
  tooltipStyle,
} from "../../../components/admin/AdminUi";

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

const PERIODS = [
  { value: 30, label: "30 วัน" },
  { value: 90, label: "90 วัน" },
  { value: 180, label: "180 วัน" },
  { value: 0, label: "ทั้งหมด" },
];

/** การกระทำที่ระบบ "บันทึกจากผู้ใช้" กับที่ระบบ "แสดงให้ผู้ใช้" แยกกัน เพื่อไม่ให้ยอดรวมของผู้ใช้พอง */
const SYSTEM_ACTIONS = new Set(["RecommendShown"]);

const ACTION_LABELS: Record<string, string> = {
  View: "เปิดดู",
  Click: "คลิก",
  AddToTrip: "เพิ่มลงทริป",
  Favorite: "ถูกใจ",
  Review: "รีวิว",
  Search: "ค้นหา",
  Skip: "ข้าม",
  NotInterested: "ไม่สนใจ",
  QuickBounce: "ออกจากหน้าเร็ว",
  RecommendShown: "ระบบแสดงรายการแนะนำ",
};
const NEUTRALS = ["#64748b", "#94a3b8", "#cbd5e1", "#475569", "#e2e8f0"];

/** ความสนใจที่ผู้ใช้เลือกเองตอนตั้งค่า (คีย์ภาษาอังกฤษจากหลังบ้าน) ใช้ชื่อไทยชุดเดียวกับหน้าตั้งค่าความสนใจ */
const SURVEY_LABELS: Record<string, string> = {
  nature: "ธรรมชาติ",
  history: "ประวัติศาสตร์",
  culture: "วัฒนธรรม",
  food: "อาหารพื้นถิ่น",
  community: "ชุมชน/วิถีชีวิต",
};

type InterestSource = "behavior" | "survey";

const SOURCE_META: Record<InterestSource, { label: string; color: string }> = {
  behavior: { label: "เรียนรู้จากพฤติกรรม", color: "#2563eb" },
  survey: { label: "ผู้ใช้เลือกเอง", color: "#94a3b8" },
};
const MAX_INTEREST_BARS = 10;

/** ชื่อภาษาไทยของความสนใจ: คีย์ที่ผู้ใช้เลือกเอง > ชื่อหมวดจากหลังบ้าน > "หมวด N" > คีย์เดิม */
function interestName(key: string, displayName?: string): { name: string; source: InterestSource } {
  const survey = SURVEY_LABELS[key.toLowerCase()];
  if (survey) return { name: survey, source: "survey" };
  if (displayName && displayName !== key) return { name: displayName, source: "behavior" };
  const cat = /^cat:(\d+)$/i.exec(key);
  return { name: cat ? `หมวด ${cat[1]}` : displayName || key, source: "behavior" };
}

function actionColor(key: string, fallbackIndex: number) {
  return ACTION_META[key]?.color ?? NEUTRALS[fallbackIndex % NEUTRALS.length];
}

function InterestTooltip({ active, payload }: { active?: boolean; payload?: { payload: InterestDatum }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={tooltipStyle} className="bg-white px-4 py-3">
      <div className="font-semibold text-slate-900">{d.name}</div>
      <div className="mt-0.5 text-slate-600">
        น้ำหนักความสนใจ <span className="font-semibold tabular-nums text-slate-900">{d.weight.toFixed(2)}</span>
      </div>
      <div className="mt-0.5 text-sm text-slate-500">ที่มา: {SOURCE_META[d.source].label}</div>
    </div>
  );
}

type InterestDatum = { key: string; name: string; weight: number; source: InterestSource };

export default function UserInterestDetailsPage() {
  const { userId } = useParams();
  const id = Number(userId);
  const validId = Number.isFinite(id) && id > 0;
  const [days, setDays] = useState(90);

  const { data, isLoading, isFetching, isError, refetch } = useGetUserInterestDetailsQuery(
    { userId: id, days, top: 20 },
    { skip: !validId },
  );

  const crumbs = (
    <nav aria-label="ตำแหน่งปัจจุบัน" className="mb-5 flex items-center gap-1.5 text-sm text-slate-500">
      <Link to="/admin/userList" className={`rounded hover:text-slate-900 hover:underline ${FOCUS}`}>
        ผู้ใช้งาน
      </Link>
      <ChevronRight className="h-4 w-4" aria-hidden />
      <span aria-current="page" className="text-slate-900">
        ความสนใจของผู้ใช้ {validId ? `#${id}` : ""}
      </span>
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
    return shell(
      <ErrorState text="รหัสผู้ใช้ไม่ถูกต้อง" onRetry={() => history.back()} />,
    );
  }

  if (isLoading) {
    return shell(
      <div aria-busy="true" aria-label="กำลังโหลดข้อมูล">
        <div className="mb-8 h-8 w-72 animate-pulse rounded bg-slate-200" />
        <div className="grid gap-6 @5xl:grid-cols-12">
          <div className="@5xl:col-span-7"><SkeletonPanel h="h-[26rem]" /></div>
          <div className="@5xl:col-span-5"><SkeletonPanel h="h-[26rem]" /></div>
          <div className="@5xl:col-span-12"><SkeletonPanel h="h-72" /></div>
        </div>
      </div>,
    );
  }

  if (isError || !data) {
    return shell(<ErrorState text="โหลดข้อมูลความสนใจไม่สำเร็จ" onRetry={refetch} />);
  }

  /* ---------- เตรียมข้อมูล ---------- */

  const interests: InterestDatum[] = data.topInterests.map((it) => ({
    key: it.interestKey,
    ...interestName(it.interestKey, it.displayName),
    weight: it.weight,
  }));
  const nameByKey = Object.fromEntries(interests.map((x) => [x.key, x.name]));
  const sources = new Set(interests.map((x) => x.source));
  const shownInterests = interests.slice(0, MAX_INTEREST_BARS);
  const maxWeight = Math.max(1, ...interests.map((x) => x.weight));
  const topInterest = interests[0];
  const hasInterest = interests.some((x) => x.weight > 0);
  // หลายหมวดน้ำหนักเท่ากันที่ระดับสูงสุด: ไม่ระบุหมวดเดียว (ลำดับในหมู่ที่เท่ากันไม่มีความหมาย)
  const tiedTop = topInterest ? interests.filter((x) => x.weight >= topInterest.weight - 0.005) : [];

  const actionEntries = Object.entries(data.actionCounts);
  const userActions = actionEntries
    .filter(([k]) => !SYSTEM_ACTIONS.has(k))
    .sort((a, b) => b[1] - a[1]);
  const systemShown = actionEntries.filter(([k]) => SYSTEM_ACTIONS.has(k)).reduce((s, [, v]) => s + v, 0);
  const userTotal = userActions.reduce((s, [, v]) => s + v, 0);
  const topAction = userActions[0];

  const shareItems = userActions.map(([k, v], i) => ({
    key: k,
    label: ACTION_LABELS[k] ?? k,
    value: v,
    color: actionColor(k, i),
  }));

  const placeRows = (data.topPlaces ?? []).map((p) => ({
    name: p.categoryName ? `${p.name ?? `สถานที่ #${p.placeId}`} · ${p.categoryName}` : p.name ?? `สถานที่ #${p.placeId}`,
    logs: p.score ?? 0,
  }));

  const period = days === 0 ? "ทั้งหมดที่มีในระบบ" : `${days} วันล่าสุด`;
  const since = days === 0 ? null : new Date(data.sinceUtc).toLocaleDateString("th-TH");

  return shell(
    <>
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 @3xl:flex-row @3xl:items-end @3xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            ความสนใจของผู้ใช้ #{data.userId}
          </h1>
          <p className="mt-1 text-base text-slate-500">
            ช่วงข้อมูล: {period}
            {since && <> (ตั้งแต่ {since})</>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Segmented options={PERIODS} value={days} onChange={setDays} />
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="โหลดข้อมูลใหม่"
            className={`inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS}`}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} aria-hidden />
          </button>
        </div>
      </header>

      {/* สรุปผลเป็นประโยค */}
      <section aria-label="สรุปผล" className="border-b border-slate-200 py-8">
        <div className="max-w-4xl">
          {hasInterest && topInterest ? (
            <p className="text-2xl font-semibold leading-snug tracking-tight text-slate-900 [text-wrap:balance]">
              ผู้ใช้คนนี้สนใจ{" "}
              {tiedTop.length > 1 ? (
                <>
                  <span className="text-blue-700">{tiedTop.slice(0, 3).map((x) => x.name).join(" · ")}</span>
                  {tiedTop.length > 3 && <> และอีก {tiedTop.length - 3} หมวด</>} ในระดับเท่ากัน
                </>
              ) : (
                <>
                  <span className="text-blue-700">{topInterest.name}</span> มากที่สุด
                  {topInterest.source === "survey" && <span className="text-slate-500"> (ตามที่ผู้ใช้เลือกเอง)</span>}
                </>
              )}
              {userTotal > 0 && topAction && (
                <>
                  {" "}
                  และทำกิจกรรมเอง <span className="tabular-nums">{userTotal.toLocaleString()}</span> ครั้ง
                  ส่วนใหญ่คือ{ACTION_LABELS[topAction[0]] ?? topAction[0]} (
                  <span className="tabular-nums">{((topAction[1] / userTotal) * 100).toFixed(0)}%</span>)
                </>
              )}
            </p>
          ) : (
            <p className="text-xl font-semibold text-slate-900">ผู้ใช้คนนี้ยังไม่มีความสนใจที่บันทึกไว้</p>
          )}
          <ul className="mt-3 space-y-1 text-base text-slate-600">
            {systemShown > 0 && (
              <li>
                ระบบแสดงรายการแนะนำให้ผู้ใช้ {systemShown.toLocaleString()} ครั้ง (ไม่นับเป็นการกระทำของผู้ใช้)
              </li>
            )}
            {placeRows[0] && (
              <li>
                สถานที่ที่ผูกพันที่สุด: {placeRows[0].name.split(" · ")[0]} (คะแนน {placeRows[0].logs})
              </li>
            )}
            {userTotal === 0 && <li>ไม่พบการกระทำของผู้ใช้ในช่วงเวลานี้ ลองเลือกช่วงที่ยาวขึ้น</li>}
          </ul>
        </div>
      </section>

      <div className={`grid gap-6 py-8 transition-opacity @5xl:grid-cols-12 ${isFetching ? "opacity-60" : ""}`}>
        {/* ความสนใจรายหมวด */}
        <div className="@5xl:col-span-7">
          <Panel
            title="ความสนใจรายหมวด"
            subtitle={
              interests.length > MAX_INTEREST_BARS
                ? `น้ำหนักความสนใจ (0–1) · แสดง ${MAX_INTEREST_BARS} อันดับแรกจาก ${interests.length}`
                : "น้ำหนักความสนใจ (0–1)"
            }
            action={
              sources.size > 1 ? (
                <ul className="flex flex-wrap justify-end gap-x-4 gap-y-1 text-sm text-slate-600">
                  {(Object.keys(SOURCE_META) as InterestSource[]).map((k) => (
                    <li key={k} className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-5 rounded-full" style={{ background: SOURCE_META[k].color }} aria-hidden />
                      {SOURCE_META[k].label}
                    </li>
                  ))}
                </ul>
              ) : undefined
            }
          >
            {shownInterests.length > 0 ? (
              <div
                role="img"
                aria-label={`กราฟแท่งน้ำหนักความสนใจ: ${shownInterests.map((x) => `${x.name} (${SOURCE_META[x.source].label}) ${x.weight.toFixed(2)}`).join(", ")}`}
                style={{ height: shownInterests.length * 40 + 36 }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={shownInterests}
                    layout="vertical"
                    margin={{ top: 4, right: 48, left: 4, bottom: 4 }}
                    barCategoryGap={10}
                  >
                    <CartesianGrid horizontal={false} stroke={gridStroke} />
                    <XAxis
                      type="number"
                      domain={[0, maxWeight]}
                      ticks={[0, 0.25, 0.5, 0.75, 1].map((t) => t * maxWeight)}
                      tick={axisTick}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => String(Number(v.toFixed(2)))}
                    />
                    <YAxis
                      type="category"
                      dataKey="key"
                      width={132}
                      tick={axisTick}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(k: string) => nameByKey[k] ?? k}
                    />
                    <Tooltip content={<InterestTooltip />} cursor={{ fill: "#f1f5f9" }} />
                    <Bar dataKey="weight" barSize={20} radius={[0, 6, 6, 0]} animationDuration={500}>
                      {shownInterests.map((d) => (
                        <Cell key={d.key} fill={SOURCE_META[d.source].color} />
                      ))}
                      <LabelList
                        dataKey="weight"
                        position="right"
                        formatter={(v: unknown) => Number(v).toFixed(2)}
                        style={{ fontSize: 14, fill: "#334155" }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState text="ผู้ใช้คนนี้ยังไม่มีความสนใจที่บันทึกไว้" />
            )}
          </Panel>
        </div>

        {/* การกระทำของผู้ใช้ */}
        <div className="@5xl:col-span-5">
          <Panel title="การกระทำของผู้ใช้" subtitle={`สัดส่วนตามประเภท · ${period}`}>
            {shareItems.length > 0 ? (
              <>
                <ShareBar items={shareItems} />
                <p className="mt-4 text-sm text-slate-500">
                  รวม {userTotal.toLocaleString()} ครั้ง ไม่นับที่ระบบแสดงรายการแนะนำให้
                  {systemShown > 0 && <> ({systemShown.toLocaleString()} ครั้ง)</>}
                </p>
              </>
            ) : (
              <EmptyState text="ไม่พบการกระทำของผู้ใช้ในช่วงเวลานี้" />
            )}
          </Panel>
        </div>

        {/* สถานที่ที่ผูกพันที่สุด */}
        <div className="@5xl:col-span-12">
          <RankList
            title="สถานที่ที่ผูกพันที่สุด"
            subtitle="คะแนน: ถูกใจและรีวิว ครั้งละ 3 · เพิ่มลงทริป ครั้งละ 2 (แสดงสูงสุด 10 แห่ง)"
            data={placeRows}
            barColor={SOURCE_META.behavior.color}
          />
        </div>
      </div>
    </>,
  );
}
