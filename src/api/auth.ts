import { api } from './api';
import type { ApiResponse, User, LoginCredentials } from '../types';

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const response = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', credentials);
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
