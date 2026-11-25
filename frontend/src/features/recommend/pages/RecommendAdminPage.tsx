import { useGetModelMetaQuery, useTrainModelMutation } from "../recommendApi";
import type { BaselineTable, ModelMeta } from "../recommendTypes";
import { BrainCircuit, CheckCircle2, Loader2, RefreshCw, XCircle } from "lucide-react";
import { formatThaiDateTime, showSuccessOk } from "../../../utils";
import {
  DataList,
  ErrorState,
  KpiStrip,
  PageBody,
  PageHeader,
  Panel,
  PrimaryButton,
  SecondaryButton,
  SkeletonPanel,
  SkeletonStrip,
} from "../../../components/admin/AdminUi";

/** ชื่อวิธีที่แสดงบนหน้า (คีย์มาจาก model_meta.json) */
const METHOD_LABELS: Record<string, string> = {
  Random: "สุ่ม",
  PastCategoryScore: "เรียงตามคะแนนในอดีตของผู้ใช้",
  CategoryPopularity: "เรียงตามความนิยมหมวดโดยรวม",
  PastRatioLift: "เรียงตามสัดส่วนเกินความนิยมในอดีต",
  LightGBM: "LightGBM (โมเดลนี้)",
};
const METHOD_ORDER = ["Random", "PastCategoryScore", "CategoryPopularity", "PastRatioLift", "LightGBM"];

export default function RecommendAdminPage() {
  const { data: meta, isLoading, error, refetch } = useGetModelMetaQuery();
  const [trainModel, { isLoading: training }] = useTrainModelMutation();

  const onTrain = async () => {
    try {
      await trainModel().unwrap();
      await refetch();
      showSuccessOk("เทรนโมเดลใหม่สำเร็จ");
    } catch (e: any) {
      // ตัวกันข้อมูลผิดปกติฝั่งหลังบ้านส่งข้อความอธิบายมาใน data.message
      alert(e?.data?.message ?? e?.message ?? "เทรนไม่สำเร็จ");
    }
  };

  return (
    <RecommendAdminView
      meta={meta}
      isLoading={isLoading}
      hasError={!!error}
      training={training}
      onRefresh={() => refetch()}
      onTrain={onTrain}
    />
  );
}

/** ส่วนแสดงผลล้วน (ไม่เรียก API) เพื่อให้ทดสอบหน้าตาด้วยข้อมูลตัวอย่างได้ */
export function RecommendAdminView({
  meta,
  isLoading,
  hasError,
  training,
  onRefresh,
  onTrain,
}: {
  meta?: ModelMeta;
  isLoading: boolean;
  hasError: boolean;
  training: boolean;
  onRefresh: () => void;
  onTrain: () => void;
}) {
  const modelExists = !!meta;

  return (
    <div className="min-h-full bg-slate-50 pb-12">
      <PageHeader
        icon={BrainCircuit}
        tone="indigo"
        title="ระบบแนะนำ (ML Dashboard)"
        description="โมเดล LightGBM จัดอันดับหมวดหมู่ที่ผู้ใช้สนใจ"
        actions={
          <>
            <SecondaryButton onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" aria-hidden />
              รีเฟรช
            </SecondaryButton>
            <PrimaryButton tone="indigo" disabled={training} onClick={onTrain}>
              {training && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {training ? "กำลังเทรน..." : "เทรนโมเดลใหม่"}
            </PrimaryButton>
          </>
        }
      />

      <PageBody>
        {isLoading && (
          <div className="space-y-6">
            <SkeletonStrip />
            <SkeletonPanel />
          </div>
        )}

        {!isLoading && hasError && <ErrorState text="ไม่พบ model_meta.json" onRetry={onRefresh} />}

        {!isLoading && !hasError && meta && (
          <>
            {/* สถานะโมเดล */}
            <div
              className={`rounded-2xl p-6 text-white shadow-lg ${
                training
                  ? "bg-gradient-to-br from-amber-500 to-orange-600"
                  : modelExists
                  ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                  : "bg-gradient-to-br from-rose-500 to-red-600"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                  {training ? (
                    <Loader2 className="h-7 w-7 animate-spin" aria-hidden />
                  ) : modelExists ? (
                    <CheckCircle2 className="h-7 w-7" aria-hidden />
                  ) : (
                    <XCircle className="h-7 w-7" aria-hidden />
                  )}
                </div>
                <div>
                  <p className="text-base text-white/80">สถานะโมเดล</p>
                  <p className="text-2xl font-bold">
                    {training ? "กำลังเทรนโมเดล..." : "พร้อมใช้งาน"}
                  </p>
                </div>
              </div>
            </div>

            {/* ข้อมูลที่ใช้เทรน */}
            <KpiStrip
              items={[
                { label: "ข้อมูลทั้งหมด (แถว)", value: meta.Dataset.TotalRows.toLocaleString(), color: "blue" },
                meta.Dataset.Validation
                  ? {
                      label: "เทรนโมเดลจริงจาก (แถว)",
                      value: meta.Dataset.TrainRows.toLocaleString(),
                      color: "emerald" as const,
                    }
                  : { label: "สำหรับเทรน", value: meta.Dataset.TrainRows.toLocaleString(), color: "emerald" as const },
                meta.Dataset.Validation
                  ? {
                      label: "วิธีประเมินผล",
                      value: <span className="text-lg">{meta.Dataset.Validation}</span>,
                      color: "amber" as const,
                    }
                  : { label: "สำหรับทดสอบ", value: meta.Dataset.TestRows.toLocaleString(), color: "amber" as const },
                {
                  label: "ผู้ใช้ที่ใช้เทรน",
                  value:
                    meta.DataSnapshot.UsersWithActivity !== undefined ? (
                      <>
                        {meta.DataSnapshot.UniqueUsers.toLocaleString()}
                        <span className="text-xl font-medium text-slate-400"> / {meta.DataSnapshot.UsersWithActivity.toLocaleString()}</span>
                      </>
                    ) : (
                      meta.DataSnapshot.UniqueUsers.toLocaleString()
                    ),
                  color: "violet",
                },
                { label: "จำนวนหมวด", value: meta.DataSnapshot.UniqueCategories.toLocaleString(), color: "indigo" },
                {
                  label: "ใช้เวลาเทรน",
                  value: <span className="text-xl">{meta.Training.DurationSeconds.toLocaleString()} วินาที</span>,
                  color: "slate",
                },
              ]}
            />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <Panel title="รายละเอียดโมเดล" minHeight={false}>
                <DataList
                  rows={[
                    { label: "ชื่อโมเดล", value: meta.ModelName },
                    { label: "เวอร์ชัน", value: meta.ModelVersion },
                    { label: "อัลกอริทึม", value: `${meta.Algorithm} (${meta.ProblemType})` },
                    { label: "ฟีเจอร์", value: meta.FeatureDescription },
                    { label: "เทรนล่าสุด", value: formatThaiDateTime(meta.Training.TrainedAtUtc) },
                    ...(meta.DataSnapshot.UsersWithActivity !== undefined
                      ? [
                          {
                            label: "ผู้ใช้ที่ถูกข้าม",
                            value: (() => {
                              const skipped = meta.DataSnapshot.UsersWithActivity! - meta.DataSnapshot.UniqueUsers;
                              if (skipped <= 0) return "ไม่มี (เทรนผู้ใช้ที่มีกิจกรรมครบทุกคน)";
                              return `${skipped.toLocaleString()} คน (ล็อกสถานที่น้อยกว่า ${meta.DataSnapshot.MinLogsPerUser ?? 2} รายการ ${(meta.DataSnapshot.UsersSkippedTooFewLogs ?? 0).toLocaleString()} คน · ยังไม่มีข้อมูลอดีตให้เรียนรู้ ${(meta.DataSnapshot.UsersSkippedNoPast ?? 0).toLocaleString()} คน)`;
                            })(),
                          },
                        ]
                      : []),
                  ]}
                />
              </Panel>

              <Panel title="คุณภาพการจัดอันดับ" subtitle={
                  meta.Dataset.Validation
                    ? "NDCG@3 จาก cross-validation (ผู้ใช้ทุกคนถูกทดสอบโดยโมเดลที่ไม่เคยเห็นเขา)"
                    : "NDCG เฉลี่ยของผู้ใช้ชุดทดสอบ"
                }
                minHeight={false}
              >
                <p className="text-4xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {meta.Metrics.NDCG.toFixed(4)}
                </p>
                <p className="mt-3 text-base text-slate-600">
                  {meta.Metrics.Note ??
                    "ค่านี้ตัวเดียวอ่านผลโมเดลไม่ได้เมื่อมีหมวดน้อย ควรเทียบกับ baseline (เทรนใหม่เพื่อให้มีตารางเทียบ)"}
                </p>
                {(meta.Metrics.BeatsBestBaselineAbsolute !== undefined ||
                  meta.Metrics.BeatsBestBaselineLift !== undefined) && (
                  <ul className="mt-4 space-y-2 text-base">
                    <BeatsRow
                      label="ชนะทุก baseline: ป้ายกิจกรรมอนาคต (ป้ายที่ระบบใช้จริง)"
                      ok={meta.Metrics.BeatsBestBaselineAbsolute}
                    />
                    <BeatsRow
                      label="ชนะทุก baseline: ป้าย lift (เกินกว่าความนิยมหมวด)"
                      ok={meta.Metrics.BeatsBestBaselineLift}
                    />
                  </ul>
                )}
              </Panel>
            </div>

            {meta.Baselines && (
              <BaselinePanel
                title="เทียบกับวิธีง่ายๆ: วัดด้วยปริมาณกิจกรรมของหมวด"
                subtitle="NDCG ยิ่งสูงยิ่งดี ถ้า LightGBM ไม่สูงกว่าวิธีที่ไม่ใช้ ML แปลว่าโมเดลยังไม่เพิ่มคุณค่า"
                table={meta.Baselines}
              />
            )}
            {meta.BaselinesLift && (
              <BaselinePanel
                title="เทียบกับวิธีง่ายๆ: วัดว่าหมวดไหนที่ผู้ใช้สนใจ “เกินกว่าความนิยมทั่วไป”"
                subtitle="ตัดอิทธิพลของขนาดหมวดออก เพื่อดูความเป็นส่วนตัวของผู้ใช้จริง"
                table={meta.BaselinesLift}
              />
            )}
          </>
        )}
      </PageBody>
    </div>
  );
}

function BeatsRow({ label, ok }: { label: string; ok?: boolean }) {
  if (ok === undefined) return null;
  return (
    <li className="flex items-start gap-2">
      {ok ? (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
      ) : (
        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" aria-hidden />
      )}
      <span className="text-slate-700">
        {label}: <span className={ok ? "font-semibold text-emerald-700" : "font-semibold text-rose-700"}>{ok ? "ใช่" : "ยังไม่ชนะ"}</span>
      </span>
    </li>
  );
}

function BaselinePanel({ title, subtitle, table }: { title: string; subtitle: string; table: BaselineTable }) {
  const names = METHOD_ORDER.filter((n) => table[n]);
  return (
    <Panel title={title} subtitle={subtitle} minHeight={false}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-base">
          <thead>
            <tr className="border-b border-slate-200 text-left text-sm text-slate-500">
              <th className="py-2 pr-4 font-medium">วิธี</th>
              <th className="px-3 py-2 text-right font-medium">NDCG@1</th>
              <th className="px-3 py-2 text-right font-medium">NDCG@3</th>
              <th className="py-2 pl-3 text-right font-medium">NDCG@7</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {names.map((n) => {
              const isModel = n === "LightGBM";
              return (
                <tr key={n} className={isModel ? "bg-indigo-50 font-semibold" : ""}>
                  <td className="py-2.5 pr-4 text-slate-800">{METHOD_LABELS[n] ?? n}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{table[n].NdcgAt1.toFixed(3)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{table[n].NdcgAt3.toFixed(3)}</td>
                  <td className="py-2.5 pl-3 text-right tabular-nums">{table[n].NdcgAt7.toFixed(3)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
