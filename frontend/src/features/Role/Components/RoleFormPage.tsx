import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Form, Formik } from "formik";
import * as Yup from "yup";
import TextInput from "../../../components/Inputs/TextInput";
import { useCreateRoleMutation, useUpdateRoleMutation } from "../roleApi";
import type { roleDto } from "../roleTypes";

const RoleFormPage = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const role = location.state?.role as roleDto | undefined;

  const [createRole] = useCreateRoleMutation();
  const [updateRole] = useUpdateRoleMutation();

  const isEditMode = !!id;

  return (
    <div className="min-h-screen w-full px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">
          {isEditMode ? "แก้ไขสิทธิ์" : "เพิ่มสิทธิ์ใหม่"}
        </h1>

        <div className="bg-white rounded-lg p-6 shadow-md">
          <Formik
            initialValues={{
              roleName: role?.roleName || "",
            }}
            validationSchema={Yup.object({
              roleName: Yup.string().required("กรุณากรอกชื่อสิทธิ์"),
            })}
            onSubmit={async (values) => {
              try {
                if (isEditMode && role) {
                  await updateRole({
                    id: role.roleId,
                    body: {
                      roleId: role.roleId,
                      roleName: values.roleName,
                    },
                  });
                } else {
                  await createRole({
                    roleId: 0,
                    roleName: values.roleName,
                  });
                }
                navigate("/admin/role");
              } catch (error) {
                console.error(error);
              }
            }}
          >
            {({ isSubmitting, isValid, dirty }) => (
              <Form className="space-y-6">
                <TextInput
                  label="ชื่อสิทธิ์"
                  name="roleName"
                  placeholder="กรุณากรอกชื่อสิทธิ์"
                />

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => navigate("/admin/role")}
                    className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !isValid || !dirty}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default RoleFormPage;
