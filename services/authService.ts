import api from '@/lib/api';
import type { ApiResponse, AuthResponse } from '@/types/user';

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  gender: 'male' | 'female';
  profile_created_by: 'self' | 'parents' | 'siblings';
}

export interface LoginData {
  email: string;
  password: string;
}

export const authService = {
  register: (data: RegisterData) =>
    api.post<AuthResponse>('/auth/register', data),

  login: (data: LoginData) =>
    api.post<AuthResponse>('/auth/login', data),

  logout: () =>
    api.post<ApiResponse<null>>('/auth/logout'),

  me: () =>
    api.get<ApiResponse<{ user: import('@/types/user').User }>>('/auth/me'),

  resendVerification: () =>
    api.post<ApiResponse<null>>('/auth/email/resend'),
};

