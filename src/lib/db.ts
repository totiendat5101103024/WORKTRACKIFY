/**
 * Firebase Firestore data layer.
 * Replaces IndexedDB to provide real-time cloud sync across devices
 * while maintaining offline capabilities.
 */

import { collection, getDocs, setDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import type { Transaction, FixedExpense, WishlistItem } from '../types/finance';

const COLLECTIONS = {
  TRANSACTIONS: 'transactions',
  FIXED_EXPENSES: 'fixedExpenses',
  WISHLIST: 'wishlist',
} as const;

// ============= Transactions =============

export async function getAllTransactions(): Promise<Transaction[]> {
  const snapshot = await getDocs(collection(db, COLLECTIONS.TRANSACTIONS));
  return snapshot.docs.map(doc => doc.data() as Transaction);
}

export async function getTransactionsByMonth(year: number, month: number): Promise<Transaction[]> {
  const all = await getAllTransactions();
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  return all.filter(t => t.date.startsWith(prefix));
}

export async function addTransaction(tx: Transaction): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.TRANSACTIONS, tx.id), tx);
}

export async function updateTransaction(tx: Transaction): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.TRANSACTIONS, tx.id), tx);
}

export async function deleteTransaction(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.TRANSACTIONS, id));
}

// ============= Fixed Expenses =============

export async function getAllFixedExpenses(): Promise<FixedExpense[]> {
  const snapshot = await getDocs(collection(db, COLLECTIONS.FIXED_EXPENSES));
  return snapshot.docs.map(doc => doc.data() as FixedExpense);
}

export async function addFixedExpense(expense: FixedExpense): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.FIXED_EXPENSES, expense.id), expense);
}

export async function updateFixedExpense(expense: FixedExpense): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.FIXED_EXPENSES, expense.id), expense);
}

export async function deleteFixedExpense(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.FIXED_EXPENSES, id));
}

// ============= Wishlist =============

export async function getAllWishlistItems(): Promise<WishlistItem[]> {
  const snapshot = await getDocs(collection(db, COLLECTIONS.WISHLIST));
  return snapshot.docs.map(doc => doc.data() as WishlistItem);
}

export async function addWishlistItem(item: WishlistItem): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.WISHLIST, item.id), item);
}

export async function updateWishlistItem(item: WishlistItem): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.WISHLIST, item.id), item);
}

export async function deleteWishlistItem(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.WISHLIST, id));
}

// ============= Bulk / Utility =============

export async function clearAllData(): Promise<void> {
  const batch = writeBatch(db);
  
  const txs = await getDocs(collection(db, COLLECTIONS.TRANSACTIONS));
  txs.forEach(d => batch.delete(d.ref));
  
  const fes = await getDocs(collection(db, COLLECTIONS.FIXED_EXPENSES));
  fes.forEach(d => batch.delete(d.ref));
  
  const wls = await getDocs(collection(db, COLLECTIONS.WISHLIST));
  wls.forEach(d => batch.delete(d.ref));
  
  await batch.commit();
}
