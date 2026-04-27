/**
 * Bottom Navigation Bar — switches between Salary and Finance tabs.
 * Glassmorphic floating pill design with animated indicator.
 */

import { motion } from 'motion/react';
import { Briefcase, Wallet } from 'lucide-react';

export type AppTab = 'salary' | 'finance';

interface Props {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const tabs = [
  { id: 'salary' as AppTab, label: 'Lương', icon: Briefcase },
  { id: 'finance' as AppTab, label: 'Tài chính', icon: Wallet },
];

export default function BottomNav({ activeTab, onTabChange }: Props) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200, delay: 0.5 }}
        className="flex gap-1 p-1.5 bg-white/80 backdrop-blur-xl border border-surface-200/60 rounded-2xl shadow-xl shadow-surface-900/10"
      >
        {tabs.map(tab => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                active
                  ? 'text-white'
                  : 'text-surface-400 hover:text-surface-600'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 bg-gradient-to-r from-brand-500 to-brand-600 rounded-xl shadow-lg shadow-brand-300/30"
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon className="w-4 h-4" />
                {tab.label}
              </span>
            </button>
          );
        })}
      </motion.div>
    </div>
  );
}
