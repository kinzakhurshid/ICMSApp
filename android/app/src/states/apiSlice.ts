// apiSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ApiState {
  loading: boolean;
  error: any;
  response: any;
  token: string | null;
}

const initialState: ApiState = {
  loading: false,
  error: null,
  response: null,
  token: null,
};

const apiSlice = createSlice({
  name: "api",
  initialState,
  reducers: {
    apiRequestStart(state) {
      state.loading = true;
      state.error = null;
      state.response = null;
    },
    apiRequestSuccess(state, action: PayloadAction<any>) {
      state.loading = false;
      state.response = action.payload;
    },
    apiRequestFailure(state, action: PayloadAction<any>) {
      state.loading = false;
      state.error = action.payload;
    },
    setAuthToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
    },
    clearAuthToken(state) {
      state.token = null;
    },
    clearApiState(state) {
      state.loading = false;
      state.error = null;
      state.response = null;
    },
  },
});

// Export all actions
export const {
  apiRequestStart,
  apiRequestSuccess,
  apiRequestFailure,
  setAuthToken,
  clearAuthToken, // Make sure this is exported
  clearApiState,
} = apiSlice.actions;

export default apiSlice.reducer;