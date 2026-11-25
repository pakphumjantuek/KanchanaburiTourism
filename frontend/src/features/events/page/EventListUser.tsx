import { useState } from "react";
import { useDebounce } from "../../../utils/useDebounce";
import { useBehaviorLogger } from "../../behavior/useBehaviorLogger";

import { Footer } from "../../../components/Layout/Footer";
import { useGetAllPlaceQuery } from "../../places/placeApi";
import { PlaceListHeader } from "../../places/Components/place-list/PlaceListHeader";
import { PlaceGrid } from "../../places/Components/place-list/PlaceGrid";
import { PaginationBar } from "../../places/Components/place-list/PaginationBar";
import { EmptyState } from "../../places/Components/place-list/EmptyState";

// หน้า "อีเวนต์" = สถานที่ที่ถูกตั้งเป็นอีเวนต์ชั่วคราวและกำลังจัดอยู่ (ใกล้จบขึ้นก่อน)
// อีเวนต์ที่จบแล้วหรือยังไม่เริ่มจะไม่อยู่ในรายการนี้เอง (backend กรองให้)
const EventListUser = () => {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [search, setSearch] = useState("");

  const log = useBehaviorLogger();
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, isFetching } = useGetAllPlaceQuery({
    page,
    pageSize,
    search: debouncedSearch,
    eventOnly: true,
  });

  const places = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-[#fbf8f5] text-[#141c23] text-left">
      <PlaceListHeader
        search={search}
        setSearch={setSearch}
        setPage={setPage}
        kicker="Events"
        title={
          <>
            อีเวนต์<span className="text-[#ffb59c]">ที่กำลังจัด</span>
          </>
        }
        subtitle="งานเทศกาล กิจกรรม และโปรโมชั่นช่วงสั้น ๆ ในเมืองกาญจน์ ที่ไม่ควรพลาด"
        placeholder="ค้นหาอีเวนต์ เช่น งานเทศกาล, ตลาดนัด, คอนเสิร์ต..."
      />

      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 py-8">
        <div className="mb-5 flex items-center justify-between text-sm">
          <p className="text-[#5a413a]">
            {isLoading ? "กำลังค้นหา..." : <>พบ <b className="text-[#141c23]">{total}</b> อีเวนต์ที่กำลังจัด</>}
          </p>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              className="font-semibold text-[#d84a1b] hover:underline"
            >
              ล้างคำค้นหา
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-80 rounded-2xl bg-[#e7e1db] animate-pulse" />
            ))}
          </div>
        ) : places.length > 0 ? (
          <div className={isFetching ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <PlaceGrid
              places={places}
              onClickLog={(placeId) =>
                log({
                  placeId,
                  actionType: "CLICK",
                  metaJson: JSON.stringify({ source: "event_list" }),
                })
              }
            />
          </div>
        ) : search ? (
          <EmptyState
            title="ไม่พบอีเวนต์ที่ค้นหา"
            description="ลองใช้คำค้นอื่น หรือดูอีเวนต์ทั้งหมด"
            resetLabel="ดูอีเวนต์ทั้งหมด"
            onReset={() => {
              setSearch("");
              setPage(1);
            }}
          />
        ) : (
          <EmptyState
            title="ตอนนี้ยังไม่มีอีเวนต์ที่กำลังจัด"
            description="แวะกลับมาดูใหม่ได้เสมอ — ระหว่างนี้ลองดูสถานที่ท่องเที่ยวก่อนได้"
          />
        )}

        <PaginationBar
          page={page}
          totalPages={totalPages}
          onPageChange={(p) => {
            setPage(p);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </div>
      <div className="mt-10">
        <Footer />
      </div>
    </div>
  );
};

export default EventListUser;
