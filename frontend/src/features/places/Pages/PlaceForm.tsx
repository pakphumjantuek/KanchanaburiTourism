import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Form, Formik } from "formik";
import Swal from "sweetalert2";
import * as Yup from "yup";
import { useEffect, useMemo, useState } from "react";
import { Check, ImagePlus, X } from "lucide-react";

import MapPicker from "../../../components/MapPicker";
import { ErrorSummary, FOCUS, INPUT, inputTone, Field, StepCard, TextField, chipCls } from "../../../components/form/FormKit";
import { endPresets, formatFullDateTime, fromLocalInput, toLocalInput } from "../../../utils/eventTime";

import {
  useCreatePlaceMutation,
  useUpdatePlaceMutation,
  useUploadPlaceImagesBatchMutation,
  useDeletePlaceImageMutation,
  useSetPlaceOwnerMutation,
  useGetByIdQuery,
} from "../placeApi";

import { useGetAllPlaceCategoryQuery } from "../../placeCategory/placeCategoryApi";
import { useGetAllPlaceTagQuery } from "../../placeTag/placeTagApi";
import type { CreatePlaceRequest, PlaceDto } from "../placeTypes";
import { confirmDelete, showSuccessOk } from "../../../utils";
import { useCreateDefaultOpeningMutation } from "../../placeOpening/placeOpenApi";
import { useGetProfileQuery } from "../../auth/authApi";
import { useGetApprovedOperatorsQuery } from "../../operator/operatorApi";

// ---------- helpers ----------
const toNumOrUndef = (v: string) => (v.trim() === "" ? undefined : Number(v));
const toNum = (v: string) => Number(v);

type FormValues = {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  avgVisitMinutes: string; // เก็บเป็น string ในฟอร์ม
  priceRange: string; // เก็บเป็น string ในฟอร์ม
  categoryId: string; // เก็บเป็น string ในฟอร์ม (select มักคืน string)
  tagIds: number[]; // เลือกหลาย tag
  isActive: boolean;
  isEvent: boolean; // อีเวนต์ชั่วคราว
  eventStart: string; // datetime-local; ว่าง = แสดงทันที
  eventEnd: string; // datetime-local; จำเป็นเมื่อเป็นอีเวนต์
};

const validationSchema = Yup.object({
  name: Yup.string().trim().required("กรุณากรอกชื่อสถานที่"),
  categoryId: Yup.string()
    .required("กรุณาเลือกหมวดหมู่")
    .test("categoryId", "กรุณาเลือกหมวดหมู่", (v) => Number(v) > 0),
  latitude: Yup.number().typeError("กรุณาระบุละติจูด").required("กรุณาระบุละติจูด"),
  longitude: Yup.number().typeError("กรุณาระบุลองจิจูด").required("กรุณาระบุลองจิจูด"),
  description: Yup.string(),
  address: Yup.string(),
  avgVisitMinutes: Yup.string(),
  priceRange: Yup.string(),
  tagIds: Yup.array().of(Yup.number()).default([]),
  isActive: Yup.boolean().default(true),
  isEvent: Yup.boolean().default(false),
  eventStart: Yup.string(),
  eventEnd: Yup.string(),
});

const VISIT_PRESETS = [30, 60, 90, 120, 180];

export default function PlaceFormPage() {
  const { id } = useParams<{ id?: string }>();
  const isEditMode = !!id;

  const navigate = useNavigate();
  const location = useLocation();
  const placeFromState = location.state?.place as PlaceDto | undefined;

  const placeIdNum = id ? Number(id) : undefined;
  const { data: placeFromApi } = useGetByIdQuery(placeIdNum!, {
    skip: !placeIdNum,
  });

  const { data: placeCategories } = useGetAllPlaceCategoryQuery({ page: 1, pageSize: 100 });
  const { data: placeTags } = useGetAllPlaceTagQuery({ page: 1, pageSize: 100 });

  const place = placeFromApi ?? placeFromState;

  const categoryOptions = useMemo(
    () =>
      placeCategories?.items?.map((c) => ({
        value: String(c.categoryId),
        label: c.categoryName,
      })) ?? [],
    [placeCategories]
  );

  const tagList = placeTags?.items ?? [];

  const [createPlace] = useCreatePlaceMutation();
  const [updatePlace] = useUpdatePlaceMutation();
  const [uploadBatch] = useUploadPlaceImagesBatchMutation();
  const [deleteImage] = useDeletePlaceImageMutation();
  const [createDefaultOpening] = useCreateDefaultOpeningMutation();
  const { data: me } = useGetProfileQuery();
  const isAdmin = me?.roleName === "Admin";
  const { data: operators = [] } = useGetApprovedOperatorsQuery(undefined, {
    skip: !isAdmin || !isEditMode,
  });
  const [setPlaceOwner, { isLoading: savingOwner }] = useSetPlaceOwnerMutation();

  // ผู้ประกอบการลงได้เฉพาะหมวด "อาหาร" → ไม่ต้องให้เลือก ระบบใส่ให้เอง
  const isOperatorOnly = me?.roleName === "Operator";
  const visibleCategoryOptions = useMemo(
    () =>
      isOperatorOnly
        ? categoryOptions.filter((o) => o.label === "อาหาร")
        : categoryOptions,
    [isOperatorOnly, categoryOptions]
  );

  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [replaceOld, setReplaceOld] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pinned, setPinned] = useState(false); // สร้างใหม่: ต้องปักหมุดเองอย่างน้อย 1 ครั้ง
  const [showCoords, setShowCoords] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [priceMode, setPriceMode] = useState<"none" | "free" | "paid">("none");

  const hasPin = isEditMode || pinned;
  // ผู้ประกอบการลงร้านค้า → ใช้คำว่า "ร้าน" แทน "สถานที่"
  const noun = isOperatorOnly ? "ร้าน" : "สถานที่";

  // โหมดแก้ไข: ตั้งค่าตัวเลือกค่าเข้าตามข้อมูลเดิม
  useEffect(() => {
    if (!place) return;
    if (place.priceRange == null) setPriceMode("none");
    else setPriceMode(place.priceRange === 0 ? "free" : "paid");
  }, [place]);

  const previews = useMemo(() => newFiles.map((f) => URL.createObjectURL(f)), [newFiles]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const addFiles = (list: FileList | File[] | null) => {
    const imgs = Array.from(list ?? []).filter((f) => f.type.startsWith("image/"));
    if (!imgs.length) return;
    setNewFiles((prev) => {
      const next = [...prev, ...imgs];
      return next;
    });
  };

  const removeNewFile = (idx: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));
    setCoverIndex((c) => (idx < c ? c - 1 : idx === c ? 0 : c));
  };

  const initialValues: FormValues = useMemo(
    () => ({
      name: place?.name ?? "",
      description: place?.description ?? "",
      latitude: place?.latitude ?? 14.0228,
      longitude: place?.longitude ?? 99.5328,
      address: place?.address ?? "",
      avgVisitMinutes: place?.avgVisitMinutes != null ? String(place.avgVisitMinutes) : "",
      priceRange: place?.priceRange != null ? String(place.priceRange) : "",
      categoryId:
        place?.categoryId != null
          ? String(place.categoryId)
          : isOperatorOnly && visibleCategoryOptions.length === 1
            ? visibleCategoryOptions[0].value
            : "",
      tagIds: (place as any)?.tagIds ?? [],
      isActive: place?.isActive ?? true,
      isEvent: place?.isEvent ?? false,
      eventStart: toLocalInput(place?.eventStartAt),
      eventEnd: toLocalInput(place?.eventEndAt),
    }),
    [place, isOperatorOnly, visibleCategoryOptions]
  );

  const toPayload = (v: FormValues): CreatePlaceRequest => ({
    name: v.name.trim(),
    description: v.description?.trim() || undefined,
    latitude: v.latitude,
    longitude: v.longitude,
    address: v.address?.trim() || undefined,
    avgVisitMinutes: toNumOrUndef(v.avgVisitMinutes),
    priceRange: toNumOrUndef(v.priceRange),
    categoryId: v.categoryId ? toNum(v.categoryId) : undefined,
    isActive: v.isActive,
    tagIds: v.tagIds,
    isEvent: v.isEvent,
    eventStartAt: v.isEvent ? fromLocalInput(v.eventStart) : undefined,
    eventEndAt: v.isEvent ? fromLocalInput(v.eventEnd) : undefined,
  });

  const uploadIfAny = async (placeId: number) => {
    if (!newFiles.length) return;
    try {
      await uploadBatch({ placeId, files: newFiles, coverIndex, replaceOld }).unwrap();
    } catch (e) {
      // อัปโหลดรูปพลาดไม่ทำให้การบันทึกล้ม แต่แจ้งผู้ใช้ภายหลัง
      console.error("upload failed:", e);
      throw new Error("บันทึกข้อมูลแล้ว แต่อัปโหลดรูปไม่สำเร็จ ลองเพิ่มรูปอีกครั้งในหน้าแก้ไข");
    }
  };

  const handleSubmit = async (values: FormValues) => {
    setServerError(null);

    if (values.isEvent) {
      const goEvent = () =>
        document.getElementById("step-event")?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (!values.eventEnd) {
        setServerError("เลือกให้เป็นอีเวนต์แล้ว กรุณาระบุวันเวลาสิ้นสุดในข้อสุดท้าย");
        goEvent();
        return;
      }
      const startMs = values.eventStart ? new Date(values.eventStart).getTime() : null;
      const endMs = new Date(values.eventEnd).getTime();
      if (startMs != null && endMs <= startMs) {
        setServerError("เวลาสิ้นสุดอีเวนต์ต้องหลังเวลาเริ่ม");
        goEvent();
        return;
      }
      // แก้ข้อมูลอื่นของอีเวนต์ที่จบแล้วได้โดยไม่แตะเวลา แต่ถ้าเปลี่ยนเวลาสิ้นสุดต้องเป็นอนาคต
      const endUnchanged = isEditMode && !!place?.eventEndAt && toLocalInput(place.eventEndAt) === values.eventEnd;
      if (!endUnchanged && endMs <= Date.now()) {
        setServerError("เวลาสิ้นสุดอีเวนต์ต้องเป็นเวลาในอนาคต");
        goEvent();
        return;
      }
    }

    if (!hasPin) {
      setServerError(`กรุณาปักหมุดตำแหน่ง${noun}บนแผนที่ในข้อ 2 ก่อนบันทึก`);
      document.getElementById("step-location")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    let placeId: number | undefined;
    try {
      const payload = toPayload(values);

      if (isEditMode) {
        if (!place?.placeId) throw new Error("ไม่พบสถานที่ที่จะแก้ไข");
        placeId = place.placeId;
        await updatePlace({ id: placeId, body: payload }).unwrap();
      } else {
        const created = await createPlace(payload).unwrap();
        placeId = created.placeId;

        // ตั้งเวลาเปิด-ปิดเริ่มต้นให้อัตโนมัติ (แก้ได้ภายหลัง)
        try {
          await createDefaultOpening({
            placeId,
            body: { openTime: "09:00:00", closeTime: "18:00:00" },
          }).unwrap();
        } catch (e: any) {
          console.warn("CREATE DEFAULT OPENING FAILED:", e);
        }
      }

      await uploadIfAny(placeId);

      if (isOperatorOnly && !isEditMode) {
        // ร้านใหม่: บอกขั้นต่อไปที่ต้องทำให้ร้านพร้อมใช้งาน
        const r = await Swal.fire({
          icon: "success",
          title: "สร้างร้านเรียบร้อยแล้ว",
          text: "ขั้นต่อไป: ใส่เมนูของร้าน และตั้งเวลาเปิด-ปิด",
          showDenyButton: true,
          showCancelButton: true,
          confirmButtonText: "เพิ่มเมนูร้าน",
          denyButtonText: "ตั้งเวลาทำการ",
          cancelButtonText: "กลับไปรายการ",
          allowOutsideClick: false,
          confirmButtonColor: "#2563eb",
          denyButtonColor: "#475569",
          cancelButtonColor: "#94a3b8",
        });
        const state = { placeName: values.name.trim() };
        if (r.isConfirmed) navigate(`/admin/places/${placeId}/menus`, { replace: true, state });
        else if (r.isDenied) navigate(`/admin/places/${placeId}/opening`, { replace: true, state });
        else navigate("/admin/place", { replace: true });
        return;
      }
      await showSuccessOk(`บันทึก${noun}เรียบร้อยแล้ว`);
      navigate("/admin/place", { replace: true });
    } catch (err: any) {
      console.error("SUBMIT ERROR:", err);
      const msg =
        err?.data?.errorMessages?.[0] ??
        err?.message ??
        "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
      setServerError(msg);
      // สร้างสถานที่สำเร็จแต่รูปพลาด → พาไปหน้าแก้ไขเพื่อไม่ให้สร้างซ้ำ
      if (!isEditMode && placeId) navigate(`/admin/place/edit/${placeId}`, { replace: true });
    }
  };

  return (
    <div className="@container min-h-screen bg-slate-50 px-4 pb-0 pt-6 text-sm text-slate-800 selection:bg-blue-100 selection:text-blue-900 sm:px-6 lg:px-10 lg:pb-10 lg:pt-8">
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        enableReinitialize
        onSubmit={handleSubmit}
      >
        {({ values, setFieldValue, isSubmitting, errors, touched }) => {
          const hasName = values.name.trim() !== "";
          const hasCategory = Number(values.categoryId) > 0;
          const hasPhoto = newFiles.length > 0 || !!place?.images?.length;
          const hasDesc = values.description.trim() !== "";

          const checklist: { label: string; done: boolean; required: boolean }[] = [
            { label: `ชื่อ${noun}`, done: hasName, required: true },
            ...(isOperatorOnly ? [] : [{ label: "หมวดหมู่", done: hasCategory, required: true }]),
            { label: "ปักหมุดบนแผนที่", done: hasPin, required: true },
            ...(values.isEvent ? [{ label: "เวลาสิ้นสุดอีเวนต์", done: values.eventEnd !== "", required: true }] : []),
            { label: "รูปภาพ", done: hasPhoto, required: false },
            { label: "คำอธิบาย", done: hasDesc, required: false },
          ];
          const missingRequired = checklist.filter((c) => c.required && !c.done).length;

          const catError = touched.categoryId && errors.categoryId ? errors.categoryId : undefined;

          const saveButton = (
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 ${FOCUS}`}
            >
              {isSubmitting ? "กำลังบันทึก…" : isEditMode ? "บันทึกการแก้ไข" : `บันทึก${noun}`}
            </button>
          );

          return (
            <Form className="mx-auto w-full max-w-[1500px] space-y-6">
              <div>
                <nav aria-label="ตำแหน่งปัจจุบัน" className="mb-3 flex items-center gap-1.5 text-sm text-slate-500">
                  <Link to="/admin/place" className={`rounded hover:text-slate-900 hover:underline ${FOCUS}`}>
                    {isOperatorOnly ? "ร้านของฉัน" : "สถานที่"}
                  </Link>
                  <span aria-hidden>›</span>
                  <span aria-current="page" className="text-slate-900">
                    {isEditMode ? `แก้ไข${noun}` : `เพิ่ม${noun}ใหม่`}
                  </span>
                </nav>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                  {isEditMode ? `แก้ไขข้อมูล${noun}` : `เพิ่ม${noun}ใหม่`}
                </h1>
                <p className="mt-1 text-base text-slate-600">
                  กรอกทีละข้อตามลำดับ ข้อที่เขียนว่า “จำเป็น” ต้องกรอก ส่วนข้ออื่นเว้นไว้ก่อนได้
                </p>
              </div>

              <ErrorSummary serverError={serverError} />

              <div className="grid gap-6 @5xl:grid-cols-12">
                {/* ------- ซ้าย: 4 ขั้นตอน ------- */}
                <div className="space-y-6 @5xl:col-span-8">
                  {/* 1 */}
                  <StepCard
                    step={1}
                    title={isOperatorOnly ? "ชื่อและเรื่องราวของร้าน" : "ชื่อและประเภท"}
                    subtitle={isOperatorOnly ? "บอกลูกค้าว่าร้านของคุณคือร้านอะไร" : "บอกว่าสถานที่นี้คืออะไร"}
                  >
                    <TextField
                      name="name"
                      label={`ชื่อ${noun}`}
                      required
                      hint="พิมพ์ชื่อที่ลูกค้าเรียกหรือเห็นหน้าร้าน"
                      placeholder="เช่น ร้านข้าวแช่ริมน้ำ"
                    />

                    {isOperatorOnly ? null : (
                      <Field label="หมวดหมู่" required hint="เลือกประเภทที่ตรงกับสถานที่ที่สุด" error={catError}>
                        <select
                          name="categoryId"
                          value={values.categoryId}
                          onChange={(e) => setFieldValue("categoryId", e.target.value)}
                          aria-invalid={!!catError}
                          className={`${INPUT} ${inputTone(!!catError)}`}
                        >
                          <option value="">— เลือกหมวดหมู่ —</option>
                          {visibleCategoryOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                    )}

                    <Field
                      label="คำอธิบาย"
                      hint="เล่าสั้น ๆ ว่าร้านนี้มีอะไรเด่น เช่น เมนูแนะนำ บรรยากาศ ความเป็นมา"
                    >
                      <textarea
                        value={values.description}
                        onChange={(e) => setFieldValue("description", e.target.value)}
                        rows={5}
                        placeholder="เช่น ร้านอาหารไทยริมแม่น้ำแคว เปิดมากว่า 20 ปี เมนูเด่นคือปลากะพงทอดน้ำปลา"
                        className={`${INPUT} h-auto ${inputTone(false)}`}
                      />
                    </Field>
                  </StepCard>

                  {/* 2 */}
                  <StepCard
                    id="step-location"
                    step={2}
                    title="ที่ตั้ง"
                    subtitle={`พิมพ์ชื่อ${noun}ในช่องค้นหาของแผนที่ หรือคลิกบนแผนที่เพื่อปักหมุด`}
                  >
                    <div className="relative z-0 rounded-2xl">
                      <MapPicker
                        simple={isOperatorOnly}
                        lat={Number(values.latitude) || 13.7563}
                        lng={Number(values.longitude) || 100.5018}
                        onChange={(lat, lng, address) => {
                          setPinned(true);
                          setServerError(null);
                          setFieldValue("latitude", Number(lat.toFixed(6)));
                          setFieldValue("longitude", Number(lng.toFixed(6)));
                          if (address) setFieldValue("address", address);
                        }}
                      />
                    </div>

                    <p
                      className={`flex items-center gap-2 text-sm ${
                        hasPin ? "text-emerald-800" : "text-slate-600"
                      }`}
                    >
                      {hasPin ? (
                        <>
                          <Check className="h-5 w-5" aria-hidden /> ปักหมุดแล้ว
                        </>
                      ) : (
                        `ยังไม่ได้ปักหมุด — คลิกบนแผนที่ตรงตำแหน่ง${noun}`
                      )}
                    </p>

                    <TextField
                      name="address"
                      label="ที่อยู่"
                      hint="ระบบเติมให้อัตโนมัติเมื่อปักหมุด แก้ไขเองได้"
                      placeholder="เช่น 123 ถ.แสงชูโต ต.บ้านเหนือ อ.เมือง กาญจนบุรี"
                    />

                    <div>
                      <button
                        type="button"
                        onClick={() => setShowCoords((s) => !s)}
                        aria-expanded={showCoords}
                        className={`rounded text-sm font-medium text-blue-700 underline-offset-2 hover:underline ${FOCUS}`}
                      >
                        {showCoords ? "ซ่อนพิกัด" : "ดู/แก้พิกัด (สำหรับผู้ที่ต้องการระบุเอง)"}
                      </button>
                      {showCoords && (
                        <div className="mt-4 grid grid-cols-1 gap-5 @xl:grid-cols-2">
                          <TextField name="latitude" label="ละติจูด" type="number" placeholder="เช่น 14.0228" />
                          <TextField name="longitude" label="ลองจิจูด" type="number" placeholder="เช่น 99.5328" />
                        </div>
                      )}
                    </div>
                  </StepCard>

                  {/* 3 */}
                  <StepCard
                    step={3}
                    title="รูปภาพ"
                    subtitle="รูปสวย ๆ ทำให้คนสนใจมากขึ้น เลือกได้หลายรูปพร้อมกัน"
                  >
                    {isEditMode && place?.images?.length ? (
                      <div className="space-y-3">
                        <p className="text-base font-semibold text-slate-900">รูปที่มีอยู่</p>
                        <div className="grid grid-cols-2 gap-3 @xl:grid-cols-3 @3xl:grid-cols-4">
                          {place.images.map((img) => (
                            <div
                              key={img.imageId}
                              className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                            >
                              <img
                                src={`${import.meta.env.VITE_API_BASE_URLS ?? ""}${img.imageUrl}`}
                                alt="รูปของสถานที่"
                                className="h-36 w-full object-cover"
                              />
                              {img.isCover && (
                                <span className="absolute left-2 top-2 rounded-full bg-white px-2.5 py-1 text-sm font-medium text-slate-900 shadow-sm">
                                  รูปปก
                                </span>
                              )}
                              <button
                                type="button"
                                aria-label="ลบรูปนี้"
                                className={`absolute right-2 top-2 rounded-full bg-rose-600 px-3 py-1 text-sm font-medium text-white hover:bg-rose-700 ${FOCUS}`}
                                onClick={async () => {
                                  if (!(await confirmDelete("ต้องการลบรูปนี้ใช่หรือไม่?"))) return;
                                  await deleteImage({ placeId: place.placeId, imageId: img.imageId }).unwrap();
                                }}
                              >
                                ลบ
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <label
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragging(true);
                      }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragging(false);
                        addFiles(e.dataTransfer.files);
                      }}
                      className={`relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-blue-600 ${
                        dragging
                          ? "border-blue-600 bg-blue-50"
                          : "border-slate-300 bg-slate-50 hover:border-blue-500 hover:bg-blue-50/50"
                      }`}
                    >
                      <ImagePlus className="h-10 w-10 text-blue-600" aria-hidden />
                      <span className="text-lg font-semibold text-slate-900">กดเพื่อเลือกรูป หรือลากรูปมาวางที่นี่</span>
                      <span className="text-sm text-slate-600">รองรับไฟล์ภาพทุกชนิด เลือกได้หลายรูป</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        onChange={(e) => {
                          addFiles(e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </label>

                    {newFiles.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-base text-slate-700">
                          เลือกแล้ว <b>{newFiles.length}</b> รูป — กดที่รูปเพื่อเลือกเป็น <b>รูปปก</b> (รูปที่แสดงเป็นรูปแรก)
                        </p>
                        <div className="grid grid-cols-2 gap-3 @xl:grid-cols-3 @3xl:grid-cols-4">
                          {newFiles.map((file, idx) => {
                            const isCover = idx === coverIndex;
                            return (
                              <div
                                key={`${file.name}-${file.lastModified}-${idx}`}
                                className={`relative overflow-hidden rounded-xl border bg-slate-50 ${
                                  isCover ? "border-blue-600 ring-2 ring-blue-600" : "border-slate-200"
                                }`}
                              >
                                <button
                                  type="button"
                                  aria-pressed={isCover}
                                  onClick={() => setCoverIndex(idx)}
                                  className={`block w-full ${FOCUS}`}
                                >
                                  <img src={previews[idx]} alt={file.name} className="h-36 w-full object-cover" />
                                  <span
                                    className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-sm font-medium shadow-sm ${
                                      isCover ? "bg-blue-600 text-white" : "bg-white text-slate-900"
                                    }`}
                                  >
                                    {isCover ? "รูปปก" : "ตั้งเป็นรูปปก"}
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  aria-label={`เอารูป ${file.name} ออก`}
                                  onClick={() => removeNewFile(idx)}
                                  className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm hover:bg-rose-50 hover:text-rose-700 ${FOCUS}`}
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

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

                  {/* 4 (ซ่อนสำหรับผู้ประกอบการ) */}
                  {!isOperatorOnly && (
                  <StepCard
                    step={4}
                    title="รายละเอียดเพิ่มเติม"
                    subtitle="ข้อมูลเหล่านี้ช่วยให้ผู้มาเยือนวางแผนได้ง่ายขึ้น (ไม่บังคับ)"
                  >
                    <Field label="ใช้เวลาเที่ยวชมโดยประมาณ" hint="กี่นาทีที่คนมักใช้ที่นี่">
                      <div className="flex flex-wrap items-center gap-2.5">
                        {VISIT_PRESETS.map((m) => {
                          const on = values.avgVisitMinutes === String(m);
                          return (
                            <button
                              key={m}
                              type="button"
                              aria-pressed={on}
                              onClick={() => setFieldValue("avgVisitMinutes", on ? "" : String(m))}
                              className={`rounded-full border px-4 py-2 text-base transition-colors ${FOCUS} ${
                                on
                                  ? "border-blue-600 bg-blue-600 text-white"
                                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {m >= 60 ? `${m / 60} ชม.` : `${m} นาที`}
                            </button>
                          );
                        })}
                        <span className="flex items-center gap-2 text-base text-slate-600">
                          หรือพิมพ์เอง
                          <input
                            type="number"
                            min={0}
                            value={values.avgVisitMinutes}
                            onChange={(e) => setFieldValue("avgVisitMinutes", e.target.value)}
                            className={`w-28 ${INPUT} ${inputTone(false)} py-2`}
                            aria-label="เวลาเที่ยวชมเป็นนาที"
                          />
                          นาที
                        </span>
                      </div>
                    </Field>

                    <Field label="ค่าเข้า">
                      <div className="flex flex-wrap items-center gap-2.5">
                        {(
                          [
                            ["none", "ไม่ระบุ"],
                            ["free", "เข้าฟรี"],
                            ["paid", "มีค่าเข้า"],
                          ] as const
                        ).map(([mode, label]) => {
                          const on = priceMode === mode;
                          return (
                            <button
                              key={mode}
                              type="button"
                              aria-pressed={on}
                              onClick={() => {
                                setPriceMode(mode);
                                setFieldValue("priceRange", mode === "free" ? "0" : "");
                              }}
                              className={`rounded-full border px-4 py-2 text-base transition-colors ${FOCUS} ${
                                on
                                  ? "border-blue-600 bg-blue-600 text-white"
                                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                        {priceMode === "paid" && (
                          <span className="flex items-center gap-2 text-base text-slate-600">
                            <input
                              type="number"
                              min={1}
                              value={values.priceRange}
                              onChange={(e) => setFieldValue("priceRange", e.target.value)}
                              placeholder="เช่น 50"
                              className={`w-32 ${INPUT} ${inputTone(false)} py-2`}
                              aria-label="ค่าเข้าเป็นบาท"
                            />
                            บาท
                          </span>
                        )}
                      </div>
                    </Field>

                    <Field label="ป้ายคำอธิบาย (แท็ก)" hint="เลือกคำที่ตรงกับสถานที่ ช่วยให้ลูกค้าค้นเจอง่ายขึ้น เลือกได้หลายอัน">
                      <div className="flex flex-wrap gap-2.5">
                        {tagList.map((t: any) => {
                          const tid = Number(t.tagId);
                          const active = values.tagIds.includes(tid);
                          return (
                            <button
                              key={t.tagId}
                              type="button"
                              aria-pressed={active}
                              onClick={() => {
                                const next = active
                                  ? values.tagIds.filter((x) => x !== tid)
                                  : [...values.tagIds, tid];
                                setFieldValue("tagIds", next);
                              }}
                              className={`rounded-full border px-4 py-2 text-base transition-colors ${FOCUS} ${
                                active
                                  ? "border-blue-600 bg-blue-600 text-white"
                                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {t.tagName ?? t.name ?? `แท็ก ${t.tagId}`}
                            </button>
                          );
                        })}
                        {!tagList.length && <p className="text-sm text-slate-500">ยังไม่มีแท็กในระบบ</p>}
                      </div>
                    </Field>

                    <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      เวลาเปิด-ปิด: ระบบตั้งให้เป็น 09:00–18:00 ทุกวันอัตโนมัติ แก้ได้ภายหลังจากหน้ารายการสถานที่
                    </p>
                  </StepCard>
                  )}

                  {/* อีเวนต์ชั่วคราว (ผู้ประกอบการและแอดมินใช้ได้) */}
                  <StepCard
                    id="step-event"
                    step={isOperatorOnly ? 4 : 5}
                    title="อีเวนต์ชั่วคราว"
                    subtitle={`ถ้า${noun}นี้เป็นงานหรือกิจกรรมที่จัดแค่ช่วงหนึ่ง ตั้งวันเวลาสิ้นสุดไว้ได้ ระบบจะซ่อนให้เองเมื่อหมดเวลา`}
                  >
                    <div className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={values.isEvent}
                        aria-label={`${noun}นี้เป็นอีเวนต์ชั่วคราว`}
                        onClick={() => setFieldValue("isEvent", !values.isEvent)}
                        className={`relative mt-0.5 inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${FOCUS} ${
                          values.isEvent ? "bg-blue-600" : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform motion-reduce:transition-none ${
                            values.isEvent ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <span>
                        <span className="block text-base font-semibold text-slate-900">{noun}นี้เป็นอีเวนต์ชั่วคราว</span>
                        <span className="block text-sm text-slate-600">
                          เมื่อเลยเวลาสิ้นสุด ผู้ใช้จะไม่เห็น{noun}นี้ในรายการ การแนะนำ หรือการจัดทริปอีก (หน้าแอดมินยังเห็น)
                          และข้อมูลการใช้งานของอีเวนต์จะไม่ถูกนำไปเทรนระบบแนะนำ
                        </span>
                      </span>
                    </div>

                    {values.isEvent && (
                      <>
                        {isEditMode && place?.eventStatus === "ended" && (
                          <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-base text-amber-900">
                            อีเวนต์นี้จบเมื่อ {formatFullDateTime(place.eventEndAt)} ตอนนี้ผู้ใช้ไม่เห็น{noun}นี้ ต่อเวลาสิ้นสุดเพื่อเปิดอีกครั้ง
                            หรือปิดสวิตช์ด้านบนเพื่อกลับเป็น{noun}ปกติ
                          </p>
                        )}

                        <div className="grid grid-cols-1 gap-5 @3xl:grid-cols-2">
                          <Field label="เริ่มแสดง" hint="เว้นว่าง = แสดงทันทีที่บันทึก">
                            <input
                              type="datetime-local"
                              value={values.eventStart}
                              onChange={(e) => setFieldValue("eventStart", e.target.value)}
                              className={`${INPUT} ${inputTone(false)}`}
                            />
                          </Field>
                          <Field label="สิ้นสุดและหยุดแสดงผลเมื่อ" required hint="เลยเวลานี้ ระบบซ่อนให้เองโดยไม่ต้องมีใครมากดปิด">
                            <input
                              type="datetime-local"
                              value={values.eventEnd}
                              onChange={(e) => setFieldValue("eventEnd", e.target.value)}
                              className={`${INPUT} ${inputTone(false)}`}
                            />
                          </Field>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="text-base text-slate-600">ตั้งเวลาสิ้นสุดอย่างเร็ว:</span>
                          {endPresets.map((p) => (
                            <button key={p.key} type="button" onClick={() => setFieldValue("eventEnd", p.build())} className={chipCls(false)}>
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </StepCard>
                </div>

                {/* ------- ขวา: เช็กลิสต์ + บันทึก ------- */}
                <aside className="space-y-6 @5xl:col-span-4">
                  <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 @5xl:sticky @5xl:top-6">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">พร้อมบันทึกหรือยัง?</h2>
                      <p className="text-sm text-slate-600">
                        {missingRequired === 0
                          ? "ข้อมูลที่จำเป็นครบแล้ว กดบันทึกได้เลย"
                          : `ยังเหลือข้อที่จำเป็นอีก ${missingRequired} ข้อ`}
                      </p>
                    </div>

                    <ul className="space-y-2.5">
                      {checklist.map((c) => (
                        <li key={c.label} className="flex items-center gap-3 text-base">
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                              c.done
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-slate-300 bg-white text-transparent"
                            }`}
                            aria-hidden
                          >
                            <Check className="h-4 w-4" />
                          </span>
                          <span className={c.done ? "text-slate-900" : "text-slate-600"}>{c.label}</span>
                          {!c.done && (
                            <span className={`ml-auto text-sm ${c.required ? "text-rose-700" : "text-slate-500"}`}>
                              {c.required ? "จำเป็น" : "แนะนำ"}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>

                    <div className="hidden space-y-3 @5xl:block">
                      {saveButton}
                      <button
                        type="button"
                        onClick={() => navigate("/admin/place")}
                        className={`w-full rounded-xl border border-slate-200 bg-white px-6 py-3 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50 ${FOCUS}`}
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>

                  {isAdmin && isEditMode && place && (
                    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                      <h2 className="text-lg font-semibold text-slate-900">เจ้าของสถานที่</h2>
                      <p className="text-sm text-slate-600">
                        ผู้ประกอบการที่ดูแลสถานที่นี้ (ไม่เลือก = แอดมินดูแลเอง) บันทึกทันทีเมื่อเลือก
                      </p>
                      <select
                        disabled={savingOwner}
                        value={place.ownerId ?? ""}
                        onChange={async (e) => {
                          const v = e.target.value;
                          await setPlaceOwner({
                            id: place.placeId,
                            ownerId: v === "" ? null : Number(v),
                          }).unwrap();
                          await showSuccessOk("บันทึกเจ้าของเรียบร้อยแล้ว");
                        }}
                        className={`${INPUT} ${inputTone(false)} disabled:opacity-60`}
                      >
                        <option value="">ไม่มีเจ้าของ</option>
                        {operators.map((o) => (
                          <option key={o.userId} value={o.userId}>
                            {o.businessName ? `${o.businessName} — ` : ""}
                            {o.displayName} ({o.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </aside>
              </div>

              {/* แถบบันทึกด้านล่าง สำหรับจอแคบ */}
              <div className="sticky bottom-0 z-20 -mx-4 flex gap-3 border-t border-slate-200 bg-white/95 p-3 backdrop-blur sm:-mx-6 lg:-mx-10 @5xl:hidden">
                <button
                  type="button"
                  onClick={() => navigate("/admin/place")}
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
