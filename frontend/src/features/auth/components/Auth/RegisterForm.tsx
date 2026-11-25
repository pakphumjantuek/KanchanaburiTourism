import React, { useState } from "react";
import { useRegisterMutation } from "../../../../features/auth/authApi";
import { useNavigate } from "react-router-dom";

export const RegisterForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isOperator, setIsOperator] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const mismatch = confirmPassword !== "" && confirmPassword !== password;

  const [register, { isLoading, error }] = useRegisterMutation();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return;
    try {
      // ไม่เก็บเบอร์โทรตอนสมัครแล้ว ส่งค่าว่างตามที่ API เดิมรับ
      await register({
        email,
        displayName,
        phoneNumber: "",
        password,
        businessName: isOperator ? businessName.trim() || undefined : undefined,
        businessDescription: isOperator ? businessDescription.trim() || undefined : undefined,
      }).unwrap();
      navigate("/login");
    } catch {}
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

      {/* Left Section - Register Form */}
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
          <a href="/" className="inline-flex items-center gap-2 text-slate-600 text-sm mb-10 hover:text-slate-900 transition-colors duration-300">
            <span>←</span>
            <span>กลับหน้าแรก</span>
          </a>

          {/* Title */}
          <div className="mb-2 animate-fade-in">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              สร้างบัญชีใหม่
            </h1>
            <div className="h-1 w-12 bg-blue-600 rounded-full"></div>
          </div>
          
          <p className="text-slate-600 text-sm mb-10 mt-4">มาร่วมเริ่มต้นไปกับเรากันเถอะ!</p>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Display Name Field */}
            <div className="mb-6">
              <label className="block mb-2 text-slate-700 text-sm font-semibold">
                ชื่อที่แสดง <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="เช่น สมชาย"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all duration-300"
              />
            </div>

            {/* Email Field */}
            <div className="mb-6">
              <label className="block mb-2 text-slate-700 text-sm font-semibold">
                อีเมล <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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

            {/* Confirm Password Field */}
            <div className="mb-6">
              <label className="block mb-2 text-slate-700 text-sm font-semibold">
                ยืนยันรหัสผ่าน <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                placeholder="กรอกรหัสผ่านอีกครั้ง"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                aria-invalid={mismatch}
                className={`w-full px-4 py-3 bg-white border rounded-lg text-slate-900 placeholder-slate-500 text-sm focus:ring-1 focus:outline-none transition-all duration-300 ${
                  mismatch ? "border-red-400 focus:border-red-500 focus:ring-red-500" : "border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                }`}
              />
              {mismatch && <p className="mt-1.5 text-xs text-red-600">รหัสผ่านทั้งสองช่องไม่ตรงกัน</p>}
            </div>

            {/* สมัครเป็นผู้ประกอบการ */}
            <div className="mb-6">
              <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={isOperator}
                  onChange={(e) => setIsOperator(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-blue-600"
                />
                <span>
                  <span className="font-semibold">สมัครเป็นผู้ประกอบการ</span>
                  <span className="block text-slate-500">
                    ลงสถานที่และเมนูอาหารของตัวเองได้ หลังแอดมินอนุมัติ
                  </span>
                </span>
              </label>

              {isOperator && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block mb-2 text-slate-700 text-sm font-semibold">
                      ชื่อกิจการ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น ร้านข้าวแช่ริมน้ำ"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-slate-700 text-sm font-semibold">
                      รายละเอียดกิจการ
                    </label>
                    <textarea
                      rows={3}
                      placeholder="ประเภทกิจการ ที่ตั้งโดยสังเขป"
                      value={businessDescription}
                      onChange={(e) => setBusinessDescription(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all duration-300"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-4 mb-6 bg-red-50 border border-red-300 rounded-lg text-red-700 text-sm">
                <span className="mr-2">⚠️</span>{errorMessage}
              </div>
            )}

            {/* Sign Up Button */}
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
                  กำลังสมัครสมาชิก...
                </div>
              ) : (
                "สมัครสมาชิก"
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <p className="mt-8 text-center text-slate-600 text-sm">
            มีบัญชีอยู่แล้ว?{" "}
            <a href="/login" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
              เข้าสู่ระบบ
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
