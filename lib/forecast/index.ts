// 90-Day Cash Forecast Engine
// Pure functions, no I/O, no AI, deterministic, shared by server and client.

import { Client, Invoice, RecurringExpense, ExpenseFrequency } from '../db/types';

export const OVERDUE_CATCHUP_DAYS = 3;
export const SAFE_BUFFER_PERCENTAGE = 0.2; // 20% safe buffer

export type ForecastHorizon = 30 | 60 | 90;
export type CashHealth = 'safe' | 'tight' | 'danger';

export interface OneOffExpense {
  name: string;
  amount: number;
  date: string; // YYYY-MM-DD
}

export interface ForecastInput {
  today: string; // YYYY-MM-DD
  horizonDays: number; // 30, 60, 90 (or any positive number)
  openingCash: number;
  invoices: Invoice[]; // Unpaid invoices with balance > 0
  clients: Client[];
  recurringExpenses: RecurringExpense[];
  oneOffExpenses?: OneOffExpense[];
}

export interface DailyForecastPoint {
  date: string; // YYYY-MM-DD
  dayIndex: number; // 0 to horizonDays - 1
  balance: number;
  inflow: number;
  outflow: number;
}

export interface ForecastEvent {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'inflow' | 'outflow';
  amount: number;
  label: string;
  source: 'invoice' | 'recurring_expense' | 'one_off_expense';
  clientName?: string;
  invoiceId?: string;
}

export interface ForecastSummary {
  lowestBalance: number;
  lowestBalanceDate: string;
  firstNegativeDate: string | null;
  runwayDays: number | null;
  totalIn: number;
  totalOut: number;
  endingBalance: number;
  health: CashHealth;
}

export interface ForecastResult {
  daily: DailyForecastPoint[];
  events: ForecastEvent[];
  summary: ForecastSummary;
}

// ---------------------------------------------------------------------------
// Pure UTC-based Date Math Helpers (avoids local timezone date shifts)
// ---------------------------------------------------------------------------

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function toUtcTimestamp(ymd: string): number {
  const [y, m, d] = ymd.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function fromUtcTimestamp(utcMs: number): string {
  const date = new Date(utcMs);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(ymd: string, days: number): string {
  return fromUtcTimestamp(toUtcTimestamp(ymd) + days * MS_PER_DAY);
}

export function daysBetween(fromYmd: string, toYmd: string): number {
  return Math.round((toUtcTimestamp(toYmd) - toUtcTimestamp(fromYmd)) / MS_PER_DAY);
}

/**
 * Returns the number of days in a given year and month (1-indexed month, 1-12)
 */
export function getDaysInMonth(year: number, month: number): number {
  // Day 0 of next month is the last day of month
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Clamps day of month to maximum days in that month (handles 31st in 30-day months & Feb)
 */
export function addMonthsClamped(ymd: string, monthsToAdd: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const totalMonths = y * 12 + (m - 1) + monthsToAdd;
  const newYear = Math.floor(totalMonths / 12);
  const newMonth = (totalMonths % 12) + 1;

  const maxDays = getDaysInMonth(newYear, newMonth);
  const clampedDay = Math.min(d, maxDays);

  return `${newYear}-${String(newMonth).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
}

export function addYearsClamped(ymd: string, yearsToAdd: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const newYear = y + yearsToAdd;
  const maxDays = getDaysInMonth(newYear, m);
  const clampedDay = Math.min(d, maxDays);
  return `${newYear}-${String(m).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Engine Logic
// ---------------------------------------------------------------------------

/**
 * Calculates the expected receipt date for an unpaid invoice based on client delay rules.
 * If expected date is on or before today, catches up to today + OVERDUE_CATCHUP_DAYS.
 */
export function calculateExpectedReceiptDate(
  dueDate: string,
  delayDays: number,
  today: string
): string {
  const rawExpected = addDays(dueDate, Math.max(0, delayDays));
  if (rawExpected <= today) {
    return addDays(today, OVERDUE_CATCHUP_DAYS);
  }
  return rawExpected;
}

/**
 * Expands a recurring expense into dated occurrences within the given horizon.
 * Correctly clamps day of month for monthly schedules.
 */
export function expandRecurringExpense(
  expense: RecurringExpense,
  today: string,
  horizonEndDate: string
): Array<{ date: string; amount: number; label: string; expenseId: string }> {
  if (!expense.is_active || expense.amount <= 0) return [];

  const results: Array<{ date: string; amount: number; label: string; expenseId: string }> = [];
  const [origYear, origMonth, origDay] = expense.next_due_date.split('-').map(Number);
  const baseDayOfMonth = origDay;

  let occurrenceIndex = 0;
  const maxIterations = 600; // safety bound

  while (occurrenceIndex < maxIterations) {
    let occurrenceDate: string;

    if (expense.frequency === 'weekly') {
      occurrenceDate = addDays(expense.next_due_date, occurrenceIndex * 7);
    } else if (expense.frequency === 'monthly') {
      const totalMonths = origYear * 12 + (origMonth - 1) + occurrenceIndex;
      const nY = Math.floor(totalMonths / 12);
      const nM = (totalMonths % 12) + 1;
      const maxDays = getDaysInMonth(nY, nM);
      const clamped = Math.min(baseDayOfMonth, maxDays);
      occurrenceDate = `${nY}-${String(nM).padStart(2, '0')}-${String(clamped).padStart(2, '0')}`;
    } else if (expense.frequency === 'quarterly') {
      const totalMonths = origYear * 12 + (origMonth - 1) + occurrenceIndex * 3;
      const nY = Math.floor(totalMonths / 12);
      const nM = (totalMonths % 12) + 1;
      const maxDays = getDaysInMonth(nY, nM);
      const clamped = Math.min(baseDayOfMonth, maxDays);
      occurrenceDate = `${nY}-${String(nM).padStart(2, '0')}-${String(clamped).padStart(2, '0')}`;
    } else if (expense.frequency === 'yearly') {
      const nY = origYear + occurrenceIndex;
      const maxDays = getDaysInMonth(nY, origMonth);
      const clamped = Math.min(baseDayOfMonth, maxDays);
      occurrenceDate = `${nY}-${String(origMonth).padStart(2, '0')}-${String(clamped).padStart(2, '0')}`;
    } else {
      break;
    }

    if (occurrenceDate > horizonEndDate) {
      break;
    }

    if (occurrenceDate >= today) {
      results.push({
        date: occurrenceDate,
        amount: expense.amount,
        label: expense.name,
        expenseId: expense.id,
      });
    }

    occurrenceIndex++;
  }

  return results;
}

/**
 * Computes daily projected cash balance and upcoming events over a given horizon.
 */
export function computeCashForecast(input: ForecastInput): ForecastResult {
  const { today, horizonDays, openingCash, invoices, clients, recurringExpenses } = input;
  const oneOffExpenses = input.oneOffExpenses || [];

  const horizonEndDate = addDays(today, horizonDays - 1);
  const clientMap = new Map(clients.map((c) => [c.id, c]));

  const allEvents: ForecastEvent[] = [];

  // 1. Process Unpaid Invoices
  for (const inv of invoices) {
    const balance = inv.amount - inv.paid_amount;
    if (balance <= 0.001) continue; // paid

    const client = clientMap.get(inv.client_id);
    const delay = client ? client.average_delay_days : 0;
    const expectedDate = calculateExpectedReceiptDate(inv.due_date, delay, today);

    allEvents.push({
      id: `ev-inv-${inv.id}`,
      date: expectedDate,
      type: 'inflow',
      amount: balance,
      label: `${client ? client.name : 'Client'} (${inv.milestone_label.toUpperCase()})`,
      source: 'invoice',
      clientName: client?.name,
      invoiceId: inv.id,
    });
  }

  // 2. Process Recurring Expenses
  for (const exp of recurringExpenses) {
    const occurrences = expandRecurringExpense(exp, today, horizonEndDate);
    for (let i = 0; i < occurrences.length; i++) {
      const occ = occurrences[i];
      allEvents.push({
        id: `ev-rec-${exp.id}-${occ.date}-${i}`,
        date: occ.date,
        type: 'outflow',
        amount: occ.amount,
        label: occ.label,
        source: 'recurring_expense',
      });
    }
  }

  // 3. Process One-Off Expenses
  for (let i = 0; i < oneOffExpenses.length; i++) {
    const oneOff = oneOffExpenses[i];
    if (oneOff.amount > 0) {
      allEvents.push({
        id: `ev-oneoff-${i}-${oneOff.date}`,
        date: oneOff.date,
        type: 'outflow',
        amount: oneOff.amount,
        label: oneOff.name,
        source: 'one_off_expense',
      });
    }
  }

  // Sort all events chronologically
  allEvents.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    // inflows before outflows on same day
    if (a.type !== b.type) return a.type === 'inflow' ? -1 : 1;
    return b.amount - a.amount;
  });

  // Map events inside horizon by date for daily aggregation
  const dailyInflows = new Map<string, number>();
  const dailyOutflows = new Map<string, number>();

  for (const ev of allEvents) {
    if (ev.date >= today && ev.date <= horizonEndDate) {
      if (ev.type === 'inflow') {
        dailyInflows.set(ev.date, (dailyInflows.get(ev.date) || 0) + ev.amount);
      } else {
        dailyOutflows.set(ev.date, (dailyOutflows.get(ev.date) || 0) + ev.amount);
      }
    }
  }

  // 4. Generate Daily Balance Curve (Day 0 to horizonDays - 1)
  const daily: DailyForecastPoint[] = [];
  let currentBalance = openingCash;

  let lowestBalance = openingCash;
  let lowestBalanceDate = today;
  let firstNegativeDate: string | null = null;
  let totalIn = 0;
  let totalOut = 0;

  for (let dayIndex = 0; dayIndex < horizonDays; dayIndex++) {
    const date = addDays(today, dayIndex);
    const inflow = dailyInflows.get(date) || 0;
    const outflow = dailyOutflows.get(date) || 0;

    totalIn += inflow;
    totalOut += outflow;

    currentBalance = currentBalance + inflow - outflow;

    if (currentBalance < lowestBalance) {
      lowestBalance = currentBalance;
      lowestBalanceDate = date;
    }

    if (currentBalance < 0 && !firstNegativeDate) {
      firstNegativeDate = date;
    }

    daily.push({
      date,
      dayIndex,
      balance: currentBalance,
      inflow,
      outflow,
    });
  }

  const runwayDays = firstNegativeDate ? daysBetween(today, firstNegativeDate) : null;
  const endingBalance = daily.length > 0 ? daily[daily.length - 1].balance : openingCash;

  // Determine health
  let health: CashHealth = 'safe';
  const safeBuffer = openingCash * SAFE_BUFFER_PERCENTAGE;

  if (lowestBalance < 0) {
    health = 'danger';
  } else if (lowestBalance < safeBuffer) {
    health = 'tight';
  } else {
    health = 'safe';
  }

  return {
    daily,
    events: allEvents,
    summary: {
      lowestBalance,
      lowestBalanceDate,
      firstNegativeDate,
      runwayDays,
      totalIn,
      totalOut,
      endingBalance,
      health,
    },
  };
}
