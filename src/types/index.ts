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
  recaptcha_token?: string;
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
  image_url?: string;
  thumbnail_url?: string;
}

export interface TransactionItem {
  product_id: number;
  product?: Product;
  quantity: number;
  price: number;
  subtotal: number;
  order_type: string;
}

export interface Transaction {
  id: number;
  invoice_number: string;
  customer_id?: number;
  customer?: Customer;
  user_id: number;
  user?: User;
  subtotal: number;
  discount: number;
  points_redeemed: number;
  points_discount: number;
  tax: number;
  total: number;
  payment_method: 'cash' | 'snap';
  payment_status: 'pending' | 'success' | 'failed';
  loyalty_points_earned: number;
  items: TransactionItem[];
  created_at: string;
}

export interface TrendData {
  percentage: number;
  is_up: boolean;
  label: string;
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
  sales_by_order_type: Record<string, number>;
  item_count_by_order_type: Record<string, number>;
  revenue_trend?: TrendData;
  orders_trend?: TrendData;
  ticket_trend?: TrendData;
}

export interface StoreSetting {
  id: number;
  shop_name: string;
  tax_rate: number;
  currency: string;
  receipt_header: string;
  receipt_footer: string;
  /** Owner's WhatsApp number for low-stock alerts and scheduled reports. */
  owner_phone: string;
  /** Printer character width: 32 for 58mm paper, 48 for 80mm. */
  receipt_paper_width: number;
  low_stock_alerts_enabled: boolean;
  daily_report_enabled: boolean;
  weekly_report_enabled: boolean;
  monthly_report_enabled: boolean;
  /** Local (Asia/Jakarta) hour scheduled reports are sent. */
  report_hour: number;
  updated_at: string;
}

/** Stock gap created when an offline sale oversold a product. */
export interface StockDiscrepancy {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  transaction_id: number;
  invoice_number: string;
  requested_quantity: number;
  available_stock: number;
  shortfall: number;
  reason: string;
  resolved_at?: string;
  created_at: string;
}

