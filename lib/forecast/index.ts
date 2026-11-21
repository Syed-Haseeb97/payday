// 90-Day Cash Flow Forecast Engine (Deterministic Code Placeholder)
// To be implemented in subsequent step.
// Computes daily projected balance: Opening Cash + Expected Invoices (adjusted for client delay) - Recurring Expenses.

export interface DailyForecastPoint {
  date: string; // YYYY-MM-DD
  dayIndex: number;
  openingBalance: number;
  inflow: number;
  outflow: number;
  closingBalance: number;
  isLowestPoint: boolean;
  isNegative: boolean;
}

export interface ForecastSummary {
  openingBalance: number;
  closingBalance90Days: number;
  lowestBalance: number;
  lowestBalanceDate: string;
  daysBelowZeroCount: number;
  points: DailyForecastPoint[];
}

export function compute90DayForecastPlaceholder(): ForecastSummary {
  // Stub structure ready for deterministic calculation in next step
  return {
    openingBalance: 50000,
    closingBalance90Days: 145000,
    lowestBalance: 12000,
    lowestBalanceDate: '2026-12-05',
    daysBelowZeroCount: 0,
    points: [],
  };
}
