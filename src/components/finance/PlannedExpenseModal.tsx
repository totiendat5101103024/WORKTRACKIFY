/**
 * Modal to add a new Planned Expense (Khoản chuẩn bị chi).
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag } from 'lucide-react';
import { EXPENSE_CATEGORIES } from '../../types/finance';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    amount: number;
    emoji: string;
    category: string;
    note: string;
  }) => Promise<void>;
}

export default function PlannedExpenseModal({ open, onClose, onSave }: Props) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCat, setSelectedCat] = useState(EXPENSE_CATEGORIES[2]); // Mua sắm default
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName('');
    setAmount('');
    setSelectedCat(EXPENSE_CATEGORIES[2]);
    setNote('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    const amt = parseFloat(amount.replace(/,/g, ''));
    if (!name.trim() || isNaN(amt) || amt <= 0) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        amount: amt,
        emoji: selectedCat.emoji,
        category: selectedCat.name,
        note: note.trim(),
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
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.96 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="bg-white rounded-[2rem] p-6 w-full max-w-md shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-base font-black text-surface-800">Thêm khoản chuẩn bị chi</h2>
                  <p className="text-[10px] text-surface-400 font-medium">Tick để chuyển sang đã chi tiêu</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-surface-100 text-surface-400 hover:bg-surface-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category chips */}
            <div className="mb-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2 block">Danh mục</label>
              <div className="flex flex-wrap gap-2">
                {EXPENSE_CATEGORIES.map(cat => (
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
                placeholder="VD: Mua giày mới"
                className="w-full bg-surface-50 border border-surface-200 rounded-2xl px-4 py-3 text-sm font-medium text-surface-800 placeholder:text-surface-300 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all"
              />
            </div>

            {/* Amount */}
            <div className="mb-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2 block">Số tiền dự kiến (₫)</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full bg-surface-50 border border-surface-200 rounded-2xl px-4 py-3 text-sm font-medium text-surface-800 placeholder:text-surface-300 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all"
              />
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
              <button
                onClick={handleClose}
                className="flex-1 py-3.5 rounded-2xl bg-surface-100 text-surface-600 text-sm font-bold hover:bg-surface-200 transition-colors"
              >
                Huỷ
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !name.trim() || !amount}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-black shadow-lg shadow-amber-200/50 hover:shadow-amber-300/50 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Đang lưu...' : '+ Thêm vào danh sách'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
