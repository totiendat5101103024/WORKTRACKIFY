/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CalendarProvider, useCalendar } from './context/CalendarContext';
import { FinanceProvider } from './context/FinanceContext';
import LockScreen from './components/auth/LockScreen';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import SettingsPanel from './components/SettingsPanel';
import FinanceDashboard from './components/finance/FinanceDashboard';
import BottomNav, { type AppTab } from './components/BottomNav';

/**
 * Inner app shell that consumes CalendarContext.
 * Handles the auth-gated routing: Login → Dashboard.
 */
function AppShell() {
  const {
    isAuthenticated, loading, tokens,
    login, settings, updateSettings, authError,
    settingsOpen, closeSettings,
    currentMonth,
  } = useCalendar();

  const [activeTab, setActiveTab] = useState<AppTab>('salary');

  // Initial loading
  if (loading && !tokens) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-50 to-surface-100">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-surface-500 font-medium tracking-tight">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Not logged in to Google
  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLogin={login}
        settings={settings}
        onUpdateSettings={updateSettings}
        error={authError}
      />
    );
  }

  // Main App — wrapped with FinanceProvider (scoped to current month)
  return (
    <FinanceProvider year={currentMonth.getFullYear()} month={currentMonth.getMonth()}>
      <AnimatePresence mode="wait">
        {activeTab === 'salary' ? (
          <motion.div
            key="salary"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Dashboard />
          </motion.div>
        ) : (
          <motion.div
            key="finance"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <FinanceDashboard />
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      <SettingsPanel
        open={settingsOpen}
        onClose={closeSettings}
      />
    </FinanceProvider>
  );
}

/**
 * Root App component.
 * Gate 1: PIN Lock Screen
 * Gate 2: CalendarProvider → AppShell (handles Google auth + dashboard)
 */
export default function App() {
  const [unlocked, setUnlocked] = useState(false);

  // Always show lock screen first (for PIN setup or verification)
  if (!unlocked) {
    return <LockScreen onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <CalendarProvider>
      <AppShell />
    </CalendarProvider>
  );
}
