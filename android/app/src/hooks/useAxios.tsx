// hooks/useAxios.ts
import { useState } from "react";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { Platform } from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "../states/store";

// Use deployed server for all environments
const API_BASE_URL = "https://intelgency.com/api";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 second timeout
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor to handle FormData properly
axiosInstance.interceptors.request.use(
  (config) => {
    // Handle FormData requests
    if (config.data instanceof FormData) {
      // Remove Content-Type header - let axios/browser set it with boundary
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
      // Increase timeout for file uploads
      config.timeout = 60000; // 60 seconds
      // Don't transform FormData
      config.transformRequest = [];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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
    
    try {
      // Check for FormData (works in both web and React Native)
      const isFormData = data instanceof FormData || 
                        (data && typeof data === 'object' && data !== null && '_parts' in data) ||
                        (data && data.constructor && data.constructor.name === 'FormData');
      
      // Prepare headers
      const requestHeaders: any = { ...headers };
      
      // Add authorization if needed
      if (token && includeAuth) {
        requestHeaders.Authorization = `Bearer ${token}`;
      }
      
      // Configure request
      const requestConfig: any = {
        method,
        url,
        data,
        params,
        headers: requestHeaders,
        responseType,
      };

      if (!isFormData) {
        // For JSON, ensure Content-Type is set
        if (!requestConfig.headers['Content-Type'] && !requestConfig.headers['content-type']) {
          requestConfig.headers['Content-Type'] = 'application/json';
        }
      }
      // For FormData, the interceptor will handle removing Content-Type and setting timeout

      // For FormData in React Native, use XMLHttpRequest for better compatibility
      if (isFormData) {
        console.log('Sending FormData request via XMLHttpRequest:', {
          url: `${API_BASE_URL}${url}`,
          method,
          hasData: !!data,
          tokenPresent: !!(token && includeAuth),
        });

        // Build URL with query params if any
        let fullUrl = `${API_BASE_URL}${url}`;
        if (params && Object.keys(params).length > 0) {
          const queryString = new URLSearchParams(params).toString();
          fullUrl += `?${queryString}`;
        }

        // Use XMLHttpRequest for FormData in React Native (more reliable than fetch)
        try {
          const result = await new Promise<any>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            // Set up timeout
            xhr.timeout = 60000; // 60 seconds
            
            // Handle successful response
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const responseData = JSON.parse(xhr.responseText);
                  setResponse(responseData);
                  resolve(responseData);
                } catch (parseError) {
                  // If response is not JSON, return as text
                  setResponse(xhr.responseText);
                  resolve(xhr.responseText);
                }
              } else {
                let errorData;
                try {
                  errorData = JSON.parse(xhr.responseText);
                } catch {
                  errorData = { message: xhr.responseText || `HTTP ${xhr.status}` };
                }
                
                // Log full error details for server errors
                if (xhr.status >= 500) {
                  console.error('Server Error Response:', {
                    status: xhr.status,
                    statusText: xhr.statusText,
                    responseText: xhr.responseText,
                    parsedError: errorData,
                  });
                }
                
                const error = {
                  response: { data: errorData, status: xhr.status },
                  message: errorData.message || errorData.error || `HTTP ${xhr.status}`,
                  success: errorData.success,
                };
                setError(error);
                reject(error);
              }
            };
            
            // Handle errors
            xhr.onerror = () => {
              const error = {
                message: 'Network request failed',
                code: 'NETWORK_ERROR',
                response: undefined,
                status: undefined,
              };
              console.error('XMLHttpRequest network error');
              setError(error);
              reject(error);
            };
            
            // Handle timeout
            xhr.ontimeout = () => {
              const error = {
                message: 'Request timeout - The server took too long to respond',
                code: 'TIMEOUT',
                response: undefined,
                status: undefined,
              };
              console.error('XMLHttpRequest timeout');
              setError(error);
              reject(error);
            };
            
            // Open and send request
            xhr.open(method, fullUrl, true);
            
            // Set headers (except Content-Type which will be set automatically with boundary)
            Object.keys(requestHeaders).forEach(key => {
              if (key.toLowerCase() !== 'content-type') {
                xhr.setRequestHeader(key, requestHeaders[key]);
              }
            });
            
            // Send FormData
            xhr.send(data as any);
          });
          
          return result;
        } catch (xhrError: any) {
          // Re-throw to be caught by outer catch block
          throw xhrError;
        }
      }

      // Use the instance for non-FormData requests
      const res: AxiosResponse = await axiosInstance(requestConfig);
      setResponse(res.data);
      return res.data;
    } catch (err: any) {
      const errorDetails = {
        url: `${API_BASE_URL}${url}`,
        method,
        isFormData: data instanceof FormData,
        error: err.message,
        code: err.code,
        response: err.response?.data,
        status: err.response?.status,
        request: err.request ? 'Request was made but no response received' : 'No request was made',
      };
      console.error('API Error Details:', errorDetails);
      
      // If it's a network error, provide more helpful message
      if (err.message === 'Network Error' || err.code === 'NETWORK_ERROR' || !err.response) {
        console.error('Network Error - Possible causes:');
        console.error('1. No internet connection');
        console.error('2. Server is down or unreachable');
        console.error('3. CORS issue (unlikely in React Native)');
        console.error('4. Request timeout');
        console.error('5. FormData serialization issue');
      }
      
      const errorData = err.response?.data || err.message || err;
      setError(errorData);
      throw errorData;
    } finally {
      setLoading(false);
    }
  };

  return { callApi, loading, error, response };
};

export default useAxios;