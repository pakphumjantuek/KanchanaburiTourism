import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable, type Column } from "../../../components/Table/DataTable";
import TableControls from "../../../components/Table/TableControls";
import Pagination from "../../../components/Table/Pagination";
import { useDebounce } from "../../../utils/useDebounce";
import { confirmDelete, showSuccessOk } from "../../../utils";
import {
  useDeletePlaceTagMutation,
  useGetAllPlaceTagQuery,
} from "../placeTagApi";
import type { PlaceTagDto } from "../placeTagTypes";

const PlaceTagListPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const navigate = useNavigate();

  const [deletePlaceTag] = useDeletePlaceTagMutation();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize]);

  const { data, isLoading } = useGetAllPlaceTagQuery({
    page,
    pageSize,
    search: debouncedSearch,
  });

  const users = data?.items ?? [];
  const total = data?.total ?? 0;

  const columns: Column<PlaceTagDto>[] = [
    {
      header: "ชื่อแท็กสถานที่",
      render: (u) => <span className="font-medium text-sm">{u.tagName}</span>,
    },
    {
      header: "รายละเอียด",
      render: (u) => (
        <span className="font-medium text-sm">{u.tagDescription}</span>
      ),
    },
    {
      header: "จัดการ",
      align: "center",
      render: (placeTag) => (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => {
              navigate(`/admin/placeTag/edit/${placeTag.tagId}`, {
                state: { placeTag },
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
                  deletePlaceTag(placeTag.tagId);
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
          <h1 className="text-3xl font-bold">จัดการแท็กสถานที่ท่องเที่ยว</h1>
          <p className="text-gray-600 text-sm mt-1">
            จำนวนแท็กทั้งหมด: {total} แห่ง
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/placeTag/add")}
          className="bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition shadow-md hover:shadow-lg"
        >
          ➕ เพิ่มแท็กสถานที่
        </button>
      </div>

      <div className="mb-4">
        <TableControls
          search={search}
          pageSize={pageSize}
          searchPlaceholder="ค้นหาชื่อประเภทสถานที่..."
          onSearchChange={setSearch}
          onPageSizeChange={setPageSize}
        />
      </div>

      <DataTable<PlaceTagDto>
        columns={columns}
        data={users}
        isLoading={isLoading}
        emptyText="ไม่มีแท็กสถานที่"
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

export default PlaceTagListPage;
