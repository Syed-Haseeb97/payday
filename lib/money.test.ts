import { describe, it, expect } from 'vitest';
import { formatINR, formatCompactINR, formatDateIndian } from './money';

describe('formatINR', () => {
  it('formats zero', () => {
    expect(formatINR(0)).toBe('₹0');
  });

  it('formats values below 1000 without grouping', () => {
    expect(formatINR(999)).toBe('₹999');
  });

  it('formats thousands', () => {
    expect(formatINR(1000)).toBe('₹1,000');
  });

  it('formats lakhs with Indian grouping', () => {
    expect(formatINR(100000)).toBe('₹1,00,000');
    expect(formatINR(125000)).toBe('₹1,25,000');
  });

  it('formats crores with Indian grouping', () => {
    expect(formatINR(1250000)).toBe('₹12,50,000');
  });

  it('formats negative values with the sign before the ₹', () => {
    expect(formatINR(-5000)).toBe('-₹5,000');
  });

  it('rounds non-integers with Math.round', () => {
    expect(formatINR(999.4)).toBe('₹999');
    expect(formatINR(999.5)).toBe('₹1,000');
  });
});

describe('formatCompactINR', () => {
  it('formats zero', () => {
    expect(formatCompactINR(0)).toBe('₹0');
  });

  it('formats amounts below 1000', () => {
    expect(formatCompactINR(500)).toBe('₹500');
    expect(formatCompactINR(-750)).toBe('-₹750');
  });

  it('formats thousands with K suffix', () => {
    expect(formatCompactINR(1000)).toBe('₹1K');
    expect(formatCompactINR(45000)).toBe('₹45K');
    expect(formatCompactINR(45400)).toBe('₹45.4K');
    expect(formatCompactINR(-30000)).toBe('-₹30K');
  });

  it('formats lakhs with L suffix', () => {
    expect(formatCompactINR(100000)).toBe('₹1L');
    expect(formatCompactINR(120000)).toBe('₹1.2L');
    expect(formatCompactINR(140000)).toBe('₹1.4L');
    expect(formatCompactINR(-120000)).toBe('-₹1.2L');
  });

  it('formats crores with Cr suffix', () => {
    expect(formatCompactINR(10000000)).toBe('₹1Cr');
    expect(formatCompactINR(25000000)).toBe('₹2.5Cr');
    expect(formatCompactINR(-10000000)).toBe('-₹1Cr');
  });
});

describe('formatDateIndian', () => {
  it('formats YYYY-MM-DD to readable Indian format', () => {
    const formatted = formatDateIndian('2026-12-14');
    expect(formatted).toContain('14');
    expect(formatted).toContain('Dec');
    expect(formatted).toContain('2026');
  });
});
