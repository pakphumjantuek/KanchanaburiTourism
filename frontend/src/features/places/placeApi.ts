import { createApi } from "@reduxjs/toolkit/query/react";
import type { ApiResponse } from "../../api/ApiResponse";
import { baseQueryWithReauth } from "../../api/baseQuery";
import type { PagedResult } from "../../interface/PagedResult";
import type {
  CreatePlaceRequest,
  DishForPlaceDto,
  PlaceBehaviorDashboardDto,
  PlaceDto,
  UpsertPlaceDishPayload,
} from "./placeTypes";

export const placeApi = createApi({
  reducerPath: "placeApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Place"],
  endpoints: (builder) => ({
    getAllPlace: builder.query<
      PagedResult<PlaceDto>,
      { page: number; pageSize: number; search?: string; category?: string; mine?: boolean; eventOnly?: boolean }
    >({
      query: ({ page, pageSize, search, category, mine, eventOnly }) => ({
        url: mine ? "/place/mine" : "/place",
        method: "GET",
        params: { page, pageSize, search, category, eventOnly },
      }),
      transformResponse: (response: ApiResponse<PagedResult<PlaceDto>>) => {
        if (!response.isSuccess || !response.result) {
          throw new Error(
            response.errorMessages?.[0] ?? "โหลดสถานที่ไม่สำเร็จ",
          );
        }
        return response.result;
      },
      providesTags: ["Place"],
    }),
    getById: builder.query<PlaceDto, number>({
      query: (id) => ({ url: `/place/${id}`, method: "GET" }),
      transformResponse: (response: ApiResponse<PlaceDto>) => {
        if (!response.isSuccess || !response.result) {
          throw new Error(
            response.errorMessages?.[0] ?? "โหลดสถานที่ไม่สำเร็จ",
          );
        }
        return response.result;
      },
      providesTags: ["Place"],
    }),

    // ✅ แนะนำให้ create คืน PlaceDto เพื่อเอา placeId ไปอัปโหลดรูป
    createPlace: builder.mutation<PlaceDto, CreatePlaceRequest>({
      query: (body) => ({ url: "/place", method: "POST", body }),
      transformResponse: (response: ApiResponse<PlaceDto>) => {
        if (!response.isSuccess || !response.result) {
          throw new Error(
            response.errorMessages?.[0] ?? "เพิ่มสถานที่ไม่สำเร็จ",
          );
        }
        return response.result;
      },
      invalidatesTags: ["Place"],
    }),

    updatePlace: builder.mutation<
      void,
      { id: number; body: CreatePlaceRequest }
    >({
      query: ({ id, body }) => ({ url: `/place/${id}`, method: "PUT", body }),
      invalidatesTags: ["Place"],
    }),

    setPlaceOwner: builder.mutation<void, { id: number; ownerId: number | null }>({
      query: ({ id, ownerId }) => ({
        url: `/place/${id}/owner`,
        method: "PUT",
        body: { ownerId },
      }),
      invalidatesTags: ["Place"],
    }),
    deletePlace: builder.mutation<void, number>({
      query: (id) => ({ url: `/place/${id}`, method: "DELETE" }),
      invalidatesTags: ["Place"],
    }),

    // ✅ Upload many + coverIndex + replaceOld
    uploadPlaceImagesBatch: builder.mutation<
      void,
      {
        placeId: number;
        files: File[];
        coverIndex: number;
        replaceOld: boolean;
      }
    >({
      query: ({ placeId, files, coverIndex, replaceOld }) => {
        const formData = new FormData();
        files.forEach((f) => formData.append("files", f));
        formData.append("coverIndex", String(coverIndex));
        formData.append("replaceOld", String(replaceOld));

        return {
          url: `/place/${placeId}/images`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Place"],
    }),

    // ✅ Delete image
    deletePlaceImage: builder.mutation<
      void,
      { placeId: number; imageId: number }
    >({
      query: ({ placeId, imageId }) => ({
        url: `/place/${placeId}/images/${imageId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Place"],
    }),

    getDishesByPlaceId: builder.query<DishForPlaceDto[], number>({
      query: (placeId) => `/place/${placeId}/dishes`,
      transformResponse: (res: ApiResponse<DishForPlaceDto[]>) => {
        if (!res.isSuccess)
          throw new Error(res.errorMessages?.[0] ?? "โหลดเมนูไม่สำเร็จ");
        return res.result ?? [];
      },
      providesTags: ["Place"],
    }),

    upsertDishToPlace: builder.mutation<
      void,
      { placeId: number; body: UpsertPlaceDishPayload }
    >({
      query: ({ placeId, body }) => ({
        url: `/place/${placeId}/dishes`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Place"],
    }),

    deleteDishFromPlace: builder.mutation<
      void,
      { placeId: number; dishId: number }
    >({
      query: ({ placeId, dishId }) => ({
        url: `/place/${placeId}/dishes/${dishId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Place"],
    }),
    getPlaceDashboard: builder.query<
  PlaceBehaviorDashboardDto,
  { placeId: number; from?: string; to?: string }
>({
  query: ({ placeId, from, to }) => ({
    url: `/place/${placeId}/dashboard`,
    method: "GET",
    params: { from, to },
  }),
  transformResponse: (
    response: ApiResponse<PlaceBehaviorDashboardDto>,
  ) => {
    if (!response.isSuccess || !response.result) {
      throw new Error(
        response.errorMessages?.[0] ?? "โหลดสถิติสถานที่ไม่สำเร็จ",
      );
    }
    return response.result;
  },
  providesTags: ["Place"],
}),

  }),
});

export const {
  useGetAllPlaceQuery,
  useGetByIdQuery,
  useCreatePlaceMutation,
  useUpdatePlaceMutation,
  useDeletePlaceMutation,
  useSetPlaceOwnerMutation,
  useUploadPlaceImagesBatchMutation,
  useDeletePlaceImageMutation,
  useUpsertDishToPlaceMutation,
  useGetDishesByPlaceIdQuery,
  useDeleteDishFromPlaceMutation,
  useGetPlaceDashboardQuery,
} = placeApi;
