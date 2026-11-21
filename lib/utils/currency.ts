// Utility functions for Indian Rupee currency and date formatting

/**
 * Formats a number according to the Indian numbering system (e.g., 125000 -> "₹1,25,000")
 */
export function formatINR(amount: number, options?: { hideSymbol?: boolean }): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  // Format with en-IN locale
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(absAmount);

  const prefix = options?.hideSymbol ? '' : '₹';
  return isNegative ? `-${prefix}${formatted}` : `${prefix}${formatted}`;
}

/**
 * Formats a date string (YYYY-MM-DD) into Indian readable format (e.g., "14 Dec 2026")
 */
export function formatDateIndian(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}
