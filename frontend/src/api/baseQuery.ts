import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type { RootState } from "../store";
import type { ApiResponse } from "./ApiResponse";
import type { AuthResponse } from "../features/auth/authTypes";
import { setCredentials, clearAuth } from "../features/auth/authSlice";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const ACCESS_TOKEN_KEY = "auth_accessToken";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token =
      state.auth.accessToken || localStorage.getItem(ACCESS_TOKEN_KEY);

    if (token) headers.set("Authorization", `Bearer ${token}`);

    return headers;
  },
});

let refreshingPromise: Promise<any> | null = null;

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const url =
      typeof args === "string" ? args : (args.url as string | undefined) ?? "";

    if (url.includes("/auth/refresh")) {
      api.dispatch(clearAuth());
      return result;
    }

    // ✅ refresh lock กันยิงซ้อน
    if (!refreshingPromise) {
      refreshingPromise = Promise.resolve(
        rawBaseQuery(
          { url: "/auth/refresh", method: "POST" },
          api,
          extraOptions
        )
      ).finally(() => {
        refreshingPromise = null;
      });
    }
    const refreshResult = await refreshingPromise;
    const apiRes = refreshResult.data as ApiResponse<AuthResponse> | undefined;

    if (apiRes?.isSuccess && apiRes.result) {
      api.dispatch(setCredentials(apiRes.result));
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(clearAuth());
    }
  }

  return result;
};
