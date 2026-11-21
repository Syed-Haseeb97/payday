import { describe, it, expect } from 'vitest';
import { buildTodaySummary } from './summary';

describe('Today Summary Builder', () => {
  it('builds summary when overdue invoices exist with a projected lowest cash point', () => {
    const text = buildTodaySummary({
      overdueCount: 3,
      lowestBalance: 26500,
      lowestBalanceDate: '2026-12-12',
      whoOwesCount: 5,
    });

    expect(text).toContain('3 invoices need chasing.');
    expect(text).toContain('Your lowest cash point is ₹26,500 on 12 Dec.');
  });

  it('handles single overdue invoice with correct singular grammar', () => {
    const text = buildTodaySummary({
      overdueCount: 1,
      lowestBalance: 40000,
      lowestBalanceDate: '2027-01-05',
      whoOwesCount: 2,
    });

    expect(text).toContain('1 invoice needs chasing.');
    expect(text).toContain('Your lowest cash point is ₹40,000 on 5 Jan.');
  });

  it('handles zero overdue invoices with healthy receivables', () => {
    const text = buildTodaySummary({
      overdueCount: 0,
      lowestBalance: 140000,
      lowestBalanceDate: '2027-01-15',
      whoOwesCount: 4,
    });

    expect(text).toContain('All invoices are on track.');
    expect(text).toContain('Your lowest cash point is ₹1,40,000 on 15 Jan.');
  });

  it('handles empty receivables gracefully', () => {
    const text = buildTodaySummary({
      overdueCount: 0,
      lowestBalance: null,
      lowestBalanceDate: null,
      whoOwesCount: 0,
    });

    expect(text).toBe('No active receivables pending. Cash trajectory is calculating.');
  });
});
