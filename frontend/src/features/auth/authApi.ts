import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UserProfile,
} from "./authTypes";
import type { ApiResponse } from "../../api/ApiResponse";
import { setCredentials, clearAuth, setUser } from "./authSlice";
import { baseQueryWithReauth } from "../../api/baseQuery";
import type { PagedResult } from "../../interface/PagedResult";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Profile"],
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<AuthResponse>) => {
        if (!response.isSuccess || !response.result) {
          throw new Error(response.errorMessages[0] ?? "Login failed");
        }
        return response.result;
      },
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data));
          // เขียนทับโปรไฟล์ที่แคชไว้ (อาจเป็น 401 จากตอนยังไม่ล็อกอิน) ไม่งั้น route guard จะเด้งกลับ /login
          dispatch(authApi.util.upsertQueryData("getProfile", undefined, data.user));
        } catch {}
      },
    }),

    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<AuthResponse>) => {
        if (!response.isSuccess || !response.result) {
          throw new Error(response.errorMessages[0] ?? "Register failed");
        }
        return response.result;
      },
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data));
          // เขียนทับโปรไฟล์ที่แคชไว้ (อาจเป็น 401 จากตอนยังไม่ล็อกอิน) ไม่งั้น route guard จะเด้งกลับ /login
          dispatch(authApi.util.upsertQueryData("getProfile", undefined, data.user));
        } catch {}
      },
    }),

    logout: builder.mutation<{ message: string }, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      transformResponse: (response: ApiResponse<{ message: string }>) => {
        if (response.result) return response.result;
        return { message: response.errorMessages?.[0] ?? "" };
      },
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(clearAuth());
           dispatch(authApi.util.resetApiState());
          dispatch(authApi.util.invalidateTags(["Profile"]));
        }
      },
    }),

    getProfile: builder.query<UserProfile, { userid?: number } | void>({
      query: (arg) => ({
        url: "/users/profile",
        method: "GET",
        params: arg?.userid ? { userid: arg.userid } : undefined,
      }),
      transformResponse: (response: ApiResponse<UserProfile>) => {
        if (!response.isSuccess || !response.result) {
          throw new Error(response.errorMessages?.[0] ?? "โหลดโปรไฟล์ไม่สำเร็จ");
        }
        return response.result;
      },
      providesTags: ["Profile"],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const isSelf = !arg || !arg.userid;
          if (isSelf) dispatch(setUser(data));
        } catch {}
      },
    }),

    getAllUser: builder.query<
      PagedResult<UserProfile>,
      { page: number; pageSize: number; search?: string }
    >({
      query: ({ page, pageSize, search }) => ({
        url: "/users",
        method: "GET",
        params: { page, pageSize, search },
      }),
      transformResponse: (response: ApiResponse<PagedResult<UserProfile>>) => {
        if (!response.isSuccess || !response.result) {
          throw new Error(response.errorMessages?.[0] ?? "โหลดผู้ใช้ไม่สำเร็จ");
        }
        return response.result;
      },
      providesTags: ["Profile"],
    }),

    // ✅ PUT /users/profile (FormData)
    updateProfile: builder.mutation<void, FormData>({
      query: (body) => ({
        url: "/users/profile",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Profile"],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useGetAllUserQuery,
} = authApi;
