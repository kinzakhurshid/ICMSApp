import axios from 'axios';
import { LoginCredentials, LoginResponse } from './types';

// Create axios instance
const api = axios.create({
  baseURL: 'http://10.98.134.172:5000/api',
  timeout: 10000,
});

// Login API
export const loginUser = async (
  credentials: LoginCredentials
): Promise<LoginResponse> => {
  try {
    const response = await api.post('/user/login', credentials);

    if (!response.data?.user) {
      throw new Error('Invalid server response: Missing user data');
    }

    return response.data;
  } catch (error: any) {
    let errorMessage = 'Login failed';

    if (error.response) {
      errorMessage =
        error.response.data?.message ||
        `Request failed with status ${error.response.status}`;
    } else if (error.request) {
      errorMessage = 'No response from server';
    }

    throw new Error(errorMessage);
  }
};

// ✅ Add testConnection back
export const testConnection = async (): Promise<{ success: boolean }> => {
  try {
    const response = await api.get('/test-connection');
    return response.data; // should be { success: true } if backend is correct
  } catch (error) {
    console.error('Test connection failed:', error);
    throw error;
  }
};
