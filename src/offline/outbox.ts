import { api } from '../api/api';
import { getDB, type OutboxItem } from './db';

/**
 * The outbox: sales captured on this terminal that the server has not yet
 * acknowledged.
 *
 * The contract with the server is that every entry carries a `client_tx_id`
 * that the server treats as an idempotency key. That is what makes retrying
 * safe: if a response is lost after the server committed the sale, replaying
 * the entry returns "duplicate" instead of creating a second sale. Because of
 * that guarantee, an entry is only ever deleted once the server has explicitly
 * accounted for it -- never on a network error, and never optimistically.
 */

const MAX_BATCH = 100;

type Listener = () => void;
const listeners = new Set<Listener>();

/** Subscribe to outbox changes so the UI can show an accurate pending count. */
export function subscribeOutbox(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  listeners.forEach((fn) => fn());
}

function newClientTxId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Older WebViews on cheap Android tills may lack randomUUID.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
}

export async function enqueue(
  payload: OutboxItem['payload'],
  total: number,
): Promise<OutboxItem> {
  const item: OutboxItem = {
    clientTxId: newClientTxId(),
    clientCreatedAt: new Date().toISOString(),
    payload,
    total,
    status: 'pending',
    attempts: 0,
  };

  const db = await getDB();
  await db.put('outbox', item);
  notify();
  return item;
}

export async function listOutbox(): Promise<OutboxItem[]> {
  const db = await getDB();
  const all = await db.getAll('outbox');
  return all.sort((a, b) => a.clientCreatedAt.localeCompare(b.clientCreatedAt));
}

/** Count of sales still owed to the server. Drives the UI badge. */
export async function pendingCount(): Promise<number> {
  const db = await getDB();
  const all = await db.getAll('outbox');
  return all.filter((i) => i.status !== 'failed').length;
}

export async function failedCount(): Promise<number> {
  const db = await getDB();
  const all = await db.getAll('outbox');
  return all.filter((i) => i.status === 'failed').length;
}

export async function discard(clientTxId: string): Promise<void> {
  const db = await getDB();
  await db.delete('outbox', clientTxId);
  notify();
}

export interface SyncOutcome {
  applied: number;
  duplicate: number;
  rejected: number;
  /** Entries the server refused; these stay in the outbox for a human to review. */
  rejectedItems: { clientTxId: string; error: string }[];
  /** Stock gaps the server recorded because an offline sale oversold. */
  discrepancies: {
    product_name: string;
    sku: string;
    shortfall: number;
    invoice_number: string;
  }[];
}

interface SyncItemResult {
  client_tx_id: string;
  status: 'applied' | 'duplicate' | 'rejected';
  error?: string;
  invoice_number?: string;
  stock_discrepancies?: {
    product_name: string;
    sku: string;
    shortfall: number;
    invoice_number: string;
  }[];
}

let draining = false;

/**
 * Pushes queued sales to the server, oldest first.
 *
 * Guarded against re-entry because both the reconnect listener and the periodic
 * timer can fire at once; two concurrent drains would send the same entries
 * twice. The server would deduplicate them, but there is no reason to make it.
 */
export async function drain(): Promise<SyncOutcome | null> {
  if (draining) return null;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return null;

  const db = await getDB();
  const all = await listOutbox();
  // 'failed' entries have been explicitly rejected by the server; retrying them
  // unchanged would just fail again, so they wait for a human.
  const queue = all.filter((i) => i.status !== 'failed').slice(0, MAX_BATCH);
  if (queue.length === 0) return null;

  draining = true;
  const outcome: SyncOutcome = {
    applied: 0,
    duplicate: 0,
    rejected: 0,
    rejectedItems: [],
    discrepancies: [],
  };

  try {
    for (const item of queue) {
      await db.put('outbox', { ...item, status: 'syncing' });
    }
    notify();

    const response = await api.post('/transactions/sync', {
      transactions: queue.map((item) => ({
        client_tx_id: item.clientTxId,
        client_created_at: item.clientCreatedAt,
        source: 'offline',
        ...item.payload,
      })),
    });

    const results: SyncItemResult[] = response.data?.data?.results ?? [];
    const byId = new Map(results.map((r) => [r.client_tx_id, r]));

    for (const item of queue) {
      const result = byId.get(item.clientTxId);

      // No verdict for this entry means the server never spoke to it. Put it
      // back as pending rather than guessing; the idempotency key makes a
      // later retry safe either way.
      if (!result) {
        await db.put('outbox', { ...item, status: 'pending', attempts: item.attempts + 1 });
        continue;
      }

      if (result.status === 'applied' || result.status === 'duplicate') {
        await db.delete('outbox', item.clientTxId);
        if (result.status === 'applied') outcome.applied++;
        else outcome.duplicate++;

        for (const d of result.stock_discrepancies ?? []) {
          outcome.discrepancies.push(d);
        }
        continue;
      }

      // Rejected: the sale cannot be stored as-is. Keep it so the owner can see
      // what was lost instead of silently dropping real revenue.
      await db.put('outbox', {
        ...item,
        status: 'failed',
        attempts: item.attempts + 1,
        lastError: result.error ?? 'rejected by server',
        rejectedAt: new Date().toISOString(),
      });
      outcome.rejected++;
      outcome.rejectedItems.push({
        clientTxId: item.clientTxId,
        error: result.error ?? 'rejected by server',
      });
    }

    return outcome;
  } catch (err) {
    // Network or server error: nothing is known about what landed, so every
    // entry goes back to pending and will be retried verbatim.
    for (const item of queue) {
      await db.put('outbox', {
        ...item,
        status: 'pending',
        attempts: item.attempts + 1,
        lastError: err instanceof Error ? err.message : 'sync failed',
      });
    }
    return null;
  } finally {
    draining = false;
    notify();
  }
}
