import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../api/baseQuery";
import type {
  CreateBehaviorLogRequest,
} from "./behaviorTypes";

export const behaviorApi = createApi({
  reducerPath: "behaviorApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Recommendation", "Behavior", "ModelStatus"],
  endpoints: (builder) => ({
    // ✅ POST /api/behavior
    logBehavior: builder.mutation<
      { isSuccess: boolean; duplicated?: boolean },
      CreateBehaviorLogRequest
    >({
      query: (body) => ({
        url: "/behavior",
        method: "POST",
        body, // body ต้องมี clientEventId + anonymousId แล้ว (มาจาก useBehaviorLogger)
      }),
      // ✅ ถ้าเป็น guest (ไม่มี token) อย่า invalidate tag ที่จะทำให้ refetch endpoint ที่ต้อง login
      invalidatesTags: (_result, _error, _arg) => {
        const hasToken = !!localStorage.getItem("token"); // หรือวิธีเช็ค auth ของคุณ
        return hasToken ? ["Behavior", "Recommendation"] : [];
      },
    }),

 
  }),
});

export const {
  useLogBehaviorMutation,
} = behaviorApi;
