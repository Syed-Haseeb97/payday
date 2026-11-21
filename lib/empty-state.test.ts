import { describe, it, expect } from 'vitest';
import { computeCashForecast } from './forecast';
import { deriveAlerts } from './alerts';
import { rankBadDayActions } from './ranking';
import { buildAgingSummary } from './aging';
import { buildWhoOwesMe } from './receivables';
import { buildTodaySummary } from './dashboard/summary';

describe('Empty state resilience', () => {
  it('does not produce NaN, Infinity, or throw errors when account is completely empty', () => {
    const emptyInput = {
      today: '2026-11-21',
      horizonDays: 90,
      openingCash: 0,
      invoices: [],
      clients: [],
      recurringExpenses: [],
      oneOffExpenses: [],
    };

    // 1. Forecast with zero cash and zero items
    const forecast = computeCashForecast(emptyInput);
    expect(forecast.summary.lowestBalance).toBe(0);
    expect(forecast.summary.endingBalance).toBe(0);
    expect(forecast.summary.totalIn).toBe(0);
    expect(forecast.summary.totalOut).toBe(0);
    expect(Number.isNaN(forecast.summary.lowestBalance)).toBe(false);
    expect(Number.isFinite(forecast.summary.lowestBalance)).toBe(true);
    expect(forecast.summary.health).toBe('safe');

    // 2. Alerts with empty inputs
    const alerts = deriveAlerts(emptyInput);
    expect(Array.isArray(alerts)).toBe(true);
    expect(alerts.length).toBe(0);

    // 3. Bad Day ranking with empty invoices and empty expenses
    const badDay = rankBadDayActions(emptyInput);
    expect(badDay.topRanked).toEqual([]);
    expect(badDay.allRanked).toEqual([]);
    expect(badDay.combinedCashImpact).toBe(0);
    expect(Number.isNaN(badDay.combinedCashImpact)).toBe(false);

    // 4. Aging summary with empty invoices
    const aging = buildAgingSummary([], '2026-11-21');
    expect(aging.not_due.count).toBe(0);
    expect(aging.not_due.amount).toBe(0);
    expect(aging['30_plus'].amount).toBe(0);

    // 5. Who owes me with empty invoices and clients
    const whoOwes = buildWhoOwesMe([], [], '2026-11-21');
    expect(whoOwes).toEqual([]);

    // 6. Today summary
    const summary = buildTodaySummary({
      overdueCount: 0,
      lowestBalance: 0,
      lowestBalanceDate: '2026-11-21',
      whoOwesCount: 0,
    });
    expect(summary).toBe('No active receivables pending. Your lowest cash point is ₹0 on 21 Nov.');
    expect(summary).not.toContain('NaN');
    expect(summary).not.toContain('Infinity');
  });
});
