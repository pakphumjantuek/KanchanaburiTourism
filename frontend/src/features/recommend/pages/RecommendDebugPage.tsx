import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowDown, ArrowUp, ChevronRight, Minus, RefreshCw } from "lucide-react";
import { useGetRecommendationDebugQuery } from "../recommendApi";
import type { RecommendationDebug } from "../recommendTypes";

type Row = RecommendationDebug["comparison"][number];

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

const pct = (v: number) => `${v.toFixed(1)}%`;

/* ---------- ส่วนย่อย ---------- */

/** ขึ้น/ลง/คงเดิม ของอันดับ (rankChange = อันดับพฤติกรรม − อันดับโมเดล; บวก = โมเดลดันขึ้น) */
function RankChange({ change, rawRank }: { change: number; rawRank: number }) {
  if (change > 0)
    return (
      <span className="inline-flex items-center gap-1 text-emerald-700">
        <ArrowUp className="h-4 w-4" aria-hidden /> ขึ้น {change} อันดับ
        <span className="text-slate-500">(เดิมที่ {rawRank})</span>
      </span>
    );
  if (change < 0)
    return (
      <span className="inline-flex items-center gap-1 text-rose-700">
        <ArrowDown className="h-4 w-4" aria-hidden /> ลง {Math.abs(change)} อันดับ
        <span className="text-slate-500">(เดิมที่ {rawRank})</span>
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-slate-500">
      <Minus className="h-4 w-4" aria-hidden /> อันดับเดิม
    </span>
  );
}

function Bar({ value, max, tone, ready }: { value: number; max: number; tone: string; ready: boolean }) {
  return (
    <div className="flex items-center gap-3" aria-hidden>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none ${tone}`}
          style={{ width: ready ? `${Math.min(100, (value / max) * 100)}%` : "0%" }}
        />
      </div>
      <span className="w-14 text-right text-sm tabular-nums text-slate-700">{pct(value)}</span>
    </div>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="@container selection:bg-blue-100 selection:text-blue-900">
      <div className="mx-auto w-full max-w-[1680px] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</div>
    </div>
  );
}

function Crumbs({ userId }: { userId: string | number }) {
  return (
    <nav aria-label="ตำแหน่งปัจจุบัน" className="mb-5 flex items-center gap-1.5 text-sm text-slate-500">
      <Link to="/admin/userList" className={`rounded hover:text-slate-900 hover:underline ${FOCUS}`}>
        ผู้ใช้งาน
      </Link>
      <ChevronRight className="h-4 w-4" aria-hidden />
      <span aria-current="page" className="text-slate-900">
        ผลวิเคราะห์ผู้ใช้ #{userId}
      </span>
    </nav>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="กำลังโหลดข้อมูล">
      <div className="h-8 w-80 max-w-full rounded bg-slate-200" />
      <div className="mt-3 h-5 w-48 rounded bg-slate-200" />
      <div className="mt-10 h-9 w-[36rem] max-w-full rounded bg-slate-200" />
      <div className="mt-3 h-5 w-96 max-w-full rounded bg-slate-200" />
      <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 py-5">
            <div className="h-6 w-6 rounded bg-slate-200" />
            <div className="h-5 w-40 rounded bg-slate-200" />
            <div className="h-5 flex-1 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** ข้อความผิดพลาดที่บอกสาเหตุและทางออก (400 จากหลังบ้าน = ทำนายไม่ได้: ยังไม่มีโมเดลหรือข้อมูลไม่พอ) */
function ErrorBlock({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const status = typeof error === "object" && error && "status" in error ? (error as { status: unknown }).status : null;
  const cannotPredict = status === 400;
  return (
    <div className="max-w-xl rounded-2xl border border-slate-200 bg-white p-8">
      <h2 className="text-lg font-semibold text-slate-900">
        {cannotPredict ? "ยังทำนายให้ผู้ใช้คนนี้ไม่ได้" : "โหลดข้อมูลไม่สำเร็จ"}
      </h2>
      <p className="mt-2 text-base text-slate-600">
        {cannotPredict
          ? "ระบบยังไม่มีโมเดลที่เทรนแล้ว หรือผู้ใช้คนนี้มีข้อมูลไม่พอ ลองเทรนโมเดลที่หน้าระบบแนะนำ แล้วกลับมาเปิดใหม่"
          : "ตรวจสอบการเชื่อมต่อกับเซิร์ฟเวอร์ แล้วลองอีกครั้ง"}
      </p>
      {status !== null && <p className="mt-2 text-sm text-slate-500">รหัสข้อผิดพลาด: {String(status)}</p>}
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          onClick={onRetry}
          className={`inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-base font-medium text-white transition-colors hover:bg-blue-700 ${FOCUS}`}
        >
          <RefreshCw className="h-4 w-4" aria-hidden /> ลองอีกครั้ง
        </button>
        <Link
          to="/admin/recommend"
          className={`inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50 ${FOCUS}`}
        >
          ไปหน้าระบบแนะนำ
        </Link>
      </div>
    </div>
  );
}

/** ประโยคสรุปผลที่ผู้ดูต้องการรู้ก่อน: โมเดลมองว่าผู้ใช้สนใจอะไร มากแค่ไหน และต่างจากพฤติกรรมอย่างไร */
function Verdict({ rows, total }: { rows: Row[]; total: number }) {
  if (total <= 0 || rows.length === 0) {
    return (
      <div className="max-w-3xl">
        <p className="text-xl font-semibold text-slate-900">ผู้ใช้คนนี้ยังไม่มีกิจกรรมในระบบ</p>
        <p className="mt-2 text-base text-slate-600">โมเดลจึงยังไม่มีข้อมูลให้ทำนายความสนใจ</p>
      </div>
    );
  }

  const top = rows[0];
  const uniform = 100 / rows.length;
  const risers = rows.filter((r) => r.rankChange > 0).sort((a, b) => b.rankChange - a.rankChange);
  const fallers = rows.filter((r) => r.rankChange < 0).sort((a, b) => a.rankChange - b.rankChange);
  const agrees = top.rawRank === 1;

  return (
    <div className="max-w-4xl">
      <p className="text-2xl font-semibold leading-snug tracking-tight text-slate-900 [text-wrap:balance]">
        โมเดลคาดว่าผู้ใช้คนนี้สนใจ <span className="text-blue-700">{top.category}</span> มากที่สุด
        คิดเป็น <span className="tabular-nums">{pct(top.percent)}</span> ของความสนใจทั้งหมด
      </p>
      <ul className="mt-3 space-y-1 text-base text-slate-600">
        <li>
          {agrees
            ? "ตรงกับหมวดที่ผู้ใช้ทำมากที่สุดจากพฤติกรรมจริง"
            : `ต่างจากหมวดที่ผู้ใช้ทำมากที่สุด (หมวดนี้เป็นอันดับ ${top.rawRank} ตามพฤติกรรม)`}
        </li>
        <li>ถ้าสนใจเท่ากันทุกหมวด แต่ละหมวดจะได้ {pct(uniform)}</li>
        {risers[0] && (
          <li>
            โมเดลดันขึ้นมากที่สุด: {risers[0].category} (ขึ้น {risers[0].rankChange} อันดับ)
            {fallers[0] && <> · ดันลงมากที่สุด: {fallers[0].category} (ลง {Math.abs(fallers[0].rankChange)} อันดับ)</>}
          </li>
        )}
      </ul>
    </div>
  );
}

/* ---------- หน้า ---------- */

export const RecommendDebugPage = () => {
  const { userid } = useParams<{ userid: string }>();
  const { data, isLoading, isFetching, error, refetch } = useGetRecommendationDebugQuery(Number(userid));

  // แท่งค่อยๆ ยืดตอนข้อมูลมาถึง (ครั้งเดียวต่อการโหลด)
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!data) return;
    setReady(false);
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, [data]);

  if (isLoading) {
    return (
      <PageShell>
        <Crumbs userId={userid ?? ""} />
        <Skeleton />
      </PageShell>
    );
  }

  if (error || !data) {
    return (
      <PageShell>
        <Crumbs userId={userid ?? ""} />
        <ErrorBlock error={error} onRetry={refetch} />
      </PageShell>
    );
  }

  // เรียงตามอันดับของโมเดล (อันดับ 1 อยู่บนสุด)
  const rows = [...data.comparison].sort((a, b) => a.mlRank - b.mlRank);
  const maxPct = Math.max(1, ...rows.map((r) => r.percent), ...rows.map((r) => r.ratio * 100));

  return (
    <PageShell>
      <Crumbs userId={data.userId} />

      <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 @3xl:flex-row @3xl:items-end @3xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            ผลวิเคราะห์ความสนใจของผู้ใช้ #{data.userId}
          </h1>
          <p className="mt-1 text-base text-slate-500">
            กิจกรรมรวม <span className="tabular-nums">{data.totalUserActivity.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span> คะแนน
            · {rows.length} หมวดหมู่
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className={`inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS}`}
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} aria-hidden />
          {isFetching ? "กำลังโหลด…" : "โหลดใหม่"}
        </button>
      </header>

      <section className="border-b border-slate-200 py-8" aria-label="สรุปผล">
        <Verdict rows={rows} total={data.totalUserActivity} />
      </section>

      <div className="grid gap-x-12 gap-y-10 py-8 @5xl:grid-cols-[minmax(0,1fr)_21rem]">
        {/* เปรียบเทียบรายหมวด */}
        <section aria-labelledby="cmp-title">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
            <h2 id="cmp-title" className="text-lg font-semibold text-slate-900">
              เปรียบเทียบรายหมวด
            </h2>
            <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
              <li className="inline-flex items-center gap-2">
                <span className="h-2.5 w-5 rounded-full bg-slate-300" aria-hidden /> สิ่งที่ผู้ใช้ทำ
              </li>
              <li className="inline-flex items-center gap-2">
                <span className="h-2.5 w-5 rounded-full bg-blue-600" aria-hidden /> สิ่งที่โมเดลทาย
              </li>
            </ul>
          </div>

          <ol className="divide-y divide-slate-200 border-y border-slate-200">
            {rows.map((r) => (
              <li
                key={r.category}
                className="grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-x-4 gap-y-3 py-4 @2xl:grid-cols-[2rem_minmax(11rem,15rem)_minmax(0,1fr)]"
              >
                <span
                  className={`text-lg font-semibold tabular-nums ${r.mlRank === 1 ? "text-blue-700" : "text-slate-400"}`}
                  aria-label={`อันดับ ${r.mlRank} ตามโมเดล`}
                >
                  {r.mlRank}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-base font-medium text-slate-900">{r.category}</div>
                  <div className="text-sm">
                    <RankChange change={r.rankChange} rawRank={r.rawRank} />
                  </div>
                </div>
                <div className="col-span-2 space-y-1.5 @2xl:col-span-1">
                  <Bar value={r.ratio * 100} max={maxPct} tone="bg-slate-300" ready={ready} />
                  <Bar value={r.percent} max={maxPct} tone="bg-blue-600" ready={ready} />
                  <span className="sr-only">
                    สิ่งที่ผู้ใช้ทำ {pct(r.ratio * 100)} สิ่งที่โมเดลทาย {pct(r.percent)}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* วิธีอ่านหน้านี้ */}
        <aside aria-labelledby="how-title" className="@5xl:pt-9">
          <h2 id="how-title" className="text-lg font-semibold text-slate-900">
            วิธีอ่านหน้านี้
          </h2>
          <dl className="mt-3 divide-y divide-slate-200 border-y border-slate-200 text-base">
            <div className="py-3">
              <dt className="font-medium text-slate-900">สิ่งที่ผู้ใช้ทำ</dt>
              <dd className="mt-1 text-slate-600">
                สัดส่วนคะแนนจากการเปิดดู คลิก ถูกใจ เพิ่มลงทริป และรีวิวในแต่ละหมวด ข้อมูลที่เก่าจะมีน้ำหนักลดลง
              </dd>
            </div>
            <div className="py-3">
              <dt className="font-medium text-slate-900">สิ่งที่โมเดลทาย</dt>
              <dd className="mt-1 text-slate-600">
                ส่วนแบ่งความสนใจที่โมเดลคาดว่าผู้ใช้จะมีต่อไป รวมทุกหมวดได้ 100%
              </dd>
            </div>
            <div className="py-3">
              <dt className="font-medium text-slate-900">อันดับที่เปลี่ยน</dt>
              <dd className="mt-1 text-slate-600">
                เทียบอันดับจากพฤติกรรมกับอันดับจากโมเดล ขึ้น หมายถึงโมเดลมองว่าน่าสนใจกว่าที่ผู้ใช้เคยทำ
              </dd>
            </div>
          </dl>
        </aside>
      </div>

      {/* ตัวเลขทั้งหมด */}
      <section aria-labelledby="tbl-title" className="border-t border-slate-200 pt-8">
        <h2 id="tbl-title" className="mb-3 text-lg font-semibold text-slate-900">
          ตัวเลขทั้งหมด
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr className="whitespace-nowrap">
                <th scope="col" className="px-4 py-3 font-medium">หมวดหมู่</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">คะแนนดิบ</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">ผู้ใช้ทำ (%)</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">โมเดลทาย (%)</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">คะแนนโมเดล</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">อันดับ พฤติกรรม → โมเดล</th>
                <th scope="col" className="px-4 py-3 font-medium">ผลต่อลำดับ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {rows.map((r) => (
                <tr key={r.category} className="transition-colors hover:bg-slate-50">
                  <th scope="row" className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{r.category}</th>
                  <td className="px-4 py-3 text-right tabular-nums">{r.rawScore.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{(r.ratio * 100).toFixed(1)}</td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-900">{r.percent.toFixed(1)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.mlScore.toFixed(4)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                    {r.rawRank} <span className="text-slate-400">→</span> <span className="font-medium text-slate-900">{r.mlRank}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{r.insight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </PageShell>
  );
};
