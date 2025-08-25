import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../types'; // Adjust the import path as necessary

interface UserState {
  currentUser: User | null;  // Changed from 'user' to 'currentUser'
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  currentUser: null,  // Changed from 'user' to 'currentUser'
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    loginStart(state) {
      state.loading = true;
      state.error = null;
    },
    loginSuccess(state, action: PayloadAction<User>) {  // Strongly typed payload
      state.currentUser = action.payload;
      state.loading = false;
      state.error = null;
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    logout(state) {
      state.currentUser = null;
    },
    // Add a reducer to update user token if needed
    updateToken(state, action: PayloadAction<string>) {
      if (state.currentUser) {
        state.currentUser.token = action.payload;
      }
    },
  },
});

export const { 
  loginStart, 
  loginSuccess, 
  loginFailure, 
  logout,
  updateToken 
} = userSlice.actions;

export default userSlice.reducer;