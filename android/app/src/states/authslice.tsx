// src/states/userSlice.ts

import { User } from "../types";
import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  currentUser: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

export const fetchUser = createAsyncThunk<
  User, // Return type
  void, // No argument needed
  { rejectValue: string }
>("user/fetchUser", async (_, thunkAPI) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token found");

    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return {
      ...res.data.user,
      token,
    };
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      err.response?.data?.message || err.message || "Failed to fetch user"
    );
  }
});

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
      localStorage.setItem("token", action.payload.token);
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
      localStorage.removeItem("token");
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.currentUser) {
        state.currentUser = { ...state.currentUser, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.currentUser = action.payload;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
        state.currentUser = null;
        state.isAuthenticated = false;
        localStorage.removeItem("token"); // clean up if failed
      });
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, updateUser } =
  userSlice.actions;

export default userSlice.reducer;
