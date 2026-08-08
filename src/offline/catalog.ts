import { getDB, getMeta, setMeta } from './db';
import type { Category, Product } from '../types';

/**
 * Keeps a local copy of the product catalog so the cashier can keep ringing up
 * sales when the network is gone. Refreshed opportunistically whenever the
 * terminal is online.
 */

const SYNCED_AT_KEY = 'catalogSyncedAt';

export async function saveCatalog(products: Product[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('catalog', 'readwrite');
  // Replace wholesale rather than merge, so products deleted upstream stop
  // being sellable on the terminal.
  await tx.store.clear();
  await Promise.all(products.map((p) => tx.store.put(p)));
  await tx.done;
  await setMeta(SYNCED_AT_KEY, new Date().toISOString());
}

export async function getCachedCatalog(): Promise<Product[]> {
  const db = await getDB();
  return db.getAll('catalog');
}

export async function getCachedProduct(id: number): Promise<Product | undefined> {
  const db = await getDB();
  return db.get('catalog', id);
}

/** Barcode-scanner and SKU lookup against the local cache. */
export async function lookupCachedProduct(code: string): Promise<Product | undefined> {
  const db = await getDB();
  const byBarcode = await db.getFromIndex('catalog', 'by-barcode', code);
  if (byBarcode) return byBarcode;
  return db.getFromIndex('catalog', 'by-sku', code);
}

/**
 * Categories live in the meta store rather than their own object store: the
 * list is small, always read whole, and never queried by index.
 */
export async function saveCategories(categories: Category[]): Promise<void> {
  await setMeta('categories', categories);
}

export async function getCachedCategories(): Promise<Category[]> {
  return (await getMeta<Category[]>('categories')) ?? [];
}

export async function getCatalogSyncedAt(): Promise<string | undefined> {
  return getMeta<string>(SYNCED_AT_KEY);
}

export async function isCatalogReady(): Promise<boolean> {
  const db = await getDB();
  return (await db.count('catalog')) > 0;
}
