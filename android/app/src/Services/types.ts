// API Response Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface ApiError {
  message: string;
  status?: number;
  data?: any;
}

// API Methods Types
export type LoginCredentials = {
  email: string;
  password: string;
};