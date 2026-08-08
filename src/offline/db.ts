import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Product } from '../types';

/**
 * Local durable storage for the terminal.
 *
 * Everything the cashier needs to keep selling through an outage lives here:
 * the product catalog to ring items up against, and an outbox of sales that
 * have not yet reached the server. IndexedDB is used rather than localStorage
 * because it survives memory pressure, holds far more than 5MB, and can be
 * written from a service worker.
 */

export type OutboxStatus = 'pending' | 'syncing' | 'failed';

export interface OutboxItem {
  /** Idempotency key sent to the server as client_tx_id. */
  clientTxId: string;
  /** When the sale actually happened, ISO 8601. Reports are attributed to this. */
  clientCreatedAt: string;
  payload: {
    customer_id?: number;
    discount?: number;
    redeem_points?: number;
    payment_method: string;
    items: {
      product_id: number;
      quantity: number;
      order_type?: string;
      /** Price actually charged, captured from the cached catalog. */
      unit_price: number;
    }[];
  };
  /** Denormalised for the pending-sales UI so it need not re-price anything. */
  total: number;
  status: OutboxStatus;
  attempts: number;
  lastError?: string;
  /** Set once the server has rejected the sale and a human must intervene. */
  rejectedAt?: string;
}

interface PosDB extends DBSchema {
  catalog: {
    key: number;
    value: Product;
    indexes: { 'by-barcode': string; 'by-sku': string };
  };
  outbox: {
    key: string;
    value: OutboxItem;
    indexes: { 'by-status': OutboxStatus; 'by-created': string };
  };
  meta: {
    key: string;
    value: unknown;
  };
}

const DB_NAME = 'pos-offline';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<PosDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<PosDB>> {
  if (!dbPromise) {
    dbPromise = openDB<PosDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('catalog')) {
          const catalog = db.createObjectStore('catalog', { keyPath: 'id' });
          catalog.createIndex('by-barcode', 'barcode');
          catalog.createIndex('by-sku', 'sku');
        }
        if (!db.objectStoreNames.contains('outbox')) {
          const outbox = db.createObjectStore('outbox', { keyPath: 'clientTxId' });
          outbox.createIndex('by-status', 'status');
          outbox.createIndex('by-created', 'clientCreatedAt');
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta');
        }
      },
    });
  }
  return dbPromise;
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
  const db = await getDB();
  return (await db.get('meta', key)) as T | undefined;
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  const db = await getDB();
  await db.put('meta', value, key);
}

/**
 * Clears terminal-local data. Called on logout so a shared till does not leak
 * one shop's catalog to the next session. Deliberately leaves the outbox alone:
 * unsynced sales are real revenue and must survive a logout.
 */
export async function clearCatalog(): Promise<void> {
  const db = await getDB();
  await db.clear('catalog');
  await db.delete('meta', 'catalogSyncedAt');
}
