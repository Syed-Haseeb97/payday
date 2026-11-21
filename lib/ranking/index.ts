// Bad Day Mode - Ranking Engine
// Pure functions in lib/ranking, fully deterministic, zero AI dependency.
// Ranks today's top actions by cash impact, urgency, and client unreliability.

import { Client, Invoice, PaymentReliability } from '../db/types';
import {
  computeCashForecast,
  daysBetween,
  ForecastInput,
  ForecastResult,
} from '../forecast';
import { applyScenarios } from '../whatif';
import { formatINR } from '../money';

export const W_IMPACT = 0.5;
export const W_URGENCY = 0.25;
export const W_UNRELIABILITY = 0.25;

export type BadDayActionType = 'chase' | 'heads_up';

export interface RankedActionComponents {
  cashImpact: number;
  normalizedCashImpact: number;
  urgency: number;
  unreliability: number;
}

export interface BadDayRankedItem {
  id: string; // invoice id
  rank: number;
  invoice: Invoice;
  client: Client;
  actionType: BadDayActionType;
  balance: number;
  daysOverdue: number;
  daysUntilDue: number;
  score: number;
  components: RankedActionComponents;
  oneLineReason: string;
}

export interface BadDaySummary {
  combinedCashImpact: number;
  lowestBalanceWithout: number;
  lowestBalanceWith: number;
  topRanked: BadDayRankedItem[]; // Top 3
  alsoOnList: BadDayRankedItem[]; // Next 2 (ranks 4 and 5)
  allRanked: BadDayRankedItem[];
}

/**
 * Normalizes payment reliability into unreliability (0 to 1).
 * Unreliable = 0.9, Slow = 0.6, New = 0.5, Average = 0.3, Reliable = 0.0
 */
export function getClientUnreliability(reliability: PaymentReliability): number {
  switch (reliability) {
    case 'unreliable':
      return 0.9;
    case 'slow':
      return 0.6;
    case 'new':
      return 0.5;
    case 'average':
      return 0.3;
    case 'reliable':
      return 0.0;
    default:
      return 0.5;
  }
}

/**
 * Generates deterministic one-line justification for Bad Day recommendations.
 */
export function generateOneLineReason(
  clientName: string,
  balance: number,
  actionType: BadDayActionType,
  daysOverdue: number,
  daysUntilDue: number,
  avgDelayDays: number,
  cashImpact: number
): string {
  const formattedBalance = formatINR(balance);
  const formattedImpact = formatINR(cashImpact);

  if (actionType === 'chase') {
    return `${clientName}: ${formattedBalance}, ${daysOverdue} days overdue, usually pays about ${avgDelayDays} days late. Collecting it lifts your lowest balance by ${formattedImpact}.`;
  }

  // heads_up
  return `${clientName}: ${formattedBalance}, due in ${daysUntilDue} days, usually pays about ${avgDelayDays} days late. A heads-up now prevents delays; collecting early lifts lowest balance by ${formattedImpact}.`;
}

/**
 * Pure Bad Day Ranking Function.
 * Evaluates all unpaid overdue and near-due invoices against the 90-day cash forecast.
 */
export function rankBadDayActions(input: ForecastInput): BadDaySummary {
  const { today } = input;
  const invoices = input.invoices || [];
  const clients = input.clients || [];
  const clientMap = new Map<string, Client>(clients.map((c) => [c.id, c]));

  // 1. Run baseline forecast
  const baseForecast = computeCashForecast(input);
  const baseLowestBalance = baseForecast.summary.lowestBalance;

  // 2. Identify candidates
  interface RawCandidate {
    invoice: Invoice;
    client: Client;
    balance: number;
    actionType: BadDayActionType;
    daysOverdue: number;
    daysUntilDue: number;
    cashImpact: number;
    unreliability: number;
  }

  const rawCandidates: RawCandidate[] = [];

  for (const inv of invoices) {
    const balance = inv.amount - inv.paid_amount;
    if (balance <= 0.001) continue; // Skip fully paid invoices

    const client = clientMap.get(inv.client_id) || {
      id: inv.client_id,
      user_id: inv.user_id,
      name: 'Client',
      payment_reliability: 'average',
      average_delay_days: 0,
      created_at: '',
      updated_at: '',
    };

    // Calculate days difference relative to today
    // daysBetween(from, to): if dueDate is 2026-11-09 and today is 2026-11-21 -> diff is -12
    const diff = daysBetween(today, inv.due_date);
    const isOverdue = diff < 0;
    const daysOverdue = isOverdue ? Math.abs(diff) : 0;
    const daysUntilDue = !isOverdue ? diff : 0;

    let actionType: BadDayActionType | null = null;
    if (isOverdue) {
      actionType = 'chase';
    } else if (daysUntilDue <= 10) {
      actionType = 'heads_up';
    }

    if (!actionType) continue; // Out of consideration window

    // Compute cashImpact using existing forecast and what-if functions
    const earlyInput = applyScenarios(input, [
      { type: 'invoicePaidEarly', invoiceId: inv.id, newDate: today },
    ]);
    const earlyForecast = computeCashForecast(earlyInput);
    const cashImpact = Math.max(
      0,
      earlyForecast.summary.lowestBalance - baseLowestBalance
    );

    const unreliability = getClientUnreliability(client.payment_reliability);

    rawCandidates.push({
      invoice: inv,
      client,
      balance,
      actionType,
      daysOverdue,
      daysUntilDue,
      cashImpact,
      unreliability,
    });
  }

  // 3. Compute normalized scores
  const maxImpact = Math.max(...rawCandidates.map((c) => c.cashImpact), 0);

  const scoredCandidates = rawCandidates.map((c) => {
    const normalizedCashImpact = maxImpact > 0 ? c.cashImpact / maxImpact : 0;
    const urgency =
      c.actionType === 'chase' ? Math.min(30, c.daysOverdue) / 30 : 0;

    const score =
      W_IMPACT * normalizedCashImpact +
      W_URGENCY * urgency +
      W_UNRELIABILITY * c.unreliability;

    const components: RankedActionComponents = {
      cashImpact: c.cashImpact,
      normalizedCashImpact,
      urgency,
      unreliability: c.unreliability,
    };

    const oneLineReason = generateOneLineReason(
      c.client.name,
      c.balance,
      c.actionType,
      c.daysOverdue,
      c.daysUntilDue,
      c.client.average_delay_days,
      c.cashImpact
    );

    return {
      id: c.invoice.id,
      invoice: c.invoice,
      client: c.client,
      actionType: c.actionType,
      balance: c.balance,
      daysOverdue: c.daysOverdue,
      daysUntilDue: c.daysUntilDue,
      score,
      components,
      oneLineReason,
    };
  });

  // 4. Sort with tie-breaks: score DESC, balance DESC, due_date ASC
  scoredCandidates.sort((a, b) => {
    if (Math.abs(b.score - a.score) > 0.0001) {
      return b.score - a.score;
    }
    if (Math.abs(b.balance - a.balance) > 0.001) {
      return b.balance - a.balance;
    }
    return a.invoice.due_date.localeCompare(b.invoice.due_date);
  });

  // Assign ranks
  const allRanked: BadDayRankedItem[] = scoredCandidates.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));

  const topRanked = allRanked.slice(0, 3);
  const alsoOnList = allRanked.slice(3, 5);

  // 5. Compute combined cash impact if top 3 are all collected today
  let lowestBalanceWith = baseLowestBalance;
  let combinedCashImpact = 0;

  if (topRanked.length > 0) {
    const topScenarios = topRanked.map((item) => ({
      type: 'invoicePaidEarly' as const,
      invoiceId: item.invoice.id,
      newDate: today,
    }));

    const combinedInput = applyScenarios(input, topScenarios);
    const combinedForecast = computeCashForecast(combinedInput);
    lowestBalanceWith = combinedForecast.summary.lowestBalance;
    combinedCashImpact = Math.max(0, lowestBalanceWith - baseLowestBalance);
  }

  return {
    combinedCashImpact,
    lowestBalanceWithout: baseLowestBalance,
    lowestBalanceWith,
    topRanked,
    alsoOnList,
    allRanked,
  };
}
