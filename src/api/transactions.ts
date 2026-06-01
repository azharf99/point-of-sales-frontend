import { api } from './api';
import type { ApiResponse, Transaction } from '../types';

export const transactionApi = {
  create: async (data: { customer_id?: number; items: { product_id: number; quantity: number }[]; payment_method: string; discount?: number; redeem_points?: number }) => {
    const response = await api.post<ApiResponse<{ transaction: Transaction; payment?: { order_id: string; payment_method: string; amount: number; status: string; redirect_url?: string } }>>('/transactions', data);
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
  getAll: async (page = 1, limit = 15) => {
    const response = await api.get<ApiResponse<{ items: Transaction[]; meta: { total: number; page: number; limit: number; total_pages: number } }>>('/transactions', {
      params: { page, limit }
    });
    return response.data;
  },
};
