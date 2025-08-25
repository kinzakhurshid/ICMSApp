// src/providers/redux-provider.tsx
"use client";

import { store } from "../states/store"; // Adjust the import path as necessary
import { useRef } from "react";
import { Provider } from "react-redux";

export default function ReduxProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeRef = useRef(store);
  
  return <Provider store={storeRef.current}>{children}</Provider>;
}