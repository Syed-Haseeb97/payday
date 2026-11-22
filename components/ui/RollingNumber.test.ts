import { describe, it, expect } from 'vitest';
import { formatINR } from '@/lib/money';

describe('Rolling Number & Currency Formatting Utilities', () => {
  it('formats positive rupee amounts correctly for tabular display', () => {
    expect(formatINR(125000)).toBe('₹1,25,000');
    expect(formatINR(50000)).toBe('₹50,000');
    expect(formatINR(140000)).toBe('₹1,40,000');
  });

  it('formats zero and negative rupee amounts correctly', () => {
    expect(formatINR(0)).toBe('₹0');
    expect(formatINR(-25000)).toBe('-₹25,000');
  });
});
