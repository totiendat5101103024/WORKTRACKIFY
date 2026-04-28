/**
 * Core financial data types for WorkTrackify Finance Hub
 * All types used across IndexedDB, Context, and Components.
 */

// ============= Transaction =============

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  amount: number;
  date: string; // ISO date string (YYYY-MM-DD)
  category: string;
  categoryEmoji: string;
  type: TransactionType;
  note: string;
  createdAt: number; // timestamp ms
}

// ============= Fixed Expense =============

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  emoji: string;
  /** Months in which this expense is marked paid. Format: "YYYY-MM" */
  paidMonths: string[];
  createdAt: number;
}

// ============= Wishlist / Sinking Fund =============

export interface WishlistItem {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  emoji: string;
  createdAt: number;
}

// ============= Planned Expenses (Chuẩn bị chi) =============

export interface PlannedExpense {
  id: string;
  name: string;
  amount: number;
  emoji: string;
  category: string;
  note: string;
  createdAt: number;
}

// ============= App Finance Settings =============

export interface FinanceSettings {
  /** Monthly savings goal used in "Safe to Spend" calculation */
  savingsGoal: number;
  /** Currency symbol */
  currency: string;
}

export const DEFAULT_FINANCE_SETTINGS: FinanceSettings = {
  savingsGoal: 0,
  currency: '₫',
};

// ============= Category presets =============

export interface CategoryPreset {
  name: string;
  emoji: string;
}

export const EXPENSE_CATEGORIES: CategoryPreset[] = [
  { name: 'Ăn uống', emoji: '🍜' },
  { name: 'Di chuyển', emoji: '🚗' },
  { name: 'Mua sắm', emoji: '🛒' },
  { name: 'Giải trí', emoji: '🎮' },
  { name: 'Sức khỏe', emoji: '💊' },
  { name: 'Giáo dục', emoji: '📚' },
  { name: 'Hóa đơn', emoji: '📄' },
  { name: 'Quà tặng', emoji: '🎁' },
  { name: 'Khác', emoji: '📌' },
];

export const INCOME_CATEGORIES: CategoryPreset[] = [
  { name: 'Lương', emoji: '💰' },
  { name: 'Freelance', emoji: '💻' },
  { name: 'Thưởng', emoji: '🎉' },
  { name: 'Đầu tư', emoji: '📈' },
  { name: 'Hoàn tiền', emoji: '💸' },
  { name: 'Khác', emoji: '📌' },
];

export const FIXED_EXPENSE_PRESETS: CategoryPreset[] = [
  { name: 'Tiền nhà', emoji: '🏠' },
  { name: 'Internet', emoji: '📡' },
  { name: 'Điện thoại', emoji: '📱' },
  { name: 'Điện nước', emoji: '💡' },
  { name: 'Bảo hiểm', emoji: '🛡️' },
  { name: 'Subscription', emoji: '📺' },
  { name: 'Gym', emoji: '🏋️' },
  { name: 'Khác', emoji: '📌' },
];
