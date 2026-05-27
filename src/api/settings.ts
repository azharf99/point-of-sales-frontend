import { api } from './api';
import type { ApiResponse, StoreSetting } from '../types';

export const settingsApi = {
  get: async () => {
    const response = await api.get<ApiResponse<StoreSetting>>('/settings');
    return response.data;
  },
  update: async (data: Partial<StoreSetting>) => {
    const response = await api.put<ApiResponse<StoreSetting>>('/settings', data);
    return response.data;
  },
};
