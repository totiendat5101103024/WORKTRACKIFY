/**
 * Calendar Context — shared state for Google auth, calendar events,
 * app settings, and computed salary data.
 *
 * This context eliminates prop-drilling and makes the "Estimated Monthly Salary"
 * accessible to both the Dashboard and Finance modules.
 */

import {
  createContext, useContext, useState, useEffect, useCallback, useRef,
  type ReactNode,
} from 'react';
import { addMonths } from 'date-fns';
import {
  loadTokens, clearTokens, saveTokens, loadUser, loadSettings, saveSettings,
  initiateGoogleLogin, fetchUserInfo, fetchCalendarEvents,
  type GoogleTokens, type GoogleUser, type CalendarEvent, type AppSettings,
} from '../google-api';
import {
  useSalaryCalculation,
  loadHolidayMultipliers, saveHolidayMultipliers,
  type SalaryStats, type CalculatedEvent, type HolidayMultipliers,
} from '../hooks/useSalaryCalculation';

export interface SyncInfo {
  totalFetched: number;
  matchedFilter: number;
  lastSyncAt: Date | null;
}

interface CalendarContextValue {
  // Auth
  tokens: GoogleTokens | null;
  user: GoogleUser | null;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => void;
  authError: string | null;

  // Calendar
  events: CalendarEvent[];
  loading: boolean;
  sync: () => Promise<void>;
  /** Diagnostic info about the last sync */
  lastSyncInfo: SyncInfo;

  // Month navigation
  currentMonth: Date;
  prevMonth: () => void;
  nextMonth: () => void;

  // Settings
  settings: AppSettings;
  updateSettings: (s: AppSettings) => void;
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;

  // Salary computation (from useSalaryCalculation)
  processedEvents: CalculatedEvent[];
  salaryStats: SalaryStats;
  upcomingShift: CalculatedEvent | null;
  /** Estimated monthly salary from calendar events. Alias for salaryStats.totalSalary */
  estimatedMonthlySalary: number;

  // Holiday multipliers
  holidayMultipliers: HolidayMultipliers;
  /** Set the pay multiplier for a specific event (1 = normal, 3 = holiday). Pass 1 to reset. */
  setEventMultiplier: (eventId: string, multiplier: number) => void;
}

const CalendarContext = createContext<CalendarContextValue | null>(null);

export function CalendarProvider({ children }: { children: ReactNode }) {
  // Auth state
  const [tokens, setTokens] = useState<GoogleTokens | null>(null);
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Calendar state
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSyncInfo, setLastSyncInfo] = useState<SyncInfo>({
    totalFetched: 0, matchedFilter: 0, lastSyncAt: null,
  });

  // Holiday multipliers (persisted in localStorage)
  const [holidayMultipliers, setHolidayMultipliers] = useState<HolidayMultipliers>(
    loadHolidayMultipliers
  );

  // Settings & navigation
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [settingsOpen, setSettingsOpen] = useState(false);

  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Salary computation — uses the shared hook WITH holiday multipliers
  const { processedEvents, stats: salaryStats, upcomingShift } = useSalaryCalculation(
    events, settings, holidayMultipliers
  );

  // Set multiplier for a specific event
  const setEventMultiplier = useCallback((eventId: string, multiplier: number) => {
    setHolidayMultipliers(prev => {
      const next = { ...prev };
      if (multiplier <= 1) {
        delete next[eventId]; // Reset to normal
      } else {
        next[eventId] = multiplier;
      }
      saveHolidayMultipliers(next);
      return next;
    });
  }, []);

  // Update sync info when processed events change
  useEffect(() => {
    setLastSyncInfo(prev => ({
      ...prev,
      matchedFilter: processedEvents.length,
    }));

    // Debug log for filter matching
    if (events.length > 0) {
      const keywords = settings.filterKeywords.map(k => k.toLowerCase());
      console.log(`[WorkTrackify] Filter keywords: [${keywords.join(', ')}]`);
      console.log(`[WorkTrackify] ${processedEvents.length}/${events.length} events matched filter`);
      processedEvents.forEach(e =>
        console.log(`  ✅ "${e.summary}" → ${e.paidMinutes}min paid → ${Math.round(e.salary).toLocaleString()}₫${e.multiplier > 1 ? ` (x${e.multiplier} 🎉)` : ''}`)
      );
    }
  }, [processedEvents, events, settings.filterKeywords]);

  // ===== Load saved auth on mount =====
  useEffect(() => {
    const saved = loadTokens();
    if (saved) {
      setTokens(saved);
      const savedUser = loadUser();
      if (savedUser) setUser(savedUser);
    }
    setLoading(false);
  }, []);

  // ===== Sync calendar events =====
  const sync = useCallback(async (t?: GoogleTokens | null) => {
    const tk = t || tokens;
    if (!tk) return;
    setLoading(true);
    setAuthError(null);
    try {
      const data = await fetchCalendarEvents(
        tk.access_token,
        currentMonth.getFullYear(),
        currentMonth.getMonth()
      );
      setEvents(data);
      setLastSyncInfo(prev => ({
        ...prev,
        totalFetched: data.length,
        lastSyncAt: new Date(),
      }));

      // Debug logging for troubleshooting
      console.log(`[WorkTrackify Sync] ✅ Fetched ${data.length} events from Google Calendar`);
      data.forEach(e => console.log(`  📅 "${e.summary}" | ${e.start.dateTime || e.start.date}`));

      if (!user) {
        const u = await fetchUserInfo(tk.access_token);
        setUser(u);
      }
    } catch (err: any) {
      if (err.message === 'TOKEN_EXPIRED') {
        clearTokens();
        setTokens(null);
        setUser(null);
        setAuthError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      } else {
        setAuthError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [tokens, currentMonth, user]);

  // Fetch on token/month change
  useEffect(() => {
    if (tokens) sync();
  }, [tokens, currentMonth]);

  // Auto-sync interval
  useEffect(() => {
    if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    if (tokens && settings.autoSyncMinutes > 0) {
      syncIntervalRef.current = setInterval(
        () => sync(),
        settings.autoSyncMinutes * 60 * 1000
      );
    }
    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [tokens, settings.autoSyncMinutes, sync]);

  // ===== Auth actions =====
  const login = useCallback(async () => {
    setAuthError(null);
    try {
      const newTokens = await initiateGoogleLogin(settings.clientId);
      setTokens(newTokens);
      const u = await fetchUserInfo(newTokens.access_token);
      setUser(u);
    } catch (err: any) {
      setAuthError(err.message);
    }
  }, [settings.clientId]);

  const logout = useCallback(() => {
    clearTokens();
    setTokens(null);
    setUser(null);
    setEvents([]);
  }, []);

  // ===== Settings =====
  const updateSettings = useCallback((s: AppSettings) => {
    setSettings(s);
    saveSettings(s);
  }, []);

  // ===== Provide value =====
  const value: CalendarContextValue = {
    tokens,
    user,
    isAuthenticated: !!tokens,
    login,
    logout,
    authError,

    events,
    loading,
    sync,
    lastSyncInfo,

    currentMonth,
    prevMonth: () => setCurrentMonth(m => addMonths(m, -1)),
    nextMonth: () => setCurrentMonth(m => addMonths(m, 1)),

    settings,
    updateSettings,
    settingsOpen,
    openSettings: () => setSettingsOpen(true),
    closeSettings: () => setSettingsOpen(false),

    processedEvents,
    salaryStats,
    upcomingShift,
    estimatedMonthlySalary: salaryStats.totalSalary,

    holidayMultipliers,
    setEventMultiplier,
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar(): CalendarContextValue {
  const ctx = useContext(CalendarContext);
  if (!ctx) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return ctx;
}
