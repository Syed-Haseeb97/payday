import { describe, it, expect } from 'vitest';
import { formatINR } from './money';

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
