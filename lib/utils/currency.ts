// Indian Rupee currency and formatting utilities

/**
 * Formats a number according to the Indian numbering system (e.g. 125000 -> "₹1,25,000")
 * Supports zero, negative numbers, decimals.
 */
export function formatINR(amount: number, options?: { hideSymbol?: boolean; decimals?: number }): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return options?.hideSymbol ? '0' : '₹0';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const decimals = options?.decimals ?? 0;

  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(absAmount);

  const prefix = options?.hideSymbol ? '' : '₹';
  return isNegative ? `-${prefix}${formatted}` : `${prefix}${formatted}`;
}

/**
 * Formats a date string (YYYY-MM-DD or ISO string) to readable Indian format (e.g. "14 Dec 2026")
 */
export function formatDateIndian(dateInput: string | Date): string {
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return String(dateInput);
  }
}

/**
 * Parses YYYY-MM-DD string into a safe Date object at UTC/local midnight
 */
export function parseDateString(dateStr: string): Date {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }
  return new Date(dateStr);
}

/**
 * Formats a Date object to YYYY-MM-DD string
 */
export function toISODateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
