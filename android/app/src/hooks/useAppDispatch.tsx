// states/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import userReducer from '../states/userSlice';
import apiReducer from '../states/apiSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    api: apiReducer,
  },
  // Optional: Add middleware if needed
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: false, // Disable if having non-serializable values
    }),
});

// Infer the RootState type from the store itself
export type RootState = ReturnType<typeof store.getState>;

// Export the AppDispatch type for use with useDispatch hook
export type AppDispatch = typeof store.dispatch;

// Optional: Export a custom useDispatch hook with proper typing
export const useAppDispatch = () => useDispatch<AppDispatch>();

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector