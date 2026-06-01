import { api } from './api';
import type { ApiResponse, Customer } from '../types';

export const customerApi = {
  getAll: async (page = 1, limit = 15, search = '') => {
    const params: Record<string, string | number> = { page, limit };
    if (search) params.search = search;
    const response = await api.get<ApiResponse<{ items: Customer[]; meta: { total: number; page: number; limit: number; total_pages: number } }>>('/customers', {
      params
    });
    return response.data;
  },
  lookup: async (phone: string) => {
    const response = await api.get<ApiResponse<Customer>>('/customers/lookup', {
      params: { phone }
    });
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
    return response.data;
  },
  create: async (data: Partial<Customer>) => {
    const response = await api.post<ApiResponse<Customer>>('/customers', data);
    return response.data;
  },
  update: async (id: number, data: Partial<Customer>) => {
    const response = await api.put<ApiResponse<Customer>>(`/customers/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete<ApiResponse<null>>(`/customers/${id}`);
    return response.data;
  },
};
