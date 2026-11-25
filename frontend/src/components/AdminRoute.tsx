import { Navigate, Outlet } from "react-router-dom";
import { useGetProfileQuery } from "../features/auth/authApi";
import { SD_Roles } from "../Common/SD";

export default function AdminRoute() {
  const { data, isLoading, isError, error } = useGetProfileQuery();



  if (isLoading) return <div className="p-6">Loading...</div>;

  const status = (error as any)?.status;

  // ❌ token หมด / ไม่ผ่านจริง → login
  if (isError && status === 401) {
    return <Navigate to="/login" replace />;
  }

  // ⚠️ backend ดับ / เน็ตหลุด → ไม่เด้ง login
  if (isError && status === "FETCH_ERROR") {
    return (
      <div className="flex min-h-[90vh] items-center justify-center ">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <span className="text-2xl">🚫</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800">
              เซิร์ฟเวอร์ไม่พร้อมใช้งาน
            </h3>
          </div>

          <p className="mb-6 text-gray-600 leading-relaxed">
            ไม่สามารถเชื่อมต่อกับระบบได้ในขณะนี้
            เซิร์ฟเวอร์อาจปิดอยู่หรือเครือข่ายมีปัญหา
            กรุณาลองใหม่อีกครั้งภายหลัง
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 rounded-xl bg-gray-900 px-4 py-2 text-white transition hover:bg-gray-800"
            >
              🔄 รีเฟรช
            </button>

            <a
              href="/"
              className="flex-1 rounded-xl border border-gray-300 px-4 py-2 text-center text-gray-700 transition hover:bg-gray-100"
            >
              ⬅ กลับหน้าแรก
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ❌ ไม่มีข้อมูล user (กันเคส edge)
  if (!data) {
    return <Navigate to="/login" replace />;
  }

  // ❌ ไม่มีสิทธิ์
  if (data.roleName !== SD_Roles.ADMIN && data.roleName !== SD_Roles.OPERATOR) {
    return <Navigate to="/accessDenied" replace />;
  }

  // ✅ ผ่าน
  return <Outlet />;
}
