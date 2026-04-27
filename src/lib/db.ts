/**
 * IndexedDB data layer using the `idb` library.
 * All financial data is persisted locally.
 */

import { openDB, type IDBPDatabase } from 'idb';
import type { Transaction, FixedExpense, WishlistItem } from '../types/finance';

const DB_NAME = 'worktrackify-finance';
const DB_VERSION = 1;

// Store names
const STORES = {
  TRANSACTIONS: 'transactions',
  FIXED_EXPENSES: 'fixedExpenses',
  WISHLIST: 'wishlist',
} as const;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Transactions store
        if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
          const txStore = db.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'id' });
          txStore.createIndex('by-date', 'date');
          txStore.createIndex('by-type', 'type');
        }

        // Fixed expenses store
        if (!db.objectStoreNames.contains(STORES.FIXED_EXPENSES)) {
          db.createObjectStore(STORES.FIXED_EXPENSES, { keyPath: 'id' });
        }

        // Wishlist store
        if (!db.objectStoreNames.contains(STORES.WISHLIST)) {
          db.createObjectStore(STORES.WISHLIST, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

// ============= Transactions =============

export async function getAllTransactions(): Promise<Transaction[]> {
  const db = await getDB();
  return db.getAll(STORES.TRANSACTIONS);
}

export async function getTransactionsByMonth(year: number, month: number): Promise<Transaction[]> {
  const db = await getDB();
  const all = await db.getAll(STORES.TRANSACTIONS);
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  return all.filter(t => t.date.startsWith(prefix));
}

export async function addTransaction(tx: Transaction): Promise<void> {
  const db = await getDB();
  await db.put(STORES.TRANSACTIONS, tx);
}

export async function updateTransaction(tx: Transaction): Promise<void> {
  const db = await getDB();
  await db.put(STORES.TRANSACTIONS, tx);
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORES.TRANSACTIONS, id);
}

// ============= Fixed Expenses =============

export async function getAllFixedExpenses(): Promise<FixedExpense[]> {
  const db = await getDB();
  return db.getAll(STORES.FIXED_EXPENSES);
}

export async function addFixedExpense(expense: FixedExpense): Promise<void> {
  const db = await getDB();
  await db.put(STORES.FIXED_EXPENSES, expense);
}

export async function updateFixedExpense(expense: FixedExpense): Promise<void> {
  const db = await getDB();
  await db.put(STORES.FIXED_EXPENSES, expense);
}

export async function deleteFixedExpense(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORES.FIXED_EXPENSES, id);
}

// ============= Wishlist =============

export async function getAllWishlistItems(): Promise<WishlistItem[]> {
  const db = await getDB();
  return db.getAll(STORES.WISHLIST);
}

export async function addWishlistItem(item: WishlistItem): Promise<void> {
  const db = await getDB();
  await db.put(STORES.WISHLIST, item);
}

export async function updateWishlistItem(item: WishlistItem): Promise<void> {
  const db = await getDB();
  await db.put(STORES.WISHLIST, item);
}

export async function deleteWishlistItem(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORES.WISHLIST, id);
}

// ============= Bulk / Utility =============

export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(
    [STORES.TRANSACTIONS, STORES.FIXED_EXPENSES, STORES.WISHLIST],
    'readwrite'
  );
  await Promise.all([
    tx.objectStore(STORES.TRANSACTIONS).clear(),
    tx.objectStore(STORES.FIXED_EXPENSES).clear(),
    tx.objectStore(STORES.WISHLIST).clear(),
    tx.done,
  ]);
}
