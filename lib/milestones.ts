export type MilestoneLabel = 'advance' | 'mid' | 'final';
export type MilestoneSplit = { label: MilestoneLabel; amount: number };

const LABELS: MilestoneLabel[] = ['advance', 'mid', 'final'];

/**
 * Splits a whole-rupee total into three milestones (advance, mid, final).
 * Non-last amounts are rounded; the last amount takes the remainder so the
 * milestones always sum exactly to the total.
 */
export function splitMilestones(
  totalRupees: number,
  splits: number[] = [30, 50, 20],
): MilestoneSplit[] {
  if (splits.length !== 3) {
    throw new Error('splits must have exactly 3 entries');
  }
  if (splits.some((pct) => pct < 0)) {
    throw new Error('split percentages must be >= 0');
  }
  const sum = splits.reduce((acc, pct) => acc + pct, 0);
  if (sum !== 100) {
    throw new Error(`split percentages must sum to 100 (got ${sum})`);
  }

  const first = Math.round((totalRupees * splits[0]) / 100);
  const second = Math.round((totalRupees * splits[1]) / 100);
  const last = totalRupees - first - second;

  const amounts = [first, second, last];
  return LABELS.map((label, i) => ({ label, amount: amounts[i] }));
}
