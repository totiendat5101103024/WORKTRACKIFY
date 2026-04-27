/**
 * Transaction Modal — add/edit income or expense.
 * Glassmorphic bottom sheet with category grid, amount input, and date picker.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import type { Transaction, TransactionType, CategoryPreset } from '../../types/finance';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../types/finance';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Transaction, 'id' | 'createdAt'>) => Promise<any>;
  /** If provided, we're editing */
  initial?: Transaction | null;
}

export default function TransactionModal({ open, onClose, onSave, initial }: Props) {
  const [type, setType] = useState<TransactionType>(initial?.type || 'expense');
  const [amount, setAmount] = useState(initial?.amount?.toString() || '');
  const [note, setNote] = useState(initial?.note || '');
  const [date, setDate] = useState(initial?.date || format(new Date(), 'yyyy-MM-dd'));
  const [category, setCategory] = useState(initial?.category || '');
  const [categoryEmoji, setCategoryEmoji] = useState(initial?.categoryEmoji || '');
  const [saving, setSaving] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);

  const categories: CategoryPreset[] = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  // Auto-select first category
  useEffect(() => {
    if (!initial && categories.length > 0 && !category) {
      setCategory(categories[0].name);
      setCategoryEmoji(categories[0].emoji);
    }
  }, [type, categories, initial, category]);

  // Focus amount input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => amountRef.current?.focus(), 300);
    }
  }, [open]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setType(initial?.type || 'expense');
      setAmount(initial?.amount?.toString() || '');
      setNote(initial?.note || '');
      setDate(initial?.date || format(new Date(), 'yyyy-MM-dd'));
      setCategory(initial?.category || '');
      setCategoryEmoji(initial?.categoryEmoji || '');
    }
  }, [open, initial]);

  const handleSelectCategory = (cat: CategoryPreset) => {
    setCategory(cat.name);
    setCategoryEmoji(cat.emoji);
  };

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0 || !category) return;
    setSaving(true);
    try {
      await onSave({
        type,
        amount: numAmount,
        date,
        category,
        categoryEmoji,
        note: note.trim(),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-[2rem] shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 pb-8">
              {/* Handle bar */}
              <div className="w-12 h-1.5 bg-surface-200 rounded-full mx-auto mb-6" />

              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-black tracking-tight text-surface-800">
                  {initial ? 'Sửa giao dịch' : 'Thêm giao dịch'}
                </h2>
                <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-100 transition-colors">
                  <X className="w-5 h-5 text-surface-400" />
                </button>
              </div>

              {/* Type Toggle */}
              <div className="flex gap-2 mb-6 bg-surface-100 p-1 rounded-2xl">
                <button
                  onClick={() => { setType('expense'); setCategory(''); setCategoryEmoji(''); }}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    type === 'expense'
                      ? 'bg-white text-red-500 shadow-md'
                      : 'text-surface-400 hover:text-surface-600'
                  }`}
                >
                  <TrendingDown className="w-4 h-4" /> Chi tiêu
                </button>
                <button
                  onClick={() => { setType('income'); setCategory(''); setCategoryEmoji(''); }}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    type === 'income'
                      ? 'bg-white text-emerald-500 shadow-md'
                      : 'text-surface-400 hover:text-surface-600'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" /> Thu nhập
                </button>
              </div>

              {/* Amount */}
              <div className="mb-6">
                <label className="block text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">Số tiền</label>
                <div className="relative">
                  <input
                    ref={amountRef}
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full py-4 px-4 pr-12 bg-surface-50 border border-surface-200 rounded-2xl text-2xl font-black text-surface-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-surface-300">₫</span>
                </div>
              </div>

              {/* Category Grid */}
              <div className="mb-6">
                <label className="block text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">Danh mục</label>
                <div className="grid grid-cols-4 gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat.name}
                      onClick={() => handleSelectCategory(cat)}
                      className={`py-3 rounded-2xl text-center transition-all active:scale-95 ${
                        category === cat.name
                          ? type === 'expense'
                            ? 'bg-red-50 border-2 border-red-300 shadow-sm'
                            : 'bg-emerald-50 border-2 border-emerald-300 shadow-sm'
                          : 'bg-surface-50 border border-surface-200 hover:bg-surface-100'
                      }`}
                    >
                      <span className="text-xl block">{cat.emoji}</span>
                      <span className="text-[10px] font-bold text-surface-600 mt-1 block">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Note */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">Ngày</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full py-3 px-4 bg-surface-50 border border-surface-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">Ghi chú</label>
                  <input
                    type="text"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Tùy chọn..."
                    className="w-full py-3 px-4 bg-surface-50 border border-surface-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={saving || !parseFloat(amount) || !category}
                className={`w-full py-4 rounded-2xl font-bold text-white text-sm transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg ${
                  type === 'expense'
                    ? 'bg-gradient-to-r from-red-500 to-rose-500 shadow-red-200/40'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-200/40'
                }`}
              >
                {saving ? 'Đang lưu...' : initial ? 'Cập nhật' : type === 'expense' ? '💸 Thêm chi tiêu' : '💰 Thêm thu nhập'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
