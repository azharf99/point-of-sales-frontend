import { api } from './api';
import type { ApiResponse, Customer } from '../types';

export const customerApi = {
  getAll: async () => {
    const response = await api.get<ApiResponse<Customer[]>>('/customers');
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post<ApiResponse<Customer>>('/customers', data);
    return response.data;
  },
  update: async (id: number, data: any) => {
    const response = await api.put<ApiResponse<Customer>>(`/customers/${id}`, data);
    return response.data;
  },
};
