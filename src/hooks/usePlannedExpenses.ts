/**
 * Custom hook for Planned Expenses (Khoản chuẩn bị chi) CRUD with Firestore.
 * Provides reactive state synced with the database.
 */

import { useState, useEffect, useCallback } from 'react';
import type { PlannedExpense } from '../types/finance';
import * as db from '../lib/db';
import { generateId } from '../lib/uid';

export function usePlannedExpenses() {
  const [items, setItems] = useState<PlannedExpense[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await db.getAllPlannedExpenses();
      setItems(data.sort((a, b) => b.createdAt - a.createdAt));
    } catch (err) {
      console.error('Failed to load planned expenses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(async (data: Omit<PlannedExpense, 'id' | 'createdAt'>) => {
    const item: PlannedExpense = {
      ...data,
      id: generateId(),
      createdAt: Date.now(),
    };
    await db.addPlannedExpense(item);
    await refresh();
    return item;
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await db.deletePlannedExpense(id);
    await refresh();
  }, [refresh]);

  const totalPlanned = items.reduce((sum, item) => sum + item.amount, 0);

  return {
    items,
    loading,
    add,
    remove,
    refresh,
    totalPlanned,
  };
}
