import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Form, Formik } from "formik";
import * as Yup from "yup";
import TextInput from "../../../components/Inputs/TextInput";
import {
  useCreatePlaceTagMutation,
  useUpdatePlaceTagMutation,
} from "../placeTagApi";
import type { PlaceTagDto } from "../placeTagTypes";
import TextAreaInput from "../../../components/Inputs/TextAreaInput";

const placeTagValidationSchema = Yup.object({
  tagName: Yup.string()
    .trim()
    .required("กรุณากรอกชื่อแท็กสถานที่")
    .max(150, "ชื่อแท็กลายเกินไป (ไม่เกิน 150 ตัวอักษร)"),
});

const placeTagFormPage = () => {
  const { tagId } = useParams<{ tagId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const placeTag = location.state?.placeTag as PlaceTagDto | undefined;
  const isEditMode = !!tagId;

  const [createPlaceTag] = useCreatePlaceTagMutation();
  const [updatePlaceTag] = useUpdatePlaceTagMutation();

  const initialValues = {
    tagName: placeTag?.tagName ?? "",
    tagDescription: placeTag?.tagDescription ?? "",
  };

  type FormValues = {
    tagName: string;
    tagDescription: string;
  };
  const handleSubmit = async (values: FormValues) => {
    try {
      const id = Number(tagId);

      if (isEditMode) {
        if (!Number.isFinite(id) || id <= 0) {
          throw new Error("tagId ไม่ถูกต้อง");
        }
        await updatePlaceTag({
          id,
          body: {
            tagId: id,
            tagName: values.tagName.trim(),
            tagDescription: values.tagDescription?.trim(),
          },
        }).unwrap();
      } else {
        await createPlaceTag({
          tagId: 0,
          tagName: values.tagName.trim(),
          tagDescription: values.tagDescription?.trim(),
        }).unwrap();
      }

      navigate("/admin/placeTag");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white p-4 lg:p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-gray-100 p-4 sticky top-0 z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 border">
                  🗂️
                </span>
                {isEditMode ? "แก้ไขประเภทสถานที่" : "เพิ่มประเภทสถานที่ใหม่"}
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                ใช้สำหรับจัดหมวดหมู่สถานที่ เช่น วัฒนธรรม / อาหาร / ชุมชน
              </p>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => navigate("/admin/placeCategory")}
                className="flex-1 sm:flex-none px-4 py-2 bg-gray-100 text-gray-700 font-medium text-sm rounded-xl hover:bg-gray-200 transition"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <Formik
            initialValues={initialValues}
            validationSchema={placeTagValidationSchema}
            enableReinitialize
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, isValid, dirty, submitForm }) => (
              <Form className="space-y-6">
                <TextInput
                  label="ชื่อแท็กสถานที่"
                  name="tagName"
                  placeholder="เช่น ธรรมชาติ, ประวัติศาสตร์, ชุมชน"
                />
                <TextAreaInput
                  label="คำอธิบายแท็กสถานที่ (ถ้ามี)"
                  name="tagDescription"
                  placeholder="คำอธิบายเพิ่มเติมเกี่ยวกับแท็กสถานที่นี้"
                  rows={4}
                />

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => navigate("/admin/placeTag")}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition"
                  >
                    ยกเลิก
                  </button>

                  <button
                    type="button"
                    onClick={submitForm}
                    disabled={isSubmitting || !isValid || !dirty}
                    className={`px-6 py-2 text-white rounded-xl transition ${
                      isSubmitting || !isValid || !dirty
                        ? "bg-blue-300 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 shadow-sm"
                    }`}
                  >
                    {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
                  </button>
                </div>

                <div className="text-xs text-gray-500">
                  * หมวดหมู่ที่ดีช่วยให้ Search/Filter
                  และการแนะนำสถานที่แม่นขึ้น
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default placeTagFormPage;
