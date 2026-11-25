import { Map as MapIcon } from "lucide-react";
import AutoTripModal from "../components/AutoTripModal";
import { TripHeroHeader } from "../components/list/TripHeroHeader";
import { TripControls } from "../components/list/TripControls";
import { TripGrid } from "../components/list/TripGrid";
import { TripCardSkeleton } from "../components/list/TripCardSkeleton";
import { TripPagination } from "../components/list/TripPagination";
import { useTripListController } from "../hooks/useTripListController";
import { Footer } from "../../../components/Layout/Footer";


export default function TripListPage() {
  const c = useTripListController();

  return (
    <div className="min-h-screen w-full bg-[#fbf8f5] text-[#141c23] pb-10 font-prompt">
      <TripHeroHeader />

      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 relative z-10">
        <TripControls
          search={c.search}
          onSearchChange={c.setSearch}
          onClearSearch={() => c.setSearch("")}
          onOpenAutoTrip={() => c.setAutoTripOpen(true)}
          isAutoTripLoading={c.isAutoTripLoading}
          onCreate={c.goCreate}
        />

        {c.isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
            {c.skeletonCount.map((_, idx) => (
              <TripCardSkeleton key={idx} />
            ))}
          </div>
        )}

        {!c.isLoading && c.trips.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 sm:py-20 px-5 bg-white rounded-3xl border-2 border-dashed border-[#e2bfb5]">
            <span className="w-16 h-16 rounded-2xl bg-[#ffdbd1]/60 text-[#d84a1b] flex items-center justify-center mb-4">
              <MapIcon className="w-8 h-8" />
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-[#141c23] mb-2 text-center">
              {c.hasSearch ? "ไม่พบทริปที่ตรงกับคำค้นหา" : "เริ่มการผจญภัยของคุณ!"}
            </h3>
            <p className="text-[#5a413a] mb-8 text-center max-w-md">
              {c.hasSearch
                ? "ลองเปลี่ยนคำค้นหา หรือกดล้างคำค้นหาเพื่อดูรายการทั้งหมด"
                : "คุณยังไม่มีทริปในรายการ ลองสร้างทริปใหม่ หรือให้ระบบช่วยวางแผนอัตโนมัติได้เลย"}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              {c.hasSearch ? (
                <button
                  onClick={() => c.setSearch("")}
                  className="px-8 py-3 rounded-full border border-[#e2bfb5] text-[#5a413a] font-bold hover:border-[#d84a1b] hover:text-[#d84a1b]"
                >
                  ล้างคำค้นหา
                </button>
              ) : (
                <>
                  <button
                    onClick={c.goCreate}
                    className="px-8 py-3 rounded-full bg-[#d84a1b] text-white font-bold hover:bg-[#b83c13] shadow-lg shadow-[#d84a1b]/25"
                  >
                    สร้างทริปใหม่
                  </button>
                  <button
                    onClick={() => c.setAutoTripOpen(true)}
                    className="px-8 py-3 rounded-full border-2 border-dashed border-[#e88d14]/60 bg-[#ffdcbd]/30 text-[#8a5100] font-bold hover:bg-[#ffdcbd]/60"
                  >
                    ✨ ช่วยสร้างทริปอัตโนมัติ
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {!c.isLoading && c.trips.length > 0 && (
          <TripGrid
            trips={c.trips}
            onOpen={c.goTripDetail}
            onPlanner={c.goPlanner}
            onDelete={c.handleDeleteTrip}
          />
        )}

        <TripPagination
          page={c.page}
          totalPages={c.totalPages}
          onPrev={() => c.setPage(Math.max(1, c.page - 1))}
          onNext={() => c.setPage(Math.min(c.totalPages, c.page + 1))}
        />
      </div>

      <AutoTripModal
        open={c.autoTripOpen}
        loading={c.isAutoTripLoading}
        onClose={() => c.setAutoTripOpen(false)}
        onConfirm={c.handleGenerateAutoTrip}
      />
      <div className="mt-10">
        <Footer />
      </div>
    </div>
    
  );
}
