import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthResponse, UserProfile } from "./authTypes";

export interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
}

const ACCESS_TOKEN_KEY = "auth_accessToken";
const USER_KEY = "auth_user";

function loadInitialState(): AuthState {
  try {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    const userJson = localStorage.getItem(USER_KEY);
    const user = userJson ? (JSON.parse(userJson) as UserProfile) : null;
    return { user, accessToken: token };
  } catch {
    return { user: null, accessToken: null };
  }
}

const initialState: AuthState = loadInitialState();

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<AuthResponse>) {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      localStorage.setItem(ACCESS_TOKEN_KEY, action.payload.accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(action.payload.user));
    },
    setUser(state, action: PayloadAction<UserProfile | null>) {
      state.user = action.payload;
      if (action.payload) {
        localStorage.setItem(USER_KEY, JSON.stringify(action.payload));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    },
    clearAuth(state) {
      state.accessToken = null;
      state.user = null;
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    },
  },
});

export const { setCredentials, clearAuth, setUser } = authSlice.actions;
export default authSlice.reducer;
