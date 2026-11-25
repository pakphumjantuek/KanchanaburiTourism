import { Link, useNavigate, useParams } from "react-router-dom";
import { Form, Formik } from "formik";
import * as Yup from "yup";
import { useMemo, useState } from "react";

import {
  ChecklistCard,
  ErrorSummary,
  Field,
  FOCUS,
  PhotoPicker,
  StepCard,
  TextAreaField,
  TextField,
  chipCls,
} from "../../../components/form/FormKit";

import {
  useCreateLocalDishMutation,
  useUpdateLocalDishMutation,
  useGetByIdQuery,
  useUploadLocalDishImagesBatchMutation,
  useDeleteLocalDishImageMutation,
} from "../LocalDishApi";

import { confirmDelete, showSuccessOk } from "../../../utils";
import type { CreateLocalDishPayload } from "../LocalDishType";

type FormValues = {
  nameTH: string;
  nameEN: string;
  description: string;
  origin: string;
  spicyLevel: number;
  isHalal: boolean;
  isVegetarian: boolean;
  isActive: boolean;
};

const validationSchema = Yup.object({
  nameTH: Yup.string().trim().required("กรุณาระบุชื่อเมนู"),
  spicyLevel: Yup.number().min(0).max(5),
});

const SPICY = [
  { v: 0, label: "ไม่เผ็ด" },
  { v: 1, label: "เผ็ดน้อย" },
  { v: 2, label: "ปานกลาง" },
  { v: 3, label: "เผ็ด" },
  { v: 4, label: "เผ็ดมาก" },
  { v: 5, label: "เผ็ดสุด" },
];

export default function LocalDishForm() {
  const { id } = useParams<{ id?: string }>();
  const isEditMode = !!id;
  const dishIdNum = id ? Number(id) : undefined;
  const navigate = useNavigate();
  const backTo = "/admin/localDish";

  const { data: dish } = useGetByIdQuery(dishIdNum!, { skip: !dishIdNum });

  const [createLocalDish] = useCreateLocalDishMutation();
  const [updateLocalDish] = useUpdateLocalDishMutation();
  const [uploadBatch] = useUploadLocalDishImagesBatchMutation();
  const [deleteImage] = useDeleteLocalDishImageMutation();

  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [replaceOld, setReplaceOld] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const initialValues: FormValues = useMemo(
    () => ({
      nameTH: dish?.nameTH ?? "",
      nameEN: dish?.nameEN ?? "",
      description: dish?.description ?? "",
      origin: dish?.origin ?? "",
      spicyLevel: dish?.spicyLevel ?? 0,
      isHalal: dish?.isHalal ?? false,
      isVegetarian: dish?.isVegetarian ?? false,
      isActive: dish?.isActive ?? true,
    }),
    [dish]
  );

  const toPayload = (v: FormValues): CreateLocalDishPayload => ({
    nameTH: v.nameTH.trim(),
    nameEN: v.nameEN?.trim() || "",
    description: v.description?.trim() || "",
    origin: v.origin?.trim() || "",
    spicyLevel: v.spicyLevel,
    isHalal: v.isHalal,
    isVegetarian: v.isVegetarian,
    isActive: v.isActive,
  });

  const handleSubmit = async (values: FormValues) => {
    setServerError(null);
    let dishId: number | undefined;
    try {
      const payload = toPayload(values);

      if (isEditMode) {
        if (!dishIdNum) throw new Error("ไม่พบเมนูที่จะแก้ไข");
        dishId = dishIdNum;
        await updateLocalDish({ dishId, body: payload }).unwrap();
      } else {
        const created = await createLocalDish(payload).unwrap();
        dishId = created.dishId!;
      }

      if (newFiles.length) {
        try {
          await uploadBatch({ dishId, files: newFiles, coverIndex, replaceOld }).unwrap();
        } catch {
          throw new Error("บันทึกเมนูแล้ว แต่อัปโหลดรูปไม่สำเร็จ ลองเพิ่มรูปอีกครั้งในหน้าแก้ไข");
        }
      }

      await showSuccessOk("บันทึกเมนูเรียบร้อยแล้ว");
      navigate(backTo, { replace: true });
    } catch (err: any) {
      console.error("SUBMIT ERROR:", err);
      setServerError(
        err?.data?.errorMessages?.[0] ?? err?.message ?? "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"
      );
      // สร้างเมนูสำเร็จแต่รูปพลาด → พาไปหน้าแก้ไข จะได้ไม่สร้างซ้ำ
      if (!isEditMode && dishId) navigate(`/admin/localDish/edit/${dishId}`, { replace: true });
    }
  };

  return (
    <div className="@container min-h-screen bg-slate-50 px-4 pb-0 pt-6 text-base text-slate-800 sm:px-6 lg:px-10 lg:pb-10 lg:pt-8">
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        enableReinitialize
        onSubmit={handleSubmit}
      >
        {({ values, setFieldValue, isSubmitting }) => {
          const hasPhoto = newFiles.length > 0 || !!dish?.images?.length;
          const checklist = [
            { label: "ชื่อเมนู", done: values.nameTH.trim() !== "", required: true },
            { label: "รูปอาหาร", done: hasPhoto, required: false },
            { label: "คำอธิบาย", done: values.description.trim() !== "", required: false },
          ];

          const saveButton = (
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 ${FOCUS}`}
            >
              {isSubmitting ? "กำลังบันทึก…" : isEditMode ? "บันทึกการแก้ไข" : "บันทึกเมนู"}
            </button>
          );

          return (
            <Form className="mx-auto w-full max-w-[1500px] space-y-6">
              <div>
                <nav aria-label="ตำแหน่งปัจจุบัน" className="mb-3 flex items-center gap-1.5 text-sm text-slate-500">
                  <Link to={backTo} className={`rounded hover:text-slate-900 hover:underline ${FOCUS}`}>
                    เมนูอาหาร
                  </Link>
                  <span aria-hidden>›</span>
                  <span aria-current="page" className="text-slate-900">
                    {isEditMode ? "แก้ไขเมนู" : "เพิ่มเมนูใหม่"}
                  </span>
                </nav>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                  {isEditMode ? "แก้ไขเมนูอาหาร" : "เพิ่มเมนูอาหารใหม่"}
                </h1>
                <p className="mt-1 text-base text-slate-600">
                  กรอกเฉพาะชื่อเมนูก็บันทึกได้ ส่วนอื่นเติมทีหลังได้
                </p>
              </div>

              <ErrorSummary serverError={serverError} />

              <div className="grid gap-6 @5xl:grid-cols-12">
                <div className="space-y-6 @5xl:col-span-8">
                  <StepCard step={1} title="ชื่อและเรื่องราวของเมนู" subtitle="บอกว่าเมนูนี้คืออะไร">
                    <div className="grid grid-cols-1 gap-5 @3xl:grid-cols-2">
                      <TextField
                        name="nameTH"
                        label="ชื่อเมนู (ไทย)"
                        required
                        placeholder="เช่น ข้าวแช่ชาววัง"
                      />
                      <TextField
                        name="nameEN"
                        label="ชื่อเมนู (อังกฤษ)"
                        placeholder="เช่น Khao Chae"
                        hint="ช่วยให้นักท่องเที่ยวต่างชาติเข้าใจ"
                      />
                    </div>
                    <TextAreaField
                      name="description"
                      label="คำอธิบาย"
                      rows={4}
                      hint="บอกรสชาติ ส่วนผสมเด่น หรือที่มาของเมนู"
                      placeholder="เช่น ข้าวสวยลอยในน้ำเย็นหอมกลิ่นดอกไม้ เสิร์ฟพร้อมเครื่องเคียงทอด"
                    />
                    <TextField
                      name="origin"
                      label="ที่มา / วัฒนธรรม"
                      hint="เช่น มอญ กะเหรี่ยง ภาคกลาง"
                      placeholder="เช่น มอญ"
                    />
                  </StepCard>

                  <StepCard step={2} title="ลักษณะของเมนู" subtitle="ช่วยให้ลูกค้าเลือกได้ตรงใจ">
                    <Field label="ระดับความเผ็ด">
                      <div className="flex flex-wrap gap-2.5" role="group" aria-label="ระดับความเผ็ด">
                        {SPICY.map((s) => (
                          <button
                            key={s.v}
                            type="button"
                            aria-pressed={values.spicyLevel === s.v}
                            onClick={() => setFieldValue("spicyLevel", s.v)}
                            className={chipCls(values.spicyLevel === s.v)}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </Field>

                    <Field label="ข้อมูลเพิ่มเติมสำหรับผู้ทานเฉพาะกลุ่ม">
                      <div className="flex flex-wrap gap-2.5">
                        <button
                          type="button"
                          aria-pressed={values.isHalal}
                          onClick={() => setFieldValue("isHalal", !values.isHalal)}
                          className={chipCls(values.isHalal)}
                        >
                          ฮาลาล
                        </button>
                        <button
                          type="button"
                          aria-pressed={values.isVegetarian}
                          onClick={() => setFieldValue("isVegetarian", !values.isVegetarian)}
                          className={chipCls(values.isVegetarian)}
                        >
                          มังสวิรัติ
                        </button>
                      </div>
                    </Field>

                    <label className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={values.isActive}
                        onChange={(e) => setFieldValue("isActive", e.target.checked)}
                        className="mt-1 h-5 w-5 accent-blue-600"
                      />
                      <span>
                        <span className="block text-base font-semibold text-slate-900">แสดงเมนูนี้ให้ลูกค้าเห็น</span>
                        <span className="block text-sm text-slate-600">
                          ปิดไว้ได้ถ้ายังไม่พร้อมขายหรือเมนูหมดชั่วคราว
                        </span>
                      </span>
                    </label>
                  </StepCard>

                  <StepCard step={3} title="รูปอาหาร" subtitle="รูปน่ากินช่วยให้คนอยากลอง เลือกได้หลายรูป">
                    {isEditMode && dish?.images?.length ? (
                      <div className="space-y-3">
                        <p className="text-base font-semibold text-slate-900">รูปที่มีอยู่</p>
                        <div className="grid grid-cols-2 gap-3 @xl:grid-cols-3 @3xl:grid-cols-4">
                          {dish.images.map((img) => (
                            <div
                              key={img.imageId}
                              className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                            >
                              <img
                                src={`${import.meta.env.VITE_API_BASE_URLS ?? ""}${img.imageUrl}`}
                                alt="รูปเมนู"
                                className="h-32 w-full object-cover"
                              />
                              {img.isCover && (
                                <span className="absolute left-2 top-2 rounded-full bg-white px-2.5 py-1 text-sm font-medium text-slate-900 shadow-sm">
                                  รูปปก
                                </span>
                              )}
                              <button
                                type="button"
                                aria-label="ลบรูปนี้"
                                onClick={async () => {
                                  if (!(await confirmDelete("ต้องการลบรูปนี้ใช่หรือไม่?"))) return;
                                  await deleteImage({ dishId: dishIdNum!, imageId: img.imageId }).unwrap();
                                }}
                                className={`absolute right-2 top-2 rounded-full bg-rose-600 px-3 py-1 text-sm font-medium text-white hover:bg-rose-700 ${FOCUS}`}
                              >
                                ลบ
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <PhotoPicker
                      files={newFiles}
                      setFiles={setNewFiles}
                      coverIndex={coverIndex}
                      setCoverIndex={setCoverIndex}
                    />

                    {isEditMode && newFiles.length > 0 && (
                      <label className="flex items-center gap-3 text-base text-slate-700">
                        <input
                          type="checkbox"
                          checked={replaceOld}
                          onChange={(e) => setReplaceOld(e.target.checked)}
                          className="h-5 w-5 accent-blue-600"
                        />
                        ลบรูปเดิมทั้งหมด แล้วใช้รูปใหม่แทน
                      </label>
                    )}
                  </StepCard>
                </div>

                <aside className="@5xl:col-span-4">
                  <ChecklistCard title="พร้อมบันทึกหรือยัง?" items={checklist}>
                    <div className="hidden space-y-3 @5xl:block">
                      {saveButton}
                      <button
                        type="button"
                        onClick={() => navigate(backTo)}
                        className={`w-full rounded-xl border border-slate-200 bg-white px-6 py-3 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50 ${FOCUS}`}
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </ChecklistCard>
                </aside>
              </div>

              <div className="sticky bottom-0 z-20 -mx-4 flex gap-3 border-t border-slate-200 bg-white/95 p-3 backdrop-blur sm:-mx-6 lg:-mx-10 @5xl:hidden">
                <button
                  type="button"
                  onClick={() => navigate(backTo)}
                  className={`rounded-xl border border-slate-200 bg-white px-5 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 ${FOCUS}`}
                >
                  ยกเลิก
                </button>
                <div className="flex-1">{saveButton}</div>
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
}
