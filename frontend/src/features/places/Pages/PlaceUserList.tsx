import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useGetAllPlaceQuery } from "../placeApi";
import { useDebounce } from "../../../utils/useDebounce";
import { useBehaviorLogger } from "../../behavior/useBehaviorLogger";

import { PlaceListHeader } from "../Components/place-list/PlaceListHeader";
import { FilterChips } from "../Components/place-list/FilterChips";
import { PlaceGrid } from "../Components/place-list/PlaceGrid";
import { EmptyState } from "../Components/place-list/EmptyState";
import { PaginationBar } from "../Components/place-list/PaginationBar";

import { Footer } from "../../../components/Layout/Footer";
import { useGetAllPlaceCategoryQuery } from "../../placeCategory/placeCategoryApi";

const PlaceUserList = () => {
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  // หน้าแรกส่งคำค้นมาทาง ?search=
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const log = useBehaviorLogger();
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, isFetching } = useGetAllPlaceQuery({
    page,
    pageSize,
    search: debouncedSearch,
    category: selectedCategory ?? undefined,
  });

  const { data: categoryData } = useGetAllPlaceCategoryQuery({
    page: 1,
    pageSize: 100,
  });

  const places = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  const categories = useMemo(
    () => categoryData?.items.map((c) => c.categoryName) ?? [],
    [categoryData],
  );

  const hasFilters = Boolean(search || selectedCategory);

  const resetAll = () => {
    setSearch("");
    setSelectedCategory(null);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-[#fbf8f5] text-[#141c23] text-left">
      <PlaceListHeader search={search} setSearch={setSearch} setPage={setPage} />

      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 py-8">
        <div className="sticky top-0 z-20 -mx-3 px-3 sm:mx-0 sm:px-0 py-3 bg-[#fbf8f5]/95 backdrop-blur-md mb-4">
          <FilterChips
            categories={categories}
            selectedCategory={selectedCategory}
            onSelect={(cat) => {
              setSelectedCategory(cat);
              setPage(1);
            }}
          />
          <div className="mt-3 flex items-center justify-between text-sm">
            <p className="text-[#5a413a]">
              {isLoading ? "กำลังค้นหา..." : <>พบ <b className="text-[#141c23]">{total}</b> สถานที่</>}
            </p>
            {hasFilters && (
              <button type="button" onClick={resetAll} className="font-semibold text-[#d84a1b] hover:underline">
                ล้างตัวกรอง
              </button>
            )}
          </div>
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
                  metaJson: JSON.stringify({ source: "place_list" }),
                })
              }
            />
          </div>
        ) : (
          <EmptyState onReset={resetAll} />
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

export default PlaceUserList;
