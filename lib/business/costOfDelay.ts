import { formatINR } from '../money';

export interface CostOfDelayInput {
  overdueAmount: number;
  monthlyRatePercent: number; // e.g. 1.5
  planMonthlyPrice: number;   // e.g. 299 for Solo
}

export interface CostOfDelayResult {
  overdueAmount: number;
  monthlyRatePercent: number;
  monthlyCostOfDelay: number;
  annualizedCostOfDelay: number;
  planMonthlyPrice: number;
  planSharePercent: number; // plan price as % of monthly cost of delay
  summarySentence: string;
  assumptionText: string;
}

/**
 * Calculates the real estimated financial cost of overdue invoices based on an
 * assumed monthly cost of capital / overdraft / delayed reinvestment rate.
 *
 * Example:
 * Overdue: ₹1,25,000, Rate: 1.5%
 * Monthly cost of delay: ₹1,875.
 * Solo plan (₹299/mo) represents 15.9% of that single month's cost of delay.
 */
export function computeCostOfDelay(input: CostOfDelayInput): CostOfDelayResult {
  const { overdueAmount, monthlyRatePercent, planMonthlyPrice } = input;

  const validOverdue = Math.max(0, Math.round(overdueAmount));
  const validRate = Math.max(0, monthlyRatePercent);
  const monthlyCost = Math.round(validOverdue * (validRate / 100));
  const annualizedCost = monthlyCost * 12;

  const planShare =
    monthlyCost > 0
      ? Number(((planMonthlyPrice / monthlyCost) * 100).toFixed(1))
      : 0;

  const summarySentence = `At an assumed ${validRate}% monthly cost of delay, ${formatINR(
    validOverdue
  )} of overdue invoices costs about ${formatINR(monthlyCost)} a month.`;

  const assumptionText = `Assumption: Estimated monthly cost of delayed capital (${validRate}%/mo).`;

  return {
    overdueAmount: validOverdue,
    monthlyRatePercent: validRate,
    monthlyCostOfDelay: monthlyCost,
    annualizedCostOfDelay: annualizedCost,
    planMonthlyPrice,
    planSharePercent: planShare,
    summarySentence,
    assumptionText,
  };
}
