/**
 * Custom hook for Planned Expenses (Khoản chuẩn bị chi) — supports:
 * - Regular one-off planned items (deleted when ticked)
 * - Pinned recurring items (marked complete per-month when ticked, auto-repeat next month)
 */

import { useState, useEffect, useCallback } from 'react';
import type { PlannedExpense } from '../types/finance';
import * as db from '../lib/db';
import { generateId } from '../lib/uid';

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** Normalize items from Firestore that may lack new fields */
function normalize(raw: PlannedExpense): PlannedExpense {
  return {
    isPinned: false,
    isRecurring: false,
    completedMonths: [],
    ...raw,
  };
}

export function usePlannedExpenses() {
  const [items, setItems] = useState<PlannedExpense[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await db.getAllPlannedExpenses();
      const normalized = data.map(normalize);
      // Pinned first, then newest first
      normalized.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.createdAt - a.createdAt;
      });
      setItems(normalized);
    } catch (err) {
      console.error('Failed to load planned expenses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // ---------- Derived helpers ----------

  /** Items visible for a given month (recurring shown only if not yet completed) */
  const getItemsForMonth = useCallback((monthDate: Date): PlannedExpense[] => {
    const key = monthKey(monthDate);
    return items.filter(item => {
      if (item.isRecurring) return !item.completedMonths.includes(key);
      return true; // one-off items always shown until deleted
    });
  }, [items]);

  /** Total planned amount for a given month */
  const getTotalForMonth = useCallback((monthDate: Date): number => {
    return getItemsForMonth(monthDate).reduce((sum, i) => sum + i.amount, 0);
  }, [getItemsForMonth]);

  // ---------- CRUD ----------

  const add = useCallback(async (
    data: Omit<PlannedExpense, 'id' | 'createdAt' | 'completedMonths'>
  ): Promise<PlannedExpense> => {
    const item: PlannedExpense = {
      ...data,
      id: generateId(),
      createdAt: Date.now(),
      completedMonths: [],
    };
    await db.addPlannedExpense(item);
    await refresh();
    return item;
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await db.deletePlannedExpense(id);
    await refresh();
  }, [refresh]);

  /**
   * Tick an item:
   * - Recurring → mark this month complete (stays for next month)
   * - One-off   → delete permanently
   */
  const tick = useCallback(async (id: string, monthDate: Date) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    if (item.isRecurring) {
      const key = monthKey(monthDate);
      if (item.completedMonths.includes(key)) return; // already done
      await db.updatePlannedExpense({
        ...item,
        completedMonths: [...item.completedMonths, key],
      });
      await refresh();
    } else {
      await db.deletePlannedExpense(id);
      await refresh();
    }
  }, [items, refresh]);

  /** Toggle pin ↔ unpin (also toggles isRecurring together) */
  const togglePin = useCallback(async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    await db.updatePlannedExpense({
      ...item,
      isPinned: !item.isPinned,
      isRecurring: !item.isPinned, // pin implies recurring
    });
    await refresh();
  }, [items, refresh]);

  return {
    items,
    loading,
    add,
    remove,
    tick,
    togglePin,
    refresh,
    getItemsForMonth,
    getTotalForMonth,
  };
}
