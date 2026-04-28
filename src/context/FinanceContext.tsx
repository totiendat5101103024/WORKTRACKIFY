/**
 * Finance Context — global state provider for all financial data.
 * Wraps all custom hooks and exposes a unified API.
 * Bridges with CalendarContext to compute "Safe to Spend".
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useWishlist } from '../hooks/useWishlist';
import { useFinanceSettings } from '../hooks/useFinanceSettings';
import { usePlannedExpenses } from '../hooks/usePlannedExpenses';
import { useCalendar } from './CalendarContext';
import type { Transaction, WishlistItem, FinanceSettings, PlannedExpense } from '../types/finance';

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

  // Wishlist
  wishlistItems: WishlistItem[];
  wishlistLoading: boolean;
  addWishlistItem: (data: Omit<WishlistItem, 'id' | 'createdAt'>) => Promise<WishlistItem>;
  updateWishlistItem: (item: WishlistItem) => Promise<void>;
  addWishlistFunds: (id: string, amount: number) => Promise<void>;
  removeWishlistItem: (id: string) => Promise<void>;
  wishlistTotalSaved: number;
  wishlistTotalTarget: number;

  // Planned Expenses (Khoản chuẩn bị chi — includes recurring/pinned fixed expenses)
  plannedExpenses: PlannedExpense[];
  plannedExpensesLoading: boolean;
  addPlannedExpense: (data: Omit<PlannedExpense, 'id' | 'createdAt' | 'completedMonths'>) => Promise<PlannedExpense>;
  removePlannedExpense: (id: string) => Promise<void>;
  tickPlannedExpense: (id: string, monthDate: Date) => Promise<void>;
  togglePinPlanned: (id: string) => Promise<void>;
  getPlannedForMonth: (monthDate: Date) => PlannedExpense[];
  getPlannedTotalForMonth: (monthDate: Date) => number;
  refreshPlannedExpenses: () => Promise<void>;

  // Finance Settings
  financeSettings: FinanceSettings;
  updateFinanceSettings: (partial: Partial<FinanceSettings>) => void;

  /**
   * "Safe to Spend" = Salary + Income − Spent − Planned(this month) − Savings
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
  const wlHook = useWishlist();
  const fsHook = useFinanceSettings();
  const peHook = usePlannedExpenses();

  const { estimatedMonthlySalary, currentMonth } = useCalendar();

  const safeToSpend = useMemo(() => {
    const totalIncome = estimatedMonthlySalary + txHook.totalIncome;
    const totalManualExpenses = txHook.totalExpense;
    const planned = peHook.getTotalForMonth(currentMonth);
    const savingsGoal = fsHook.settings.savingsGoal;
    return totalIncome - totalManualExpenses - planned - savingsGoal;
  }, [
    estimatedMonthlySalary, txHook.totalIncome, txHook.totalExpense,
    peHook, currentMonth, fsHook.settings.savingsGoal,
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

    // Wishlist
    wishlistItems: wlHook.items,
    wishlistLoading: wlHook.loading,
    addWishlistItem: wlHook.add,
    updateWishlistItem: wlHook.update,
    addWishlistFunds: wlHook.addFunds,
    removeWishlistItem: wlHook.remove,
    wishlistTotalSaved: wlHook.totalSaved,
    wishlistTotalTarget: wlHook.totalTarget,

    // Planned Expenses
    plannedExpenses: peHook.items,
    plannedExpensesLoading: peHook.loading,
    addPlannedExpense: peHook.add,
    removePlannedExpense: peHook.remove,
    tickPlannedExpense: peHook.tick,
    togglePinPlanned: peHook.togglePin,
    getPlannedForMonth: peHook.getItemsForMonth,
    getPlannedTotalForMonth: peHook.getTotalForMonth,
    refreshPlannedExpenses: peHook.refresh,

    // Settings
    financeSettings: fsHook.settings,
    updateFinanceSettings: fsHook.update,

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
  if (!ctx) throw new Error('useFinance must be used within a FinanceProvider');
  return ctx;
}
