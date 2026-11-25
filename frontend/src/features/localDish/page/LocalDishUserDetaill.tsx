import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loading } from "../../../components/Loading";
import { useGetByIdQuery, useGetPlacesByDishIdQuery } from "../LocalDishApi";
import { ChevronLeft, MapPin, Flame, Leaf, Utensils } from "lucide-react";

const LocalDishDetailPage = () => {
  const navigate = useNavigate();
  const { dishId } = useParams<{ dishId: string }>();

  const id = useMemo(() => {
    const n = Number(dishId);
    return Number.isFinite(n) ? n : null;
  }, [dishId]);

  const {
    data: dish,
    isLoading,
    isError,
  } = useGetByIdQuery(id as number, {
    skip: id === null,
  });

  const {
    data: places,
    isLoading: placesLoading,
    isError: placesError,
  } = useGetPlacesByDishIdQuery(id as number, {
    skip: id === null,
  });

  const baseUrl = import.meta.env.VITE_API_BASE_URLS ?? "";
  const placeholder =
    "https://placehold.co/1200x800/fff7ed/ea580c?text=Local+Food";

  const toFullUrl = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    const b = (baseUrl ?? "").trim().replace(/\/$/, "");
    const p = url.startsWith("/") ? url : `/${url}`;
    return `${b}${p}`;
  };

  const allImages = useMemo(() => {
    const imgs = (dish?.images ?? []).filter((x) => !!x?.imageUrl);
    return imgs.sort((a, b) => Number(b.isCover) - Number(a.isCover));
  }, [dish?.images]);

  const coverImage = useMemo(() => {
    return allImages.find((img) => img.isCover) || allImages[0] || null;
  }, [allImages]);

  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);

  const heroSrc = useMemo(() => {
    const url = activeImageUrl ?? coverImage?.imageUrl ?? null;
    if (!url) return placeholder;
    if (url.startsWith("http")) return url;
    const b = (baseUrl ?? "").trim().replace(/\/$/, "");
    const p = url.startsWith("/") ? url : `/${url}`;
    return `${b}${p}`;
  }, [activeImageUrl, coverImage?.imageUrl, baseUrl]);

  const renderSpicyLevel = (level: number) => {
    if (level === 0)
      return <span className="text-slate-400 text-sm">ไม่เผ็ด</span>;
    return (
      <div className="flex items-center gap-1" title={`ระดับความเผ็ด ${level}`}>
        {[...Array(Math.min(level, 5))].map((_, i) => (
          <Flame key={i} size={16} className="text-red-500 fill-red-500" />
        ))}
        {level > 5 && (
          <span className="text-sm text-red-500 font-bold ml-1">+{level}</span>
        )}
      </div>
    );
  };

  if (id === null) {
    return (
      <div className="min-h-screen bg-orange-50/30 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md shadow-lg border border-slate-100">
          <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Utensils className="text-red-500" size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            ลิงก์ไม่ถูกต้อง
          </h3>
          <p className="text-slate-500 mb-6">
            ไม่พบรหัสอาหารท้องถิ่น หรือข้อมูลอาจถูกลบไปแล้ว
          </p>
          <button
            onClick={() => navigate(-1)}
            className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition shadow-lg shadow-slate-200"
          >
            ← ย้อนกลับ
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-orange-50/30 flex justify-center py-20">
        <Loading />
      </div>
    );
  }

  if (isError || !dish) {
    return (
      <div className="min-h-screen bg-orange-50/30 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md shadow-lg border border-slate-100">
          <div className="bg-orange-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Utensils className="text-orange-500" size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            ไม่พบเมนูอาหาร
          </h3>
          <p className="text-slate-500 mb-6">
            อาจเกิดข้อผิดพลาดในการโหลดข้อมูล หรือเมนูนี้ไม่มีอยู่แล้ว
          </p>
          <button
            onClick={() => navigate(-1)}
            className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition shadow-lg shadow-slate-200"
          >
            ← ย้อนกลับไปค้นหาใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50/30 pb-20">
      {/* Navbar */}
      <div className="bg-white border-b border-orange-100 sticky top-0 z-20 shadow-sm/50 backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-slate-600 hover:text-orange-600 transition font-medium text-sm gap-1 group"
          >
            <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-orange-50 flex items-center justify-center transition-colors">
              <ChevronLeft size={18} />
            </div>
            ย้อนกลับ
          </button>

          <h1 className="text-lg font-bold text-slate-800 truncate max-w-[200px] sm:max-w-md hidden sm:block">
            {dish.nameTH}
          </h1>

          <div className="w-8" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {/* ======= TOP: Images + Content ======= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Images */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 relative group">
              <div className="aspect-[4/3] w-full bg-slate-100 relative overflow-hidden">
                <img
                  src={heroSrc}
                  alt={dish.nameTH}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105 cursor-zoom-in"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = placeholder;
                  }}
                />

                {/* Floating Badges */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  {dish.isHalal && (
                    <span className="bg-emerald-600/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      HALAL
                    </span>
                  )}
                  {dish.isVegetarian && (
                    <span className="bg-lime-600/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                      <Leaf size={12} /> VEGAN
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {allImages.map((img) => {
                  const src = toFullUrl(img.imageUrl) ?? placeholder;
                  const isActive =
                    (activeImageUrl ?? coverImage?.imageUrl) === img.imageUrl;

                  return (
                    <button
                      key={img.imageId ?? img.imageUrl}
                      onClick={() => setActiveImageUrl(img.imageUrl)}
                      className={`relative shrink-0 w-24 h-24 rounded-2xl overflow-hidden transition-all duration-200 ${
                        isActive
                          ? "ring-2 ring-orange-500 ring-offset-2 opacity-100 shadow-md transform scale-105"
                          : "opacity-70 hover:opacity-100 hover:scale-105"
                      }`}
                    >
                      <img
                        src={src}
                        alt="thumbnail"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            placeholder;
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Content */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 h-full flex flex-col relative overflow-hidden">
              {/* Decor BG */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-[100px] -z-0 opacity-50" />

              <div className="relative z-10">
                {dish.origin && (
                  <div className="inline-flex items-center text-orange-600 font-medium text-sm mb-3 bg-orange-50 px-3 py-1 rounded-full">
                    <MapPin size={14} className="mr-1" />
                    {dish.origin}
                  </div>
                )}

                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2 leading-tight">
                  {dish.nameTH}
                </h1>

                <h2 className="text-lg text-slate-500 font-medium mb-6 font-serif italic">
                  {dish.nameEN || "Traditional Local Dish"}
                </h2>

                <div className="flex items-center gap-6 mb-8 py-4 border-y border-slate-100">
                  <div>
                    <span className="block text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
                      ความเผ็ด
                    </span>
                    {renderSpicyLevel(dish.spicyLevel || 0)}
                  </div>

                  <div className="w-px h-10 bg-slate-100 mx-2" />

                  <div>
                    <span className="block text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
                      ประเภท
                    </span>
                    <div className="flex gap-2 text-sm text-slate-700 font-medium">
                      {dish.isHalal || dish.isVegetarian ? (
                        <>
                          {dish.isHalal && <span>ฮาลาล</span>}
                          {dish.isHalal && dish.isVegetarian && <span>•</span>}
                          {dish.isVegetarian && <span>มังสวิรัติ</span>}
                        </>
                      ) : (
                        <span>ทั่วไป</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="prose prose-slate prose-sm max-w-none">
                  <h3 className="text-slate-900 font-bold text-lg mb-3 flex items-center gap-2">
                    <Utensils size={18} className="text-orange-500" />
                    เรื่องราวความอร่อย
                  </h3>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-line text-base">
                    {dish.description?.trim()
                      ? dish.description
                      : "ไม่มีคำอธิบายสำหรับเมนูนี้ แต่รับรองว่ารสชาติเป็นเอกลักษณ์และน่าลิ้มลองแน่นอน!"}
                  </p>
                </div>

                {!dish.isActive && (
                  <div className="mt-6 bg-red-50 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    เมนูนี้ปิดการแสดงผลอยู่
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ======= BOTTOM: Places full width ======= */}
        <div className="mt-10">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-orange-50 opacity-60" />
            <div className="relative">
              <div className="flex items-start sm:items-center justify-between gap-4 mb-5">
                <div>
                  <h3 className="text-slate-900 font-extrabold text-xl sm:text-2xl flex items-center gap-2">
                    <MapPin size={20} className="text-orange-500" />
                    ร้านอาหารที่มีเมนูนี้
                  </h3>
                  <p className="text-slate-500 text-sm mt-1">
                    เลือกร้านเพื่อดูรายละเอียด ราคา รีวิว และเส้นทาง
                  </p>
                </div>

                {/* optional: count badge */}
                <div className="shrink-0">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-sm font-semibold">
                    {places?.length ?? 0} ร้าน
                  </span>
                </div>
              </div>

              {placesLoading ? (
                <div className="py-6 flex justify-center">
                  <Loading />
                </div>
              ) : placesError ? (
                <div className="text-red-600 text-sm bg-red-50 rounded-2xl p-4">
                  โหลดรายชื่อร้านไม่สำเร็จ
                </div>
              ) : !places || places.length === 0 ? (
                <div className="text-slate-500 text-sm bg-slate-50 rounded-2xl p-5">
                  ยังไม่มีร้านที่ผูกเมนูนี้ไว้
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {places.map((p) => {
                    const img = toFullUrl(p.coverImageUrl) ?? placeholder;

                    return (
                      <button
                        key={p.placeId}
                        onClick={() => navigate(`/placeDetails/${p.placeId}`)}
                        className="group w-full text-left bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition overflow-hidden"
                      >
                        <div className="w-full h-40 bg-slate-100 overflow-hidden">
                          <img
                            src={img}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                placeholder;
                            }}
                          />
                        </div>

                        <div className="p-4">
                          <div className="font-extrabold text-slate-900 line-clamp-1">
                            {p.name}
                          </div>

                          {p.address && (
                            <div className="text-sm text-slate-500 mt-1 line-clamp-2">
                              {p.address}
                            </div>
                          )}

                          <div className="mt-3 flex items-center justify-between">
                            <div className="text-sm text-orange-600 font-extrabold">
                              {p.price != null ? `฿${p.price}` : "—"}
                            </div>
                            <div className="text-xs text-slate-500">
                              ⭐ {Number(p.averageRating ?? 0).toFixed(1)} (
                              {p.reviewCount ?? 0})
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocalDishDetailPage;
