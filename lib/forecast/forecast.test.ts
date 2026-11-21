import { describe, it, expect } from 'vitest';
import {
  calculateExpectedReceiptDate,
  expandRecurringExpense,
  computeCashForecast,
  OVERDUE_CATCHUP_DAYS,
  SAFE_BUFFER_PERCENTAGE,
  ForecastInput,
  addDays,
  daysBetween,
  getDaysInMonth,
} from './index';
import { Client, Invoice, RecurringExpense } from '../db/types';
import { generateSeedData } from '../db/seed-data';
import { applyScenarios } from '../whatif';

describe('Forecast Engine - Pure Date & Recurrence Helpers', () => {
  it('correctly calculates days in months, including leap years', () => {
    expect(getDaysInMonth(2024, 2)).toBe(29); // 2024 is leap year
    expect(getDaysInMonth(2025, 2)).toBe(28); // 2025 is non-leap year
    expect(getDaysInMonth(2026, 4)).toBe(30); // April
    expect(getDaysInMonth(2026, 5)).toBe(31); // May
  });

  it('correctly adds days using UTC arithmetic', () => {
    expect(addDays('2026-11-20', 3)).toBe('2026-11-23');
    expect(addDays('2026-11-28', 5)).toBe('2026-12-03');
    expect(addDays('2026-12-30', 5)).toBe('2027-01-04');
  });

  it('correctly computes days between two dates', () => {
    expect(daysBetween('2026-11-20', '2026-11-23')).toBe(3);
    expect(daysBetween('2026-11-20', '2026-11-20')).toBe(0);
    expect(daysBetween('2026-11-23', '2026-11-20')).toBe(-3);
  });
});

describe('Forecast Engine - Expected Receipt Date Rules', () => {
  const today = '2026-11-20';

  it('future due date + positive client delay: expected = dueDate + delay', () => {
    const dueDate = '2026-11-25'; // 5 days in future
    const delayDays = 4;
    expect(calculateExpectedReceiptDate(dueDate, delayDays, today)).toBe('2026-11-29');
  });

  it('future due date + 0 delay: expected = dueDate', () => {
    const dueDate = '2026-11-25';
    const delayDays = 0;
    expect(calculateExpectedReceiptDate(dueDate, delayDays, today)).toBe('2026-11-25');
  });

  it('past due date (already overdue): clamps to today + OVERDUE_CATCHUP_DAYS (3 days)', () => {
    const dueDate = '2026-11-10'; // 10 days ago
    const delayDays = 2; // expected would be 2026-11-12, <= today
    const expected = calculateExpectedReceiptDate(dueDate, delayDays, today);
    expect(expected).toBe('2026-11-23'); // today + 3
    expect(expected).toBe(addDays(today, OVERDUE_CATCHUP_DAYS));
  });

  it('invoice due today with 0 delay (rawExpected <= today): clamps to today + 3', () => {
    const dueDate = '2026-11-20'; // today
    const delayDays = 0;
    expect(calculateExpectedReceiptDate(dueDate, delayDays, today)).toBe('2026-11-23');
  });
});

describe('Forecast Engine - Recurring Expense Expansion', () => {
  const today = '2026-01-15';
  const horizonEnd = '2026-04-15'; // 90 days

  it('correctly expands weekly recurring expenses', () => {
    const exp: RecurringExpense = {
      id: 'rec-w',
      user_id: 'u1',
      name: 'Weekly Studio Supplies',
      amount: 2000,
      frequency: 'weekly',
      next_due_date: '2026-01-20',
      category: 'other',
      is_active: true,
      created_at: '',
      updated_at: '',
    };

    const occurrences = expandRecurringExpense(exp, today, horizonEnd);
    expect(occurrences.length).toBeGreaterThan(10);
    expect(occurrences[0].date).toBe('2026-01-20');
    expect(occurrences[1].date).toBe('2026-01-27');
    expect(occurrences[2].date).toBe('2026-02-03');
    expect(occurrences.every((o) => o.amount === 2000)).toBe(true);
  });

  it('monthly clamping: bill on the 31st clamps to 30 Apr and 28 Feb (non-leap)', () => {
    const exp: RecurringExpense = {
      id: 'rec-m31',
      user_id: 'u1',
      name: 'End of Month Cloud Backup',
      amount: 5000,
      frequency: 'monthly',
      next_due_date: '2025-01-31',
      category: 'software',
      is_active: true,
      created_at: '',
      updated_at: '',
    };

    const occurrences = expandRecurringExpense(exp, '2025-01-01', '2025-05-01');
    const dates = occurrences.map((o) => o.date);
    expect(dates).toContain('2025-01-31');
    expect(dates).toContain('2025-02-28'); // clamped to 28 Feb in 2025!
    expect(dates).toContain('2025-03-31'); // March has 31
    expect(dates).toContain('2025-04-30'); // clamped to 30 Apr!
  });

  it('monthly clamping: bill on the 31st clamps to 29 Feb in leap year 2024', () => {
    const exp: RecurringExpense = {
      id: 'rec-leap',
      user_id: 'u1',
      name: 'Leap Year Server',
      amount: 7000,
      frequency: 'monthly',
      next_due_date: '2024-01-31',
      category: 'software',
      is_active: true,
      created_at: '',
      updated_at: '',
    };

    const occurrences = expandRecurringExpense(exp, '2024-01-01', '2024-03-31');
    const dates = occurrences.map((o) => o.date);
    expect(dates).toContain('2024-01-31');
    expect(dates).toContain('2024-02-29'); // Leap day 2024!
    expect(dates).toContain('2024-03-31');
  });

  it('yearly recurring expenses step by exactly one year', () => {
    const exp: RecurringExpense = {
      id: 'rec-y',
      user_id: 'u1',
      name: 'Annual Studio Insurance',
      amount: 36000,
      frequency: 'yearly',
      next_due_date: '2026-03-15',
      category: 'insurance',
      is_active: true,
      created_at: '',
      updated_at: '',
    };

    const occurrences = expandRecurringExpense(exp, '2026-01-01', '2028-01-01');
    expect(occurrences.map((o) => o.date)).toEqual(['2026-03-15', '2027-03-15']);
  });

  it('advances past next_due_date if next_due_date is before today', () => {
    const exp: RecurringExpense = {
      id: 'rec-past',
      user_id: 'u1',
      name: 'Old Monthly Subscription',
      amount: 1000,
      frequency: 'monthly',
      next_due_date: '2025-10-10', // months ago
      category: 'software',
      is_active: true,
      created_at: '',
      updated_at: '',
    };

    const occurrences = expandRecurringExpense(exp, '2026-01-01', '2026-02-28');
    expect(occurrences.map((o) => o.date)).toEqual(['2026-01-10', '2026-02-10']);
  });

  it('ignores inactive recurring expenses', () => {
    const exp: RecurringExpense = {
      id: 'rec-off',
      user_id: 'u1',
      name: 'Cancelled Gym',
      amount: 3000,
      frequency: 'monthly',
      next_due_date: '2026-02-01',
      category: 'other',
      is_active: false,
      created_at: '',
      updated_at: '',
    };

    expect(expandRecurringExpense(exp, '2026-01-01', '2026-04-01')).toEqual([]);
  });
});

describe('Forecast Calculation - Core Engine & Edge Cases', () => {
  const today = '2026-11-20';

  it('opening balance only (zero invoices, zero expenses): balance stays flat across horizon', () => {
    const input: ForecastInput = {
      today,
      horizonDays: 30,
      openingCash: 150000,
      invoices: [],
      clients: [],
      recurringExpenses: [],
    };

    const result = computeCashForecast(input);
    expect(result.daily.length).toBe(30);
    expect(result.daily[0].balance).toBe(150000);
    expect(result.daily[29].balance).toBe(150000);
    expect(result.summary.lowestBalance).toBe(150000);
    expect(result.summary.firstNegativeDate).toBeNull();
    expect(result.summary.runwayDays).toBeNull();
    expect(result.summary.totalIn).toBe(0);
    expect(result.summary.totalOut).toBe(0);
    expect(result.summary.health).toBe('safe');
  });

  it('partial payment balance: only unpaid balance counts towards receipts', () => {
    const client: Client = {
      id: 'c1',
      user_id: 'u1',
      name: 'Client One',
      phone: '+91 90000 00001',
      email: null,
      payment_reliability: 'reliable',
      average_delay_days: 0,
      notes: null,
      created_at: '',
      updated_at: '',
    };

    const invoice: Invoice = {
      id: 'inv-part',
      user_id: 'u1',
      booking_id: 'b1',
      client_id: 'c1',
      invoice_number: 'INV-101',
      milestone_label: 'mid',
      amount: 100000,
      paid_amount: 60000, // 40,000 unpaid remaining
      due_date: '2026-11-25',
      sent: true,
      status: 'partially_paid',
      created_at: '',
      updated_at: '',
    };

    const input: ForecastInput = {
      today,
      horizonDays: 10,
      openingCash: 50000,
      invoices: [invoice],
      clients: [client],
      recurringExpenses: [],
    };

    const result = computeCashForecast(input);
    expect(result.summary.totalIn).toBe(40000);
    // On 2026-11-25 (day 5), balance increases from 50k to 90k
    const pt = result.daily.find((d) => d.date === '2026-11-25');
    expect(pt?.balance).toBe(90000);
    expect(pt?.inflow).toBe(40000);
  });

  it('horizon boundaries: event on day horizonDays - 1 is included, day horizonDays is not', () => {
    const client: Client = {
      id: 'c1',
      user_id: 'u1',
      name: 'Client One',
      phone: '+91 90000 00001',
      email: null,
      payment_reliability: 'reliable',
      average_delay_days: 0,
      notes: null,
      created_at: '',
      updated_at: '',
    };

    // Day 89 relative to today (inside 90-day horizon [0..89])
    const day89Date = addDays(today, 89);
    // Day 90 relative to today (outside 90-day horizon)
    const day90Date = addDays(today, 90);

    const invInside: Invoice = {
      id: 'inv-in',
      user_id: 'u1',
      booking_id: 'b1',
      client_id: 'c1',
      invoice_number: 'INV-IN',
      milestone_label: 'final',
      amount: 30000,
      paid_amount: 0,
      due_date: day89Date,
      sent: true,
      status: 'sent',
      created_at: '',
      updated_at: '',
    };

    const invOutside: Invoice = {
      id: 'inv-out',
      user_id: 'u1',
      booking_id: 'b1',
      client_id: 'c1',
      invoice_number: 'INV-OUT',
      milestone_label: 'final',
      amount: 50000,
      paid_amount: 0,
      due_date: day90Date,
      sent: true,
      status: 'sent',
      created_at: '',
      updated_at: '',
    };

    const input: ForecastInput = {
      today,
      horizonDays: 90,
      openingCash: 50000,
      invoices: [invInside, invOutside],
      clients: [client],
      recurringExpenses: [],
    };

    const result = computeCashForecast(input);
    expect(result.summary.totalIn).toBe(30000); // Only invInside counted in daily balance
    expect(result.daily[89].balance).toBe(80000);
  });

  it('health ratings: safe (>= 20% opening), tight (> 0 but < 20%), danger (< 0)', () => {
    const openingCash = 100000; // 20% safe buffer = 20,000

    // 1. Safe: balance drops to 30,000 (>= 20k)
    const safeInput: ForecastInput = {
      today,
      horizonDays: 10,
      openingCash,
      invoices: [],
      clients: [],
      recurringExpenses: [],
      oneOffExpenses: [{ name: 'Expense', amount: 70000, date: addDays(today, 2) }],
    };
    expect(computeCashForecast(safeInput).summary.health).toBe('safe');

    // 2. Tight: balance drops to 15,000 (< 20k but > 0)
    const tightInput: ForecastInput = {
      today,
      horizonDays: 10,
      openingCash,
      invoices: [],
      clients: [],
      recurringExpenses: [],
      oneOffExpenses: [{ name: 'Expense', amount: 85000, date: addDays(today, 2) }],
    };
    const tightResult = computeCashForecast(tightInput);
    expect(tightResult.summary.health).toBe('tight');
    expect(tightResult.summary.lowestBalance).toBe(15000);
    expect(tightResult.summary.firstNegativeDate).toBeNull();
    expect(tightResult.summary.runwayDays).toBeNull();

    // 3. Danger: balance drops to -5,000 (< 0)
    const dangerInput: ForecastInput = {
      today,
      horizonDays: 10,
      openingCash,
      invoices: [],
      clients: [],
      recurringExpenses: [],
      oneOffExpenses: [{ name: 'Expense', amount: 105000, date: addDays(today, 4) }],
    };
    const dangerResult = computeCashForecast(dangerInput);
    expect(dangerResult.summary.health).toBe('danger');
    expect(dangerResult.summary.lowestBalance).toBe(-5000);
    expect(dangerResult.summary.firstNegativeDate).toBe(addDays(today, 4));
    expect(dangerResult.summary.runwayDays).toBe(4);
  });
});

describe('Forecast & Seed Data Integration Test', () => {
  it('baseline forecast stays positive but dips into tight health (< 20% of opening cash ₹1,40,000)', () => {
    const seed = generateSeedData();
    const today = new Date().toISOString().split('T')[0];
    const unpaids = seed.invoices.filter((i) => i.amount - i.paid_amount > 0);

    const baseResult = computeCashForecast({
      today,
      horizonDays: 90,
      openingCash: seed.settings.opening_cash_balance,
      invoices: unpaids,
      clients: seed.clients,
      recurringExpenses: seed.recurringExpenses,
    });

    // Opening cash is 140,000. 20% is 28,000.
    expect(baseResult.summary.lowestBalance).toBeGreaterThan(0);
    expect(baseResult.summary.lowestBalance).toBeLessThan(seed.settings.opening_cash_balance * SAFE_BUFFER_PERCENTAGE);
    expect(baseResult.summary.health).toBe('tight');
    expect(baseResult.summary.firstNegativeDate).toBeNull();
    expect(baseResult.summary.runwayDays).toBeNull();
  });

  it('scenario "Mehta pays 15 days late" pushes the balance below zero and reports health as danger', () => {
    const seed = generateSeedData();
    const today = new Date().toISOString().split('T')[0];
    const unpaids = seed.invoices.filter((i) => i.amount - i.paid_amount > 0);
    const mehta = seed.clients.find((c) => c.name.includes('Mehta'));
    expect(mehta).toBeDefined();

    const whatIfInput = applyScenarios(
      {
        today,
        horizonDays: 90,
        openingCash: seed.settings.opening_cash_balance,
        invoices: unpaids,
        clients: seed.clients,
        recurringExpenses: seed.recurringExpenses,
      },
      [{ type: 'clientLate', clientId: mehta!.id, extraDays: 15 }]
    );

    const scenarioResult = computeCashForecast(whatIfInput);
    expect(scenarioResult.summary.lowestBalance).toBeLessThan(0);
    expect(scenarioResult.summary.health).toBe('danger');
    expect(scenarioResult.summary.firstNegativeDate).not.toBeNull();
    expect(scenarioResult.summary.runwayDays).toBe(23); // exactly 23 days runway
  });
});
