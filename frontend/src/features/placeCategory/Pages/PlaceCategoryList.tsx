import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable, type Column } from "../../../components/Table/DataTable";
import TableControls from "../../../components/Table/TableControls";
import Pagination from "../../../components/Table/Pagination";
import { useDebounce } from "../../../utils/useDebounce";
import { confirmDelete, showSuccessOk } from "../../../utils";
import {
  useDeletePlaceCategoryMutation,
  useGetAllPlaceCategoryQuery,
} from "../placeCategoryApi";
import type { PlaceCategory } from "../placeCategoryTypes";

const PlaceListPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const navigate = useNavigate();

  const [deletePlaceCategory] = useDeletePlaceCategoryMutation();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize]);

  const { data, isLoading } = useGetAllPlaceCategoryQuery({
    page,
    pageSize,
    search: debouncedSearch,
  });

  const users = data?.items ?? [];
  const total = data?.total ?? 0;

  const columns: Column<PlaceCategory>[] = [
    {
      header: "ชื่อหมวดหมู่",
      render: (u) => (
        <span className="font-medium text-sm">{u.categoryName}</span>
      ),
    },
    {
      header: "รายละเอียด",
      render: (u) => (
        <span className="font-medium text-sm">{u.categoryDescription}</span>
      ),
    },
    {
      header: "จัดการ",
      align: "center",
      render: (placeCategory) => (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => {
              navigate(
                `/admin/placeCategory/edit/${placeCategory.categoryId}`,
                { state: { placeCategory } }
              );
            }}
            className="bg-yellow-600 text-white px-4 py-1.5 rounded text-xs font-medium hover:bg-yellow-700 transition"
          >
            แก้ไข
          </button>
          <button
            onClick={() => {
              confirmDelete().then((confirmed) => {
                if (confirmed) {
                  deletePlaceCategory(placeCategory.categoryId);
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
          <h1 className="text-3xl font-bold">จัดการหมวดหมู่สถานที่</h1>
          <p className="text-gray-600 text-sm mt-1">
            จำนวนหมวดหมู่ทั้งหมด: {total} หมวด
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/placeCategory/add")}
          className="bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition shadow-md hover:shadow-lg"
        >
          ➕ เพิ่มหมวดหมู่สถานที่
        </button>
      </div>

      <div className="mb-4">
        <TableControls
          search={search}
          pageSize={pageSize}
          searchPlaceholder="ค้นหาชื่อหมวดหมู่..."
          onSearchChange={setSearch}
          onPageSizeChange={setPageSize}
        />
      </div>

      <DataTable<PlaceCategory>
        columns={columns}
        data={users}
        isLoading={isLoading}
        emptyText="ไม่มีหมวดหมู่สถานที่"
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

export default PlaceListPage;
