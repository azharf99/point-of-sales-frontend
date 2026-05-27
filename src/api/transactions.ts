import { api } from './api';
import type { ApiResponse, Transaction } from '../types';

export const transactionApi = {
  create: async (data: any) => {
    const response = await api.post<ApiResponse<Transaction & { payment?: { redirect_url: string } }>>('/transactions', data);
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get<ApiResponse<Transaction>>(`/transactions/${id}`);
    return response.data;
  },
  getPrintData: async (id: number) => {
    const response = await api.get<ApiResponse<{ raw_esc_pos: string; metadata: any }>>(`/transactions/${id}/print`);
    return response.data;
  },
};
