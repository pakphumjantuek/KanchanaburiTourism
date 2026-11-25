import { authApi } from "../auth/authApi";
import type { ApiResponse } from "../../api/ApiResponse";

export type OperatorStatus = "Pending" | "Approved" | "Rejected";

export interface OperatorApplication {
  operatorApplicationId: number;
  userId: number;
  userName?: string | null;
  email?: string | null;
  businessName: string;
  contactPhone?: string | null;
  description?: string | null;
  status: OperatorStatus;
  rejectReason?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
}

export interface ApprovedOperator {
  userId: number;
  displayName: string;
  email: string;
  businessName?: string | null;
}

export interface ApplyOperatorRequest {
  businessName: string;
  contactPhone?: string;
  description?: string;
}

function unwrap<T>(response: ApiResponse<T>, fallback: string): T {
  if (!response.isSuccess) {
    throw new Error(response.errorMessages?.[0] ?? fallback);
  }
  return response.result as T;
}

// ฝัง endpoint เข้า authApi (ใช้ tag "Profile" ร่วมกัน เพื่อรีเฟรชหลังอนุมัติ/ปฏิเสธ)
export const operatorApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyOperatorApplication: builder.query<OperatorApplication | null, void>({
      query: () => ({ url: "/operator/my-application", method: "GET" }),
      transformResponse: (r: ApiResponse<OperatorApplication | null>) =>
        unwrap(r, "โหลดคำขอไม่สำเร็จ"),
      providesTags: ["Profile"],
    }),
    applyOperator: builder.mutation<OperatorApplication, ApplyOperatorRequest>({
      query: (body) => ({ url: "/operator/apply", method: "POST", body }),
      transformResponse: (r: ApiResponse<OperatorApplication>) =>
        unwrap(r, "ส่งคำขอไม่สำเร็จ"),
      invalidatesTags: ["Profile"],
    }),
    getOperatorApplications: builder.query<OperatorApplication[], string | void>({
      query: (status) => ({
        url: "/operator/applications",
        method: "GET",
        params: status ? { status } : undefined,
      }),
      transformResponse: (r: ApiResponse<OperatorApplication[]>) =>
        unwrap(r, "โหลดคำขอไม่สำเร็จ") ?? [],
      providesTags: ["Profile"],
    }),
    getApprovedOperators: builder.query<ApprovedOperator[], void>({
      query: () => ({ url: "/operator/approved", method: "GET" }),
      transformResponse: (r: ApiResponse<ApprovedOperator[]>) =>
        unwrap(r, "โหลดรายชื่อผู้ประกอบการไม่สำเร็จ") ?? [],
      providesTags: ["Profile"],
    }),
    approveOperator: builder.mutation<OperatorApplication, number>({
      query: (id) => ({
        url: `/operator/applications/${id}/approve`,
        method: "POST",
      }),
      transformResponse: (r: ApiResponse<OperatorApplication>) =>
        unwrap(r, "อนุมัติไม่สำเร็จ"),
      invalidatesTags: ["Profile"],
    }),
    rejectOperator: builder.mutation<
      OperatorApplication,
      { id: number; reason?: string }
    >({
      query: ({ id, reason }) => ({
        url: `/operator/applications/${id}/reject`,
        method: "POST",
        body: { reason },
      }),
      transformResponse: (r: ApiResponse<OperatorApplication>) =>
        unwrap(r, "ปฏิเสธไม่สำเร็จ"),
      invalidatesTags: ["Profile"],
    }),
  }),
});

export const {
  useGetMyOperatorApplicationQuery,
  useApplyOperatorMutation,
  useGetOperatorApplicationsQuery,
  useGetApprovedOperatorsQuery,
  useApproveOperatorMutation,
  useRejectOperatorMutation,
} = operatorApi;
