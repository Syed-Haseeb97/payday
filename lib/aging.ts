export type AgingBucket = 'not_due' | '1_7' | '8_30' | '30_plus';

export type AgingInvoice = {
  amount: number;
  paidAmount: number;
  dueDate: string;
  sent: boolean;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toUtcMs(ymd: string): number {
  const [y, m, d] = ymd.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/**
 * Whole days between dueDate and today, or 0 if the invoice is not overdue.
 * Uses UTC so the local timezone never shifts the result.
 */
export function daysOverdue(dueDate: string, today: string): number {
  const days = Math.round((toUtcMs(today) - toUtcMs(dueDate)) / MS_PER_DAY);
  return days > 0 ? days : 0;
}

export function agingBucket(days: number): AgingBucket {
  if (days <= 0) return 'not_due';
  if (days <= 7) return '1_7';
  if (days <= 30) return '8_30';
  return '30_plus';
}

/**
 * Summarises unpaid receivables by aging bucket. Only the remaining balance
 * counts; draft (unsent) invoices and fully paid invoices are excluded.
 */
export function buildAgingSummary(
  invoices: AgingInvoice[],
  today: string,
): Record<AgingBucket, { count: number; amount: number }> {
  const summary: Record<AgingBucket, { count: number; amount: number }> = {
    not_due: { count: 0, amount: 0 },
    '1_7': { count: 0, amount: 0 },
    '8_30': { count: 0, amount: 0 },
    '30_plus': { count: 0, amount: 0 },
  };

  for (const inv of invoices) {
    if (!inv.sent) continue;
    const balance = inv.amount - inv.paidAmount;
    if (balance <= 0) continue;

    const bucket = agingBucket(daysOverdue(inv.dueDate, today));
    summary[bucket].count += 1;
    summary[bucket].amount += balance;
  }

  return summary;
}
