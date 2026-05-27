import { api } from './api';
import type { ApiResponse, User } from '../types';

export const authApi = {
  login: async (credentials: any) => {
    const response = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', credentials);
    return response.data;
  },
  getProfile: async () => {
    const response = await api.get<ApiResponse<User>>('/auth/profile');
    return response.data;
  },
  register: async (data: any) => {
    const response = await api.post<ApiResponse<User>>('/auth/register', data);
    return response.data;
  },
};
