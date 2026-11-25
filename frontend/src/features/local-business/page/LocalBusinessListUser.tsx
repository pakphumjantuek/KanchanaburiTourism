import { useState } from "react";
import { useDebounce } from "../../../utils/useDebounce";
import { useBehaviorLogger } from "../../behavior/useBehaviorLogger";

import { Footer } from "../../../components/Layout/Footer";
import { useGetAllPlaceQuery } from "../../places/placeApi";
import { PlaceListHeader } from "../../places/Components/place-list/PlaceListHeader";
import { PlaceGrid } from "../../places/Components/place-list/PlaceGrid";
import { PaginationBar } from "../../places/Components/place-list/PaginationBar";
import { EmptyState } from "../../places/Components/place-list/EmptyState";

// หน้า "ร้านอาหารพื้นถิ่น" = รายการสถานที่หมวด "อาหาร" ใช้คอมโพเนนต์ชุดเดียวกับ /places
const LocalBusinessListUser = () => {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [search, setSearch] = useState("");

  const log = useBehaviorLogger();
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, isFetching } = useGetAllPlaceQuery({
    page,
    pageSize,
    search: debouncedSearch,
    category: "อาหาร",
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
        kicker="Local food"
        title={
          <>
            ร้านอาหาร<span className="text-[#ffb59c]">พื้นถิ่น</span>
          </>
        }
        subtitle="ร้านลับ ร้านริมน้ำ และรสมือแม่ครัวเมืองกาญจน์ ที่คนท้องถิ่นแนะนำ"
        placeholder="ค้นหาร้าน เช่น แกงป่า, ปลาแม่น้ำ, ร้านแพ..."
      />

      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 py-8">
        <div className="mb-5 flex items-center justify-between text-sm">
          <p className="text-[#5a413a]">
            {isLoading ? "กำลังค้นหา..." : <>พบ <b className="text-[#141c23]">{total}</b> ร้าน</>}
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
                  metaJson: JSON.stringify({ source: "local_food_list", category: "food" }),
                })
              }
            />
          </div>
        ) : search ? (
          <EmptyState
            title="ไม่พบร้านที่ค้นหา"
            description="ลองใช้คำค้นอื่น หรือดูร้านทั้งหมด"
            resetLabel="ดูร้านทั้งหมด"
            onReset={() => {
              setSearch("");
              setPage(1);
            }}
          />
        ) : (
          <EmptyState
            title="ยังไม่มีร้านอาหารในระบบ"
            description="กำลังรวบรวมร้านพื้นถิ่นเมืองกาญจน์ — ระหว่างนี้ลองดูสถานที่ท่องเที่ยวก่อนได้"
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

export default LocalBusinessListUser;
