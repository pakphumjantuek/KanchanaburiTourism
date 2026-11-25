import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import { useLogoutMutation } from "../../features/auth/authApi";
import {
  LogOut,
  User,
  UserPlus,
  LogIn,
  MapPin,
  Menu,
  X,
  Compass,
  UtensilsCrossed,
  Sparkles,
  CalendarClock,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const user = useAppSelector((s) => s.auth.user);
  const [logout, { isLoading }] = useLogoutMutation();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } finally {
      navigate("/login");
    }
  };

  const isHomeActive = location.pathname === "/home";
  const isPlacesActive =
    location.pathname.startsWith("/places") ||
    location.pathname.startsWith("/placeDetails");
  const isLocalDishActive = location.pathname.startsWith("/localDishs") || location.pathname.startsWith("/localDishDetails");
  const isLocalBusinessActive = location.pathname.startsWith("/localBusines");
  const isEventsActive = location.pathname.startsWith("/events");
  const isTripActive = location.pathname.startsWith("/trip");
  const isProfileActive = location.pathname.startsWith("/profile");

  const navLinkClass = (active: boolean) =>
    `relative px-3.5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
      active
        ? "bg-[#ffdbd1] text-[#d84a1b] shadow-xs"
        : "text-[#5a413a] hover:text-[#141c23] hover:bg-[#f6f9ff]"
    }`;

  const mobileNavLinkClass = (active: boolean) =>
    `px-4 py-2.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-between ${
      active
        ? "bg-[#ffdbd1] text-[#d84a1b]"
        : "text-[#5a413a] hover:bg-[#f6f9ff] hover:text-[#141c23]"
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-[#e2bfb5]/60 shadow-xs transition-all">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <Link to="/home" className="flex items-center gap-2.5 sm:gap-3 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-[#d84a1b] to-[#b83c13] flex items-center justify-center text-white shadow-md shadow-[#d84a1b]/25 group-hover:scale-105 transition-transform duration-300">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-[#141c23] text-base sm:text-lg tracking-tight group-hover:text-[#d84a1b] transition-colors">
                  Kanchanaburi
                </span>
                <span className="text-[12px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#ffdbd1] text-[#d84a1b]">
                  Travel
                </span>
              </div>
              <span className="text-[13px] text-[#8e7068] font-medium leading-none -mt-0.5">
                เที่ยวกาญจนบุรี & อาหารพื้นบ้าน
              </span>
            </div>
          </Link>

          {/* Primary Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1.5 xl:gap-2">
            <Link to="/home" className={navLinkClass(isHomeActive)}>
              <span>หน้าแรก</span>
            </Link>

            <Link to="/places" className={navLinkClass(isPlacesActive)}>
              <Compass className="w-4 h-4 opacity-75" />
              <span>สถานที่ท่องเที่ยว</span>
            </Link>

            <Link to="/events" className={navLinkClass(isEventsActive)}>
              <CalendarClock className="w-4 h-4 opacity-75" />
              <span>อีเวนต์</span>
            </Link>

            <Link to="/localBusines" className={navLinkClass(isLocalBusinessActive)}>
              <UtensilsCrossed className="w-4 h-4 opacity-75" />
              <span>ร้านอาหารท้องถิ่น</span>
            </Link>

            <Link to="/localDishs" className={navLinkClass(isLocalDishActive)}>
              <Sparkles className="w-4 h-4 opacity-75" />
              <span>อาหารท้องถิ่น</span>
            </Link>

            {user && (
              <Link to="/trip" className={navLinkClass(isTripActive)}>
                <span>ทริปของฉัน</span>
              </Link>
            )}

            {user && (
              <Link to="/profile" className={navLinkClass(isProfileActive)}>
                <span>โปรไฟล์</span>
              </Link>
            )}
          </div>

          {/* Right Side: Auth / User Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#f6f9ff] hover:bg-[#e7eff8] border border-[#e2bfb5]/50 transition-colors cursor-pointer text-left shadow-xs"
                >
                  <div className="w-7 h-7 rounded-full bg-[#d84a1b] text-white flex items-center justify-center font-bold text-xs">
                    {user.displayName ? user.displayName[0].toUpperCase() : <User size={14} />}
                  </div>
                  <div className="hidden sm:flex flex-col">
                    <span className="text-xs font-bold text-[#141c23] line-clamp-1 leading-tight">
                      {user.displayName}
                    </span>
                    <span className="text-[12px] text-[#8e7068] leading-tight">
                      {user.roleName || "สมาชิก"}
                    </span>
                  </div>
                </Link>

                {user.roleName === "Operator" ? (
                  <Link
                    to="/admin/place"
                    className="hidden sm:inline-flex items-center px-3.5 py-2 rounded-full text-xs font-bold border border-[#e2bfb5] text-[#5a413a] hover:bg-[#fbf8f5] transition-colors"
                  >
                    จัดการร้านของฉัน
                  </Link>
                ) : user.roleName !== "Admin" ? (
                  <Link
                    to="/operator/apply"
                    className="hidden sm:inline-flex items-center px-3.5 py-2 rounded-full text-xs font-bold border border-[#e2bfb5] text-[#5a413a] hover:bg-[#fbf8f5] transition-colors"
                  >
                    สมัครผู้ประกอบการ
                  </Link>
                ) : null}

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoading}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer ${
                    isLoading
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/60"
                  }`}
                  title="ออกจากระบบ"
                >
                  <LogOut size={14} />
                  <span className="hidden sm:inline">
                    {isLoading ? "กำลังออก..." : "ออกจากระบบ"}
                  </span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-bold border border-[#e2bfb5] text-[#5a413a] hover:bg-[#fbf8f5] hover:text-[#141c23] transition-all shadow-xs"
                >
                  <UserPlus size={15} />
                  <span>สมัครสมาชิก</span>
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 bg-[#d84a1b] hover:bg-[#b83c13] text-white px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-extrabold shadow-md shadow-[#d84a1b]/25 transition-all active:scale-95"
                >
                  <LogIn size={15} />
                  <span>เข้าสู่ระบบ</span>
                </Link>
              </>
            )}

            {/* Mobile Menu Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-10 h-10 rounded-2xl bg-[#f6f9ff] border border-[#e2bfb5]/60 flex items-center justify-center text-[#5a413a] hover:text-[#141c23] transition-colors"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu (Full Links) */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-[#f3ede7] animate-fade-in text-left">
            <div className="flex flex-col gap-1.5">
              <Link
                to="/home"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass(isHomeActive)}
              >
                <span>หน้าแรก</span>
                <span className="text-xs text-[#8e7068]">Home</span>
              </Link>
              <Link
                to="/places"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass(isPlacesActive)}
              >
                <span>สถานที่ท่องเที่ยว</span>
                <span className="text-xs text-[#8e7068]">Places</span>
              </Link>
              <Link
                to="/events"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass(isEventsActive)}
              >
                <span>อีเวนต์</span>
                <span className="text-xs text-[#8e7068]">Events</span>
              </Link>
              <Link
                to="/localBusines"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass(isLocalBusinessActive)}
              >
                <span>ร้านอาหารท้องถิ่น</span>
                <span className="text-xs text-[#8e7068]">Restaurants</span>
              </Link>
              <Link
                to="/localDishs"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass(isLocalDishActive)}
              >
                <span>อาหารท้องถิ่น</span>
                <span className="text-xs text-[#8e7068]">Local Food</span>
              </Link>

              {user && (
                <Link
                  to="/trip"
                  onClick={() => setMobileMenuOpen(false)}
                  className={mobileNavLinkClass(isTripActive)}
                >
                  <span>ทริปของฉัน</span>
                  <span className="text-xs text-[#8e7068]">My Trips</span>
                </Link>
              )}

              {user && (
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className={mobileNavLinkClass(isProfileActive)}
                >
                  <span>โปรไฟล์ส่วนตัว</span>
                  <span className="text-xs text-[#8e7068]">Profile</span>
                </Link>
              )}

              {!user && (
                <div className="pt-2 flex flex-col gap-2">
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-xl border border-[#e2bfb5] text-xs font-bold text-[#5a413a]"
                  >
                    สมัครสมาชิก
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
