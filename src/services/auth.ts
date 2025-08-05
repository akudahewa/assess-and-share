import { apiClient, ApiResponse } from './api';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  role?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  user: User;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthTokens>> {
    const response = await apiClient.post<AuthTokens>('/auth/login', credentials);
    if (response.success && response.data) {
      apiClient.setToken(response.data.access_token);
    }
    return response;
  }

  async register(data: RegisterData): Promise<ApiResponse<AuthTokens>> {
    const response = await apiClient.post<AuthTokens>('/auth/register', data);
    if (response.success && response.data) {
      apiClient.setToken(response.data.access_token);
    }
    return response;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      apiClient.clearToken();
    }
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return apiClient.get<User>('/auth/me');
  }

  async refreshToken(): Promise<ApiResponse<AuthTokens>> {
    const response = await apiClient.post<AuthTokens>('/auth/refresh');
    if (response.success && response.data) {
      apiClient.setToken(response.data.access_token);
    }
    return response;
  }
}

export const authService = new AuthService();