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
