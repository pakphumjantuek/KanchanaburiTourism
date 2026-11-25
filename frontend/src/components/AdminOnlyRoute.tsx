import { Navigate, Outlet } from "react-router-dom";
import { useGetProfileQuery } from "../features/auth/authApi";
import { SD_Roles } from "../Common/SD";

// หน้าที่ผู้ประกอบการเข้าไม่ได้ (เฉพาะแอดมิน) — ใช้ซ้อนใต้ AdminRoute
export default function AdminOnlyRoute() {
  const { data, isLoading } = useGetProfileQuery();

  if (isLoading) return <div className="p-6 text-base text-slate-500">กำลังโหลด…</div>;
  if (data?.roleName !== SD_Roles.ADMIN) {
    return <Navigate to="/admin/place" replace />;
  }
  return <Outlet />;
}
