import { useState } from "react";
import { Check, X } from "lucide-react";
import Swal from "sweetalert2";
import {
  EmptyState,
  PageBody,
  PageHeader,
  Segmented,
} from "../../../components/admin/AdminUi";
import {
  useApproveOperatorMutation,
  useGetOperatorApplicationsQuery,
  useRejectOperatorMutation,
  type OperatorApplication,
  type OperatorStatus,
} from "../operatorApi";

type Filter = "Pending" | "Approved" | "Rejected" | "All";

const STATUS_LABEL: Record<OperatorStatus, string> = {
  Pending: "รออนุมัติ",
  Approved: "อนุมัติแล้ว",
  Rejected: "ไม่อนุมัติ",
};

const STATUS_STYLE: Record<OperatorStatus, string> = {
  Pending: "bg-amber-50 text-amber-800 border-amber-200",
  Approved: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Rejected: "bg-slate-100 text-slate-700 border-slate-200",
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function OperatorApplicationsPage() {
  const [filter, setFilter] = useState<Filter>("Pending");
  const { data, isLoading, isError } = useGetOperatorApplicationsQuery(
    filter === "All" ? undefined : filter,
  );
  const [approve, { isLoading: approving }] = useApproveOperatorMutation();
  const [reject, { isLoading: rejecting }] = useRejectOperatorMutation();
  const busy = approving || rejecting;

  const items = data ?? [];

  const onApprove = async (a: OperatorApplication) => {
    const r = await Swal.fire({
      title: "อนุมัติผู้ประกอบการ?",
      text: `${a.businessName} (${a.userName ?? a.email}) จะลงสถานที่และเมนูของตัวเองได้ทันที`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "อนุมัติ",
      cancelButtonText: "ยกเลิก",
    });
    if (r.isConfirmed) await approve(a.operatorApplicationId).unwrap();
  };

  const onReject = async (a: OperatorApplication) => {
    const wasApproved = a.status === "Approved";
    const r = await Swal.fire({
      title: wasApproved ? "ถอนสิทธิ์ผู้ประกอบการ?" : "ไม่อนุมัติคำขอ?",
      text: wasApproved
        ? "ผู้ใช้จะกลับเป็นสมาชิกทั่วไป สถานที่และเมนูที่เคยลงจะยังอยู่"
        : undefined,
      input: "text",
      inputPlaceholder: "เหตุผล (ไม่บังคับ)",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: wasApproved ? "ถอนสิทธิ์" : "ไม่อนุมัติ",
      cancelButtonText: "ยกเลิก",
    });
    if (r.isConfirmed)
      await reject({
        id: a.operatorApplicationId,
        reason: r.value || undefined,
      }).unwrap();
  };

  return (
    <>
      <PageHeader
        title="คำขอผู้ประกอบการ"
        description="ตรวจสอบและอนุมัติผู้ที่ต้องการลงสถานที่และเมนูอาหารเอง"
      />
      <PageBody>
        <Segmented<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "Pending", label: "รออนุมัติ" },
            { value: "Approved", label: "อนุมัติแล้ว" },
            { value: "Rejected", label: "ไม่อนุมัติ" },
            { value: "All", label: "ทั้งหมด" },
          ]}
        />

        {isLoading ? (
          <div className="text-base text-slate-500">กำลังโหลด…</div>
        ) : isError ? (
          <div className="text-base text-rose-700">โหลดคำขอไม่สำเร็จ</div>
        ) : items.length === 0 ? (
          <EmptyState text="ไม่มีคำขอในหมวดนี้" />
        ) : (
          <ul className="grid gap-4 @container">
            {items.map((a) => (
              <li
                key={a.operatorApplicationId}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-semibold text-slate-900">
                        {a.businessName}
                      </h2>
                      <span
                        className={`rounded-full border px-3 py-0.5 text-sm font-medium ${STATUS_STYLE[a.status]}`}
                      >
                        {STATUS_LABEL[a.status]}
                      </span>
                    </div>
                    <p className="text-base text-slate-600">
                      ผู้สมัคร: {a.userName ?? "-"} · {a.email ?? "-"}
                      {a.contactPhone ? ` · โทร ${a.contactPhone}` : ""}
                    </p>
                    {a.description && (
                      <p className="text-base text-slate-700">{a.description}</p>
                    )}
                    <p className="text-sm text-slate-500">
                      ส่งคำขอ {fmt(a.createdAt)}
                      {a.reviewedAt ? ` · ตรวจแล้ว ${fmt(a.reviewedAt)}` : ""}
                      {a.rejectReason ? ` · เหตุผล: ${a.rejectReason}` : ""}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-3">
                    {a.status !== "Approved" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onApprove(a)}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-base font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                      >
                        <Check className="h-5 w-5" />
                        อนุมัติ
                      </button>
                    )}
                    {a.status !== "Rejected" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onReject(a)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
                      >
                        <X className="h-5 w-5" />
                        {a.status === "Approved" ? "ถอนสิทธิ์" : "ไม่อนุมัติ"}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PageBody>
    </>
  );
}
