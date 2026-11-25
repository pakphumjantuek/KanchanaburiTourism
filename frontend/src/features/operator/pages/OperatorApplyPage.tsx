import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useGetMyOperatorApplicationQuery,
  useApplyOperatorMutation,
} from "../operatorApi";
import { useGetProfileQuery, useLogoutMutation } from "../../auth/authApi";
import { SD_Roles } from "../../../Common/SD";

const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20";

export default function OperatorApplyPage() {
  const navigate = useNavigate();
  const { data: profile } = useGetProfileQuery();
  const { data: app, isLoading } = useGetMyOperatorApplicationQuery();
  const [apply, { isLoading: sending, error }] = useApplyOperatorMutation();
  const [logout] = useLogoutMutation();

  const [businessName, setBusinessName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [description, setDescription] = useState("");

  const isOperator = profile?.roleName === SD_Roles.OPERATOR;
  const errorMessage =
    (error as any)?.message ?? (error as any)?.data?.errorMessages?.[0] ?? "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) return;
    try {
      await apply({
        businessName: businessName.trim(),
        contactPhone: contactPhone.trim() || undefined,
        description: description.trim() || undefined,
      }).unwrap();
    } catch {}
  };

  const relogin = async () => {
    try {
      await logout().unwrap();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  let body: React.ReactNode;
  if (isLoading) {
    body = <p className="text-lg text-slate-500">กำลังโหลด…</p>;
  } else if (profile?.roleName === SD_Roles.ADMIN) {
    body = <p className="text-lg text-slate-700">บัญชีแอดมินจัดการสถานที่ได้อยู่แล้ว</p>;
  } else if (app?.status === "Approved") {
    body = (
      <div className="space-y-4">
        <p className="text-lg text-slate-700">
          คำขอของ <b>{app.businessName}</b> ได้รับการอนุมัติแล้ว
        </p>
        {isOperator ? (
          <Link
            to="/admin/place"
            className="inline-flex rounded-xl bg-blue-600 px-6 py-3 text-lg font-medium text-white hover:bg-blue-700"
          >
            ไปจัดการสถานที่ของฉัน
          </Link>
        ) : (
          <>
            <p className="text-base text-slate-600">
              กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่ เพื่อเปิดใช้สิทธิ์ผู้ประกอบการ
            </p>
            <button
              type="button"
              onClick={relogin}
              className="rounded-xl bg-blue-600 px-6 py-3 text-lg font-medium text-white hover:bg-blue-700"
            >
              ออกจากระบบและเข้าใหม่
            </button>
          </>
        )}
      </div>
    );
  } else if (app?.status === "Pending") {
    body = (
      <div className="space-y-2">
        <p className="text-lg text-slate-700">
          ส่งคำขอ <b>{app.businessName}</b> แล้ว กำลังรอแอดมินตรวจสอบ
        </p>
        <p className="text-base text-slate-500">เมื่ออนุมัติแล้วคุณจะลงสถานที่และเมนูอาหารเองได้ทันที</p>
      </div>
    );
  } else {
    body = (
      <form onSubmit={submit} className="space-y-5">
        {app?.status === "Rejected" && (
          <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-base text-slate-700">
            คำขอครั้งก่อนไม่ได้รับการอนุมัติ
            {app.rejectReason ? `: ${app.rejectReason}` : ""} — แก้ข้อมูลแล้วส่งใหม่ได้
          </p>
        )}
        <label className="block space-y-2">
          <span className="text-lg font-medium text-slate-800">ชื่อกิจการ</span>
          <input
            className={inputCls}
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="เช่น ร้านข้าวแช่ริมน้ำ"
            required
          />
        </label>
        <label className="block space-y-2">
          <span className="text-lg font-medium text-slate-800">เบอร์ติดต่อ</span>
          <input
            className={inputCls}
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="ไม่บังคับ"
            inputMode="tel"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-lg font-medium text-slate-800">รายละเอียดกิจการ</span>
          <textarea
            className={inputCls}
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="ประเภทกิจการ ที่ตั้งโดยสังเขป"
          />
        </label>
        {errorMessage && <p className="text-base text-rose-700">{errorMessage}</p>}
        <button
          type="submit"
          disabled={sending}
          className="rounded-xl bg-blue-600 px-6 py-3 text-lg font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {sending ? "กำลังส่ง…" : "ส่งคำขอ"}
        </button>
      </form>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-semibold text-slate-900">สมัครเป็นผู้ประกอบการ</h1>
      <p className="mb-8 text-lg text-slate-600">
        เจ้าของร้านอาหาร ที่พัก หรือสถานที่ท่องเที่ยว ลงข้อมูลสถานที่และเมนูอาหารของตัวเองได้
        หลังแอดมินอนุมัติ
      </p>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">{body}</div>
    </div>
  );
}
