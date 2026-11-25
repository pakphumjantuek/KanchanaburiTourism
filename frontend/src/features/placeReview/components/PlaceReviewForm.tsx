import { useEffect, useMemo, useState } from "react";
import { RatingStars } from "./RatingStars";
import {
  useGetMyReviewQuery,
  useUpsertMyReviewMutation,
  useDeleteMyReviewMutation,
} from "../PlaceReviewApi"; // <-- ปรับ path ให้ตรง
import { showError, showSuccessOk } from "../../../utils"; // <-- ปรับ path ให้ตรง
import { useBehaviorLogger } from "../../behavior/useBehaviorLogger";

type Props = {
  placeId: number;
  isLoggedIn: boolean;
};

export function PlaceReviewForm({ placeId, isLoggedIn }: Props) {
  const { data: myReview, isLoading: isMyLoading, error } = useGetMyReviewQuery(
    { placeId },
    { skip: !isLoggedIn }
  );

  const [upsert, { isLoading: isSaving }] = useUpsertMyReviewMutation();
  const [del, { isLoading: isDeleting }] = useDeleteMyReviewMutation();
  const log = useBehaviorLogger();

  const initial = useMemo(() => {
    return {
      rating: myReview?.rating ?? 0,
      comment: myReview?.comment ?? "",
    };
  }, [myReview?.rating, myReview?.comment]);

  const [rating, setRating] = useState(initial.rating);
  const [comment, setComment] = useState(initial.comment);

  useEffect(() => {
    setRating(initial.rating);
    setComment(initial.comment);
  }, [initial.rating, initial.comment]);

  const canSubmit = isLoggedIn && rating >= 1 && comment.trim().length > 0;

const onSave = async () => {
  try {
    const res = await upsert({
      placeId,
      body: { rating, comment: comment.trim() },
    }).unwrap();

    await log({
      placeId,
      actionType: "REVIEW",
      actionValue: rating,
      metaJson: JSON.stringify({
        placeReviewId: res?.placeReviewId ?? null,
        hasComment: Boolean(comment?.trim()),
        length: comment?.trim()?.length ?? 0,
      }),
    }).catch(() => {});

    showSuccessOk("บันทึกรีวิวสำเร็จ");
  } catch (e: any) {
    showError(
      e?.data?.errorMessages?.[0] ??
        e?.message ??
        "บันทึกรีวิวไม่สำเร็จ",
    );
  }
};


  const onDelete = async () => {
    if (!myReview) return;
    if (!confirm("ต้องการลบรีวิวของคุณหรือไม่?")) return;

    try {
      await del({ placeId }).unwrap();
      showSuccessOk("ลบรีวิวสำเร็จ");
      setRating(0);
      setComment("");
    } catch (e: any) {
      showError(e?.data?.errorMessages?.[0] ?? e?.message ?? "ลบรีวิวไม่สำเร็จ");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <p className="text-sm text-slate-700">
          กรุณาเข้าสู่ระบบเพื่อเขียนรีวิว
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900">รีวิวของฉัน</h3>
          <p className="text-sm text-slate-600">
            ให้ดาวและเขียนความคิดเห็นสั้น ๆ
          </p>
        </div>

        {myReview ? (
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            เคยรีวิวแล้ว
          </span>
        ) : (
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200">
            ยังไม่เคยรีวิว
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <RatingStars value={rating} onChange={setRating} />
        <span className="text-sm font-bold text-slate-800">{rating}/5</span>
      </div>

      <textarea
        className="mt-4 w-full min-h-[120px] rounded-xl border border-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
        placeholder="เล่าประสบการณ์ของคุณ..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={!canSubmit || isSaving}
          className="flex-1 bg-emerald-400 hover:bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-500 text-slate-900 font-extrabold py-3 rounded-xl transition-all"
        >
          {isSaving ? "กำลังบันทึก..." : "บันทึกรีวิว"}
        </button>

        {myReview && (
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            className="px-4 bg-white hover:bg-slate-50 text-rose-600 font-extrabold py-3 rounded-xl border border-slate-200 transition-all"
          >
            {isDeleting ? "กำลังลบ..." : "ลบ"}
          </button>
        )}
      </div>

      {error ? (
        <p className="mt-3 text-sm text-rose-600">
          โหลดรีวิวของฉันไม่สำเร็จ
        </p>
      ) : null}

      {isMyLoading ? (
        <p className="mt-3 text-sm text-slate-500">กำลังโหลดข้อมูล...</p>
      ) : null}
    </div>
  );
}
