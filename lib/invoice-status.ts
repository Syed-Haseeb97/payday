export type InvoiceStatus = 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue';

/**
 * Derives the display status of an invoice. Dates are "YYYY-MM-DD" strings,
 * so lexical comparison is chronological.
 */
export function deriveInvoiceStatus(input: {
  amount: number;
  paidAmount: number;
  dueDate: string;
  sent: boolean;
  today: string;
}): InvoiceStatus {
  const { amount, paidAmount, dueDate, sent, today } = input;
  const balance = amount - paidAmount;

  if (balance <= 0) return 'paid';
  if (dueDate < today) return 'overdue';
  if (paidAmount > 0) return 'partially_paid';
  if (sent) return 'sent';
  return 'draft';
}
