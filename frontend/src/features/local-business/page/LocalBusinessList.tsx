import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable, type Column } from "../../../components/Table/DataTable";
import TableControls from "../../../components/Table/TableControls";
import Pagination from "../../../components/Table/Pagination";
import { useDebounce } from "../../../utils/useDebounce";
import { confirmDelete, showSuccessOk } from "../../../utils";
import { useDeletePlaceMutation, useGetAllPlaceQuery } from "../../places/placeApi";
import type { PlaceDto } from "../../places/placeTypes";

const LocalBusinessListPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");

  const debouncedSearch = useDebounce(search, 400);
  const navigate = useNavigate();

  const [deletePlace] = useDeletePlaceMutation();
  
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize]);

  const { data, isLoading } = useGetAllPlaceQuery({
    page,
    pageSize,
    search: debouncedSearch,
    category: "อาหาร",
  });

  const users = data?.items ?? [];
  const total = data?.total ?? 0;

  const columns: Column<PlaceDto>[] = [
    {
      header: "ชื่อสถานที่",
      render: (u) => <span className="font-medium text-sm">{u.name}</span>,
    },
    {
      header: "ประเภท",
      render: (place) => (
        <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          {place.categoryName || "-"}
        </span>
      ),
    },
    {
      header: "ที่อยู่",
      render: (place) => (
        <span className="text-xs text-gray-600">
          {place.address
            ? place.address.substring(0, 35) +
              (place.address.length > 35 ? "..." : "")
            : "-"}
        </span>
      ),
    },
    {
      header: "เวลาเปิด-ปิด",
      render: (place) => (
        <button
          className="text-xs text-blue-600 hover:underline"
          onClick={() =>
            navigate(`/admin/places/${place.placeId}/opening`, {
              state: { placeName: place.name },
            })
          }
        >
          ตั้งเวลาเปิด-ปิด
        </button>
      ),
    },
    {
      header: "เมนูอาหาร",
      render: (place) => (
        <button
          className="text-xs text-orange-600 hover:underline"
          onClick={() =>
            navigate(`/admin/places/${place.placeId}/menus`, {
              state: { placeName: place.name },
            })
          }
        >
          จัดการเมนู
        </button>
      ),
    },
   {
      header: "รายระเอียด",
      render: (place) => (
        <button
          className="text-xs text-blue-600 hover:underline"
          onClick={() =>
            navigate(`/admin/place/dashboard/${place.placeId}/`, {
              state: { placeName: place.name },
            })
          }
        >
          ดูสถิติ
        </button>
      ),
    },
    {
      header: "จัดการ",
      align: "center",
      render: (place) => (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => {
              navigate(`/admin/place/edit/${place.placeId}`, {
                state: { place },
              });
            }}
            className="bg-yellow-600 text-white px-4 py-1.5 rounded text-xs font-medium hover:bg-yellow-700 transition"
          >
            แก้ไข
          </button>
          <button
            onClick={() => {
              confirmDelete().then((confirmed) => {
                if (confirmed) {
                  deletePlace(place.placeId);
                  showSuccessOk("ลบข้อมูลสำเร็จ!");
                }
              });
            }}
            className="bg-rose-600 text-white px-4 py-1.5 rounded text-xs font-medium hover:bg-rose-700 transition"
          >
            ลบ
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen w-full px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">จัดการร้านค้าผู้ประกอบการ</h1>
          <p className="text-gray-600 text-sm mt-1">
            จำนวนสถานที่ทั้งหมด: {total} แห่ง
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/place/add")}
          className="bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition shadow-md hover:shadow-lg"
        >
          ➕ เพิ่มสถานที่
        </button>     
      </div>
      <div className="mb-4 ">
        <TableControls
          search={search}
          pageSize={pageSize}
          searchPlaceholder="ค้นหาร้านค้าผู้ประกอบการ..."
          onSearchChange={setSearch}
          onPageSizeChange={setPageSize}
        />     
      </div>

      <DataTable<PlaceDto>
        columns={columns}
        data={users}
        isLoading={isLoading}
        emptyText="ไม่มีสถานที่ท่องเที่ยว"
      />

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
      />
    </div>
  );
};

export default LocalBusinessListPage;
