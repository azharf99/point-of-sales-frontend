export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiError {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
}

export interface LoginCredentials {
  username: string;
  password?: string;
}

export interface User {
  id: number;
  name: string;
  username: string;
  role: 'admin' | 'staff';
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  points: number;
}

export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  category_id: number;
  category?: Category;
  name: string;
  sku: string;
  barcode: string;
  price: number;
  cost_price: number;
  stock: number;
  min_stock: number;
}

export interface TransactionItem {
  product_id: number;
  product?: Product;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Transaction {
  id: number;
  customer_id?: number;
  customer?: Customer;
  user_id: number;
  user?: User;
  total_amount: number;
  discount: number;
  payment_method: 'cash' | 'snap';
  payment_status: 'pending' | 'success' | 'failed';
  items: TransactionItem[];
  created_at: string;
}

export interface SalesReport {
  total_sales: number;
  total_orders: number;
  average_order_value: number;
  top_products: Array<{
    product_id: number;
    product_name: string;
    total_quantity: number;
    total_sales: number;
    revenue: number;
  }>;
  order_volume: number;
  average_ticket: number;
  cash_payments: number;
  snap_payments: number;
  total_discount: number;
}

export interface StoreSetting {
  id: number;
  shop_name: string;
  tax_rate: number;
  currency: string;
  receipt_header: string;
  receipt_footer: string;
  updated_at: string;
}

