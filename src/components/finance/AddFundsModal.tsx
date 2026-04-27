/**
 * Add Funds Modal — quick input to add money toward a savings goal.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, PiggyBank } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (amount: number) => Promise<void>;
  itemName: string;
  itemEmoji: string;
  remaining: number;
}

export default function AddFundsModal({ open, onClose, onSave, itemName, itemEmoji, remaining }: Props) {
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setAmount('');
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const quickAmounts = [50000, 100000, 200000, 500000];

  const handleSubmit = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) return;
    setSaving(true);
    try {
      await onSave(num);
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

              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black tracking-tight text-surface-800 flex items-center gap-2">
                  <PiggyBank className="w-5 h-5 text-brand-500" />
                  Thêm tiền
                </h2>
                <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-100">
                  <X className="w-5 h-5 text-surface-400" />
                </button>
              </div>

              <div className="bg-surface-50 rounded-2xl p-4 mb-5 flex items-center gap-3">
                <span className="text-2xl">{itemEmoji}</span>
                <div>
                  <p className="font-bold text-surface-800 text-sm">{itemName}</p>
                  <p className="text-[10px] text-surface-400 font-medium">Còn thiếu {remaining.toLocaleString()}₫</p>
                </div>
              </div>

              {/* Quick amounts */}
              <div className="flex gap-2 mb-4">
                {quickAmounts.map(qa => (
                  <button
                    key={qa}
                    onClick={() => setAmount(qa.toString())}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                      amount === qa.toString()
                        ? 'bg-brand-100 border-2 border-brand-300 text-brand-700'
                        : 'bg-surface-50 border border-surface-200 text-surface-600 hover:bg-surface-100'
                    }`}
                  >
                    {(qa / 1000)}k
                  </button>
                ))}
              </div>

              {/* Amount input */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="Nhập số tiền..."
                    className="w-full py-3 px-4 pr-10 bg-surface-50 border border-surface-200 rounded-xl text-lg font-black focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-surface-300">₫</span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={saving || !parseFloat(amount)}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-200/40 active:scale-[0.98] disabled:opacity-50 transition-all"
              >
                {saving ? 'Đang lưu...' : '🐷 Thêm vào quỹ'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
