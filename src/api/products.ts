import { api } from './api';
import type { ApiResponse, Product, Category } from '../types';

export const productApi = {
  getAll: async (page = 1, limit = 15) => {
    const response = await api.get<ApiResponse<{ items: Product[]; meta: { total: number; page: number; limit: number; total_pages: number } }>>('/products', {
      params: { page, limit }
    });
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data;
  },
  create: async (data: Partial<Product>) => {
    const response = await api.post<ApiResponse<Product>>('/products', data);
    return response.data;
  },
  update: async (id: number, data: Partial<Product>) => {
    const response = await api.put<ApiResponse<Product>>(`/products/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete<ApiResponse<null>>(`/products/${id}`);
    return response.data;
  },
  getLowStock: async () => {
    const response = await api.get<ApiResponse<Product[]>>('/products/low-stock');
    return response.data;
  },
  lookup: async (code: string) => {
    const response = await api.get<ApiResponse<Product>>(`/products/lookup?code=${encodeURIComponent(code)}`);
    return response.data;
  },
  getCategories: async () => {
    const response = await api.get<ApiResponse<Category[]>>('/products/categories');
    return response.data;
  },
  createCategory: async (data: Partial<Category>) => {
    const response = await api.post<ApiResponse<Category>>('/products/categories', data);
    return response.data;
  },
};
