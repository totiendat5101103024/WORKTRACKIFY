/**
 * Finance Dashboard — Bento-style financial overview.
 * Shows Safe to Spend, transaction list, fixed expenses, wishlist, and spending breakdown.
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, TrendingUp, TrendingDown, Shield, Wallet,
  Receipt, Trash2, ChevronLeft, ChevronRight, Clock,
  Target, PiggyBank, ShoppingBag, CheckCircle2, Circle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useFinance } from '../../context/FinanceContext';
import { useCalendar } from '../../context/CalendarContext';
import TransactionModal from './TransactionModal';
import FixedExpenseModal from './FixedExpenseModal';
import WishlistModal from './WishlistModal';
import AddFundsModal from './AddFundsModal';
import PlannedExpenseModal from './PlannedExpenseModal';
import type { Transaction } from '../../types/finance';

export default function FinanceDashboard() {
  const {
    transactions, addTransaction, removeTransaction,
    totalManualIncome, totalManualExpense,
    fixedExpenses, addFixedExpense, removeFixedExpense,
    toggleFixedExpensePaid, getFixedExpensesTotal, isFixedExpensePaid,
    financeSettings, safeToSpend,
    wishlistItems, addWishlistItem, addWishlistFunds, removeWishlistItem,
    wishlistTotalSaved, wishlistTotalTarget,
    plannedExpenses, addPlannedExpense, removePlannedExpense, totalPlanned,
  } = useFinance();

  const { estimatedMonthlySalary, currentMonth, prevMonth, nextMonth } = useCalendar();

  const [showTxModal, setShowTxModal] = useState(false);
  const [showFEModal, setShowFEModal] = useState(false);
  const [showWLModal, setShowWLModal] = useState(false);
  const [showPEModal, setShowPEModal] = useState(false);
  const [tickingId, setTickingId] = useState<string | null>(null);
  const [fundTarget, setFundTarget] = useState<{ id: string; name: string; emoji: string; remaining: number } | null>(null);

  const totalFixedExpenses = getFixedExpensesTotal(currentMonth);
  const totalIncome = estimatedMonthlySalary + totalManualIncome;

  // Tick a planned expense → create actual transaction + remove from list
  const handleTickPlanned = useCallback(async (pe: typeof plannedExpenses[0]) => {
    if (tickingId === pe.id) return;
    setTickingId(pe.id);
    try {
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      await addTransaction({
        amount: pe.amount,
        date: dateStr,
        category: pe.category,
        categoryEmoji: pe.emoji,
        type: 'expense',
        note: pe.note || pe.name,
      });
      await removePlannedExpense(pe.id);
    } finally {
      setTickingId(null);
    }
  }, [addTransaction, removePlannedExpense, tickingId]);

  // Group transactions by date
  const groupedTx = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    transactions.forEach(tx => {
      if (!groups[tx.date]) groups[tx.date] = [];
      groups[tx.date].push(tx);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, items]) => ({ date, items }));
  }, [transactions]);

  // Spending breakdown by category
  const spendingByCategory = useMemo(() => {
    const cats: Record<string, { emoji: string; total: number }> = {};
    transactions.filter(t => t.type === 'expense').forEach(tx => {
      if (!cats[tx.category]) cats[tx.category] = { emoji: tx.categoryEmoji, total: 0 };
      cats[tx.category].total += tx.amount;
    });
    return Object.entries(cats)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [transactions]);

  const maxCatSpend = spendingByCategory.length > 0 ? spendingByCategory[0].total : 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-brand-50/20 to-surface-100 text-surface-900 font-sans p-4 md:p-6 overflow-x-hidden flex flex-col pb-24">
      {/* Header */}
      <header className="flex justify-between items-center mb-6 max-w-7xl mx-auto w-full">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-surface-800">Tài chính</h1>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="hover:text-brand-500 transition-colors"><ChevronLeft className="w-3.5 h-3.5" /></button>
            <span className="text-[10px] md:text-xs text-surface-400 uppercase tracking-[0.15em] font-black">
              {format(currentMonth, 'MMMM yyyy', { locale: vi })}
            </span>
            <button onClick={nextMonth} className="hover:text-brand-500 transition-colors"><ChevronRight className="w-3.5 h-3.5" /></button>
          </div>
        </div>
        <button
          onClick={() => setShowTxModal(true)}
          className="w-11 h-11 bg-gradient-to-br from-brand-500 to-brand-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand-300/30 active:scale-95 transition-transform"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-4 md:gap-6 max-w-7xl mx-auto w-full flex-1">

        {/* Safe to Spend Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="col-span-12 md:col-span-6 bg-gradient-to-br from-surface-900 to-surface-800 rounded-[2rem] p-6 md:p-8 text-white shadow-2xl relative overflow-hidden"
        >
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-brand-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400">Safe to Spend</span>
          </div>
          <h2 className={`text-3xl md:text-4xl font-black tracking-tighter ${safeToSpend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {safeToSpend >= 0 ? '' : '-'}{Math.abs(Math.round(safeToSpend)).toLocaleString()}
            <span className="text-lg ml-1 opacity-40 font-bold">₫</span>
          </h2>
          <p className="text-[10px] text-surface-500 mt-2 font-medium leading-relaxed">
            = Lương ({Math.round(estimatedMonthlySalary).toLocaleString()}) + Thu nhập ({Math.round(totalManualIncome).toLocaleString()})
            <br />− CĐ ({Math.round(totalFixedExpenses).toLocaleString()}) − Chi tiêu ({Math.round(totalManualExpense).toLocaleString()})
            <br />− Chuẩn bị chi ({Math.round(totalPlanned).toLocaleString()}) − TK ({Math.round(financeSettings.savingsGoal).toLocaleString()})
          </p>
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl" />
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="col-span-6 md:col-span-3 bg-white rounded-[2rem] border border-surface-200/60 p-5 md:p-6 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-surface-400">Tổng thu</span>
          </div>
          <p className="text-xl md:text-2xl font-black text-emerald-600 tracking-tight">
            {Math.round(totalIncome).toLocaleString()}<span className="text-xs ml-0.5 opacity-40">₫</span>
          </p>
          <p className="text-[9px] text-surface-400 mt-1 font-bold">
            Lương: {Math.round(estimatedMonthlySalary).toLocaleString()} • Khác: {Math.round(totalManualIncome).toLocaleString()}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="col-span-6 md:col-span-3 bg-white rounded-[2rem] border border-surface-200/60 p-5 md:p-6 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-600" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-surface-400">Tổng chi</span>
          </div>
          <p className="text-xl md:text-2xl font-black text-red-500 tracking-tight">
            {Math.round(totalManualExpense + totalFixedExpenses).toLocaleString()}<span className="text-xs ml-0.5 opacity-40">₫</span>
          </p>
          <p className="text-[9px] text-surface-400 mt-1 font-bold">
            CĐ: {Math.round(totalFixedExpenses).toLocaleString()} • Biến đổi: {Math.round(totalManualExpense).toLocaleString()}
          </p>
        </motion.div>

        {/* Spending Breakdown */}
        {spendingByCategory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className="col-span-12 md:col-span-4 bg-white rounded-[2rem] border border-surface-200/60 p-5 md:p-6 shadow-sm"
          >
            <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-surface-400 mb-4">📊 Chi tiêu theo danh mục</h3>
            <div className="space-y-3">
              {spendingByCategory.map(cat => {
                const pct = (cat.total / maxCatSpend) * 100;
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-surface-700 flex items-center gap-1.5">
                        <span>{cat.emoji}</span> {cat.name}
                      </span>
                      <span className="text-xs font-black text-surface-600 tabular-nums">{cat.total.toLocaleString()}₫</span>
                    </div>
                    <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-brand-400 to-brand-500 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Fixed Expenses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className={`col-span-12 ${spendingByCategory.length > 0 ? 'md:col-span-4' : 'md:col-span-5'} bg-white rounded-[2rem] border border-surface-200/60 p-5 md:p-6 shadow-sm`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-surface-400" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-surface-400">Chi phí cố định</h3>
            </div>
            <button onClick={() => setShowFEModal(true)} className="text-[10px] font-bold text-brand-500 hover:text-brand-600 transition-colors">+ Thêm</button>
          </div>

          {fixedExpenses.length === 0 ? (
            <p className="text-center text-surface-400 text-sm py-6 italic">Chưa có chi phí cố định</p>
          ) : (
            <div className="space-y-2">
              {fixedExpenses.map(fe => {
                const paid = isFixedExpensePaid(fe.id, currentMonth);
                return (
                  <div key={fe.id} className="flex items-center gap-3 p-3 rounded-2xl bg-surface-50 border border-surface-100">
                    <button
                      onClick={() => toggleFixedExpensePaid(fe.id, currentMonth)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all shrink-0 ${
                        paid ? 'bg-emerald-100 text-emerald-600 shadow-sm' : 'bg-surface-100 text-surface-400 hover:bg-brand-50'
                      }`}
                    >
                      {paid ? '✅' : fe.emoji}
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-bold ${paid ? 'line-through text-surface-400' : 'text-surface-800'}`}>{fe.name}</span>
                    </div>
                    <span className="text-sm font-black text-surface-600 shrink-0">{fe.amount.toLocaleString()}₫</span>
                    <button
                      onClick={async (e) => { e.stopPropagation(); await removeFixedExpense(fe.id); }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-surface-300 hover:text-red-500 hover:bg-red-50 transition-all shrink-0 active:scale-90"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
              <div className="flex justify-between items-center pt-2 border-t border-surface-100">
                <span className="text-[10px] font-black uppercase text-surface-400">Tổng / tháng</span>
                <span className="text-sm font-black text-surface-700">{Math.round(totalFixedExpenses).toLocaleString()}₫</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Wishlist / Savings Goals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
          className={`col-span-12 ${spendingByCategory.length > 0 ? 'md:col-span-4' : 'md:col-span-5'} bg-white rounded-[2rem] border border-surface-200/60 p-5 md:p-6 shadow-sm`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-surface-400" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-surface-400">Mục tiêu tiết kiệm</h3>
            </div>
            <button onClick={() => setShowWLModal(true)} className="text-[10px] font-bold text-brand-500 hover:text-brand-600 transition-colors">+ Thêm</button>
          </div>

          {/* Total progress */}
          {wishlistItems.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-3 mb-4 border border-emerald-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-black uppercase text-emerald-600">Tổng tiết kiệm</span>
                <span className="text-xs font-black text-emerald-700">
                  {wishlistTotalSaved.toLocaleString()} / {wishlistTotalTarget.toLocaleString()}₫
                </span>
              </div>
              <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${wishlistTotalTarget > 0 ? Math.min((wishlistTotalSaved / wishlistTotalTarget) * 100, 100) : 0}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"
                />
              </div>
            </div>
          )}

          {wishlistItems.length === 0 ? (
            <div className="text-center py-6">
              <PiggyBank className="w-8 h-8 text-surface-200 mx-auto mb-2" />
              <p className="text-surface-400 text-xs font-medium">Chưa có mục tiêu</p>
            </div>
          ) : (
            <div className="space-y-3">
              {wishlistItems.map(item => {
                const pct = item.targetAmount > 0 ? Math.min((item.savedAmount / item.targetAmount) * 100, 100) : 0;
                const remaining = Math.max(0, item.targetAmount - item.savedAmount);
                const isComplete = pct >= 100;
                return (
                  <div key={item.id} className={`p-3 rounded-2xl border transition-all ${isComplete ? 'bg-emerald-50 border-emerald-200' : 'bg-surface-50 border-surface-100'}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg">{item.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-bold block truncate ${isComplete ? 'text-emerald-700' : 'text-surface-800'}`}>
                          {item.name} {isComplete && '🎉'}
                        </span>
                        <span className="text-[9px] text-surface-400 font-medium">
                          {item.savedAmount.toLocaleString()} / {item.targetAmount.toLocaleString()}₫
                        </span>
                      </div>
                      {!isComplete && (
                        <button
                          onClick={() => setFundTarget({ id: item.id, name: item.name, emoji: item.emoji, remaining })}
                          className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold hover:bg-emerald-200 transition-colors active:scale-95 shrink-0"
                        >
                          + Thêm tiền
                        </button>
                      )}
                      <button
                        onClick={async () => await removeWishlistItem(item.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-surface-300 hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="h-2 bg-surface-200/60 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className={`h-full rounded-full ${isComplete ? 'bg-emerald-400' : 'bg-gradient-to-r from-brand-400 to-brand-500'}`}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[9px] font-bold text-surface-400">{Math.round(pct)}%</span>
                      {!isComplete && <span className="text-[9px] font-bold text-surface-400">còn {remaining.toLocaleString()}₫</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Planned Expenses — Khoản chuẩn bị chi */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.23 }}
          className="col-span-12 bg-white rounded-[2rem] border border-surface-200/60 p-5 md:p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-500" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-surface-400">Khoản chuẩn bị chi</h3>
              {plannedExpenses.length > 0 && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[9px] font-black">{plannedExpenses.length}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {plannedExpenses.length > 0 && (
                <span className="text-[10px] font-black text-amber-600">{totalPlanned.toLocaleString()}₫</span>
              )}
              <button onClick={() => setShowPEModal(true)} className="text-[10px] font-bold text-brand-500 hover:text-brand-600 transition-colors">+ Thêm</button>
            </div>
          </div>

          {plannedExpenses.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <ShoppingBag className="w-6 h-6 text-amber-200" />
              </div>
              <p className="text-surface-400 text-xs font-medium">Chưa có khoản nào cần chi</p>
              <p className="text-surface-300 text-[10px] mt-1">Nhấn + để lên kế hoạch chi tiêu</p>
            </div>
          ) : (
            <div className="space-y-2">
              {plannedExpenses.map(pe => (
                <AnimatePresence key={pe.id}>
                  <motion.div
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 40, scale: 0.95 }}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50/60 border border-amber-100 group"
                  >
                    {/* Tick button */}
                    <button
                      onClick={() => handleTickPlanned(pe)}
                      disabled={tickingId === pe.id}
                      className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-90 hover:bg-amber-100 disabled:opacity-50"
                      title="Tick để chuyển sang đã chi tiêu"
                    >
                      {tickingId === pe.id ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                          className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full"
                        />
                      ) : (
                        <Circle className="w-5 h-5 text-amber-400 group-hover:text-amber-500 transition-colors" />
                      )}
                    </button>

                    {/* Emoji badge */}
                    <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center text-sm shrink-0">
                      {pe.emoji}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold text-surface-800 block truncate">{pe.name}</span>
                      {pe.note && <span className="text-[10px] text-surface-400 block truncate">{pe.note}</span>}
                      <span className="text-[9px] text-amber-600 font-bold">{pe.category}</span>
                    </div>

                    {/* Amount */}
                    <span className="text-sm font-black text-amber-700 tabular-nums shrink-0">
                      -{pe.amount.toLocaleString()}₫
                    </span>

                    {/* Delete */}
                    <button
                      onClick={async (e) => { e.stopPropagation(); await removePlannedExpense(pe.id); }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-surface-300 hover:text-red-500 hover:bg-red-50 transition-all shrink-0 active:scale-90 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                </AnimatePresence>
              ))}

              {/* Hint */}
              <div className="flex items-center gap-2 pt-2 border-t border-amber-100">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <p className="text-[10px] text-amber-500 font-medium">Tick vào ô tròn để chuyển sang "Đã chi tiêu"</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Transaction List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="col-span-12 bg-white rounded-[2rem] border border-surface-200/60 p-5 md:p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-surface-400" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-surface-400">Giao dịch gần đây</h3>
            </div>
            <button onClick={() => setShowTxModal(true)} className="text-[10px] font-bold text-brand-500 hover:text-brand-600 transition-colors">+ Thêm</button>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="w-10 h-10 text-surface-200 mx-auto mb-3" />
              <p className="text-surface-400 text-sm font-medium">Chưa có giao dịch</p>
              <p className="text-surface-300 text-xs mt-1">Nhấn + để thêm thu nhập hoặc chi tiêu</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {groupedTx.map(group => (
                <div key={group.date}>
                  <p className="text-[9px] font-black uppercase tracking-widest text-surface-400 mb-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(parseISO(group.date), 'EEEE, dd/MM', { locale: vi })}
                  </p>
                  <div className="space-y-1.5">
                    {group.items.map(tx => (
                      <div key={tx.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-50 transition-colors">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 ${
                          tx.type === 'income' ? 'bg-emerald-100' : 'bg-red-100'
                        }`}>
                          {tx.categoryEmoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-bold text-surface-800 block truncate">{tx.category}</span>
                          {tx.note && <span className="text-[10px] text-surface-400 block truncate">{tx.note}</span>}
                        </div>
                        <span className={`text-sm font-black tabular-nums shrink-0 ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                          {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()}₫
                        </span>
                        <button
                          onClick={async (e) => { e.stopPropagation(); await removeTransaction(tx.id); }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-surface-300 hover:text-red-500 hover:bg-red-50 transition-all shrink-0 active:scale-90"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Modals */}
      <TransactionModal
        open={showTxModal}
        onClose={() => setShowTxModal(false)}
        onSave={addTransaction}
      />
      <FixedExpenseModal
        open={showFEModal}
        onClose={() => setShowFEModal(false)}
        onSave={addFixedExpense}
      />
      <WishlistModal
        open={showWLModal}
        onClose={() => setShowWLModal(false)}
        onSave={addWishlistItem}
      />
      <PlannedExpenseModal
        open={showPEModal}
        onClose={() => setShowPEModal(false)}
        onSave={addPlannedExpense}
      />
      {fundTarget && (
        <AddFundsModal
          open={!!fundTarget}
          onClose={() => setFundTarget(null)}
          onSave={async (amount) => {
            await addWishlistFunds(fundTarget.id, amount);
            setFundTarget(null);
          }}
          itemName={fundTarget.name}
          itemEmoji={fundTarget.emoji}
          remaining={fundTarget.remaining}
        />
      )}
    </div>
  );
}
