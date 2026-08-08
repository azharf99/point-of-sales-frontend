import { api } from './api';
import { checkout, type CheckoutData } from '../offline/checkout';
import type { ApiResponse, Transaction } from '../types';

export const transactionApi = {
  /**
   * Routed through the offline-capable checkout: a cash sale is captured
   * locally and queued when the server cannot be reached, so the counter keeps
   * moving during an outage. See src/offline/checkout.ts.
   */
  create: (data: CheckoutData) => checkout(data),
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
