// src/pages/AdminPage.tsx
import React, { useState, useRef, useEffect } from "react";
import { withAdminAuth } from "../HOC";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LayoutDashboard, Users, LogOut, User, MapPin, CookingPot, Tag, BrainCircuit, MapPinHouse, ShieldUser, Utensils, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { useLogoutMutation } from "../features/auth/authApi";

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  to: string;
}

const AdminPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const user = useAppSelector((state: any) => state.auth.user);
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 1024;
      setSidebarOpen(isDesktop);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const isDesktop = window.innerWidth >= 1024;
    if (!isDesktop) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getInitials = (name: string = "A") => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 1);
  };

  const isAdmin = user?.roleName === "Admin";

  const adminMenu: MenuItem[] = [
    {
      label: "แดชบอร์ด",
      icon: <LayoutDashboard size={20} />,
      to: "/admin/dashboard",
    },
     {
      label: "ML Recommendation",
      icon: <BrainCircuit size={20} />,
      to: "/admin/recommend",
    },
    {
      label: "ผู้ใช้งาน",
      icon: <Users size={20} />,
      to: "/admin/userList",
    },
    {
      label: "บทบาท",
      icon: <ShieldUser size={20} />,
      to: "/admin/role",
    },
    {
      label: "สถานที่",
      icon: <MapPinHouse size={20} />,
      to: "/admin/place",
    },
    {
      label: "ร้านค้าผู้ประกอบการ",
      icon: <Utensils size={20} />,
      to: "/admin/localBusiness",
    },
    {
      label: "อาหารท้องถิ่น",
      icon: <CookingPot size={20} />,
      to: "/admin/localDish",
    },
    {
      label: "หมวดหมู่สถานที่",
      icon: <MapPin size={20} />,
      to: "/admin/placeCategory",
    },
    {
      label: "แท็กสถานที่",
      icon: <Tag size={20} />,
      to: "/admin/placeTag",
    },
    {
      label: "คำขอผู้ประกอบการ",
      icon: <UserCheck size={20} />,
      to: "/admin/operators",
    },
  ];

  const operatorMenu: MenuItem[] = [
    {
      label: "สถานที่ของฉัน",
      icon: <MapPinHouse size={20} />,
      to: "/admin/place",
    },
    {
      label: "เมนูอาหารของฉัน",
      icon: <CookingPot size={20} />,
      to: "/admin/localDish",
    },
  ];

  const menuItems = isAdmin ? adminMenu : operatorMenu;

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <aside
        className={`fixed lg:static h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out z-30 ${
          sidebarOpen
            ? "w-64 translate-x-0"
            : "lg:w-20 lg:translate-x-0 -translate-x-full"
        }`}
      >
        {/* Logo Section */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-200">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0"
            style={{	
              background: "linear-gradient(to bottom right, #2563eb, #1e40af)",
            }}
          >
            K
          </div>
          {sidebarOpen && (
            <h1 className="text-lg font-bold text-gray-900">{isAdmin ? "Admin" : "ผู้ประกอบการ"}</h1>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-2">
          {sidebarOpen && (
            <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Menu
            </p>
          )}
          <ul className="space-y-2">
            {menuItems.map((item, index) => (
              <li key={index}>
                <Link
                  to={item.to}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 justify-center lg:justify-start ${
                    isActive(item.to)
                      ? "bg-blue-100 text-blue-600 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {sidebarOpen && <span className="text-sm">{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 text-gray-700 shrink-0"
              title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <input
              type="text"
              placeholder="Search..."
              className="hidden md:block px-3 py-2 text-sm rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all flex-1 max-w-xs"
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="hidden sm:block text-right">
              <span className="text-xs sm:text-sm text-gray-600 block truncate max-w-xs">
                สวัสดี, {user?.displayName}
              </span>
            </div>

            {/* User Profile Dropdown  */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden text-white font-semibold cursor-pointer hover:shadow-md transition-shadow active:scale-95 shrink-0"
                style={{
                  background: "linear-gradient(to right, #2563eb, #1e40af)",
                }}
                title="User profile"
              >
                {user?.avatarUrl ? (
                  <img
                    src={`${import.meta.env.VITE_API_BASE_URLS}${user?.avatarUrl
                    }`}
                    alt="avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // fallback ถ้ารูปโหลดไม่ได้
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                    }}
                  />
                ) : (
                  getInitials(user?.displayName)
                )}
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <Link
                    to="/admin/profile"
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User size={16} />
                    <span className="font-medium">โปรไฟล์</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    <LogOut size={16} />
                    <span className="font-medium">
                      {isLoggingOut ? "กำลังออก..." : "ออกจากระบบ"}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default withAdminAuth(AdminPage);
