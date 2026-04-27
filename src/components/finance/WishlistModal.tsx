/**
 * Wishlist Modal — add a new savings goal item.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Target } from 'lucide-react';
import type { WishlistItem } from '../../types/finance';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<WishlistItem, 'id' | 'createdAt'>) => Promise<any>;
}

const EMOJI_PRESETS = ['🎮', '💻', '📱', '🎧', '👟', '✈️', '🎸', '📚', '🏠', '🚗', '💍', '🎁'];

export default function WishlistModal({ open, onClose, onSave }: Props) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName('');
      setTarget('');
      setEmoji('🎯');
      setTimeout(() => nameRef.current?.focus(), 300);
    }
  }, [open]);

  const handleSubmit = async () => {
    const numTarget = parseFloat(target);
    if (!name.trim() || !numTarget || numTarget <= 0) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        targetAmount: numTarget,
        savedAmount: 0,
        emoji,
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
            className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-[2rem] shadow-2xl"
          >
            <div className="p-6 pb-8">
              <div className="w-12 h-1.5 bg-surface-200 rounded-full mx-auto mb-6" />

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-black tracking-tight text-surface-800 flex items-center gap-2">
                  <Target className="w-5 h-5 text-brand-500" />
                  Thêm mục tiêu
                </h2>
                <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-100">
                  <X className="w-5 h-5 text-surface-400" />
                </button>
              </div>

              {/* Emoji picker */}
              <div className="mb-5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_PRESETS.map(e => (
                    <button
                      key={e}
                      onClick={() => setEmoji(e)}
                      className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all active:scale-90 ${
                        emoji === e
                          ? 'bg-brand-100 border-2 border-brand-300 shadow-sm'
                          : 'bg-surface-50 border border-surface-200 hover:bg-surface-100'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div className="mb-4">
                <label className="block text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">Tên mục tiêu</label>
                <input
                  ref={nameRef}
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="VD: MacBook Pro, Du lịch Đà Lạt..."
                  className="w-full py-3 px-4 bg-surface-50 border border-surface-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              {/* Target */}
              <div className="mb-6">
                <label className="block text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">Số tiền cần</label>
                <div className="relative">
                  <input
                    type="number"
                    value={target}
                    onChange={e => setTarget(e.target.value)}
                    placeholder="0"
                    className="w-full py-3 px-4 pr-10 bg-surface-50 border border-surface-200 rounded-xl text-lg font-black focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-surface-300">₫</span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={saving || !name.trim() || !parseFloat(target)}
                className="w-full py-4 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-brand-300/30 active:scale-[0.98] disabled:opacity-50 transition-all"
              >
                {saving ? 'Đang lưu...' : '🎯 Thêm mục tiêu tiết kiệm'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
