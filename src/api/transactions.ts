import { api } from './api';
import type { ApiResponse, Transaction } from '../types';

export const transactionApi = {
  create: async (data: { customer_id?: number; items: { product_id: number; quantity: number }[]; payment_method: string }) => {
    const response = await api.post<ApiResponse<Transaction & { payment?: { redirect_url: string } }>>('/transactions', data);
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get<ApiResponse<Transaction>>(`/transactions/${id}`);
    return response.data;
  },
  getPrintData: async (id: number) => {
    const response = await api.get<ApiResponse<{ raw_esc_pos: string; metadata: Record<string, unknown> }>>(`/transactions/${id}/print`);
    return response.data;
  },
};
