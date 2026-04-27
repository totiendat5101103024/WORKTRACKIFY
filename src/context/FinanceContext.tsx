/**
 * Finance Context — global state provider for all financial data.
 * Wraps all custom hooks and exposes a unified API.
 * Bridges with CalendarContext to compute "Safe to Spend".
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useFixedExpenses } from '../hooks/useFixedExpenses';
import { useWishlist } from '../hooks/useWishlist';
import { useFinanceSettings } from '../hooks/useFinanceSettings';
import { useCalendar } from './CalendarContext';
import type { Transaction, FixedExpense, WishlistItem, FinanceSettings } from '../types/finance';

interface FinanceContextValue {
  // Transactions
  transactions: Transaction[];
  transactionsLoading: boolean;
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt'>) => Promise<Transaction>;
  updateTransaction: (tx: Transaction) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  refreshTransactions: () => Promise<void>;
  totalManualIncome: number;
  totalManualExpense: number;

  // Fixed Expenses
  fixedExpenses: FixedExpense[];
  fixedExpensesLoading: boolean;
  addFixedExpense: (data: Omit<FixedExpense, 'id' | 'createdAt' | 'paidMonths'>) => Promise<FixedExpense>;
  updateFixedExpense: (expense: FixedExpense) => Promise<void>;
  removeFixedExpense: (id: string) => Promise<void>;
  toggleFixedExpensePaid: (id: string, monthDate: Date) => Promise<void>;
  getFixedExpensesTotal: (monthDate: Date) => number;
  isFixedExpensePaid: (id: string, monthDate: Date) => boolean;

  // Wishlist
  wishlistItems: WishlistItem[];
  wishlistLoading: boolean;
  addWishlistItem: (data: Omit<WishlistItem, 'id' | 'createdAt'>) => Promise<WishlistItem>;
  updateWishlistItem: (item: WishlistItem) => Promise<void>;
  addWishlistFunds: (id: string, amount: number) => Promise<void>;
  removeWishlistItem: (id: string) => Promise<void>;
  wishlistTotalSaved: number;
  wishlistTotalTarget: number;

  // Finance Settings
  financeSettings: FinanceSettings;
  updateFinanceSettings: (partial: Partial<FinanceSettings>) => void;

  // Smart Analytics
  /**
   * "Safe to Spend" = Estimated Calendar Salary + Manual Incomes
   *                    - Total Fixed Expenses
   *                    - Total Manual Expenses already spent
   *                    - Savings Goal
   */
  safeToSpend: number;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

interface ProviderProps {
  children: ReactNode;
  year: number;
  month: number; // 0-indexed
}

export function FinanceProvider({ children, year, month }: ProviderProps) {
  const txHook = useTransactions(year, month);
  const feHook = useFixedExpenses();
  const wlHook = useWishlist();
  const fsHook = useFinanceSettings();

  // Bridge: read estimated salary from CalendarContext
  const { estimatedMonthlySalary, currentMonth } = useCalendar();

  // Compute "Safe to Spend"
  const safeToSpend = useMemo(() => {
    const totalIncome = estimatedMonthlySalary + txHook.totalIncome;
    const totalFixedExpenses = feHook.getTotalForMonth(currentMonth);
    const totalManualExpenses = txHook.totalExpense;
    const savingsGoal = fsHook.settings.savingsGoal;

    return totalIncome - totalFixedExpenses - totalManualExpenses - savingsGoal;
  }, [
    estimatedMonthlySalary, txHook.totalIncome, txHook.totalExpense,
    feHook, currentMonth, fsHook.settings.savingsGoal,
  ]);

  const value: FinanceContextValue = {
    // Transactions
    transactions: txHook.transactions,
    transactionsLoading: txHook.loading,
    addTransaction: txHook.add,
    updateTransaction: txHook.update,
    removeTransaction: txHook.remove,
    refreshTransactions: txHook.refresh,
    totalManualIncome: txHook.totalIncome,
    totalManualExpense: txHook.totalExpense,

    // Fixed Expenses
    fixedExpenses: feHook.expenses,
    fixedExpensesLoading: feHook.loading,
    addFixedExpense: feHook.add,
    updateFixedExpense: feHook.update,
    removeFixedExpense: feHook.remove,
    toggleFixedExpensePaid: feHook.togglePaid,
    getFixedExpensesTotal: feHook.getTotalForMonth,
    isFixedExpensePaid: feHook.isPaidForMonth,

    // Wishlist
    wishlistItems: wlHook.items,
    wishlistLoading: wlHook.loading,
    addWishlistItem: wlHook.add,
    updateWishlistItem: wlHook.update,
    addWishlistFunds: wlHook.addFunds,
    removeWishlistItem: wlHook.remove,
    wishlistTotalSaved: wlHook.totalSaved,
    wishlistTotalTarget: wlHook.totalTarget,

    // Settings
    financeSettings: fsHook.settings,
    updateFinanceSettings: fsHook.update,

    // Smart Analytics
    safeToSpend,
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return ctx;
}
