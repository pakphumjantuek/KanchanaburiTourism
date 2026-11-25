import React from "react";
import { DataTable, type Column } from "../../components/Table/DataTable";
import TableControls from "../../components/Table/TableControls";
import Pagination from "../../components/Table/Pagination";
import { useGetAllUserQuery } from "../../features/auth/authApi";
import type { UserProfile } from "../../features/auth/authTypes"; // ✅ ปรับ path ให้ถูก
import { useDebounce } from "../../utils/useDebounce";
import { useNavigate } from "react-router-dom";

const UserListPage = () => {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounce(search, 400);
  const navigate = useNavigate();

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize]);

  const { data, isLoading } = useGetAllUserQuery({
    page,
    pageSize,
    search: debouncedSearch,
  });

  const users = data?.items ?? [];
  const total = data?.total ?? 0;

  const columns: Column<UserProfile>[] = [
    {
      header: "ชื่อ",
      render: (u) => <span className="font-medium">{u.displayName}</span>,
    },
    {
      header: "รูปโปรไฟล์",
      align: "center",
      render: (u) =>
        u.avatarUrl ? (
          <img
            src={`${import.meta.env.VITE_API_BASE_URLS}${u.avatarUrl}`}
            className="w-10 h-10 rounded-full object-cover mx-auto"
          />
          
        ) : (
          <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center text-white font-bold mx-auto">
            {u.displayName.charAt(0)}
          </div>
        ),
    },
    { header: "อีเมล", render: (u) => u.email },
    {
      header: "เบอร์โทร",
      align: "center",
      render: (u) => u.phoneNumber || "-",
    },
    {
      header: "สิทธิ์",
      align: "center",
      render: (u) => (
        <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
          {u.roleName}
        </span>
      ),
    },
    {
      header: "จัดการ",
      align: "center",
      render: (u) => (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => navigate(`/admin/profile/${u.userId}`)}
            className="bg-green-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition"
          >
            โปรไฟล์
          </button>
           <button
            onClick={() => navigate(`/admin/users/${u.userId}/interests`)}
            className="bg-orange-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-orange-700 transition"
          >
            ความสนใจ
          </button>
           <button
            onClick={() => navigate(`/admin/recommendDebug/${u.userId}`)}
            className="bg-purple-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition"
          >
            ML
          </button>
          {/* <button className="bg-yellow-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-yellow-700 transition">
            แก้ไข
          </button>

          <button className="bg-rose-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-rose-700 transition">
            ลบ
          </button> */}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen w-full px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-6">รายชื่อผู้ใช้งาน</h1>

      <div className="mb-4">
        <TableControls
          search={search}
          pageSize={pageSize}
          searchPlaceholder="ชื่อ / อีเมล..."
          onSearchChange={setSearch}
          onPageSizeChange={setPageSize}
        />
      </div>

      <DataTable<UserProfile>
        columns={columns}
        data={users}
        isLoading={isLoading}
        emptyText="ไม่มีข้อมูลผู้ใช้"
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

export default UserListPage;
