/**
 * Fixed Expense Modal — add/edit recurring monthly expenses.
 * Emoji preset selection with name and amount inputs.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import type { FixedExpense, CategoryPreset } from '../../types/finance';
import { FIXED_EXPENSE_PRESETS } from '../../types/finance';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<FixedExpense, 'id' | 'createdAt' | 'paidMonths'>) => Promise<any>;
  initial?: FixedExpense | null;
}

export default function FixedExpenseModal({ open, onClose, onSave, initial }: Props) {
  const [name, setName] = useState(initial?.name || '');
  const [amount, setAmount] = useState(initial?.amount?.toString() || '');
  const [emoji, setEmoji] = useState(initial?.emoji || '📌');
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(initial?.name || '');
      setAmount(initial?.amount?.toString() || '');
      setEmoji(initial?.emoji || '📌');
      setTimeout(() => nameRef.current?.focus(), 300);
    }
  }, [open, initial]);

  const handlePreset = (p: CategoryPreset) => {
    setName(p.name);
    setEmoji(p.emoji);
  };

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (!name.trim() || !numAmount || numAmount <= 0) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), amount: numAmount, emoji });
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
            className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-[2rem] shadow-2xl"
          >
            <div className="p-6 pb-8">
              <div className="w-12 h-1.5 bg-surface-200 rounded-full mx-auto mb-6" />

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-black tracking-tight text-surface-800">
                  {initial ? 'Sửa chi phí' : 'Thêm chi phí cố định'}
                </h2>
                <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-100 transition-colors">
                  <X className="w-5 h-5 text-surface-400" />
                </button>
              </div>

              {/* Presets */}
              <div className="mb-5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">Chọn nhanh</label>
                <div className="flex flex-wrap gap-2">
                  {FIXED_EXPENSE_PRESETS.map(p => (
                    <button
                      key={p.name}
                      onClick={() => handlePreset(p)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
                        name === p.name
                          ? 'bg-brand-100 border-2 border-brand-300 text-brand-700'
                          : 'bg-surface-50 border border-surface-200 text-surface-600 hover:bg-surface-100'
                      }`}
                    >
                      <span>{p.emoji}</span> {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div className="mb-4">
                <label className="block text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">Tên chi phí</label>
                <input
                  ref={nameRef}
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="VD: Tiền nhà..."
                  className="w-full py-3 px-4 bg-surface-50 border border-surface-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              {/* Amount */}
              <div className="mb-6">
                <label className="block text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">Số tiền / tháng</label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full py-3 px-4 pr-12 bg-surface-50 border border-surface-200 rounded-xl text-lg font-black focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-surface-300">₫/tháng</span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={saving || !name.trim() || !parseFloat(amount)}
                className="w-full py-4 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-2xl font-bold text-sm hover:from-brand-600 hover:to-brand-700 transition-all shadow-lg shadow-brand-300/30 active:scale-[0.98] disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : initial ? 'Cập nhật' : '📌 Thêm chi phí cố định'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
