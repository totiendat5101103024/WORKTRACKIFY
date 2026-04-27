/**
 * Custom hook for Fixed Expenses CRUD with IndexedDB.
 */

import { useState, useEffect, useCallback } from 'react';
import type { FixedExpense } from '../types/finance';
import * as db from '../lib/db';
import { generateId } from '../lib/uid';
import { format } from 'date-fns';

export function useFixedExpenses() {
  const [expenses, setExpenses] = useState<FixedExpense[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await db.getAllFixedExpenses();
      setExpenses(data.sort((a, b) => a.createdAt - b.createdAt));
    } catch (err) {
      console.error('Failed to load fixed expenses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(async (data: Omit<FixedExpense, 'id' | 'createdAt' | 'paidMonths'>) => {
    const expense: FixedExpense = {
      ...data,
      id: generateId(),
      paidMonths: [],
      createdAt: Date.now(),
    };
    await db.addFixedExpense(expense);
    await refresh();
    return expense;
  }, [refresh]);

  const update = useCallback(async (expense: FixedExpense) => {
    await db.updateFixedExpense(expense);
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await db.deleteFixedExpense(id);
    await refresh();
  }, [refresh]);

  const togglePaid = useCallback(async (id: string, monthDate: Date) => {
    const monthKey = format(monthDate, 'yyyy-MM');
    const expense = expenses.find(e => e.id === id);
    if (!expense) return;

    const isPaid = expense.paidMonths.includes(monthKey);
    const updatedExpense: FixedExpense = {
      ...expense,
      paidMonths: isPaid
        ? expense.paidMonths.filter(m => m !== monthKey)
        : [...expense.paidMonths, monthKey],
    };
    await db.updateFixedExpense(updatedExpense);
    await refresh();
  }, [expenses, refresh]);

  /** Calculate total fixed expenses amount for a given month */
  const getTotalForMonth = useCallback((monthDate: Date) => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  /** Check if a specific expense is paid for a given month */
  const isPaidForMonth = useCallback((id: string, monthDate: Date) => {
    const monthKey = format(monthDate, 'yyyy-MM');
    const expense = expenses.find(e => e.id === id);
    return expense?.paidMonths.includes(monthKey) ?? false;
  }, [expenses]);

  return {
    expenses,
    loading,
    add,
    update,
    remove,
    togglePaid,
    getTotalForMonth,
    isPaidForMonth,
    refresh,
  };
}
