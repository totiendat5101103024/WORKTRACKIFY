/**
 * Settings Panel — slide-out drawer for app configuration.
 * Now consumes data from CalendarContext.
 */

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCalendar } from '../context/CalendarContext';
import type { AppSettings } from '../google-api';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ open, onClose }: Props) {
  const { settings, updateSettings, user, logout } = useCalendar();
  const [local, setLocal] = useState(settings);
  const [keywordInput, setKeywordInput] = useState('');

  // Sync local state when settings change or panel opens
  useEffect(() => {
    if (open) setLocal(settings);
  }, [open, settings]);

  const save = () => { updateSettings(local); onClose(); };
  const set = (key: keyof AppSettings, val: any) => setLocal({ ...local, [key]: val });

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (kw && !local.filterKeywords.includes(kw)) {
      set('filterKeywords', [...local.filterKeywords, kw]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (kw: string) => {
    set('filterKeywords', local.filterKeywords.filter(k => k !== kw));
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto"
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-black tracking-tight text-surface-900">Cài đặt</h2>
                <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-100 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {user && (
                <div className="flex items-center gap-3 p-4 bg-surface-50 rounded-2xl mb-8 border border-surface-100">
                  <img src={user.picture} alt="" className="w-10 h-10 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-surface-800 truncate">{user.name}</p>
                    <p className="text-xs text-surface-400 truncate">{user.email}</p>
                  </div>
                  <button onClick={logout} className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors whitespace-nowrap">
                    Đăng xuất
                  </button>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">Lương / giờ (VNĐ)</label>
                  <input type="number" value={local.ratePerHour} onChange={e => set('ratePerHour', Number(e.target.value))}
                    className="w-full py-3 px-4 bg-surface-50 border border-surface-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">Mục tiêu lương tháng (VNĐ)</label>
                  <input type="number" value={local.targetSalary} onChange={e => set('targetSalary', Number(e.target.value))}
                    className="w-full py-3 px-4 bg-surface-50 border border-surface-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">Auto-sync (phút, 0 = tắt)</label>
                  <input type="number" value={local.autoSyncMinutes} onChange={e => set('autoSyncMinutes', Number(e.target.value))} min={0} max={60}
                    className="w-full py-3 px-4 bg-surface-50 border border-surface-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">Google Client ID</label>
                  <input type="text" value={local.clientId} onChange={e => set('clientId', e.target.value)}
                    className="w-full py-3 px-4 bg-surface-50 border border-surface-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">
                    Từ khóa lọc sự kiện
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {local.filterKeywords.map(kw => (
                      <span key={kw} className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-100 text-brand-700 rounded-lg text-xs font-bold">
                        {kw}
                        <button onClick={() => removeKeyword(kw)} className="hover:text-red-500 transition-colors">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={keywordInput} onChange={e => setKeywordInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addKeyword()}
                      placeholder="Thêm từ khóa..."
                      className="flex-1 py-2.5 px-4 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
                    <button onClick={addKeyword} className="px-4 py-2.5 bg-surface-900 text-white rounded-xl text-sm font-bold hover:bg-surface-800 transition-colors">+</button>
                  </div>
                </div>
              </div>

              <button onClick={save}
                className="w-full mt-8 py-4 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-2xl font-bold hover:from-brand-600 hover:to-brand-700 transition-all shadow-lg shadow-brand-300/30 active:scale-[0.98]">
                Lưu cài đặt
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
