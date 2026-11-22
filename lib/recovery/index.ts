// Recovery Plan Engine
// Pure deterministic function in lib/recovery. Zero I/O, zero AI, non-mutating.

import {
  computeCashForecast,
  ForecastInput,
  ForecastResult,
  SAFE_BUFFER_PERCENTAGE,
  addDays,
  daysBetween,
} from '../forecast';
import { applyScenarios, WhatIfScenario } from '../whatif';
import { Invoice, Client } from '../db/types';
import { formatINR } from '../money';

export interface RecoveryAction {
  invoice: Invoice;
  client: Client;
  amount: number;
  daysOverdueOrToDue: number;
  isOverdue: boolean;
  effectOnLowestBalance: number;
  cumulativeLowestBalance: number;
}

export interface DeferralOption {
  name: string;
  amount: number;
  originalDate: string;
  deferredDate: string;
  resultingLowestBalance: number;
  clearsShortfall: boolean;
}

export interface RecoveryPlan {
  needed: boolean;
  initialLowestBalance: number;
  initialLowestDate: string;
  safeBuffer: number;
  actions: RecoveryAction[];
  deferral?: DeferralOption;
  resultingLowestBalance: number;
  resultingLowestDate: string;
  fullyResolved: boolean;
  summarySentence: string;
}

/**
 * Computes a deterministic recovery plan when projected lowest balance
 * falls below the 20% safe buffer or below zero.
 *
 * Greedily selects Bad Day candidate invoices whose early collection (today + 2 days)
 * raises the lowest projected cash balance the most, until safe buffer is reached or 5 actions chosen.
 * Tie-breaks by larger balance, then earlier due date.
 * Also computes flexible upcoming expense deferral options (+7 days).
 */
export function computeRecoveryPlan(input: ForecastInput): RecoveryPlan {
  const safeBuffer = Math.round(input.openingCash * SAFE_BUFFER_PERCENTAGE);
  const baseForecast = computeCashForecast(input);
  const initialLowest = baseForecast.summary.lowestBalance;
  const initialLowestDate = baseForecast.summary.lowestBalanceDate;

  // 1. If cash runway is already safe, no recovery plan needed
  if (initialLowest >= safeBuffer) {
    return {
      needed: false,
      initialLowestBalance: initialLowest,
      initialLowestDate,
      safeBuffer,
      actions: [],
      resultingLowestBalance: initialLowest,
      resultingLowestDate: initialLowestDate,
      fullyResolved: true,
      summarySentence: 'Cash runway is safe. Projected balance remains above your safe buffer.',
    };
  }

  const clients = input.clients || [];
  const clientMap = new Map<string, Client>(clients.map((c) => [c.id, c]));
  const invoices = input.invoices || [];

  // 2. Identify Bad Day candidates: unpaid invoices overdue or due within 10 days
  interface Candidate {
    invoice: Invoice;
    client: Client;
    balance: number;
    daysDiff: number;
    isOverdue: boolean;
  }

  const candidates: Candidate[] = [];
  for (const inv of invoices) {
    const balance = inv.amount - inv.paid_amount;
    if (balance <= 0.001) continue;

    const diff = daysBetween(input.today, inv.due_date);
    const isOverdue = diff < 0;

    // Must be overdue OR due within 10 days
    if (isOverdue || diff <= 10) {
      const client = clientMap.get(inv.client_id) || {
        id: inv.client_id,
        user_id: inv.user_id,
        name: 'Client',
        payment_reliability: 'average',
        average_delay_days: 0,
        created_at: '',
        updated_at: '',
      };

      candidates.push({
        invoice: inv,
        client,
        balance,
        daysDiff: diff,
        isOverdue,
      });
    }
  }

  // 3. Greedy action selection
  const earlyPayDate = addDays(input.today, 2);
  const actions: RecoveryAction[] = [];
  const chosenScenarios: WhatIfScenario[] = [];
  let currentLowest = initialLowest;
  let remainingCandidates = [...candidates];

  while (
    currentLowest < safeBuffer &&
    actions.length < 5 &&
    remainingCandidates.length > 0
  ) {
    interface Evaluation {
      candidate: Candidate;
      newLowest: number;
      gain: number;
    }

    const evaluations: Evaluation[] = [];

    for (const cand of remainingCandidates) {
      const testScenarios: WhatIfScenario[] = [
        ...chosenScenarios,
        {
          type: 'invoicePaidEarly',
          invoiceId: cand.invoice.id,
          newDate: earlyPayDate,
        },
      ];

      const simInput = applyScenarios(input, testScenarios);
      const simForecast = computeCashForecast(simInput);
      const newLowest = simForecast.summary.lowestBalance;
      const gain = newLowest - currentLowest;

      evaluations.push({
        candidate: cand,
        newLowest,
        gain,
      });
    }

    // Sort evaluations:
    // 1. Positive gain candidates come first
    // 2. Prioritize overdue invoices ("chase") over upcoming ("heads_up")
    // 3. Highest gain (raises lowest balance the most)
    // 4. Tie-break: larger invoice balance
    // 5. Tie-break: earlier due date
    evaluations.sort((a, b) => {
      const aHasGain = a.gain > 0;
      const bHasGain = b.gain > 0;
      if (aHasGain !== bHasGain) {
        return aHasGain ? -1 : 1;
      }
      if (a.candidate.isOverdue !== b.candidate.isOverdue) {
        return a.candidate.isOverdue ? -1 : 1;
      }
      if (b.gain !== a.gain) {
        return b.gain - a.gain;
      }
      if (b.candidate.balance !== a.candidate.balance) {
        return b.candidate.balance - a.candidate.balance;
      }
      return a.candidate.invoice.due_date.localeCompare(b.candidate.invoice.due_date);
    });

    const best = evaluations[0];
    if (!best || best.gain <= 0) {
      // No remaining candidate improves lowest balance before the shortfall date
      break;
    }

    // Add to chosen actions
    chosenScenarios.push({
      type: 'invoicePaidEarly',
      invoiceId: best.candidate.invoice.id,
      newDate: earlyPayDate,
    });

    currentLowest = best.newLowest;
    actions.push({
      invoice: best.candidate.invoice,
      client: best.candidate.client,
      amount: best.candidate.balance,
      daysOverdueOrToDue: Math.abs(best.candidate.daysDiff),
      isOverdue: best.candidate.isOverdue,
      effectOnLowestBalance: best.gain,
      cumulativeLowestBalance: currentLowest,
    });

    remainingCandidates = remainingCandidates.filter(
      (c) => c.invoice.id !== best.candidate.invoice.id
    );
  }

  // 4. Compute Deferral Option
  // Which single upcoming flexible expense (recurring or one-off) could move 7 days later to clear shortfall?
  let deferral: DeferralOption | undefined;

  // A. Check one-off expenses before lowest balance date
  const oneOffs = input.oneOffExpenses || [];
  for (const exp of oneOffs) {
    if (exp.date <= initialLowestDate) {
      const deferredDate = addDays(exp.date, 7);
      const modifiedOneOffs = oneOffs.map((o) =>
        o === exp ? { ...o, date: deferredDate } : o
      );
      const simInput: ForecastInput = {
        ...input,
        oneOffExpenses: modifiedOneOffs,
      };
      const sim = computeCashForecast(simInput);
      if (sim.summary.lowestBalance > initialLowest) {
        if (!deferral || sim.summary.lowestBalance > deferral.resultingLowestBalance) {
          deferral = {
            name: exp.name,
            amount: exp.amount,
            originalDate: exp.date,
            deferredDate,
            resultingLowestBalance: sim.summary.lowestBalance,
            clearsShortfall: sim.summary.lowestBalance >= safeBuffer,
          };
        }
      }
    }
  }

  // B. Check recurring expenses whose next occurrence lands before lowest date
  const recurring = input.recurringExpenses || [];
  for (const rec of recurring) {
    if (rec.next_due_date <= initialLowestDate) {
      const deferredDate = addDays(rec.next_due_date, 7);
      const modifiedRecurring = recurring.map((r) =>
        r.id === rec.id ? { ...r, next_due_date: deferredDate } : r
      );
      const simInput: ForecastInput = {
        ...input,
        recurringExpenses: modifiedRecurring,
      };
      const sim = computeCashForecast(simInput);
      if (sim.summary.lowestBalance > initialLowest) {
        if (!deferral || sim.summary.lowestBalance > deferral.resultingLowestBalance) {
          deferral = {
            name: `${rec.name} (recurring)`,
            amount: rec.amount,
            originalDate: rec.next_due_date,
            deferredDate,
            resultingLowestBalance: sim.summary.lowestBalance,
            clearsShortfall: sim.summary.lowestBalance >= safeBuffer,
          };
        }
      }
    }
  }

  // 5. Final resulting forecast
  const finalInput = applyScenarios(input, chosenScenarios);
  const finalForecast = computeCashForecast(finalInput);
  const resultingLowestBalance = finalForecast.summary.lowestBalance;
  const resultingLowestDate = finalForecast.summary.lowestBalanceDate;
  const fullyResolved = resultingLowestBalance >= safeBuffer;

  // 6. Build clear deterministic summary sentence
  let summarySentence = '';
  if (actions.length > 0) {
    const actionClauses = actions.map(
      (a) => `${a.client.name.split(' ')[0]} ${formatINR(a.amount)}`
    );
    const actionText =
      actionClauses.length === 1
        ? actionClauses[0]
        : actionClauses.slice(0, -1).join(', ') + ' and ' + actionClauses[actionClauses.length - 1];

    summarySentence = `Collect ${actionText} and your lowest balance rises from ${formatINR(initialLowest)} to ${formatINR(resultingLowestBalance)}.`;
    if (!fullyResolved) {
      const shortfall = safeBuffer - resultingLowestBalance;
      summarySentence += ` (Still ${formatINR(shortfall)} short of ₹${formatINR(safeBuffer)} safe buffer).`;
    }
  } else {
    summarySentence = `Shortfall of ${formatINR(safeBuffer - initialLowest)} detected, but no upcoming candidate receivables can bridge the gap before ${initialLowestDate}.`;
    if (deferral) {
      summarySentence += ` Consider deferring ${deferral.name} (+7 days).`;
    }
  }

  return {
    needed: true,
    initialLowestBalance: initialLowest,
    initialLowestDate,
    safeBuffer,
    actions,
    deferral,
    resultingLowestBalance,
    resultingLowestDate,
    fullyResolved,
    summarySentence,
  };
}
