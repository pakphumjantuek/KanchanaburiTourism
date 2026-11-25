import { CloudSun } from "lucide-react";

// src/features/place/components/place-detail/WeatherWidget.tsx
export function WeatherWidget() {
  return (
    <div className="bg-gradient-to-br from-sky-400 to-blue-500 rounded-3xl p-6 text-white shadow-lg shadow-sky-200 relative overflow-hidden">
      {/* Background Decors */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 blur-xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-8 -mb-8 blur-lg"></div>

      <div className="flex justify-between items-center relative z-10">
        <div>
          <p className="text-sky-100 text-sm font-medium mb-1">
            สภาพอากาศวันนี้
          </p>
          <div className="flex items-baseline gap-1">
            <h3 className="text-4xl font-bold">32</h3>
            <span className="text-xl font-medium opacity-80">°C</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2 py-0.5 rounded-md bg-white/20 text-xs font-semibold backdrop-blur-sm">
              กาญจนบุรี
            </span>
            <p className="text-sm font-medium">ฟ้าโปร่ง</p>
          </div>
        </div>

        <CloudSun className="w-16 h-16 text-white drop-shadow-md opacity-90" />
      </div>
    </div>
  );
}
