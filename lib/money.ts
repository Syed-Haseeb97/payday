/**
 * Formats whole rupees using the Indian grouping system (e.g. ₹12,50,000).
 * Non-integer input is rounded with Math.round first.
 */
export function formatINR(rupees: number): string {
  const n = Math.round(rupees);
  const negative = n < 0;
  const digits = String(Math.abs(n));

  let grouped: string;
  if (digits.length <= 3) {
    grouped = digits;
  } else {
    const last3 = digits.slice(-3);
    const rest = digits.slice(0, -3);
    // Group the remaining digits in pairs from the right: 12345 -> 12,345 -> 1,23,45x
    const restGrouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    grouped = `${restGrouped},${last3}`;
  }

  return `${negative ? '-' : ''}₹${grouped}`;
}

/**
 * Compact Indian currency formatting for chart axes (e.g. ₹1.2L, ₹45K, ₹2.5Cr).
 * Supports zero, negative numbers, decimals.
 */
export function formatCompactINR(rupees: number): string {
  const n = Math.round(rupees);
  if (n === 0) return '₹0';

  const negative = n < 0;
  const abs = Math.abs(n);

  let formattedNum: string;
  let suffix = '';

  if (abs >= 10000000) {
    // 1 Crore = 10,000,000
    const val = abs / 10000000;
    formattedNum = val % 1 === 0 ? String(val) : val.toFixed(1).replace(/\.0$/, '');
    suffix = 'Cr';
  } else if (abs >= 100000) {
    // 1 Lakh = 100,000
    const val = abs / 100000;
    formattedNum = val % 1 === 0 ? String(val) : val.toFixed(1).replace(/\.0$/, '');
    suffix = 'L';
  } else if (abs >= 1000) {
    // 1 Thousand = 1,000
    const val = abs / 1000;
    formattedNum = val % 1 === 0 ? String(val) : val.toFixed(1).replace(/\.0$/, '');
    suffix = 'K';
  } else {
    formattedNum = String(abs);
  }

  return `${negative ? '-' : ''}₹${formattedNum}${suffix}`;
}

/**
 * Formats a date string (YYYY-MM-DD or Date object) to readable Indian format (e.g. "14 Dec 2026")
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
