import { useMemo, useState } from "react";
import { useAppSelector } from "../../../store/hooks";
import { useGetReviewsByPlaceQuery } from "../PlaceReviewApi";
import { PlaceReviewForm } from "../components/PlaceReviewForm";
import { RatingStars } from "../components/RatingStars";
import { formatThaiDate } from "../../../utils";

type Props = {
  placeId: number;
};

// ✅ ช่วยอ่านฟิลด์แบบปลอดภัยขึ้นนิดนึง
type ReviewLike = {
  reviewId?: number;
  rating?: number | null;
  comment?: string | null;

  // 👇 ชื่อจาก API (แนะนำให้ backend ส่งมาเป็น DisplayName / displayName)
  displayName?: string | null;
  userName?: string | null;
  createdByName?: string | null;

  // 👇 ต้องมีอย่างน้อย 1 ตัว เพื่อระบุเจ้าของรีวิว
  userId?: number | null;
  createdByUserId?: number | null;

  createdAt?: string | null;
  createdDateTime?: string | null;
};

export function PlaceReviews({ placeId }: Props) {
  const user = useAppSelector((s) => s.auth.user);
  const isLoggedIn = Boolean(user);

  const take = 10;
  const [skip, setSkip] = useState(0);

  const { data: reviews = [], isLoading, isFetching, error } =
    useGetReviewsByPlaceQuery({ placeId, skip, take });

  const avg = useMemo(() => {
    if (!reviews.length) return 0;
    const s = reviews.reduce((a, r: any) => a + (r.rating ?? 0), 0);
    return Math.round((s / reviews.length) * 10) / 10;
  }, [reviews]);

  return (
    <div className="flex flex-col gap-6">
      <PlaceReviewForm placeId={placeId} isLoggedIn={isLoggedIn} />

      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              รีวิวจากผู้ใช้งาน
            </h3>
            <p className="text-sm text-slate-600">
              {reviews.length
                ? `คะแนนเฉลี่ย (จากรายการที่โหลด): ${avg}/5`
                : "ยังไม่มีรีวิว"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <RatingStars value={Math.round(avg)} readOnly sizeClassName="w-5 h-5" />
            <span className="text-sm font-bold text-slate-800">{avg}</span>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {isLoading ? (
            <p className="text-sm text-slate-500">กำลังโหลดรีวิว...</p>
          ) : error ? (
            <p className="text-sm text-rose-600">โหลดรีวิวไม่สำเร็จ</p>
          ) : reviews.length === 0 ? (
            <div className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-4">
              ยังไม่มีรีวิว ลองเป็นคนแรกที่รีวิวสถานที่นี้ 🙂
            </div>
          ) : (
            (reviews as ReviewLike[]).map((r, idx) => {
              const createdAt = r.createdAt ?? r.createdDateTime ?? null;

              // ✅ ระบุว่าเป็นรีวิวของฉันไหม (ต้องมี userId/createdByUserId จาก API)
              const reviewUserId = r.userId ?? r.createdByUserId ?? null;

              // 🔧 ปรับตรงนี้ให้ตรงกับโครง auth user ของคุณ
              // ถ้าใน state ใช้ user.userId ก็ใช้แบบนี้
              const myUserId = (user as any)?.userId ?? (user as any)?.id ?? null;

              const isMine = Boolean(myUserId && reviewUserId && myUserId === reviewUserId);

         
              const userName =
                (isMine ? (user as any)?.DisplayName : null) ||
                r.displayName ||
                r.userName ||
                r.createdByName ||
                "ผู้ใช้งาน";
                
                console.log('userName:', userName);
              return (
                <div
                  key={r.reviewId ?? idx}
                  className="border border-slate-200 rounded-2xl p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-extrabold text-slate-900">
                        {userName}
                        {isMine ? (
                          <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ของฉัน
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatThaiDate(createdAt ?? '')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <RatingStars value={r.rating ?? 0} readOnly sizeClassName="w-4 h-4" />
                      <span className="text-xs font-bold text-slate-700">
                        {r.rating ?? 0}/5
                      </span>
                    </div>
                  </div>

                  {r.comment ? (
                    <p className="mt-3 text-sm text-slate-700 whitespace-pre-wrap">
                      {r.comment}
                    </p>
                  ) : null}
                </div>
              );
            })
          )}
        </div>

        <div className="mt-5 flex justify-between">
          <button
            type="button"
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold hover:bg-slate-50 disabled:opacity-50"
            disabled={skip === 0 || isFetching}
            onClick={() => setSkip((s) => Math.max(0, s - take))}
          >
            ก่อนหน้า
          </button>

          <button
            type="button"
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold hover:bg-slate-50 disabled:opacity-50"
            disabled={reviews.length < take || isFetching}
            onClick={() => setSkip((s) => s + take)}
          >
            ถัดไป
          </button>
        </div>

        {isFetching ? (
          <p className="mt-3 text-sm text-slate-500">กำลังโหลด...</p>
        ) : null}
      </div>
    </div>
  );
}