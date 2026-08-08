import { api } from './api';
import type { ApiResponse, StockDiscrepancy } from '../types';

export const inventoryApi = {
  /**
   * Stock gaps left by offline sales that oversold. Defaults to unresolved
   * only, which is what the owner needs to act on.
   */
  getDiscrepancies: async (unresolvedOnly = true) => {
    const response = await api.get<ApiResponse<{
      items: StockDiscrepancy[];
      meta: { total: number; unresolved_only: boolean };
    }>>('/inventory/discrepancies', {
      params: { unresolved: unresolvedOnly },
    });
    return response.data;
  },

  /**
   * Closes out a gap. Supplying countedStock corrects the product's on-hand
   * quantity to that physical count, which is the only trustworthy number once
   * the books and the shelf have diverged.
   */
  resolveDiscrepancy: async (id: number, countedStock?: number) => {
    const response = await api.post<ApiResponse<null>>(
      `/inventory/discrepancies/${id}/resolve`,
      countedStock === undefined ? {} : { counted_stock: countedStock },
    );
    return response.data;
  },
};
