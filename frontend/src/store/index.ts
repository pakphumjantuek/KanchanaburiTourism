import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import { authApi } from "../features/auth/authApi";
import { setupListeners } from "@reduxjs/toolkit/query";
import { roleApi } from "../features/Role/roleApi";
import { interestApi } from "../features/interests/interestApi";
import { placeApi } from "../features/places/placeApi";
import { placeCategoryApi } from "../features/placeCategory/placeCategoryApi";
import { placeTagApi } from "../features/placeTag/placeTagApi";
import { tripApi } from "../features/trip/tripApi";
import { recommendApi } from "../features/recommend/recommendApi";
import { behaviorApi } from "../features/behavior/behavior";
import { homeApi } from "../features/home/homeApi";
import { placeOpenApi } from "../features/placeOpening/placeOpenApi";
import { placeReviewApi } from "../features/placeReview/PlaceReviewApi";
import { localDishApi } from "../features/localDish/LocalDishApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [roleApi.reducerPath]: roleApi.reducer,
    [interestApi.reducerPath]: interestApi.reducer,
    [placeApi.reducerPath]: placeApi.reducer,
    [placeCategoryApi.reducerPath]: placeCategoryApi.reducer,
    [placeTagApi.reducerPath]: placeTagApi.reducer,
    [tripApi.reducerPath]: tripApi.reducer,
    [behaviorApi.reducerPath]: behaviorApi.reducer,
    [recommendApi.reducerPath]: recommendApi.reducer,
    [homeApi.reducerPath]: homeApi.reducer,
    [placeOpenApi.reducerPath]: placeOpenApi.reducer,
    [placeReviewApi.reducerPath]: placeReviewApi.reducer,
    [localDishApi.reducerPath]: localDishApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      roleApi.middleware,
      interestApi.middleware,
      placeApi.middleware,
      placeCategoryApi.middleware,
      placeTagApi.middleware,
      tripApi.middleware,
      behaviorApi.middleware,
      recommendApi.middleware,
      homeApi.middleware,
      placeOpenApi.middleware,
      placeReviewApi.middleware,
      localDishApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

setupListeners(store.dispatch);
