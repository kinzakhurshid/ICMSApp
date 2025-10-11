// hooks/useAxios.ts
import { useState } from "react";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { useSelector } from "react-redux";
import { RootState } from "../states/store";

const API_BASE_URL = "https://intelgency.com/api";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 second timeout
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
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
  error: any;
  response: any;
}

const useAxios = (): UseAxiosReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);
  const [response, setResponse] = useState<any>(null);
  const { currentUser,token } = useSelector((state: RootState) => state.user);

  const callApi = async ({
    method,
    url,
    data,
    params,
    headers = {},
    responseType,
    includeAuth = true,
  }: ApiRequest): Promise<any> => {
    setLoading(true);
    setError(null);
    setResponse(null);
  console.log("Uploading to:", API_BASE_URL + "/chats/sendAttachments");
    try {
      if (token && includeAuth) {
        console.log(token)
        headers.Authorization = `Bearer ${token}`;
      }

      const res: AxiosResponse = await axiosInstance({
        method,
        url,
        data,
        params,
        headers,
        responseType,
      });

      setResponse(res.data);
      return res.data;
    } catch (err: any) {
      const errorData = err.response?.data || err.message;
      setError(errorData);
      throw errorData;
    } finally {
      setLoading(false);
    }
  };

  return { callApi, loading, error, response };
};

export default useAxios;