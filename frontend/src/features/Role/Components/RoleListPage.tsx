import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable, type Column } from "../../../components/Table/DataTable";
import TableControls from "../../../components/Table/TableControls";
import Pagination from "../../../components/Table/Pagination";
import { useDebounce } from "../../../utils/useDebounce";
import { useGetAllRoleQuery, useDeleteRoleMutation } from "../roleApi";
import type { roleDto } from "../roleTypes";
import { confirmDelete, showSuccessOk } from "../../../utils";

const RoleListPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const navigate = useNavigate();

  const [deleteRole] = useDeleteRoleMutation();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize]);

  const { data, isLoading } = useGetAllRoleQuery({
    page,
    pageSize,
    search: debouncedSearch,
  });

  const users = data?.items ?? [];
  const total = data?.total ?? 0;

  const columns: Column<roleDto>[] = [
    {
      header: "รหัสสิทธิ์",
      render: (u) => <span className="font-medium">{u.roleId}</span>,
    },
    {
      header: "ชื่อสิทธิ์",
      render: (u) => <span className="font-medium">{u.roleName}</span>,
    },
    {
      header: "จัดการ",
      align: "center",
      render: (role) => (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => {
              navigate(`/admin/role/edit/${role.roleId}`, { state: { role } });
            }}
            className="bg-yellow-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-yellow-700 transition"
          >
            แก้ไข
          </button>
          <button
            onClick={() => {
              confirmDelete().then((confirmed) => {
                if (confirmed) {
                  deleteRole(role.roleId);
                  showSuccessOk("ลบข้อมูลสำเร็จ!");
                }
              });
            }}
            className="bg-rose-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-rose-700 transition"
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
        <h1 className="text-3xl font-bold">สิทธิ์ผู้ใช้งาน</h1>
        <button
          onClick={() => navigate("/admin/role/add")}
          className="bg-green-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition"
        >
          เพิ่มข้อมูล
        </button>
      </div>

      <div className="mb-4">
        <TableControls
          search={search}
          pageSize={pageSize}
          searchPlaceholder="ชื่อสิทธิ์ / รหัสสิทธิ์..."
          onSearchChange={setSearch}
          onPageSizeChange={setPageSize}
        />
      </div>

      <DataTable<roleDto>
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

export default RoleListPage;
