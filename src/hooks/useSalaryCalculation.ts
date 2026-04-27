/**
 * Salary calculation hook — extracts the break deduction logic
 * and salary stats from raw calendar events into a reusable hook.
 * This is the single source of truth for "Estimated Monthly Salary"
 * that both the Dashboard and Finance modules consume.
 *
 * Supports holiday multipliers (e.g. x3 for holiday shifts).
 */

import { useMemo } from 'react';
import { getISOWeek, parseISO, differenceInMinutes } from 'date-fns';
import type { CalendarEvent, AppSettings } from '../google-api';

/** Map of eventId → pay multiplier (e.g. 3 for holiday x3) */
export type HolidayMultipliers = Record<string, number>;

const STORAGE_KEY = 'worktrackify_holiday_multipliers';

/** Load holiday multipliers from localStorage */
export function loadHolidayMultipliers(): HolidayMultipliers {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Save holiday multipliers to localStorage */
export function saveHolidayMultipliers(m: HolidayMultipliers): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(m));
}

export interface CalculatedEvent {
  id: string;
  summary: string;
  start: Date;
  end: Date;
  rawMinutes: number;
  paidMinutes: number;
  /** Base salary (without multiplier) */
  baseSalary: number;
  /** Final salary (with multiplier applied) */
  salary: number;
  /** Pay multiplier (1 = normal, 3 = holiday) */
  multiplier: number;
  week: number;
}

export interface WeeklyBreakdown {
  name: string;
  salary: number;
  rawMin: number;
  paidMin: number;
  count: number;
}

export interface SalaryStats {
  /** Total estimated salary from calendar events this month */
  totalSalary: number;
  /** Total paid minutes (after break deductions) */
  totalPaidMin: number;
  /** Total raw minutes (before break deductions) */
  totalRawMin: number;
  /** Weekly breakdown of hours and salary */
  weeklyBreakdown: WeeklyBreakdown[];
  /** Number of work shifts */
  shiftCount: number;
  /** Average paid minutes per shift */
  avgMin: number;
  /** Progress towards target salary (percentage) */
  progress: number;
}

/**
 * Format minutes into a human-readable string like "8h30"
 */
export function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
}

/**
 * Apply the smart break deduction rules:
 * - < 6h: 0 deduction (full pay)
 * - 6-8h: 30 min deduction
 * - > 8h: 60 min deduction
 */
function getBreakDeduction(rawMinutes: number): number {
  const hours = rawMinutes / 60;
  if (hours >= 8) return 60;
  if (hours >= 6) return 30;
  return 0;
}

export function useSalaryCalculation(
  events: CalendarEvent[],
  settings: AppSettings,
  holidayMultipliers: HolidayMultipliers = {}
) {
  const processedEvents = useMemo<CalculatedEvent[]>(() => {
    const keywords = settings.filterKeywords.map(k => k.toLowerCase());
    return events
      .filter(e => {
        if (keywords.length === 0) return true;
        const s = (e.summary || '').toLowerCase();
        return keywords.some(kw => s.includes(kw));
      })
      .filter(e => e.start.dateTime && e.end.dateTime)
      .map(e => {
        const start = parseISO(e.start.dateTime!);
        const end = parseISO(e.end.dateTime!);
        const rawMinutes = differenceInMinutes(end, start);
        const deduction = getBreakDeduction(rawMinutes);
        const paidMinutes = rawMinutes - deduction;
        const baseSalary = (paidMinutes / 60) * settings.ratePerHour;
        const multiplier = holidayMultipliers[e.id] || 1;
        return {
          id: e.id,
          summary: e.summary,
          start,
          end,
          rawMinutes,
          paidMinutes,
          baseSalary,
          salary: baseSalary * multiplier,
          multiplier,
          // Use ISO week (Monday = start of week) to match Vietnamese calendar
          week: getISOWeek(start),
        };
      })
      .sort((a, b) => b.start.getTime() - a.start.getTime());
  }, [events, settings, holidayMultipliers]);

  const stats = useMemo<SalaryStats>(() => {
    const totalSalary = processedEvents.reduce((a, c) => a + c.salary, 0);
    const totalPaidMin = processedEvents.reduce((a, c) => a + c.paidMinutes, 0);
    const totalRawMin = processedEvents.reduce((a, c) => a + c.rawMinutes, 0);

    const weekMap: Record<string, { salary: number; rawMin: number; paidMin: number; count: number }> = {};
    processedEvents.forEach(e => {
      const key = `Tuần ${e.week}`;
      if (!weekMap[key]) weekMap[key] = { salary: 0, rawMin: 0, paidMin: 0, count: 0 };
      weekMap[key].salary += e.salary;
      weekMap[key].rawMin += e.rawMinutes;
      weekMap[key].paidMin += e.paidMinutes;
      weekMap[key].count++;
    });

    const weeklyBreakdown = Object.entries(weekMap)
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const progress = settings.targetSalary > 0 ? (totalSalary / settings.targetSalary) * 100 : 0;

    return {
      totalSalary,
      totalPaidMin,
      totalRawMin,
      weeklyBreakdown,
      shiftCount: processedEvents.length,
      avgMin: processedEvents.length ? totalPaidMin / processedEvents.length : 0,
      progress,
    };
  }, [processedEvents, settings]);

  const upcomingShift = useMemo(() => {
    const now = new Date();
    return processedEvents
      .filter(e => e.start >= now)
      .sort((a, b) => a.start.getTime() - b.start.getTime())[0] || null;
  }, [processedEvents]);

  return {
    processedEvents,
    stats,
    upcomingShift,
  };
}
