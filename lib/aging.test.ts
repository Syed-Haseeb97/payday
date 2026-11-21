import { describe, it, expect } from 'vitest';
import { daysOverdue, agingBucket, buildAgingSummary } from './aging';

describe('daysOverdue', () => {
  it('returns 0 on the due date', () => {
    expect(daysOverdue('2025-03-10', '2025-03-10')).toBe(0);
  });

  it('returns 0 when not yet due', () => {
    expect(daysOverdue('2025-03-15', '2025-03-10')).toBe(0);
  });

  it('counts whole days across a month boundary', () => {
    expect(daysOverdue('2025-02-27', '2025-03-02')).toBe(3);
  });

  it('counts whole days across a leap day', () => {
    expect(daysOverdue('2024-02-28', '2024-03-01')).toBe(2);
  });
});

describe('agingBucket', () => {
  it('maps boundary days to the correct buckets', () => {
    expect(agingBucket(0)).toBe('not_due');
    expect(agingBucket(1)).toBe('1_7');
    expect(agingBucket(7)).toBe('1_7');
    expect(agingBucket(8)).toBe('8_30');
    expect(agingBucket(30)).toBe('8_30');
    expect(agingBucket(31)).toBe('30_plus');
  });
});

describe('buildAgingSummary', () => {
  const today = '2025-03-31';

  it('places invoices at boundary days into the right buckets', () => {
    const invoices = [
      { amount: 100, paidAmount: 0, dueDate: '2025-03-31', sent: true }, // 0 -> not_due
      { amount: 200, paidAmount: 0, dueDate: '2025-03-30', sent: true }, // 1 -> 1_7
      { amount: 300, paidAmount: 0, dueDate: '2025-03-24', sent: true }, // 7 -> 1_7
      { amount: 400, paidAmount: 0, dueDate: '2025-03-23', sent: true }, // 8 -> 8_30
      { amount: 500, paidAmount: 0, dueDate: '2025-03-01', sent: true }, // 30 -> 8_30
      { amount: 600, paidAmount: 0, dueDate: '2025-02-28', sent: true }, // 31 -> 30_plus
    ];
    const summary = buildAgingSummary(invoices, today);
    expect(summary.not_due).toEqual({ count: 1, amount: 100 });
    expect(summary['1_7']).toEqual({ count: 2, amount: 500 });
    expect(summary['8_30']).toEqual({ count: 2, amount: 900 });
    expect(summary['30_plus']).toEqual({ count: 1, amount: 600 });
  });

  it('counts only the remaining balance on partial payments', () => {
    const summary = buildAgingSummary(
      [{ amount: 1000, paidAmount: 250, dueDate: '2025-03-20', sent: true }],
      today,
    );
    expect(summary['8_30']).toEqual({ count: 1, amount: 750 });
  });

  it('excludes draft invoices entirely', () => {
    const summary = buildAgingSummary(
      [{ amount: 1000, paidAmount: 0, dueDate: '2025-02-01', sent: false }],
      today,
    );
    expect(summary.not_due).toEqual({ count: 0, amount: 0 });
    expect(summary['30_plus']).toEqual({ count: 0, amount: 0 });
  });

  it('skips fully paid invoices', () => {
    const summary = buildAgingSummary(
      [{ amount: 1000, paidAmount: 1000, dueDate: '2025-02-01', sent: true }],
      today,
    );
    expect(summary['30_plus']).toEqual({ count: 0, amount: 0 });
  });
});
