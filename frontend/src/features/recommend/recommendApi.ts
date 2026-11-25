import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../api/baseQuery";
import type { ModelMeta, RecommendationDebug, TrainingStatsDto } from "./recommendTypes";

export const recommendApi = createApi({
  reducerPath: "recommendApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["ModelMeta", "TrainingStats"],
  endpoints: (builder) => ({
    // GET /Recommendation/training-stats?days=90
    getTrainingStats: builder.query<TrainingStatsDto, { days?: number } | void>({
      query: (q) => ({
        url: "/Recommendation/training-stats",
        method: "GET",
        params: { days: q?.days ?? 90 },
      }),
      transformResponse: (res: any) => {
        if (!res?.isSuccess || !res?.stats) throw new Error(res?.message ?? "โหลดสถิติเทรนไม่สำเร็จ");
        return res.stats as TrainingStatsDto;
      },
      providesTags: ["TrainingStats"],
    }),

    // 🔥 GET /recommend/model-meta
    getModelMeta: builder.query<ModelMeta, void>({
      query: () => ({
        url: "/Recommendation/model-meta",
        method: "GET",
      }),
      providesTags: ["ModelMeta"],
    }),

    // 🔥 POST /recommend/train-model
    trainModel: builder.mutation<{ meta: ModelMeta }, void>({
      query: () => ({
        url: "/Recommendation/train-model",
        method: "POST",
      }),
      transformResponse: (res: any) => {
        if (!res?.isSuccess) throw new Error(res?.message ?? "Train failed");

        return { meta: res.meta };
      },
      invalidatesTags: ["ModelMeta"],
    }),
    getRecommendationDebug: builder.query<RecommendationDebug, number>({
      query: (userId) => ({
        url: `/Recommendation/debug/${userId}`,
        method: "GET",
      }),
    }),
  }),
});

export const { useGetModelMetaQuery, useTrainModelMutation, useGetRecommendationDebugQuery, useGetTrainingStatsQuery } = recommendApi;
