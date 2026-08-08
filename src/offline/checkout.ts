import { api } from '../api/api';
import { enqueue } from './outbox';
import type { ApiResponse, Transaction } from '../types';

/**
 * Checkout that survives a dead network.
 *
 * The rule is that a sale must never be lost and must never be double-charged.
 * That splits into two cases:
 *
 *  - Cash. Money changed hands at the counter, so the sale is a fact. If the
 *    server is unreachable we record it locally and hand the cashier a receipt
 *    immediately; the outbox delivers it when the link returns.
 *  - Gateway payments (QRIS / e-wallet / Snap). These *require* connectivity to
 *    produce a QR or a redirect, so there is nothing to queue. We fail loudly
 *    and tell the cashier to take cash instead, rather than pretending.
 */

export interface CheckoutItem {
  product_id: number;
  quantity: number;
  order_type: string;
  /** Price shown to the customer, needed to bill offline sales correctly. */
  unit_price: number;
}

export interface CheckoutData {
  payment_method: string;
  discount: number;
  redeem_points: number;
  customer_id?: number;
  items: CheckoutItem[];
  /** Locally computed total, used for the offline receipt and pending list. */
  total: number;
}

export interface CheckoutPayment {
  order_id: string;
  payment_method: string;
  amount: number;
  status: string;
  redirect_url?: string;
}

export type CheckoutResponse = ApiResponse<{
  transaction: Transaction;
  payment?: CheckoutPayment;
  /** True when the sale was stored locally and has not yet reached the server. */
  offline?: boolean;
}>;

export class OfflinePaymentUnavailableError extends Error {
  constructor(method: string) {
    super(
      `${method.toUpperCase()} needs an internet connection. Take cash and the sale will sync automatically.`,
    );
    this.name = 'OfflinePaymentUnavailableError';
  }
}

function isNetworkError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const e = err as { response?: unknown; code?: string; message?: string };
  // Axios sets no `response` when the request never reached the server.
  if (e.response === undefined) return true;
  return e.code === 'ECONNABORTED' || e.code === 'ERR_NETWORK';
}

/** Builds the receipt shown for a sale that is still sitting in the outbox. */
function offlineReceipt(data: CheckoutData, clientTxId: string): CheckoutResponse {
  const shortRef = clientTxId.replace(/-/g, '').slice(0, 8).toUpperCase();
  return {
    success: true,
    message: 'Saved on this device. It will sync automatically when you are back online.',
    data: {
      offline: true,
      transaction: {
        // Provisional only: the server assigns the real invoice number on sync.
        invoice_number: `OFFLINE-${shortRef}`,
        total: data.total,
        // Loyalty points are awarded by the server, so promising a number here
        // would risk showing the customer a figure that later changes.
        loyalty_points_earned: 0,
        points_redeemed: data.redeem_points,
        discount: data.discount,
        payment_method: 'cash',
        payment_status: 'success',
        created_at: new Date().toISOString(),
      } as unknown as Transaction,
      payment: {
        order_id: `OFFLINE-${shortRef}`,
        payment_method: 'cash',
        amount: data.total,
        status: 'success',
      },
    },
  };
}

async function queueOffline(data: CheckoutData): Promise<CheckoutResponse> {
  const item = await enqueue(
    {
      customer_id: data.customer_id,
      discount: data.discount,
      redeem_points: data.redeem_points,
      payment_method: 'cash',
      items: data.items.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
        order_type: i.order_type,
        unit_price: i.unit_price,
      })),
    },
    data.total,
  );

  return offlineReceipt(data, item.clientTxId);
}

export async function checkout(data: CheckoutData): Promise<CheckoutResponse> {
  const isCash = data.payment_method === 'cash';
  const offline = typeof navigator !== 'undefined' && !navigator.onLine;

  if (offline) {
    if (!isCash) throw new OfflinePaymentUnavailableError(data.payment_method);
    return queueOffline(data);
  }

  try {
    const response = await api.post<CheckoutResponse>('/transactions', {
      payment_method: data.payment_method,
      discount: data.discount,
      redeem_points: data.redeem_points,
      customer_id: data.customer_id,
      items: data.items.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
        order_type: i.order_type,
      })),
    });
    return response.data;
  } catch (err) {
    // `navigator.onLine` only reports link state, so a till on wifi with no
    // upstream reaches this branch rather than the one above. A cash sale that
    // already happened still has to be captured.
    if (isCash && isNetworkError(err)) {
      return queueOffline(data);
    }
    throw err;
  }
}
