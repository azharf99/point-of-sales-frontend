import { api } from './api';
import type { ApiResponse, SalesReport } from '../types';

export const reportApi = {
  getSales: async (startDate: string, endDate: string) => {
    const response = await api.get<ApiResponse<SalesReport>>(`/reports/sales?start_date=${startDate}&end_date=${endDate}`);
    return response.data;
  },
};
