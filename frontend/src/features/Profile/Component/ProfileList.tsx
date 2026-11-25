import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Camera,
  ChevronRight,
  Compass,
  Edit2,
  Heart,
  Loader2,
  Mail,
  Map as MapIcon,
  Phone,
  Plus,
  Save,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useGetProfileQuery, useUpdateProfileMutation } from "../../../features/auth/authApi";
import { usePlacesByIds } from "../../trip/hooks/usePlacesByIds";
import { PlaceGrid } from "../../places/Components/place-list/PlaceGrid";
import type { PlaceDto } from "../../places/placeTypes";

// รายการโปรดเก็บใน localStorage โดยหน้าแรก (HomePage) — อ่านที่นี่เพื่อแสดงผล
const FAVORITES_KEY = "kanchanaburi_favorites";
const readFavorites = (): number[] => {
  try {
    const v = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "number") : [];
  } catch {
    return [];
  }
};

const avatarSrc = (url?: string | null) =>
  !url ? "" : url.startsWith("blob:") || url.startsWith("http") ? url : `${import.meta.env.VITE_API_BASE_URLS ?? ""}${url}`;

const inputCls =
  "w-full h-12 px-4 bg-white border border-[#e2bfb5]/70 rounded-2xl text-[#141c23] placeholder:text-[#8e7068]/70 focus:outline-none focus:border-[#d84a1b] focus:ring-4 focus:ring-[#d84a1b]/10 transition";

export const ProfilePage: React.FC = () => {
  const { userid } = useParams<{ userid: string }>();
  const id = userid ? Number(userid) : undefined;

  const { data: profile, isLoading, error } = useGetProfileQuery(id && !Number.isNaN(id) ? { userid: id } : undefined);
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();

  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "favorites">("info");
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [saveError, setSaveError] = useState("");

  const [favoriteIds] = useState<number[]>(readFavorites);
  const { map: favMap, isLoading: favLoading } = usePlacesByIds(favoriteIds);
  const favorites = useMemo(
    () => favoriteIds.map((pid) => favMap.get(pid)).filter(Boolean) as PlaceDto[],
    [favoriteIds, favMap],
  );

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const resetForm = () => {
    if (!profile) return;
    setDisplayName(profile.displayName);
    setPhoneNumber(profile.phoneNumber ?? "");
    setAvatarFile(null);
    setAvatarPreview(profile.avatarUrl ?? "");
    setSaveError("");
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(resetForm, [profile]);

  const msgError = (error as any)?.data?.errorMessages?.[0] ?? (error as any)?.error ?? "โหลดโปรไฟล์ไม่สำเร็จ";

  const initials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const onPickFile = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("displayName", displayName);
    formData.append("phoneNumber", phoneNumber ?? "");
    if (avatarFile) formData.append("avatar", avatarFile);

    try {
      await updateProfile(formData).unwrap();
      setIsEditMode(false);
      setAvatarFile(null);
      setSaveError("");
    } catch (err: any) {
      console.error("Failed to update profile", err);
      setSaveError(err?.data?.errorMessages?.[0] ?? "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง");
    }
  };

  if (isLoading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbf8f5]">
        <Loader2 className="w-8 h-8 text-[#d84a1b] animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbf8f5] p-4">
        <div className="bg-white border border-[#e2bfb5]/50 rounded-3xl p-8 max-w-md w-full text-center">
          <User className="w-12 h-12 text-[#e2bfb5] mx-auto mb-3" />
          <p className="text-lg font-black text-[#141c23]">{error ? "เกิดข้อผิดพลาด" : "ไม่พบข้อมูลผู้ใช้"}</p>
          {error && <p className="text-[#8e7068] mt-1">{msgError}</p>}
          {error && (
            <button
              onClick={() => window.location.reload()}
              className="mt-5 px-5 py-2.5 rounded-full border border-[#e2bfb5] font-bold hover:border-[#d84a1b] hover:text-[#d84a1b]"
            >
              ลองใหม่อีกครั้ง
            </button>
          )}
        </div>
      </div>
    );
  }

  const shownAvatar = avatarSrc(avatarPreview);
  const quickLinks = [
    { to: "/trip", icon: MapIcon, title: "ทริปของฉัน", desc: "ดูและจัดการทริปทั้งหมด" },
    { to: "/trip/create", icon: Plus, title: "สร้างทริปใหม่", desc: "เริ่มวางแผนเที่ยวครั้งต่อไป" },
    { to: "/profile/interests", icon: Sparkles, title: "ความสนใจของฉัน", desc: "ปรับให้ระบบแนะนำตรงใจขึ้น" },
  ];

  return (
    <div className="min-h-screen bg-[#fbf8f5] text-[#141c23] text-left">
      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 pt-5 sm:pt-8 pb-12 space-y-6">
        {/* HERO */}
        <header className="relative rounded-3xl sm:rounded-[28px] overflow-hidden bg-gradient-to-br from-[#1c242b] via-[#293139] to-[#00210e] text-white p-5 sm:p-8 shadow-xl">
          <div className="absolute -top-20 -right-16 w-72 h-72 rounded-full bg-[#d84a1b]/25 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="relative shrink-0 self-center sm:self-auto">
              {shownAvatar ? (
                <img
                  src={shownAvatar}
                  alt={displayName}
                  className="w-28 h-28 sm:w-32 sm:h-32 object-cover rounded-full border-4 border-white/90 shadow-lg bg-white"
                />
              ) : (
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white/90 shadow-lg flex items-center justify-center bg-[#d84a1b] text-white font-black text-4xl">
                  {initials(displayName) || <User className="w-10 h-10" />}
                </div>
              )}
              {isEditMode && (
                <label
                  className="absolute bottom-1 right-1 w-10 h-10 bg-white text-[#141c23] rounded-full cursor-pointer hover:bg-[#ffdbd1] shadow-md flex items-center justify-center"
                  aria-label="เปลี่ยนรูปโปรไฟล์"
                >
                  <Camera size={18} />
                  <input type="file" accept="image/*" onChange={(e) => onPickFile(e.target.files?.[0])} className="hidden" />
                </label>
              )}
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left">
              <span className="inline-block px-3 py-0.5 rounded-full text-xs font-bold bg-white/15 border border-white/20">
                {profile.roleName}
              </span>
              <h1 className="mt-2 text-2xl sm:text-4xl font-black leading-tight break-words">{displayName}</h1>
              <p className="mt-1 text-sm text-white/70 flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="w-4 h-4" /> {profile.email}
              </p>
            </div>

            {!isEditMode && (
              <button
                type="button"
                onClick={() => {
                  setIsEditMode(true);
                  setActiveTab("info");
                }}
                className="self-center sm:self-auto h-11 px-5 rounded-full bg-white text-[#141c23] font-bold text-sm flex items-center gap-2 hover:bg-[#ffdbd1]"
              >
                <Edit2 size={16} /> แก้ไขโปรไฟล์
              </button>
            )}
          </div>
        </header>

        {/* QUICK LINKS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickLinks.map(({ to, icon: Icon, title, desc }) => (
            <Link
              key={to}
              to={to}
              className="group flex items-center gap-3 p-4 bg-white rounded-2xl border border-[#e2bfb5]/50 shadow-sm hover:shadow-md hover:border-[#d84a1b]/40 transition-all"
            >
              <span className="w-11 h-11 rounded-xl bg-[#ffdbd1]/60 text-[#d84a1b] flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-bold group-hover:text-[#d84a1b]">{title}</span>
                <span className="block text-xs text-[#8e7068] truncate">{desc}</span>
              </span>
              <ChevronRight className="w-4 h-4 text-[#e2bfb5] group-hover:text-[#d84a1b]" />
            </Link>
          ))}
        </div>

        {/* TABS */}
        <div role="tablist" className="flex gap-2">
          {[
            { key: "info" as const, label: "ข้อมูลส่วนตัว", icon: User },
            { key: "favorites" as const, label: `ที่บันทึกไว้ (${favoriteIds.length})`, icon: Heart },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={activeTab === key}
              onClick={() => setActiveTab(key)}
              className={`h-11 px-5 rounded-full text-sm font-bold flex items-center gap-2 transition-colors ${
                activeTab === key ? "bg-[#141c23] text-white" : "bg-white border border-[#e2bfb5]/60 text-[#5a413a] hover:border-[#d84a1b]"
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {activeTab === "info" ? (
          <section className="bg-white rounded-3xl border border-[#e2bfb5]/40 p-5 sm:p-8 shadow-sm max-w-3xl">
            {isEditMode ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="block text-sm font-semibold text-[#5a413a] mb-2">ชื่อที่แสดง</span>
                    <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputCls} required />
                  </label>
                  <label className="block">
                    <span className="block text-sm font-semibold text-[#5a413a] mb-2">เบอร์โทรศัพท์</span>
                    <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className={inputCls} placeholder="0xx-xxx-xxxx" />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="block text-sm font-semibold text-[#5a413a] mb-2">อีเมล</span>
                    <input type="email" value={profile.email} disabled className={`${inputCls} bg-[#fbf8f5] text-[#8e7068] cursor-not-allowed`} />
                    <span className="block text-xs text-[#8e7068] mt-1">อีเมลใช้เข้าสู่ระบบ จึงแก้ไขไม่ได้</span>
                  </label>
                </div>

                {saveError && <p role="alert" className="text-sm text-[#b3261e] bg-[#fdecea] rounded-xl px-4 py-2.5">{saveError}</p>}

                <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setIsEditMode(false);
                    }}
                    className="h-12 px-6 rounded-full border border-[#e2bfb5] font-bold flex items-center justify-center gap-2 hover:border-[#d84a1b]"
                  >
                    <X size={16} /> ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="h-12 px-6 rounded-full bg-[#d84a1b] hover:bg-[#b83c13] text-white font-bold flex items-center justify-center gap-2 shadow-md shadow-[#d84a1b]/25 disabled:opacity-60"
                  >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    บันทึกการเปลี่ยนแปลง
                  </button>
                </div>
              </form>
            ) : (
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { icon: User, label: "ชื่อที่แสดง", value: displayName },
                  { icon: Mail, label: "อีเมล", value: profile.email },
                  { icon: Phone, label: "เบอร์โทรศัพท์", value: phoneNumber || "ยังไม่ได้ระบุ" },
                  { icon: Compass, label: "ประเภทสมาชิก", value: profile.roleName },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 p-4 rounded-2xl bg-[#fbf8f5]">
                    <Icon className="w-5 h-5 text-[#d84a1b] shrink-0" />
                    <div className="min-w-0">
                      <dt className="text-xs text-[#8e7068]">{label}</dt>
                      <dd className="font-semibold truncate">{value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            )}
          </section>
        ) : favoriteIds.length === 0 ? (
          <section className="rounded-3xl border-2 border-dashed border-[#e2bfb5] bg-white p-10 text-center">
            <span className="mx-auto w-16 h-16 rounded-2xl bg-[#ffdbd1]/60 text-[#d84a1b] flex items-center justify-center mb-4">
              <Heart className="w-8 h-8" />
            </span>
            <p className="text-lg font-black">ยังไม่มีสถานที่ที่บันทึกไว้</p>
            <p className="text-sm text-[#8e7068] mt-1">กดรูปหัวใจบนการ์ดสถานที่ในหน้าแรกเพื่อบันทึกไว้ดูทีหลัง</p>
            <Link to="/places" className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#d84a1b] hover:bg-[#b83c13] text-white font-bold">
              <MapIcon size={18} /> สำรวจสถานที่
            </Link>
          </section>
        ) : favLoading && favorites.length === 0 ? (
          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {favoriteIds.slice(0, 4).map((pid) => (
              <div key={pid} className="h-80 rounded-2xl bg-[#e7e1db] animate-pulse" />
            ))}
          </div>
        ) : (
          <PlaceGrid places={favorites} onClickLog={async () => {}} />
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
