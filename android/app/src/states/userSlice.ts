import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../types'; // Adjust the import path as necessary

interface UserState {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  isLoggedIn: boolean;
  token?: string;
}

const initialState: UserState = {
  currentUser: null,
  loading: false,
  error: null,
  isLoggedIn: false,
  token: undefined,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    loginStart(state) {
      state.loading = true;
      state.error = null;
      state.isLoggedIn = false;
    },
    loginSuccess(state, action: PayloadAction<{ user: User; token: string }>) {
      state.currentUser = action.payload.user; // Store the complete user object
      state.token = action.payload.token; // Store the token separately
      state.loading = false;
      state.error = null;
      state.isLoggedIn = true;
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
      state.isLoggedIn = false;
      state.currentUser = null;
      state.token = undefined;
    },
    logout(state) {
      state.currentUser = null;
      state.isLoggedIn = false;
      state.token = undefined;
      state.error = null;
    },
    updateToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
      // Also update token in user object if it exists
      if (state.currentUser) {
        state.currentUser = { ...state.currentUser, token: action.payload };
      }
    },
    setLoginStatus(state, action: PayloadAction<boolean>) {
      state.isLoggedIn = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
    updateUserProfile(state, action: PayloadAction<Partial<User>>) {
      if (state.currentUser) {
        state.currentUser = { ...state.currentUser, ...action.payload };
      }
    },
  },
});

export const { 
  loginStart, 
  loginSuccess, 
  loginFailure, 
  logout,
  updateToken,
  setLoginStatus,
  clearError,
  updateUserProfile
} = userSlice.actions;

// Selectors
export const selectCurrentUser = (state: { user: UserState }) => state.user.currentUser;
export const selectIsLoggedIn = (state: { user: UserState }) => state.user.isLoggedIn;
export const selectUserLoading = (state: { user: UserState }) => state.user.loading;
export const selectUserError = (state: { user: UserState }) => state.user.error;
export const selectUserToken = (state: { user: UserState }) => state.user.token;

export default userSlice.reducer;