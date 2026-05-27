import { api } from './api';
import type { ApiResponse, User, LoginCredentials } from '../types';

export const authApi = {
  handshake: async () => {
    const response = await api.get<{ status: string }>('/auth/handshake');
    return response.data;
  },
  login: async (credentials: LoginCredentials) => {
    const response = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', credentials);
    return response.data;
  },
  logout: async () => {
    const response = await api.post<ApiResponse<null>>('/auth/logout');
    return response.data;
  },
  getProfile: async () => {
    const response = await api.get<ApiResponse<User>>('/auth/profile');
    return response.data;
  },
  register: async (data: Partial<User> & { password?: string }) => {
    const response = await api.post<ApiResponse<User>>('/auth/register', data);
    return response.data;
  },
};
