import { format, parseISO } from 'date-fns';
import { formatINR } from '../money';

export interface TodaySummaryInput {
  overdueCount: number;
  lowestBalance: number | null;
  lowestBalanceDate: string | null;
  whoOwesCount: number;
}

/**
 * Builds a deterministic, single-sentence summary of the business's situation today.
 * Examples:
 * - "3 invoices need chasing. Your lowest cash point is ₹26,500 on 12 Dec."
 * - "All invoices are on track. Your lowest cash point is ₹1,40,000 on 15 Jan."
 * - "2 invoices need chasing. Cash trajectory is calculating."
 */
export function buildTodaySummary(input: TodaySummaryInput): string {
  const { overdueCount, lowestBalance, lowestBalanceDate, whoOwesCount } = input;

  const chasePart =
    overdueCount > 0
      ? `${overdueCount} invoice${overdueCount === 1 ? '' : 's'} need${overdueCount === 1 ? 's' : ''} chasing.`
      : whoOwesCount > 0
      ? 'All invoices are on track.'
      : 'No active receivables pending.';

  if (lowestBalance !== null && lowestBalanceDate) {
    let formattedDate = lowestBalanceDate;
    try {
      formattedDate = format(parseISO(lowestBalanceDate), 'd MMM');
    } catch {
      formattedDate = lowestBalanceDate;
    }
    const cashPart = `Your lowest cash point is ${formatINR(lowestBalance)} on ${formattedDate}.`;
    return `${chasePart} ${cashPart}`;
  }

  return `${chasePart} Cash trajectory is calculating.`;
}
