/**
 * Custom hook for Finance Settings persisted in localStorage.
 */

import { useState, useCallback } from 'react';
import type { FinanceSettings } from '../types/finance';
import { DEFAULT_FINANCE_SETTINGS } from '../types/finance';

const STORAGE_KEY = 'wt_finance_settings';

function loadFinanceSettings(): FinanceSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_FINANCE_SETTINGS;
    return { ...DEFAULT_FINANCE_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_FINANCE_SETTINGS;
  }
}

function saveFinanceSettings(settings: FinanceSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function useFinanceSettings() {
  const [settings, setSettings] = useState<FinanceSettings>(loadFinanceSettings());

  const update = useCallback((partial: Partial<FinanceSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      saveFinanceSettings(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setSettings(DEFAULT_FINANCE_SETTINGS);
    saveFinanceSettings(DEFAULT_FINANCE_SETTINGS);
  }, []);

  return { settings, update, reset };
}
