import React, { useState } from "react";
import { useLoginMutation } from "../../../..//features/auth/authApi";
import { useNavigate } from "react-router-dom";
import { SD_Roles } from "../../../../Common/SD";
import { interestApi } from "../../../interests/interestApi";
import { INTEREST_KEYS } from "../../../interests/InterestsWelcomeModal";

export const LoginForm: React.FC = () => {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [login, { isLoading, error }] = useLoginMutation();
  const navigate = useNavigate();
  const [getInterests] = interestApi.endpoints.getMyInterests.useLazyQuery();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
     const auth = await login({ emailOrPhone, password }).unwrap();
       const role = auth?.user.roleName;

      if (role === SD_Roles.ADMIN) {
        navigate("/admin/dashboard");
      } else if (role === SD_Roles.OPERATOR) {
        navigate("/admin/place");
      } else {
        // ไปหน้าแรกเสมอ ; ยังไม่เคยเลือกแนวที่ชอบเอง → เปิด modal ถาม
        // (เช็คเฉพาะ key ที่ผู้ใช้เลือกเอง เพราะ backend เติม "cat:..." อัตโนมัติจากการคลิก)
        const interests = await getInterests().unwrap().catch(() => null);
        const asked = interests?.some((i) => INTEREST_KEYS.includes(i.interestKey));
        navigate(interests && !asked ? "/home?welcome=1" : "/home");
      }
    } catch (err) {
    }
  };

  const errorMessage =
    (error as any)?.data?.errorMessages?.[0] ?? (error as any)?.error ?? "";

  return (
    <div className="min-h-screen flex bg-linear-to-br from-white via-slate-50 to-white overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-blue-100/30 rounded-full blur-3xl -top-32 -left-32 opacity-40"></div>
        <div className="absolute w-96 h-96 bg-slate-100/30 rounded-full blur-3xl -bottom-32 -right-32 opacity-40"></div>
      </div>

      {/* Left Section - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 relative z-10">
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fadeIn 0.6s ease-out;
          }
        `}</style>
        
        <div className="w-full max-w-sm">
          {/* Back to dashboard link */}
          <a href="/home" className="inline-flex items-center gap-2 text-slate-600 text-sm mb-10 hover:text-slate-900 transition-colors duration-300">
            <span>←</span>
            <span>กลับหน้าแรก</span>
          </a>

          {/* Title */}
          <div className="mb-2 animate-fade-in">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              ยินดีต้อนรับกลับ
            </h1>
            <div className="h-1 w-12 bg-blue-600 rounded-full"></div>
          </div>
          
          <p className="text-slate-600 text-sm mb-10 mt-4">เข้าสู่ระบบบัญชีของคุณ</p>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="mb-6">
              <label className="block mb-2 text-slate-700 text-sm font-semibold">
                อีเมล <span className="text-red-500">*</span>
              </label>
              <input
                placeholder="you@example.com"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all duration-300"
              />
            </div>

            {/* Password Field */}
            <div className="mb-6">
              <label className="block mb-2 text-slate-700 text-sm font-semibold">
                รหัสผ่าน <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                placeholder="กรอกรหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all duration-300"
              />
            </div>

            {/* Remember & Forgot Password */}
            <div className="flex justify-between items-center mb-8 text-sm">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900 transition-colors">
                <input
                  type="checkbox"
                  checked={keepLoggedIn}
                  onChange={(e) => setKeepLoggedIn(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 bg-white cursor-pointer accent-blue-600"
                />
                <span>จดจำการเข้าสู่ระบบ</span>
              </label>
              <a href="/forgot-password" className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
                ลืมรหัสผ่าน?
              </a>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-4 mb-6 bg-red-50 border border-red-300 rounded-lg text-red-700 text-sm">
                <span className="mr-2">⚠️</span>{errorMessage}
              </div>
            )}

            {/* Current User Info */}
            {/* {user && (
              <div className="p-4 mb-6 bg-blue-50 border border-blue-300 rounded-lg text-blue-700 text-sm">
                <span className="mr-2">👤</span>Signing in as: {user.displayName}
              </div>
            )} */}

            {/* Sign In Button */}
            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full py-3 rounded-lg font-semibold text-white transition-all duration-300 ${
                isLoading 
                  ? "bg-slate-400 cursor-not-allowed opacity-70" 
                  : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  กำลังเข้าสู่ระบบ...
                </div>
              ) : (
                "เข้าสู่ระบบ"
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="mt-8 text-center text-slate-600 text-sm">
            ยังไม่มีบัญชี?{" "}
            <a href="/register" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
              สมัครสมาชิก
            </a>
          </p>
        </div>
      </div>

      {/* Right Section - Branding */}
      <div 
        className="hidden lg:flex flex-1 bg-cover bg-center items-center justify-center text-white text-center p-12 relative overflow-hidden"
        style={{ backgroundImage: `url('https://www.homephutoeyriverkwai.com/wp-content/uploads/2024/08/7.1.webp')` }}
      >
        {/* Overlay with subtle gradient */}
        <div className="absolute inset-0 bg-black/50"></div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-bold mb-4">
            กาญจนบุรี เที่ยวได้ไม่รู้จบ
          </h2>
          <p className="text-gray-100 text-base leading-relaxed">
            การท่องเที่ยวเชิงวัฒนธรรมและ อาหารพื้นถิ่น จังหวัดกาญจนบุรี
          </p>
        </div>
      </div>
    </div>
  );
};
