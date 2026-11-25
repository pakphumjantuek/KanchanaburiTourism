// src/features/trip/planner/PlannerTimeline.tsx
import { useMemo } from "react";
import type { TimelineRow, IssuesSummary } from "./timeline";
import { fmtHHMM } from "./timeline";
import { formatThaiTime } from "../../../../utils/dateUtils";

function StatusBadge({ r }: { r: TimelineRow }) {
  if (r.status === "ok") return null;

  if (r.status === "exceed_trip_end") {
    return (
      <span className="px-3 py-1.5 rounded text-xs font-semibold bg-red-600 text-white">
        เกินเวลาทริป {r.exceedTripEndMinutes ?? 0} นาที
      </span>
    );
  }

  const text =
    r.status === "arrive_before_open"
      ? "ยังไม่เปิดทำการ"
      : r.status === "arrive_after_close"
      ? "ปิดทำการแล้ว"
      : r.status === "stay_exceed_close"
      ? "เที่ยวเกินเวลาปิด"
      : "ปิดทำการ";

  const cls =
    r.status === "arrive_before_open"
      ? "bg-amber-600 text-white"
      : r.status === "arrive_after_close" || r.status === "stay_exceed_close"
      ? "bg-red-600 text-white"
      : "bg-gray-600 text-white";

  return <span className={`px-3 py-1.5 rounded text-xs font-semibold ${cls}`}>{text}</span>;
}

type Props = {
  selectedDay: number;
  startTimeHHMM: string;

  rows: TimelineRow[];
  startAt: Date;
  totalStay: number;
  totalTravel: number;

  issuesSummary: IssuesSummary;
  overTripEndMinutes: number;
};

export default function PlannerTimeline({
  selectedDay,
  startTimeHHMM,
  rows,
  startAt,
  totalStay,
  totalTravel,
  issuesSummary,
  overTripEndMinutes,
}: Props) {
  const totalMinutes = useMemo(() => totalStay + totalTravel, [totalStay, totalTravel]);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
        <div>
          <div className="text-lg font-bold text-gray-900">ขั้นตอนที่ 3: ตรวจตารางเวลา</div>
          <div className="text-xs text-gray-600">
            วันที่ {selectedDay} • เริ่ม {startTimeHHMM} น.
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
            เดินทาง {totalTravel} นาที
          </div>
          <div className="px-3 py-1.5 bg-green-50 text-green-700 rounded border border-green-200">
            เที่ยว {totalStay} นาที
          </div>
          <div
            className={`px-3 py-1.5 rounded border ${
              issuesSummary.totalIssues > 0
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-gray-50 text-gray-700 border-gray-200"
            }`}
          >
            แจ้งเตือน {issuesSummary.totalIssues} จุด
          </div>
        </div>
      </div>

      {issuesSummary.totalIssues > 0 && (
        <div className="mb-3 p-3 rounded-xl border border-amber-200 bg-amber-50 text-sm text-amber-900">
          <div className="font-bold">มีจุดที่ควรตรวจสอบ</div>
          <div className="mt-1 text-xs leading-relaxed">
            {issuesSummary.beforeOpen > 0 && <span className="mr-2">• ยังไม่เปิด {issuesSummary.beforeOpen} จุด</span>}
            {issuesSummary.afterClose > 0 && <span className="mr-2">• ปิดแล้ว {issuesSummary.afterClose} จุด</span>}
            {issuesSummary.exceedClose > 0 && <span className="mr-2">• เที่ยวเกินเวลาปิด {issuesSummary.exceedClose} จุด</span>}
            {issuesSummary.closed > 0 && <span className="mr-2">• ปิดทำการ {issuesSummary.closed} จุด</span>}
            {issuesSummary.exceedTrip > 0 && <span className="mr-2">• เกินเวลาทริป {issuesSummary.exceedTrip} จุด</span>}
          </div>
          <div className="mt-2 text-xs text-amber-800">
            แนะนำ: ลองสลับลำดับสถานที่ หรือปรับจำนวนสถานที่/เวลาเที่ยว
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50">
          <div className="text-gray-900 font-bold">ยังไม่มีตารางเวลา</div>
          <div className="text-sm text-gray-600 mt-1">เพิ่มสถานที่อย่างน้อย 1 จุด</div>
        </div>
      ) : (
        <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
          <div className="text-sm font-semibold text-gray-800 bg-green-50 px-4 py-2.5 rounded-lg border border-green-200">
            เริ่มออกเดินทาง: <span className="font-bold">{formatThaiTime(startAt)} น.</span>
          </div>

          {rows.map((r, idx) => (
            <div key={r.tripItemId}>
              {idx > 0 && r.travelFromPrevMinutes > 0 && (
                <div className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-2">
                  🚗 เดินทางไปจุดถัดไป {r.travelFromPrevMinutes} นาที
                </div>
              )}

              <div
                className={`rounded-xl border p-4 ${
                  r.status === "ok"
                    ? "border-gray-200 bg-white"
                    : r.status === "arrive_before_open"
                    ? "border-amber-200 bg-amber-50"
                    : r.status === "closed"
                    ? "border-gray-200 bg-gray-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-bold text-gray-900 truncate">{r.name}</div>

                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="px-3 py-1.5 rounded-full bg-white/70 border border-gray-200 text-gray-800">
                        ถึง <span className="font-bold text-blue-700">{fmtHHMM(r.arriveAt)} น.</span>
                      </span>
                      <span className="px-3 py-1.5 rounded-full bg-white/70 border border-gray-200 text-gray-800">
                        ออก <span className="font-bold text-indigo-700">{fmtHHMM(r.departAt)} น.</span>
                      </span>
                      <span className="px-3 py-1.5 rounded-full bg-white/70 border border-gray-200 text-gray-800">
                        เที่ยว <span className="font-bold">{r.stayMinutes} นาที</span>
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-gray-700">
                      {r.status === "closed" ? (
                        <span className="font-semibold text-gray-700">ปิดทำการ</span>
                      ) : r.openAt || r.closeAt ? (
                        <span>
                          เปิด-ปิด:{" "}
                          <span className="font-semibold">{r.openAt ? fmtHHMM(r.openAt) : "-"}</span> -{" "}
                          <span className="font-semibold">{r.closeAt ? fmtHHMM(r.closeAt) : "-"}</span> น.
                        </span>
                      ) : (
                        <span>เวลาเปิด-ปิด: ไม่ระบุ</span>
                      )}
                    </div>
                  </div>

                  <StatusBadge r={r} />
                </div>
              </div>
            </div>
          ))}

          <div className="text-sm font-semibold text-gray-800 bg-purple-50 px-4 py-2.5 rounded-lg border border-purple-200">
            สิ้นสุดเวลา: <span className="font-bold">{fmtHHMM(rows[rows.length - 1].departAt)} น.</span>{" "}
            <span className="text-gray-600">
              • รวม {Math.floor(totalMinutes / 60)} ชม. {totalMinutes % 60} นาที
            </span>
            {overTripEndMinutes > 0 && (
              <span className="ml-2 text-red-700 font-bold">(เกินเวลาทริป {overTripEndMinutes} นาที)</span>
            )}
          </div>
        </div>
      )}

      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-gray-700">
        หมายเหตุ: เวลาเดินทางอ้างอิงจาก Trip Segments ของวันนั้น หากไม่มีข้อมูลจะถือว่า 0 นาที
      </div>
    </div>
  );
}
