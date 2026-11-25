import { useAppSelector } from "../../../../store/hooks";
import { googleMapsUrl, mapStaticUrl } from "./placeDetailUtils";
import {
  Navigation,
  Map as MapIcon,
  Clock,
  Banknote,
  ListPlus,
} from "lucide-react";

type Props = {
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  avgVisitMinutes?: number | null;
  priceRange?: number | null;
  onAddToTrip: () => void;
};

export function SidebarMapCard({
  latitude,
  longitude,
  address,
  avgVisitMinutes,
  priceRange,
  onAddToTrip,
}: Props) {
  const gmap = googleMapsUrl(latitude ?? undefined, longitude ?? undefined);
  const staticMap = mapStaticUrl(latitude ?? undefined, longitude ?? undefined);

  const user = useAppSelector((s) => s.auth.user);

  return (
    <div className="bg-white rounded-3xl p-5 shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col h-full">
      {/* Map Header */}
      <div
        className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-5 group cursor-pointer bg-slate-100 border border-slate-200"
        onClick={() => gmap && window.open(gmap, "_blank")}
      >
        <img
          src={
            staticMap ??
            "https://placehold.co/400x300/eee/aaa?text=No+Map"
          }
          alt="Map"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            e.currentTarget.src =
              "https://placehold.co/400x300/eee/aaa?text=No+Map";
          }}
        />
        <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/20 transition-colors flex items-center justify-center">
          <div className="bg-white/90 backdrop-blur-sm px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 transform group-hover:-translate-y-1 transition-all">
            <MapIcon className="w-5 h-5 text-teal-600" />
            <span className="text-sm font-bold text-slate-800">ดูแผนที่</span>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-5">
        {/* Detail List */}
        <div className="space-y-4">
          {address && (
            <div className="flex gap-3 items-start p-3 bg-slate-50 rounded-xl">
              <MapIcon className="w-5 h-5 text-teal-500 mt-0.5 shrink-0" />
              <p className="text-sm text-slate-600 font-medium leading-relaxed line-clamp-2">
                {address}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 mb-1 text-blue-700">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">แนะนำ</span>
              </div>
              <p className="text-sm font-semibold text-slate-700">
                {avgVisitMinutes
                  ? `${Math.ceil(avgVisitMinutes / 60)} ชั่วโมง`
                  : "-"}
              </p>
            </div>

            <div className="p-3 bg-teal-50 rounded-xl border border-teal-100">
              <div className="flex items-center gap-2 mb-1 text-teal-700">
                <Banknote className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">ค่าเข้าชม</span>
              </div>
              <p className="text-sm font-semibold text-slate-700">
                {priceRange === 0 || !priceRange
                  ? "ฟรี"
                  : `฿${priceRange.toLocaleString()}`}
              </p>
            </div>
          </div>
        </div>

        {/* Actions - Pushed to bottom */}
        <div className="mt-auto space-y-3 pt-2">
          <button
            onClick={() => gmap && window.open(gmap, "_blank")}
            className="w-full bg-white border border-slate-200 hover:border-teal-200 hover:bg-teal-50 text-slate-700 hover:text-teal-700 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
            disabled={!gmap}
          >
            <Navigation className="w-5 h-5" />
            <span>นำทาง (Google Maps)</span>
          </button>

          {user && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAddToTrip();
              }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-slate-200 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <ListPlus className="w-5 h-5" />
              <span>เพิ่มเข้าทริป</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
