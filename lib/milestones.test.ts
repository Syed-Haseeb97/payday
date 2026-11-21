import { describe, it, expect } from 'vitest';
import { splitMilestones } from './milestones';

const sumOf = (xs: { amount: number }[]) => xs.reduce((acc, x) => acc + x.amount, 0);

describe('splitMilestones', () => {
  it('splits 80000 with the default 30/50/20 split', () => {
    const result = splitMilestones(80000);
    expect(result).toEqual([
      { label: 'advance', amount: 24000 },
      { label: 'mid', amount: 40000 },
      { label: 'final', amount: 16000 },
    ]);
  });

  it('sums exactly to the total for 40001 with default split', () => {
    const result = splitMilestones(40001);
    expect(sumOf(result)).toBe(40001);
  });

  it('sums exactly to the total for 99999 and checks exact values', () => {
    const result = splitMilestones(99999);
    expect(sumOf(result)).toBe(99999);
    expect(result.map((r) => r.amount)).toEqual([30000, 50000, 19999]);
  });

  it('supports a custom split', () => {
    const result = splitMilestones(1000, [50, 25, 25]);
    expect(result).toEqual([
      { label: 'advance', amount: 500 },
      { label: 'mid', amount: 250 },
      { label: 'final', amount: 250 },
    ]);
  });

  it('throws when splits sum to 99', () => {
    expect(() => splitMilestones(1000, [30, 40, 29])).toThrow(Error);
  });

  it('throws when splits sum to 101', () => {
    expect(() => splitMilestones(1000, [30, 50, 21])).toThrow(Error);
  });

  it('throws when splits have 2 entries', () => {
    expect(() => splitMilestones(1000, [50, 50])).toThrow(Error);
  });

  it('throws when a split is negative', () => {
    expect(() => splitMilestones(1000, [-10, 60, 50])).toThrow(Error);
  });
});
