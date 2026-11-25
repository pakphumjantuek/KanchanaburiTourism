import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { InterestsWelcomeModal } from "../../interests/InterestsWelcomeModal";
import { useGetHomeQuery } from "../homeApi";
import { useGetAllLocalDishQuery } from "../../localDish/LocalDishApi";
import type { FoodRecommendDto, PlaceRecommendDto } from "../homeTypes";
import type { LocalDishType } from "../../localDish/LocalDishType";

import {
  Search,
  Star,
  MapPin,
  ArrowRight,
  Sparkles,
  Compass,
  Heart,
  Award,
  ChevronRight,
  UtensilsCrossed,
  X,
} from "lucide-react";

function resolveImageUrl(rawUrl?: string | null): string {
  if (!rawUrl) return "";
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) return rawUrl;
  const baseUrl = import.meta.env.VITE_API_BASE_URLS || "";
  return `${baseUrl}${rawUrl}`;
}

const REGION_FOOD_PILLS = [
  { id: "all", label: "ทั้งหมด 🍲" },
  { id: "แกงป่า", label: "แกงป่าเมืองกาญจน์ 🌶️" },
  { id: "ปลาคัง", label: "ปลาแม่น้ำ & เขื่อน 🐟" },
  { id: "ผักหวาน", label: "ผักหวาน & พืชป่า 🌿" },
  { id: "สังขละบุรี", label: "อาหารมอญสังขละบุรี 👑" },
  { id: "แพริมน้ำ", label: "ร้านแพริมน้ำแคว 🛶" },
];

function PlaceItemCard({
  place,
  onClick,
  isFavorite,
  onToggleFavorite,
}: {
  place: PlaceRecommendDto;
  onClick: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const imageUrl = resolveImageUrl(place.coverImageUrl);

  const hasRating = !!place.averageRating && place.averageRating > 0;

  return (
    <article
      onClick={onClick}
      className="flex flex-col bg-white rounded-2xl shadow-md shadow-[#141c23]/5 border border-[#e2bfb5]/50 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer text-left"
    >
      {/* Balanced Image Height */}
      <div className="relative h-48 sm:h-52 lg:h-56 w-full overflow-hidden bg-slate-100">
        {imageUrl && !imgFailed ? (
          <img
            src={imageUrl}
            alt={place.name}
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#ffdbd1]/30 to-[#f6f9ff] flex flex-col items-center justify-center text-[#8e7068]">
            <UtensilsCrossed className="w-9 h-9 opacity-40 text-[#d84a1b]" />
            <span className="text-xs mt-1.5 text-[#8e7068] font-medium">กาญจนบุรี</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-75 transition-opacity" />

        {place.categoryName && (
          <span className="absolute top-3 left-3 px-2.5 py-0.5 bg-white/95 backdrop-blur-md rounded-lg text-xs text-[#d84a1b] font-bold shadow-xs">
            {place.categoryName}
          </span>
        )}

        <button
          type="button"
          aria-label={isFavorite ? "นำออกจากรายการโปรด" : "เพิ่มในรายการโปรด"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white backdrop-blur-md flex items-center justify-center text-[#141c23] hover:text-[#d84a1b] shadow-xs transition-all active:scale-90"
        >
          <Heart
            className={`w-4 h-4 ${
              isFavorite ? "fill-rose-500 text-rose-500" : "text-[#5a413a]"
            }`}
          />
        </button>

        <div className="absolute bottom-2.5 left-3 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-md text-xs font-bold text-[#141c23] shadow-xs">
          {hasRating ? (
            <>
              <Star className="w-3.5 h-3.5 fill-[#e88d14] text-[#e88d14]" />
              <span>{place.averageRating!.toFixed(1)}</span>
            </>
          ) : (
            <span className="text-[#8e7068] font-semibold">ยังไม่มีรีวิว</span>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3">
        <div>
          <div className="flex items-center justify-between text-xs text-[#8e7068] mb-1">
            <span className="flex items-center gap-1 line-clamp-1">
              <MapPin className="w-3.5 h-3.5 text-[#d84a1b] shrink-0" />
              <span>{place.address || "กาญจนบุรี"}</span>
            </span>
          </div>

          <h3 className="font-bold text-[#141c23] text-base group-hover:text-[#d84a1b] transition-colors line-clamp-1">
            {place.name}
          </h3>
          {place.description ? (
            <p className="text-xs text-[#5a413a] mt-1 line-clamp-2 leading-relaxed font-light">
              {place.description}
            </p>
          ) : (
            <p className="text-xs text-[#8e7068] mt-1 line-clamp-2 italic">
              สถานที่แนะนำยอดนิยมแห่งจังหวัดกาญจนบุรี
            </p>
          )}
        </div>

        <div className="pt-2.5 flex items-center justify-between border-t border-[#f3ede7]">
          {place.tags && place.tags.length > 0 ? (
            <span className="text-[13px] font-semibold text-[#16693c] bg-[#16693c]/10 px-2 py-0.5 rounded-md">
              #{place.tags[0]}
            </span>
          ) : (
            <span className="text-[13px] text-[#8e7068]">ยอดนิยม</span>
          )}

          <span className="px-3.5 py-1.5 rounded-full bg-[#d84a1b] text-white text-xs font-semibold group-hover:bg-[#b83c13] transition-colors flex items-center gap-1 shadow-xs">
            <span>ดูข้อมูล</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </article>
  );
}

function LocalDishCard({
  dish,
  onClick,
}: {
  dish: LocalDishType;
  onClick: () => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const cover = dish.images?.find((img) => img.isCover) ?? dish.images?.[0];
  const imageUrl = resolveImageUrl(cover?.imageUrl);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-3.5 shadow-md shadow-[#141c23]/5 border border-[#e2bfb5]/50 flex items-center gap-3.5 hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer text-left group"
    >
      <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-xl overflow-hidden shrink-0 bg-slate-100 relative shadow-inner">
        {imageUrl && !imgFailed ? (
          <img
            src={imageUrl}
            alt={dish.nameTH}
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-[#ffdbd1]/30 flex items-center justify-center text-[#d84a1b]">
            <UtensilsCrossed className="w-7 h-7 opacity-40" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-[12px] font-bold text-[#d84a1b] bg-[#ffdbd1]/60 px-2 py-0.5 rounded-full">
            {dish.origin || "เมืองกาญจน์"}
          </span>
          {dish.spicyLevel > 0 && (
            <span className="text-[12px] text-[#e88d14] font-semibold">
              ระดับเผ็ด: {"🌶️".repeat(Math.min(dish.spicyLevel, 4))}
            </span>
          )}
        </div>
        <h4 className="text-sm sm:text-base font-bold text-[#141c23] group-hover:text-[#d84a1b] truncate transition-colors">
          {dish.nameTH}
        </h4>
        {dish.nameEN && (
          <p className="text-[13px] text-[#8e7068] truncate mt-0.5 font-light">
            {dish.nameEN}
          </p>
        )}
      </div>

      <span className="w-8 h-8 rounded-full bg-[#f6f9ff] group-hover:bg-[#d84a1b] group-hover:text-white text-[#8e7068] transition-colors flex items-center justify-center shrink-0 shadow-xs">
        <ChevronRight className="w-4 h-4" />
      </span>
    </div>
  );
}

function TrendingFoodCard({
  food,
  onClick,
}: {
  food: FoodRecommendDto;
  onClick: () => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const imageUrl = resolveImageUrl(food.coverImageUrl);

  return (
    <button
      onClick={onClick}
      className="group text-left bg-white rounded-2xl overflow-hidden border border-[#e2bfb5]/50 shadow-md shadow-[#141c23]/5 hover:shadow-xl hover:-translate-y-0.5 transition-all"
    >
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        {imageUrl && !imgFailed ? (
          <img
            src={imageUrl}
            alt={food.nameTH}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-slate-300">
            <UtensilsCrossed className="w-10 h-10 opacity-30" />
          </div>
        )}
      </div>
      <div className="p-3.5">
        <p className="font-bold text-[#141c23] truncate" title={food.nameTH}>
          {food.nameTH}
        </p>
      </div>
    </button>
  );
}

export default function HomePage() {
  const navigate = useNavigate();

  // 1. Fetch real Home sections from backend API
  const [params, setParams] = useSearchParams();
  const closeWelcome = () => setParams({}, { replace: true });

  const { data: homeData, isLoading: isHomeLoading, refetch: refetchHome } = useGetHomeQuery({
    topN: 16,
  });

  // 2. Fetch real Local Dishes from backend API
  const { data: localDishesData } = useGetAllLocalDishQuery({
    page: 1,
    pageSize: 6,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [activePill, setActivePill] = useState("all");
  const [favoriteIds, setFavoriteIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem("kanchanaburi_favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = (placeId: number) => {
    setFavoriteIds((prev) => {
      const next = prev.includes(placeId)
        ? prev.filter((id) => id !== placeId)
        : [...prev, placeId];
      try {
        localStorage.setItem("kanchanaburi_favorites", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      navigate(`/places?search=${encodeURIComponent(q)}`);
    } else {
      navigate("/places");
    }
  };

  const handlePillClick = (pillId: string) => {
    setActivePill(pillId);
    if (pillId === "all") {
      navigate("/places");
    } else {
      navigate(`/places?search=${encodeURIComponent(pillId)}`);
    }
  };

  // Extract Real Sections
  const sections = homeData?.sections ?? [];
  const popularForYou =
    sections.find((s) => s.key === "popular_for_you") ??
    (sections.length > 0 ? sections[0] : null);

  const popularNow =
    sections.find((s) => s.key === "popular_now") ??
    (sections.length > 1 ? sections[1] : null);

  const hiddenFood = sections.find((s) => s.key === "hidden_food");

  // เมนูยอดนิยมช่วงนี้ (ผลจากโมเดลความนิยมอาหารของ New) — items เป็นเมนูอาหาร ไม่ใช่สถานที่
  const trendingFood = sections.find((s) => s.key === "trending_food");
  const trendingFoodItems = (trendingFood?.items ?? []) as unknown as FoodRecommendDto[];

  // Real Spotlight Place
  const spotlightPlace: PlaceRecommendDto | null =
    popularForYou?.items?.[0] ?? popularNow?.items?.[0] ?? null;

  // Real items arrays
  const popularForYouItems = popularForYou?.items ?? [];
  const popularNowItems = popularNow?.items ?? [];
  const hiddenFoodItems = hiddenFood?.items ?? [];
  const localDishes = localDishesData?.items ?? [];

  // Extra dynamic sections if any
  const extraSections = sections.filter(
    (s) =>
      s.key !== "popular_for_you" &&
      s.key !== "popular_now" &&
      s.key !== "hidden_food" &&
      s.key !== "trending_food"
  );

  return (
    <div className="min-h-screen w-full bg-[#fbf8f5] text-[#141c23] font-sans antialiased selection:bg-[#d84a1b] selection:text-white">
      {params.get("welcome") === "1" && (
        <InterestsWelcomeModal
          onClose={closeWelcome}
          onSaved={() => {
            closeWelcome();
            refetchHome();
          }}
        />
      )}
      {/* 1. TOP AMBIENT GLOW BACKDROP */}
      <div className="relative w-full overflow-hidden">
        <div className="absolute -top-32 -left-20 w-[32rem] h-[32rem] rounded-full bg-[#ffdbd1]/50 blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-20 right-0 w-[36rem] h-[36rem] rounded-full bg-[#ffdcbd]/40 blur-3xl pointer-events-none -z-10" />

        {/* 2. HERO SHOWCASE SECTION (BALANCED EXPANSIVE SCALE) */}
        <section className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 pt-8 sm:pt-10 pb-12 sm:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Column: Headlines, Value Prop, Search & Region Pills */}
            <div className="lg:col-span-7 flex flex-col gap-4 sm:gap-5 text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/90 border border-[#e2bfb5]/70 rounded-full w-fit shadow-xs backdrop-blur-md">
                <span className="flex h-2.5 w-2.5 rounded-full bg-[#d84a1b] animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#d84a1b]">
                  Local Heritage & Flavors
                </span>
              </div>

              {/* Title (Balanced) */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#141c23] tracking-tight leading-[1.15]">
                เปิดประตูสู่รสชาติเมืองกาญจน์ <br />
                <span className="text-[#d84a1b]">
                  ผ่านรสมือและมนต์เสน่ห์แห่งสายน้ำ
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base md:text-lg text-[#5a413a] max-w-2xl font-normal leading-relaxed">
                ค้นพบจานเด็ดระดับตำนานจากแม่ครัวพื้นบ้านและร้านดังริมแม่น้ำแคว
                วัตถุดิบท้องถิ่น แกงป่ารสจัดจ้าน ปลาคังสด
                พร้อมแผนที่เที่ยวและระบบจัดทริปส่งตรงถึงคุณ
              </p>

              {/* Modern Search Bar (Comfortable Size) */}
              <form
                onSubmit={handleSearch}
                className="flex items-center w-full max-w-2xl bg-white rounded-full shadow-lg shadow-[#141c23]/5 border border-[#e2bfb5]/60 p-1.5 transition-all focus-within:ring-2 focus-within:ring-[#d84a1b]"
              >
                <div className="flex items-center pl-4 text-[#8e7068]">
                  <Search className="w-5 h-5 text-[#d84a1b]" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อจานอร่อย, ร้านอาหาร, แหล่งท่องเที่ยว..."
                  className="w-full h-11 px-3 bg-transparent text-[#141c23] placeholder:text-[#8e7068] text-sm sm:text-base outline-none font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    aria-label="ล้างคำค้นหา"
                    onClick={() => setSearchQuery("")}
                    className="p-1 text-[#8e7068] hover:text-[#141c23] mr-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="submit"
                  className="px-6 py-2.5 h-11 bg-[#d84a1b] hover:bg-[#b83c13] text-white rounded-full font-bold text-sm transition-all flex items-center gap-1.5 shrink-0 shadow-md shadow-[#d84a1b]/25 active:scale-95 cursor-pointer"
                >
                  <span>ค้นหา</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Quick Region / Flavor Filter Pills */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {REGION_FOOD_PILLS.map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => handlePillClick(pill.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      activePill === pill.id
                        ? "bg-[#d84a1b] text-white shadow-sm"
                        : "bg-white hover:bg-[#f3ede7] text-[#5a413a] border border-[#e2bfb5]/50 shadow-xs"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Hero Visual Bento Feature Card */}
            <div className="lg:col-span-5 relative">
              {spotlightPlace ? (
                <div className="relative bg-white rounded-3xl shadow-xl shadow-[#141c23]/8 border border-[#e2bfb5]/70 overflow-hidden p-3.5 group">
                  <div
                    onClick={() => navigate(`/placeDetails/${spotlightPlace.placeId}`)}
                    className="relative h-72 sm:h-84 lg:h-96 w-full rounded-2xl overflow-hidden bg-slate-900 cursor-pointer"
                  >
                    {spotlightPlace.coverImageUrl ? (
                      <img
                        src={resolveImageUrl(spotlightPlace.coverImageUrl)}
                        alt={spotlightPlace.name}
                        onError={(e) => (e.currentTarget.style.visibility = "hidden")}
                        className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-700 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white/50">
                        <UtensilsCrossed className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141c23]/90 via-[#141c23]/35 to-transparent" />

                    {/* Badges on Top */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-white/95 backdrop-blur-md rounded-full text-xs text-[#d84a1b] font-bold flex items-center gap-1 shadow-xs">
                          <Sparkles className="w-3.5 h-3.5 fill-[#d84a1b]" />
                          แนะนำประจำสัปดาห์
                        </span>
                        {spotlightPlace.categoryName && (
                          <span className="px-2.5 py-1 bg-[#16693c] text-white rounded-full text-xs font-medium backdrop-blur-md shadow-xs">
                            {spotlightPlace.categoryName}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        aria-label="เพิ่ม/นำออกจากรายการโปรด"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(spotlightPlace.placeId);
                        }}
                        className="w-8 h-8 rounded-full bg-white/85 hover:bg-white text-[#141c23] flex items-center justify-center transition-all shadow-xs active:scale-90"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            favoriteIds.includes(spotlightPlace.placeId)
                              ? "fill-rose-500 text-rose-500"
                              : "text-[#141c23]"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Info at Bottom */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 text-amber-300 text-xs font-semibold mb-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{spotlightPlace.address || "กาญจนบุรี"}</span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-white line-clamp-1">
                          {spotlightPlace.name}
                        </h3>
                        {spotlightPlace.description && (
                          <p className="text-xs text-white/85 line-clamp-1 mt-0.5 font-light">
                            {spotlightPlace.description}
                          </p>
                        )}
                      </div>

                      {!!spotlightPlace.averageRating && spotlightPlace.averageRating > 0 && (
                        <div className="flex items-center gap-1 bg-[#d84a1b] text-white font-bold text-xs sm:text-sm px-3 py-1 rounded-full shadow-lg shrink-0">
                          <Star className="w-3.5 h-3.5 fill-white" />
                          <span>{spotlightPlace.averageRating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Micro Metric Strip */}
                  <div className="grid grid-cols-3 gap-2.5 pt-3 pb-0.5 text-center">
                    <div className="bg-[#f6f9ff] rounded-xl py-2 border border-[#e2bfb5]/40 shadow-xs">
                      <span className="text-lg sm:text-xl text-[#d84a1b] font-black block">
                        {popularForYouItems.length}
                      </span>
                      <span className="text-[13px] text-[#5a413a]">
                        สถานที่ยอดนิยม
                      </span>
                    </div>
                    <div className="bg-[#f6f9ff] rounded-xl py-2 border border-[#e2bfb5]/40 shadow-xs">
                      <span className="text-lg sm:text-xl text-[#e88d14] font-black block">
                        {localDishesData?.total ?? "–"}
                      </span>
                      <span className="text-[13px] text-[#5a413a]">
                        เมนูท้องถิ่นแท้
                      </span>
                    </div>
                    <div className="bg-[#f6f9ff] rounded-xl py-2 border border-[#e2bfb5]/40 shadow-xs">
                      <span className="text-lg sm:text-xl text-[#16693c] font-black block">
                        {hiddenFoodItems.length}
                      </span>
                      <span className="text-[13px] text-[#5a413a]">
                        ร้านลับท้องถิ่น
                      </span>
                    </div>
                  </div>
                </div>
              ) : isHomeLoading ? (
                <div className="h-80 w-full rounded-3xl bg-slate-200 animate-pulse" />
              ) : null}
            </div>
          </div>
        </section>
      </div>

      {isHomeLoading && (
        <section className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-10 sm:py-14">
          <div className="h-9 w-64 rounded-lg bg-slate-200 animate-pulse mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-80 rounded-2xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        </section>
      )}

      {/* 3. SECTION: ยอดนิยมสำหรับคุณ */}
      {popularForYou && popularForYouItems.length > 0 && (
        <section className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-10 sm:py-14 text-left">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-8 h-1 rounded-full bg-[#d84a1b]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#d84a1b]">
                  {popularForYou.key.toUpperCase()}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#141c23] tracking-tight">
                {popularForYou.title || "ยอดนิยมสำหรับคุณ"}
              </h2>
              <p className="text-sm text-[#5a413a] mt-1 font-light">
                สถานที่และร้านอาหารแนะนำ คัดสรรตามความสนใจของคุณ
              </p>
            </div>

            <Link
              to="/places"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#d84a1b] hover:text-[#b83c13] bg-[#ffdbd1]/50 hover:bg-[#ffdbd1] px-4 py-2 rounded-full transition-all self-start md:self-auto shadow-xs"
            >
              <span>ดูทั้งหมด ({popularForYouItems.length} รายการ)</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {popularForYouItems.slice(0, 8).map((item) => (
              <PlaceItemCard
                key={item.placeId}
                place={item}
                isFavorite={favoriteIds.includes(item.placeId)}
                onToggleFavorite={() => toggleFavorite(item.placeId)}
                onClick={() => navigate(`/placeDetails/${item.placeId}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* 4. SECTION: ทำเนียบอาหารท้องถิ่น */}
      {localDishes.length > 0 && (
        <section className="w-full bg-[#f3ede7]/60 py-12 sm:py-16 text-left">
          <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-8 h-1 rounded-full bg-[#d84a1b]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#d84a1b]">
                    LOCAL DISHES DIRECTORY
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#141c23] tracking-tight">
                  ทำเนียบอาหารท้องถิ่นเมืองกาญจน์
                </h2>
                <p className="text-sm text-[#5a413a] mt-1 font-light">
                  เมนูพื้นบ้านขึ้นชื่อ เอกลักษณ์แห่งภูมิปัญญาสายน้ำและป่าเมืองกาญจน์
                </p>
              </div>

              <Link
                to="/localDishs"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#d84a1b] hover:text-[#b83c13] bg-white px-4 py-2 rounded-full border border-[#e2bfb5]/70 shadow-xs transition-all self-start md:self-auto"
              >
                <span>ดูทำเนียบอาหารทั้งหมด ({localDishesData?.total ?? 0})</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
              {localDishes.map((dish) => (
                <LocalDishCard
                  key={dish.dishId}
                  dish={dish}
                  onClick={() => navigate(`/localDishDetails/${dish.dishId}`)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4.5 SECTION: เมนูยอดนิยมช่วงนี้ (เฉพาะเมื่อหลังบ้านส่ง trending_food มา) */}
      {trendingFoodItems.length > 0 && (
        <section className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-10 text-left">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-[#141c23]">
              {trendingFood?.title ?? "เมนูยอดนิยมช่วงนี้"}
            </h2>
            <Link to="/localDishs" className="text-xs sm:text-sm font-bold text-[#d84a1b] hover:underline">
              ดูทั้งหมด →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {trendingFoodItems.slice(0, 8).map((food) => (
              <TrendingFoodCard
                key={food.dishId}
                food={food}
                onClick={() => navigate(`/localDishDetails/${food.dishId}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* 5. SECTION: TWO-COLUMN 60/40 SPLIT */}
      <section className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-12 sm:py-16 text-left">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Left Column (60%): ร้านลับพื้นถิ่น */}
          {hiddenFoodItems.length > 0 && (
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-6 h-1 rounded-full bg-[#d84a1b]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#d84a1b]">
                    Hidden Food
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#141c23]">
                  {hiddenFood?.title || "ร้านลับพื้นถิ่นที่อยากให้คุณลอง"}
                </h2>
              </div>

              <Link
                to="/localBusines"
                className="text-xs sm:text-sm font-bold text-[#d84a1b] hover:underline flex items-center gap-0.5"
              >
                <span>ดูทั้งหมด ({hiddenFoodItems.length} ร้าน)</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {hiddenFoodItems.slice(0, 4).map((stall) => (
                <PlaceItemCard
                  key={stall.placeId}
                  place={stall}
                  isFavorite={favoriteIds.includes(stall.placeId)}
                  onToggleFavorite={() => toggleFavorite(stall.placeId)}
                  onClick={() => navigate(`/placeDetails/${stall.placeId}`)}
                />
              ))}
            </div>
          </div>

          )}

          {/* Right Column (40%): Trending Live Leaderboard */}
          <div className={`${hiddenFoodItems.length > 0 ? "lg:col-span-5" : "lg:col-span-12"} flex flex-col gap-4`}>
            <div className="bg-white rounded-3xl shadow-lg shadow-[#141c23]/5 border border-[#e2bfb5]/50 p-5 sm:p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#f3ede7]">
                <div className="flex items-center gap-2">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d84a1b] opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#d84a1b]" />
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-[#141c23]">
                    {popularNow?.title || "ยอดนิยมตอนนี้"}
                  </h3>
                </div>
                <span className="text-[13px] font-semibold text-[#8e7068] bg-[#f6f9ff] px-2.5 py-1 rounded-full border border-[#e2bfb5]/40">
                  คะแนนนิยมสูงสุด
                </span>
              </div>

              {/* Ranks 1 to 5 from real popular_now */}
              <div className="flex flex-col gap-2.5">
                {popularNowItems.slice(0, 5).map((item, idx) => (
                  <div
                    key={item.placeId}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-[#fbf8f5] transition-all group cursor-pointer border border-transparent hover:border-[#e2bfb5]/40"
                    onClick={() => navigate(`/placeDetails/${item.placeId}`)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-black flex items-center justify-center shrink-0 shadow-xs ${
                          idx === 0
                            ? "bg-[#ffdbd1] text-[#d84a1b]"
                            : idx === 1
                            ? "bg-[#ffdcbd] text-[#8a5100]"
                            : "bg-[#e7eff8] text-[#141c23]"
                        }`}
                      >
                        {idx + 1}
                      </span>

                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 bg-slate-100 shadow-xs">
                        {item.coverImageUrl ? (
                          <img
                            src={resolveImageUrl(item.coverImageUrl)}
                            alt={item.name}
                            onError={(e) => (e.currentTarget.style.visibility = "hidden")}
                            className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#ffdbd1]/30 flex items-center justify-center text-[#d84a1b]">
                            <UtensilsCrossed className="w-5 h-5 opacity-40" />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col text-left min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-[#141c23] group-hover:text-[#d84a1b] truncate transition-colors">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[13px] text-[#8e7068] mt-0.5">
                          {item.categoryName && (
                            <span className="text-[#d84a1b] font-semibold truncate">
                              {item.categoryName}
                            </span>
                          )}
                          {!!item.averageRating && item.averageRating > 0 ? (
                            <span className="text-[#16693c] flex items-center gap-0.5 font-bold shrink-0">
                              <Star className="w-3 h-3 fill-[#e88d14] text-[#e88d14]" />
                              {item.averageRating.toFixed(1)}
                            </span>
                          ) : (
                            <span className="shrink-0">ยังไม่มีรีวิว</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#f6f9ff] group-hover:bg-[#d84a1b] group-hover:text-white text-[#8e7068] transition-colors flex items-center justify-center shrink-0 shadow-xs">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Impact Community Banner */}
            <div className="bg-[#ffdbd1]/40 border border-[#e2bfb5] rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 shadow-xs text-left">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#d84a1b] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Award className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <h4 className="text-xs sm:text-sm font-bold text-[#ab2f00]">
                  ร่วมสนับสนุนชุมชนท้องถิ่น
                </h4>
                <p className="text-[13px] text-[#5a413a] mt-0.5 leading-relaxed font-light">
                  ทุกการเช็คอินและการรีวิวของคุณ ช่วยให้ร้านอาหารและชุมชนเมืองกาญจน์เป็นที่รู้จักมากขึ้น
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. EXTRA REAL SECTIONS (IF ANY) */}
      {extraSections.map((sec) => (
        <section key={sec.key} className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-10 text-left">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-[#141c23]">{sec.title}</h2>
            <Link to="/places" className="text-xs sm:text-sm font-bold text-[#d84a1b] hover:underline">
              ดูทั้งหมด →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {sec.items?.slice(0, 4).map((item) => (
              <PlaceItemCard
                key={item.placeId}
                place={item}
                isFavorite={favoriteIds.includes(item.placeId)}
                onToggleFavorite={() => toggleFavorite(item.placeId)}
                onClick={() => navigate(`/placeDetails/${item.placeId}`)}
              />
            ))}
          </div>
        </section>
      ))}

      {/* 7. SECTION: SMART TRIP & TASTE PLANNER BANNER */}
      <section className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 pb-16 sm:pb-24">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#1c242b] via-[#293139] to-[#00210e] p-6 sm:p-10 lg:p-14 text-white shadow-2xl text-left">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 flex flex-col gap-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold w-fit border border-white/10">
                <Compass className="w-3.5 h-3.5" />
                <span>KANCHANABURI SMART TRIP & TASTE PLANNER</span>
              </div>

              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
                วางแผนตะลอนกิน & เที่ยวเมืองกาญจน์ <br />
                <span className="text-[#ffdbd1]">
                  จัดเส้นทางอัจฉริยะในแบบของคุณ ฟรี!
                </span>
              </h2>

              <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl font-light leading-relaxed">
                ระบบคำนวณระยะทาง จุดแวะพัก คัดสรรร้านอาหารพื้นบ้านและที่พักแพริมน้ำ
                ให้ทริปกาญจนบุรีของคุณราบรื่นและอิ่มอร่อยในทุกกิโลเมตร
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate("/trip")}
                  className="px-8 py-3.5 bg-[#d84a1b] hover:bg-[#b83c13] text-white font-bold text-sm sm:text-base rounded-full shadow-lg shadow-[#d84a1b]/30 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                >
                  <Compass className="w-4 h-4" />
                  <span>เริ่มวางแผนทริปเลย</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/places")}
                  className="px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white font-medium text-sm sm:text-base rounded-full border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>สำรวจสถานที่ทั้งหมด</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-4 flex justify-center">
              <div className="w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 text-white shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/20 mb-3">
                  <span className="text-xs font-bold text-amber-300">
                    ทริปแนะนำ: สายกิน & วิวแคว
                  </span>
                  <span className="text-[12px] bg-[#d84a1b] px-2.5 py-0.5 rounded-full font-bold">
                    2 วัน 1 คืน
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1 shrink-0" />
                    <div>
                      <p className="font-bold text-white text-xs sm:text-sm">อาหารกลางวันปลาแม่น้ำสด</p>
                      <p className="text-[12px] text-slate-300">แกงป่า & ปลาคังสดริมแม่กลอง</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 mt-1 shrink-0" />
                    <div>
                      <p className="font-bold text-white text-xs sm:text-sm">Skywalk สองแควแม่กลอง</p>
                      <p className="text-[12px] text-slate-300">ชมวิวแม่น้ำสองสีและสกายวอล์คกระจก</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#d84a1b] mt-1 shrink-0" />
                    <div>
                      <p className="font-bold text-white text-xs sm:text-sm">เช็คอินแพริมน้ำแม่น้ำแควน้อย</p>
                      <p className="text-[12px] text-slate-300">มื้อเย็นริมน้ำ & พักผ่อนธรรมชาติ</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
