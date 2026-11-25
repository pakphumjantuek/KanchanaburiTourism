import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { useGetByIdQuery } from "../placeApi";
import type { PlaceDto } from "../placeTypes";
import { Loading } from "../../../components/Loading";
import { showError, showSuccessOk } from "../../../utils";

import {
  useGetAllTripsQuery,
  useGetTripDetailQuery,
  useAddTripItemMutation,
} from "../../trip/tripApi";
import type { TripDto } from "../../trip/tripTypes";
import AddToTripModal from "../../trip/components/AddToTripModal";
import {
  addDays,
  daysInclusive,
  parseIso,
  sod,
  thDate,
} from "../../../utils/dateTrip";
import { useBehaviorLogger } from "../../behavior/useBehaviorLogger";

import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Camera,
  ChevronRight,
  Clock,
  Compass,
  ListPlus,
  MapPin,
  MessageSquare,
  Mountain,
  ImageOff,
  Navigation,
  Share2,
  Sparkles,
  Star,
  Ticket,
  X,
} from "lucide-react";
import { useAppSelector } from "../../../store/hooks";
import { useLazyGetPlaceOpeningQuery } from "../../placeOpening/placeOpenApi";
import { PlaceReviews } from "../../placeReview/page/PlaceReviews";
import { EventBanner } from "../Components/place-detail/EventBanner";

function resolveImageUrl(rawUrl?: string | null): string {
  if (!rawUrl) return "";
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) return rawUrl;
  return `${import.meta.env.VITE_API_BASE_URLS ?? ""}${rawUrl}`;
}

function SafeImg(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState(false);
  if (failed || !props.src) {
    return (
      <div className={`${props.className ?? ""} flex items-center justify-center bg-[#f3ede7] text-[#e2bfb5]`}>
        <ImageOff className="w-8 h-8" />
      </div>
    );
  }
  return <img loading="lazy" {...props} onError={() => setFailed(true)} />;
}

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-6 h-1 rounded-full bg-[#d84a1b]" />
        <span className="text-[13px] font-bold uppercase tracking-wider text-[#d84a1b]">{kicker}</span>
      </div>
      <h2 className="text-xl sm:text-2xl font-black text-[#141c23]">{title}</h2>
    </div>
  );
}

export default function PlaceUserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [triggerOpening] = useLazyGetPlaceOpeningQuery();

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [coverFailed, setCoverFailed] = useState(false);
  const user = useAppSelector((s) => s.auth.user);

  // ===== place =====
  const placeFromState = (location.state as { place?: PlaceDto } | null)?.place;
  const placeId = id ? Number(id) : placeFromState?.placeId;

  const { data: place, isLoading: isPlaceLoading } = useGetByIdQuery(placeId!, {
    skip: !placeId || !!placeFromState,
  });

  const displayPlace = placeFromState || place;

  // ✅ ใช้ logger ตัวเดียวพอ
  const log = useBehaviorLogger();

  // ===== behavior view (กันยิงซ้ำ) =====
  const viewedOnceRef = useRef<Record<number, boolean>>({});
  useEffect(() => {
    if (!placeId) return;
    if (viewedOnceRef.current[placeId]) return;
    viewedOnceRef.current[placeId] = true;

    log({
      placeId,
      actionType: "VIEW",
      metaJson: JSON.stringify({
        categoryId: displayPlace?.categoryId,
        categoryName: displayPlace?.categoryName,
      }),
    }).catch(() => {});
  }, [placeId, log]);

  // ===== add to trip modal =====
  const [openAddTrip, setOpenAddTrip] = useState(false);

  const { data: tripPaged, isLoading: isTripListLoading } = useGetAllTripsQuery(
    { page: 1, pageSize: 50, search: "" },
    { skip: !openAddTrip },
  );
  const trips: TripDto[] = tripPaged?.items ?? [];

  const [addTripItem, { isLoading: isAddingToTrip }] = useAddTripItemMutation();

  const [selectedTripId, setSelectedTripId] = useState<number | "">("");
  const tripIdNum = selectedTripId ? Number(selectedTripId) : null;

  const { data: tripDetailRes, isLoading: isTripDetailLoading } =
    useGetTripDetailQuery(tripIdNum!, {
      skip: !openAddTrip || !tripIdNum,
    });

  const tripResult = useMemo(() => {
    const d: any = tripDetailRes;
    return d?.result ?? d;
  }, [tripDetailRes]);

  const tripStart = useMemo(
    () => parseIso(tripResult?.startDateTime),
    [tripResult?.startDateTime],
  );
  const tripEnd = useMemo(
    () => parseIso(tripResult?.endDateTime),
    [tripResult?.endDateTime],
  );
  const tripItems = useMemo(
    () => (tripResult?.items ?? []) as any[],
    [tripResult?.items],
  );

  const [dayIndex, setDayIndex] = useState(1);
  const [arrivalTime, setArrivalTime] = useState("");
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (displayPlace?.avgVisitMinutes)
      setDuration(displayPlace.avgVisitMinutes);
  }, [displayPlace?.avgVisitMinutes]);

  useEffect(() => {
    setDayIndex(1);
    setArrivalTime("");
    setNotes("");
    setDuration(displayPlace?.avgVisitMinutes ?? 60);
  }, [selectedTripId, displayPlace?.avgVisitMinutes]);

  const dayOptions = useMemo(() => {
    if (!tripStart || !tripEnd) return [];
    const total = daysInclusive(tripStart, tripEnd);
    return Array.from({ length: total }, (_, i) => {
      const di = i + 1;
      const date = addDays(sod(tripStart), i);
      return { dayIndex: di, label: `วันที่ ${di} • ${thDate(date)}` };
    });
  }, [tripStart, tripEnd]);

  const orderIndex = useMemo(() => {
    const countInDay = tripItems.filter((x) => x.dayIndex === dayIndex).length;
    return countInDay + 1;
  }, [tripItems, dayIndex]);

  const hasTripDates = Boolean(
    tripResult?.startDateTime && tripResult?.endDateTime,
  );

  const dayOfWeekFromTripDay = (
    tripStartInput?: string | Date | null,
    dayIndex?: number | null,
  ) => {
    if (!tripStartInput) return null;

    const start =
      tripStartInput instanceof Date
        ? tripStartInput
        : new Date(tripStartInput);

    if (Number.isNaN(start.getTime())) return null;

    const offset = Math.max((dayIndex ?? 1) - 1, 0);
    const d = new Date(start);
    d.setDate(d.getDate() + offset);
    return d.getDay(); // 0-6
  };

  const handleAddToTrip = async () => {
    if (!displayPlace?.placeId) return;
    if (!tripIdNum) return alert("กรุณาเลือกทริป");

    if (
      dayOptions.length > 0 &&
      (dayIndex < 1 || dayIndex > dayOptions.length)
    ) {
      return alert("วันไม่ถูกต้อง");
    }

    // ✅ ใช้ startDateTime ของทริปที่เลือก
    const tripStartDateTime =
      (tripResult?.startDateTime as string | undefined) ?? null;

    // ✅ หา dayOfWeek ของวันในทริป
    const dow = dayOfWeekFromTripDay(tripStartDateTime, dayIndex);
    if (dow == null) return alert("ไม่สามารถตรวจสอบวันของทริปได้");

    try {
      const openingList = await triggerOpening(
        displayPlace.placeId,
        true,
      ).unwrap();
      const oh = (openingList ?? []).find((x) => x.dayOfWeek === dow) ?? null;

      if (oh?.isClosed) {
        return showError(
          "สถานที่นี้ปิดทำการในวันที่เลือก จึงไม่สามารถเพิ่มได้",
        );
      }

      await addTripItem({
        tripId: tripIdNum,
        body: {
          placeId: displayPlace.placeId,
          dayIndex,
          orderIndex,
          plannedArrivalTime: arrivalTime
            ? new Date(arrivalTime).toISOString()
            : null,
          plannedDurationMinutes: duration,
          notes: notes.trim() || null,
        },
      }).unwrap();

      await log({
        placeId: displayPlace.placeId,
        actionType: "ADD_TO_TRIP",
        metaJson: JSON.stringify({
          tripId: tripIdNum,
          categoryId: displayPlace.categoryId,
          categoryName: displayPlace.categoryName,
        }),
      }).catch(() => {});

      showSuccessOk("เพิ่มเข้าทริปสำเร็จ!");
      setOpenAddTrip(false);
    } catch (err: any) {
      console.error(err);
      alert(err?.data?.errorMessages?.[0] ?? "เพิ่มเข้าทริปไม่สำเร็จ");
    }
  };

  if ((isPlaceLoading || !displayPlace) && !placeFromState) return <Loading />;

  if (!displayPlace) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ไม่พบข้อมูลสถานที่
          </h2>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all"
          >
            ← กลับไป
          </button>
        </div>
      </div>
    );
  }

  const images = displayPlace.images || [];
  const cover = images.find((img) => img.isCover) ?? images[0];
  const coverUrl = resolveImageUrl(cover?.imageUrl);
  const paragraphs = (displayPlace.description ?? "")
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const hasRating = !!displayPlace.averageRating && displayPlace.averageRating > 0;
  const tags = displayPlace.tags ?? [];
  const hasCoords = displayPlace.latitude != null && displayPlace.longitude != null;
  const lat = displayPlace.latitude;
  const lng = displayPlace.longitude;
  const navUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    : null;
  const osmEmbed = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.012},${lat - 0.008},${lng + 0.012},${lat + 0.008}&layer=mapnik&marker=${lat},${lng}`
    : null;
  const priceLabel = !displayPlace.priceRange
    ? "เข้าชมฟรี"
    : `฿${displayPlace.priceRange.toLocaleString()}`;
  const visitLabel = displayPlace.avgVisitMinutes
    ? displayPlace.avgVisitMinutes >= 60
      ? `${(displayPlace.avgVisitMinutes / 60).toLocaleString(undefined, { maximumFractionDigits: 1 })} ชม.`
      : `${displayPlace.avgVisitMinutes} นาที`
    : "-";

  const eventEnded = displayPlace.eventStatus === "ended";

  const openAddTripModal = () => {
    setOpenAddTrip(true);
    setSelectedTripId("");
    setDayIndex(1);
    setArrivalTime("");
    setDuration(displayPlace.avgVisitMinutes ?? 60);
    setNotes("");
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: displayPlace.name, url });
      else {
        await navigator.clipboard.writeText(url);
        showSuccessOk("คัดลอกลิงก์แล้ว");
      }
    } catch {}
  };

  const facts = [
    { icon: Clock, label: "ใช้เวลาเที่ยว", value: visitLabel, tone: "text-[#d84a1b] bg-[#ffdbd1]/60" },
    { icon: Ticket, label: "ค่าเข้าชม", value: priceLabel, tone: "text-[#16693c] bg-[#16693c]/10" },
    {
      icon: Star,
      label: "คะแนนรีวิว",
      value: hasRating ? `${displayPlace.averageRating!.toFixed(1)} / 5` : "ยังไม่มี",
      tone: "text-[#b86e00] bg-[#ffdcbd]/70",
    },
    {
      icon: MessageSquare,
      label: "รีวิวทั้งหมด",
      value: `${displayPlace.reviewCount ?? 0} รีวิว`,
      tone: "text-[#2c5c8a] bg-[#e7eff8]",
    },
  ];

  return (
    <div className="min-h-screen bg-[#fbf8f5] text-[#141c23] flex flex-col">
      {/* HERO */}
      <section className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 pt-5 sm:pt-6">
        <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-[#8e7068] mb-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="ย้อนกลับ"
            className="mr-1 w-8 h-8 rounded-full bg-white border border-[#e2bfb5]/60 hover:border-[#d84a1b] hover:text-[#d84a1b] flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Link to="/home" className="hover:text-[#d84a1b]">หน้าแรก</Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          <Link to="/places" className="hover:text-[#d84a1b]">สถานที่ท่องเที่ยว</Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          <span className="text-[#141c23] font-semibold truncate hidden sm:inline">{displayPlace.name}</span>
        </nav>

        <EventBanner place={displayPlace} />

        <div className="relative rounded-3xl sm:rounded-[28px] overflow-hidden h-[300px] sm:h-[460px] lg:h-[560px] xl:h-[620px] bg-gradient-to-br from-[#2a3640] to-[#00210e] shadow-xl shadow-[#141c23]/10">
          {coverUrl && !coverFailed ? (
            <img
              src={coverUrl}
              alt={displayPlace.name}
              onError={() => setCoverFailed(true)}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/25">
              <Mountain className="w-24 h-24" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#141c23]/90 via-[#141c23]/25 to-transparent" />

          <div className="absolute top-4 right-4 flex gap-2">
            <button
              type="button"
              onClick={handleShare}
              aria-label="แชร์"
              className="w-10 h-10 rounded-full bg-white/90 hover:bg-white text-[#141c23] flex items-center justify-center shadow-md transition-transform active:scale-90"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-5 pb-10 sm:p-8 sm:pb-14 lg:p-12 lg:pb-16 text-left">
            <div className="flex flex-wrap gap-2 mb-3">
              {displayPlace.categoryName && (
                <span className="px-3 py-1 rounded-full bg-[#d84a1b] text-white text-xs font-bold">
                  {displayPlace.categoryName}
                </span>
              )}
              {tags.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-xs font-semibold"
                >
                  #{t}
                </span>
              ))}
            </div>
            <h1 className="text-[28px] sm:text-5xl lg:text-6xl font-black text-white leading-tight break-words tracking-tight">
              {displayPlace.name}
            </h1>
            {displayPlace.address && (
              <p className="mt-2 flex items-center gap-1.5 text-sm sm:text-base text-white/85">
                <MapPin className="w-4 h-4 text-amber-300 shrink-0" />
                {displayPlace.address} · กาญจนบุรี
              </p>
            )}
          </div>

          {images.length > 1 && (
            <button
              type="button"
              onClick={() => setLightboxIndex(0)}
              className="absolute bottom-5 right-5 sm:bottom-8 sm:right-8 hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 hover:bg-white text-sm font-bold text-[#141c23] shadow-md"
            >
              <Camera className="w-4 h-4" />
              ดูภาพทั้งหมด ({images.length})
            </button>
          )}
        </div>

        {/* QUICK FACTS */}
        <div className="relative -mt-6 sm:-mt-10 mx-2 sm:mx-8 lg:mx-12 grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 bg-white rounded-2xl p-2.5 sm:p-3 shadow-lg shadow-[#141c23]/8 border border-[#e2bfb5]/40">
          {facts.map((f) => (
            <div key={f.label} className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl text-left">
              <span className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 ${f.tone}`}>
                <f.icon className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] sm:text-xs text-[#8e7068]">{f.label}</p>
                <p className="text-sm sm:text-base font-bold truncate">{f.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CONTENT */}
      <main className="flex-grow w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 pt-8 pb-28 sm:py-12 lg:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 xl:gap-12">
          <div className="lg:col-span-8 flex flex-col gap-8 text-left">
            {/* About */}
            <section className="bg-white rounded-3xl border border-[#e2bfb5]/40 p-4 sm:p-8 shadow-sm">
              <SectionTitle kicker="About" title="เกี่ยวกับสถานที่" />
              {paragraphs.length > 0 ? (
                <div className="relative pl-5 border-l-4 border-[#d84a1b]/70">
                  {paragraphs.map((p, i) => (
                    <p
                      key={i}
                      className={`whitespace-pre-line leading-[1.9] ${
                        i === 0
                          ? "text-lg sm:text-xl font-medium text-[#141c23]"
                          : "mt-4 text-base text-[#5a413a]"
                      }`}
                    >
                      {p}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-[#8e7068] italic">ยังไม่มีคำบรรยายสำหรับสถานที่นี้</p>
              )}

              {tags.length > 0 && (
                <div className="mt-7 pt-6 border-t border-[#f3ede7]">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#8e7068] mb-3">
                    เหมาะสำหรับ
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {tags.map((t) => (
                      <Link
                        key={t}
                        to={`/places?search=${encodeURIComponent(t)}`}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#fbf8f5] border border-[#e2bfb5]/50 text-sm font-semibold text-[#5a413a] hover:border-[#d84a1b] hover:text-[#d84a1b] hover:bg-white transition-colors"
                      >
                        <Sparkles className="w-4 h-4 text-[#e88d14] shrink-0" />
                        <span className="truncate">{t}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Gallery */}
            {images.length > 1 && (
              <section>
                <SectionTitle kicker="Gallery" title="ภาพบรรยากาศ" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 auto-rows-[130px] sm:auto-rows-[170px]">
                  {images.slice(0, 7).map((img, i) => (
                    <button
                      key={img.imageId}
                      type="button"
                      onClick={() => setLightboxIndex(i)}
                      aria-label={`ดูภาพที่ ${i + 1}`}
                      className={`relative overflow-hidden rounded-2xl bg-[#f3ede7] group ${
                        i === 0 ? "col-span-2 row-span-2" : ""
                      }`}
                    >
                      <SafeImg
                        src={resolveImageUrl(img.imageUrl)}
                        alt={`${displayPlace.name} ภาพที่ ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {i === 6 && images.length > 7 && (
                        <span className="absolute inset-0 bg-black/55 flex items-center justify-center text-white font-bold text-lg">
                          +{images.length - 7}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Getting there */}
            {osmEmbed && (
              <section className="bg-white rounded-3xl border border-[#e2bfb5]/40 p-4 sm:p-8 shadow-sm">
                <SectionTitle kicker="Getting there" title="การเดินทาง" />
                <div className="rounded-2xl overflow-hidden border border-[#e2bfb5]/50 h-[280px] sm:h-[340px] bg-[#f3ede7]">
                  <iframe
                    title={`แผนที่ ${displayPlace.name}`}
                    src={osmEmbed}
                    loading="lazy"
                    className="w-full h-full border-0"
                  />
                </div>
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="flex items-start gap-2 text-sm text-[#5a413a]">
                    <MapPin className="w-4 h-4 text-[#d84a1b] mt-0.5 shrink-0" />
                    {displayPlace.address ? `${displayPlace.address}, จ.กาญจนบุรี` : "จ.กาญจนบุรี"}
                  </p>
                  <a
                    href={navUrl!}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-[#e2bfb5] bg-white hover:border-[#d84a1b] hover:text-[#d84a1b] text-sm font-bold transition-colors shrink-0"
                  >
                    <Navigation className="w-4 h-4" />
                    นำทางด้วย Google Maps
                  </a>
                </div>
              </section>
            )}

            {/* Reviews */}
            <section className="bg-white rounded-3xl border border-[#e2bfb5]/40 p-4 sm:p-8 shadow-sm">
              <PlaceReviews placeId={displayPlace.placeId} />
            </section>
          </div>

          {/* SIDEBAR */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="lg:sticky lg:top-24 flex flex-col gap-4">
              <div className="bg-white rounded-3xl border border-[#e2bfb5]/40 p-6 shadow-lg shadow-[#141c23]/5 text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-[#8e7068]">
                  วางแผนไปที่นี่
                </p>
                <p className="mt-1 text-2xl font-black">{priceLabel}</p>
                <p className="text-sm text-[#5a413a]">
                  แนะนำให้เผื่อเวลาประมาณ {visitLabel}
                </p>

                <div className="mt-5 flex flex-col gap-2.5">
                  {user ? (
                    <button
                      type="button"
                      onClick={openAddTripModal}
                      disabled={eventEnded}
                      title={eventEnded ? "อีเวนต์นี้จบแล้ว เพิ่มเข้าทริปไม่ได้" : undefined}
                      className="w-full py-3.5 rounded-full bg-[#d84a1b] hover:bg-[#b83c13] text-white font-bold flex items-center justify-center gap-2 shadow-md shadow-[#d84a1b]/25 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ListPlus className="w-5 h-5" />
                      เพิ่มเข้าทริปของฉัน
                    </button>
                  ) : (
                    <Link
                      to="/login"
                      className="w-full py-3.5 rounded-full bg-[#d84a1b] hover:bg-[#b83c13] text-white font-bold flex items-center justify-center gap-2 shadow-md shadow-[#d84a1b]/25"
                    >
                      <ListPlus className="w-5 h-5" />
                      เข้าสู่ระบบเพื่อจัดทริป
                    </Link>
                  )}
                  {navUrl && (
                    <a
                      href={navUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-3 rounded-full border border-[#e2bfb5] hover:border-[#d84a1b] hover:text-[#d84a1b] font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <Navigation className="w-4 h-4" />
                      นำทาง
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={handleShare}
                    className="w-full py-3 rounded-full text-[#5a413a] hover:bg-[#f3ede7] font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    แชร์สถานที่นี้
                  </button>
                </div>
              </div>

              <div className="rounded-3xl bg-gradient-to-br from-[#1c242b] to-[#00210e] p-6 text-white text-left">
                <Compass className="w-6 h-6 text-amber-300" />
                <p className="mt-3 font-bold text-lg leading-snug">
                  ยังไม่มีแผนเที่ยวกาญจน์?
                </p>
                <p className="mt-1 text-sm text-white/70">
                  ให้ระบบช่วยจัดเส้นทางพร้อมร้านอร่อยระหว่างทาง
                </p>
                <Link
                  to="/trip"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#ffdbd1] hover:text-white"
                >
                  เริ่มวางแผนทริป <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* MOBILE ACTION BAR */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#e2bfb5]/50 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(20,28,35,0.08)]">
        <div className="flex items-center gap-2">
          <div className="min-w-0 mr-auto pl-1 text-left">
            <p className="text-[13px] text-[#8e7068] truncate">{visitLabel}</p>
            <p className="text-base font-black truncate">{priceLabel}</p>
          </div>
          {navUrl && (
            <a
              href={navUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="นำทาง"
              className="w-12 h-12 rounded-full border border-[#e2bfb5] flex items-center justify-center text-[#141c23] shrink-0"
            >
              <Navigation className="w-5 h-5" />
            </a>
          )}
          {user ? (
            <button
              type="button"
              onClick={openAddTripModal}
                      disabled={eventEnded}
                      title={eventEnded ? "อีเวนต์นี้จบแล้ว เพิ่มเข้าทริปไม่ได้" : undefined}
              className="h-12 px-5 rounded-full bg-[#d84a1b] active:bg-[#b83c13] text-white font-bold text-sm flex items-center gap-2 shadow-md shadow-[#d84a1b]/25 shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ListPlus className="w-5 h-5" />
              เพิ่มเข้าทริป
            </button>
          ) : (
            <Link
              to="/login"
              className="h-12 px-5 rounded-full bg-[#d84a1b] text-white font-bold text-sm flex items-center gap-2 shrink-0"
            >
              <ListPlus className="w-5 h-5" />
              เข้าสู่ระบบ
            </Link>
          )}
        </div>
      </div>

      {/* LIGHTBOX */}
      {lightboxIndex != null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            aria-label="ปิด"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
          <SafeImg
            src={resolveImageUrl(images[lightboxIndex]?.imageUrl)}
            alt={displayPlace.name}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[80vh] max-w-full rounded-xl object-contain"
          />
          {images.length > 1 && (
            <div
              className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setLightboxIndex((lightboxIndex - 1 + images.length) % images.length)}
                className="px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 text-white text-sm"
              >
                ← ก่อนหน้า
              </button>
              <span className="text-white/80 text-sm">
                {lightboxIndex + 1} / {images.length}
              </span>
              <button
                type="button"
                onClick={() => setLightboxIndex((lightboxIndex + 1) % images.length)}
                className="px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 text-white text-sm"
              >
                ถัดไป →
              </button>
            </div>
          )}
        </div>
      )}

      <AddToTripModal
        open={openAddTrip}
        onClose={() => setOpenAddTrip(false)}
        placeName={displayPlace.name}
        placeImageUrl={coverUrl}
        placeSubtitle={displayPlace.address ? `${displayPlace.address} · ${visitLabel}` : visitLabel}
        trips={trips}
        isTripListLoading={isTripListLoading}
        selectedTripId={selectedTripId}
        setSelectedTripId={setSelectedTripId}
        dayIndex={dayIndex}
        setDayIndex={setDayIndex}
        dayOptions={dayOptions}
        isTripDetailLoading={isTripDetailLoading}
        hasTripDates={hasTripDates}
        tripIdNum={tripIdNum}
        isAddingToTrip={isAddingToTrip}
        onSubmit={handleAddToTrip}
        onCreateTrip={() => {
          setOpenAddTrip(false);
          navigate("/trip/create");
        }}
      />
    </div>
  );
}
