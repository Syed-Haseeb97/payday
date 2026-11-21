import { describe, it, expect } from 'vitest';
import { getIndiaTodayStr } from './date';

describe('India timezone handling (Asia/Kolkata)', () => {
  it('correctly computes India date across UTC midnight boundaries', () => {
    // 2026-05-10T18:29:00Z -> 23:59:00 in IST (still May 10)
    const justBeforeMidnightUTC = new Date('2026-05-10T18:29:00Z');
    expect(getIndiaTodayStr(justBeforeMidnightUTC)).toBe('2026-05-10');

    // 2026-05-10T18:31:00Z -> 00:01:00 in IST (now May 11)
    const justAfterMidnightUTC = new Date('2026-05-10T18:31:00Z');
    expect(getIndiaTodayStr(justAfterMidnightUTC)).toBe('2026-05-11');
  });

  it('handles fixed clock near midnight properly', () => {
    // Exactly midnight in India: 18:30:00 UTC
    const midnightUTC = new Date('2026-05-10T18:30:00Z');
    expect(getIndiaTodayStr(midnightUTC)).toBe('2026-05-11');

    // 23:30:00 UTC is May 11 05:00:00 IST
    const morningIST = new Date('2026-05-10T23:30:00Z');
    expect(getIndiaTodayStr(morningIST)).toBe('2026-05-11');
  });
});
