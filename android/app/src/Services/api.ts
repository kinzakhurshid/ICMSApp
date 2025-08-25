// src/services/api.ts
import axios from 'axios';
import { Alert } from 'react-native';
import { Platform } from 'react-native';

// Configuration
const LOCAL_IP = '10.98.134.172'; // Your local IP from ipconfig
const PORT = 5000;
const BASE_URL = `http://${LOCAL_IP}:${PORT}/api`;

// Create axios instance with interceptors
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // 15 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor for logging
api.interceptors.request.use(config => {
  console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  return config;
}, error => {
  console.error('[API] Request error:', error);
  return Promise.reject(error);
});

// Response interceptor for error handling
api.interceptors.response.use(response => {
  return response;
}, error => {
  let errorMessage = 'Network error';
  
  if (error.response) {
    // Server responded with error status
    switch (error.response.status) {
      case 401:
        errorMessage = 'Unauthorized - Please login again';
        break;
      case 403:
        errorMessage = 'Forbidden - You don\'t have permission';
        break;
      case 404:
        errorMessage = 'Resource not found';
        break;
      case 500:
        errorMessage = 'Server error - Please try again later';
        break;
      default:
        errorMessage = error.response.data?.message || `Request failed with status ${error.response.status}`;
    }
  } else if (error.request) {
    // No response received
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timeout - Server is not responding';
    } else {
      errorMessage = 'No network connection - Please check your internet';
    }
  } else {
    // Request setup error
    errorMessage = error.message || 'Request configuration error';
  }

  console.error('[API] Error details:', {
    url: error.config?.url,
    method: error.config?.method,
    error: errorMessage
  });

  return Promise.reject(errorMessage);
});

// Health check endpoint
export const checkServerHealth = async () => {
  try {
    const response = await api.get('/health');
    return {
      status: response.data.status,
      timestamp: response.data.timestamp
    };
  } catch (error) {
    console.error('Server health check failed:', error);
    throw error;
  }
};

// User authentication endpoints
export const loginUser = async (email: string, password: string) => {
  try {
    const response = await api.post('/user/login', { email, password });
    
    if (!response.data?.user) {
      throw new Error('Invalid server response format');
    }

    return {
      user: response.data.user,
      token: response.data.token
    };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await api.post('/user/logout');
  } catch (error) {
    console.error('Logout failed:', error);
    throw error;
  }
};

// Protected API endpoints
export const getProtectedData = async (token: string) => {
  try {
    const response = await api.get('/protected/data', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch protected data:', error);
    throw error;
  }
};

// Error display helper
export const showApiError = (error: unknown) => {
  const message = typeof error === 'string' ? error : 
                 error instanceof Error ? error.message : 
                 'An unknown error occurred';
  
  Alert.alert(
    'Error',
    message,
    [{ text: 'OK', style: 'cancel' }]
  );
};

export default api;