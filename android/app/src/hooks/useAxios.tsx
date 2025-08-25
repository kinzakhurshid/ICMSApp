// hooks/useAxios.ts
import { useCallback, useState } from "react";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../states/store";
import {
  apiRequestStart,
  apiRequestSuccess,
  apiRequestFailure,
  setAuthToken,
  clearAuthToken,
} from "../states/apiSlice";

const API_BASE_URL = "http://89.116.32.31:5001/api";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

interface ApiRequest {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  responseType?: AxiosRequestConfig["responseType"];
  includeAuth?: boolean;
}

interface UseAxiosReturn {
  callApi: (request: ApiRequest) => Promise<any>;
  loading: boolean;
  error: string | null;
}

const useAxios = (): UseAxiosReturn => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = useSelector((state: RootState) => state.api.token);
  const currentUser = useSelector((state: RootState) => state.user.currentUser);

  const callApi = useCallback(
    async ({
      method,
      url,
      data,
      params,
      headers = {},
      responseType,
      includeAuth = true,
    }: ApiRequest): Promise<any> => {
      dispatch(apiRequestStart());
      setLoading(true);
      setError(null);

      try {
        const authToken = token || currentUser?.token;

        if (authToken && includeAuth) {
          headers.Authorization = `Bearer ${authToken}`;
        }

        const res: AxiosResponse = await axiosInstance({
          method,
          url,
          data,
          params,
          headers,
          responseType,
        });

        dispatch(apiRequestSuccess(res.data));
        return res.data;
      } catch (err: any) {
        const errorData = err.response?.data || err.message;
        const errorMessage = typeof errorData === 'string' ? errorData : JSON.stringify(errorData);
        
        dispatch(apiRequestFailure(errorMessage));
        setError(errorMessage);
        
        if (err.response?.status === 401) {
          dispatch(clearAuthToken());
        }

        throw errorData;
      } finally {
        setLoading(false);
      }
    },
    [dispatch, token, currentUser?.token]
  );

  return { callApi, loading, error };
};

export default useAxios;