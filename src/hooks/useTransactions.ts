/**
 * Custom hook for Transaction CRUD with IndexedDB.
 * Provides reactive state synced with the database.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Transaction } from '../types/finance';
import * as db from '../lib/db';
import { generateId } from '../lib/uid';

export function useTransactions(year: number, month: number) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await db.getTransactionsByMonth(year, month);
      setTransactions(data.sort((a, b) => b.createdAt - a.createdAt));
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(async (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    const tx: Transaction = {
      ...data,
      id: generateId(),
      createdAt: Date.now(),
    };
    await db.addTransaction(tx);
    await refresh();
    return tx;
  }, [refresh]);

  const update = useCallback(async (tx: Transaction) => {
    await db.updateTransaction(tx);
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await db.deleteTransaction(id);
    await refresh();
  }, [refresh]);

  // Derived values
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    transactions,
    loading,
    add,
    update,
    remove,
    refresh,
    totalIncome,
    totalExpense,
  };
}
