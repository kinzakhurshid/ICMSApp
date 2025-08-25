// states/store.ts
import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import apiReducer from './apiSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    api: apiReducer,
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  // Enable Redux DevTools
  devTools: true,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;