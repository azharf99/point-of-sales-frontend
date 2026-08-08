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
  /**
   * Returns the receipt as an ESC/POS byte stream (base64) plus a plain-text
   * preview. The base64 is what a local print agent or the Android wrapper
   * writes to the printer; browsers cannot reach a USB thermal printer directly.
   */
  getPrintData: async (id: number) => {
    const response = await api.get<ApiResponse<{
      invoice: string;
      paper_width: number;
      escpos_b64: string;
      preview: string;
      content_type: string;
    }>>(`/transactions/${id}/print`);
    return response.data;
  },
  /** Sends the receipt over WhatsApp. Omit phone to use the customer on file. */
  sendReceiptWhatsApp: async (id: number, phone?: string) => {
    const response = await api.post<ApiResponse<null>>(`/transactions/${id}/send-receipt`, { phone: phone || '' });
    return response.data;
  },
  getAll: async (page = 1, limit = 15) => {
    const response = await api.get<ApiResponse<{ items: Transaction[]; meta: { total: number; page: number; limit: number; total_pages: number } }>>('/transactions', {
      params: { page, limit }
    });
    return response.data;
  },
};
