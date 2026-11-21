import { describe, it, expect } from 'vitest';
import { computeCostOfDelay } from './costOfDelay';

describe('Cost of Delay Calculator', () => {
  it('computes monthly delay cost and plan share at default 1.5% assumption', () => {
    const result = computeCostOfDelay({
      overdueAmount: 125000,
      monthlyRatePercent: 1.5,
      planMonthlyPrice: 299,
    });

    // 125,000 * 0.015 = 1,875
    expect(result.monthlyCostOfDelay).toBe(1875);
    expect(result.annualizedCostOfDelay).toBe(1875 * 12);
    // 299 / 1875 = 15.94% -> 15.9%
    expect(result.planSharePercent).toBe(15.9);
    expect(result.summarySentence).toBe(
      'At an assumed 1.5% monthly cost of delay, ₹1,25,000 of overdue invoices costs about ₹1,875 a month.'
    );
    expect(result.assumptionText).toContain('1.5%/mo');
  });

  it('handles custom user-edited assumption rates (e.g. 2.0%)', () => {
    const result = computeCostOfDelay({
      overdueAmount: 80000,
      monthlyRatePercent: 2.0,
      planMonthlyPrice: 299,
    });

    // 80,000 * 0.02 = 1,600
    expect(result.monthlyCostOfDelay).toBe(1600);
    // 299 / 1600 = 18.68% -> 18.7%
    expect(result.planSharePercent).toBe(18.7);
    expect(result.summarySentence).toContain('assumed 2% monthly cost of delay');
    expect(result.summarySentence).toContain('₹1,600 a month');
  });

  it('handles zero overdue amount safely without division by zero', () => {
    const result = computeCostOfDelay({
      overdueAmount: 0,
      monthlyRatePercent: 1.5,
      planMonthlyPrice: 299,
    });

    expect(result.monthlyCostOfDelay).toBe(0);
    expect(result.planSharePercent).toBe(0);
  });
});
