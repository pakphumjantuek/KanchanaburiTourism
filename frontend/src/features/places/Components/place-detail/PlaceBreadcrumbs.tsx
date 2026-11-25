import { useNavigate } from "react-router-dom";
import { Home, ChevronRight } from "lucide-react";

type Props = { placeName: string };

export function PlaceBreadcrumbs({ placeName }: Props) {
  const navigate = useNavigate();

  return (
    <div className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-slate-100">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <button
            onClick={() => navigate("/home")}
            className="flex items-center gap-1 text-slate-500 hover:text-teal-600 font-medium transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>หน้าแรก</span>
          </button>

          <ChevronRight className="w-4 h-4 text-slate-300" />

          <button
            onClick={() => navigate("/places")}
            className="text-slate-500 hover:text-teal-600 font-medium transition-colors"
          >
            สถานที่ท่องเที่ยว
          </button>

          <ChevronRight className="w-4 h-4 text-slate-300" />

          <span className="text-teal-700 font-semibold truncate max-w-[200px] sm:max-w-xs">
            {placeName}
          </span>
        </div>
      </nav>
    </div>
  );
}
