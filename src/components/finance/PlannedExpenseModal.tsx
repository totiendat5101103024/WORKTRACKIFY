/**
 * Modal to add a new Planned Expense (Khoản chuẩn bị chi).
 * Supports pinned recurring items (chi phí cố định) and one-off items.
 * Uses banking-style comma formatting for the amount input.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Pin } from 'lucide-react';
import { EXPENSE_CATEGORIES, FIXED_EXPENSE_PRESETS } from '../../types/finance';
import type { PlannedExpense } from '../../types/finance';
import { formatAmountDisplay, parseAmountDisplay } from '../../lib/formatAmount';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<PlannedExpense, 'id' | 'createdAt' | 'completedMonths'>) => Promise<PlannedExpense>;
}

const ALL_CATEGORIES = [
  ...FIXED_EXPENSE_PRESETS.filter(c => c.name !== 'Khác'),
  ...EXPENSE_CATEGORIES,
];

export default function PlannedExpenseModal({ open, onClose, onSave }: Props) {
  const [name, setName] = useState('');
  const [amountDisplay, setAmountDisplay] = useState('');
  const [selectedCat, setSelectedCat] = useState(EXPENSE_CATEGORIES[2]); // Mua sắm
  const [note, setNote] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName('');
    setAmountDisplay('');
    setSelectedCat(EXPENSE_CATEGORIES[2]);
    setNote('');
    setIsPinned(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmountDisplay(formatAmountDisplay(e.target.value));
  };

  const handleSave = async () => {
    const amount = parseAmountDisplay(amountDisplay);
    if (!name.trim() || amount <= 0) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        amount,
        emoji: selectedCat.emoji,
        category: selectedCat.name,
        note: note.trim(),
        isPinned,
        isRecurring: isPinned, // pin = recurring
      });
      handleClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="bg-white rounded-t-[2rem] sm:rounded-[2rem] p-6 pb-8 w-full sm:max-w-md shadow-2xl max-h-[92vh] overflow-y-auto"
          >
            {/* Handle */}
            <div className="w-12 h-1.5 bg-surface-200 rounded-full mx-auto mb-5 sm:hidden" />

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-base font-black text-surface-800">Thêm khoản chuẩn bị chi</h2>
                  <p className="text-[10px] text-surface-400 font-medium">Tick để chuyển sang đã chi tiêu</p>
                </div>
              </div>
              <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-surface-100 text-surface-400 hover:bg-surface-200 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Pin toggle */}
            <button
              onClick={() => setIsPinned(p => !p)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl mb-5 border-2 transition-all ${
                isPinned
                  ? 'bg-amber-50 border-amber-400 text-amber-700'
                  : 'bg-surface-50 border-surface-200 text-surface-500 hover:border-surface-300'
              }`}
            >
              <Pin className={`w-4 h-4 shrink-0 ${isPinned ? 'text-amber-500' : 'text-surface-400'}`} />
              <div className="text-left">
                <p className="text-sm font-bold leading-tight">
                  {isPinned ? '📌 Đã ghim — Chi phí cố định hàng tháng' : 'Ghim thành chi phí cố định hàng tháng'}
                </p>
                <p className="text-[10px] mt-0.5 opacity-70">
                  {isPinned ? 'Khoản này sẽ tự động xuất hiện mỗi tháng' : 'Nhấn để ghim và lặp lại tháng sau'}
                </p>
              </div>
            </button>

            {/* Category chips */}
            <div className="mb-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2 block">Danh mục</label>
              <div className="flex flex-wrap gap-2">
                {ALL_CATEGORIES.map(cat => (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCat(cat)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedCat.name === cat.name
                        ? 'bg-amber-500 text-white shadow-sm shadow-amber-200'
                        : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div className="mb-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2 block">Tên khoản chi</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={isPinned ? 'VD: Tiền nhà, Internet...' : 'VD: Mua giày mới'}
                className="w-full bg-surface-50 border border-surface-200 rounded-2xl px-4 py-3 text-sm font-medium text-surface-800 placeholder:text-surface-300 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all"
              />
            </div>

            {/* Amount */}
            <div className="mb-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2 block">Số tiền (₫)</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={amountDisplay}
                  onChange={handleAmountChange}
                  placeholder="0"
                  className="w-full bg-surface-50 border border-surface-200 rounded-2xl px-4 py-3 pr-8 text-lg font-black text-surface-800 placeholder:text-surface-300 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-surface-300">₫</span>
              </div>
            </div>

            {/* Note */}
            <div className="mb-6">
              <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2 block">Ghi chú (tuỳ chọn)</label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Thêm ghi chú..."
                className="w-full bg-surface-50 border border-surface-200 rounded-2xl px-4 py-3 text-sm font-medium text-surface-800 placeholder:text-surface-300 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={handleClose} className="flex-1 py-3.5 rounded-2xl bg-surface-100 text-surface-600 text-sm font-bold hover:bg-surface-200 transition-colors">
                Huỷ
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !name.trim() || !amountDisplay}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-black shadow-lg shadow-amber-200/50 hover:shadow-amber-300/50 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Đang lưu...' : isPinned ? '📌 Ghim khoản này' : '+ Thêm vào danh sách'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
