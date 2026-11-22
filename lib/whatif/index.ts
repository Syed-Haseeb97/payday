// What-If Scenario Simulation Engine
// Pure functions in lib/whatif, validated with Zod, fully deterministic.

import { z } from '@/lib/zod';
import { ForecastInput, ForecastResult, CashHealth, OneOffExpense } from '../forecast';

// ---------------------------------------------------------------------------
// Zod Schemas for Discriminated Union
// ---------------------------------------------------------------------------

export const clientLateScenarioSchema = z.object({
  type: z.literal('clientLate'),
  clientId: z.string().min(1, 'Client ID is required'),
  extraDays: z.coerce.number().min(1, 'Extra days must be at least 1').max(90),
});

export const loseBookingScenarioSchema = z.object({
  type: z.literal('loseBooking'),
  bookingId: z.string().min(1, 'Booking ID is required'),
});

export const addExpenseScenarioSchema = z.object({
  type: z.literal('addExpense'),
  name: z.string().trim().min(1, 'Expense description is required'),
  amount: z.coerce.number().positive('Expense amount must be positive'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
});

export const invoicePaidEarlyScenarioSchema = z.object({
  type: z.literal('invoicePaidEarly'),
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
});

export const whatIfScenarioSchema = z.discriminatedUnion('type', [
  clientLateScenarioSchema,
  loseBookingScenarioSchema,
  addExpenseScenarioSchema,
  invoicePaidEarlyScenarioSchema,
]);

export type ClientLateScenario = z.infer<typeof clientLateScenarioSchema>;
export type LoseBookingScenario = z.infer<typeof loseBookingScenarioSchema>;
export type AddExpenseScenario = z.infer<typeof addExpenseScenarioSchema>;
export type InvoicePaidEarlyScenario = z.infer<typeof invoicePaidEarlyScenarioSchema>;

export type WhatIfScenario = z.infer<typeof whatIfScenarioSchema>;

// ---------------------------------------------------------------------------
// Pure Scenario Application (Non-mutating)
// ---------------------------------------------------------------------------

/**
 * Applies one or several what-if scenarios on top of a base ForecastInput.
 * Returns a completely NEW ForecastInput without mutating the original.
 */
export function applyScenarios(
  baseInput: ForecastInput,
  scenarios: WhatIfScenario[]
): ForecastInput {
  if (!scenarios || scenarios.length === 0) {
    return {
      ...baseInput,
      invoices: [...baseInput.invoices],
      clients: [...baseInput.clients],
      recurringExpenses: [...baseInput.recurringExpenses],
      oneOffExpenses: [...(baseInput.oneOffExpenses || [])],
    };
  }

  // Deep clone collections
  let modifiedClients = baseInput.clients.map((c) => ({ ...c }));
  let modifiedInvoices = baseInput.invoices.map((inv) => ({ ...inv }));
  let modifiedOneOffExpenses: OneOffExpense[] = [...(baseInput.oneOffExpenses || [])];
  const modifiedRecurring = baseInput.recurringExpenses.map((re) => ({ ...re }));

  for (const scenario of scenarios) {
    switch (scenario.type) {
      case 'clientLate': {
        // Increases delay for that client's invoices
        modifiedClients = modifiedClients.map((c) =>
          c.id === scenario.clientId
            ? { ...c, average_delay_days: c.average_delay_days + scenario.extraDays }
            : c
        );
        break;
      }
      case 'loseBooking': {
        // Removes all unpaid invoices for this booking from inflows
        modifiedInvoices = modifiedInvoices.filter(
          (inv) => inv.booking_id !== scenario.bookingId
        );
        break;
      }
      case 'addExpense': {
        // Appends new one-off outflow
        modifiedOneOffExpenses.push({
          name: scenario.name,
          amount: scenario.amount,
          date: scenario.date,
        });
        break;
      }
      case 'invoicePaidEarly': {
        // Overrides due date and eliminates client delay for this specific invoice
        const targetInv = modifiedInvoices.find((i) => i.id === scenario.invoiceId);
        if (targetInv) {
          const earlyClientId = `${targetInv.client_id}_early_${targetInv.id}`;
          const origClient = modifiedClients.find((c) => c.id === targetInv.client_id);
          modifiedClients.push({
            id: earlyClientId,
            user_id: targetInv.user_id,
            name: origClient?.name || 'Client',
            phone: '',
            email: null,
            payment_reliability: 'reliable',
            average_delay_days: 0,
            notes: null,
            created_at: '',
            updated_at: '',
          });
          modifiedInvoices = modifiedInvoices.map((inv) => {
            if (inv.id === scenario.invoiceId) {
              return {
                ...inv,
                client_id: earlyClientId,
                due_date: scenario.newDate,
              };
            }
            return inv;
          });
        }
        break;
      }
    }
  }

  return {
    ...baseInput,
    clients: modifiedClients,
    invoices: modifiedInvoices,
    recurringExpenses: modifiedRecurring,
    oneOffExpenses: modifiedOneOffExpenses,
  };
}

// ---------------------------------------------------------------------------
// Forecast Comparison & Deltas
// ---------------------------------------------------------------------------

export interface ForecastComparison {
  lowestBalanceDelta: number; // scenario - base
  lowestBalanceDateChanged: boolean;
  baseLowestDate: string;
  scenarioLowestDate: string;
  runwayDelta: number | null; // scenario runway - base runway (null if either has no runway date)
  endingBalanceDelta: number;
  healthWorsened: boolean;
  baseHealth: CashHealth;
  scenarioHealth: CashHealth;
  summaryText: string;
}

const HEALTH_SEVERITY: Record<CashHealth, number> = {
  safe: 0,
  tight: 1,
  danger: 2,
};

/**
 * Compares a baseline forecast against a what-if scenario forecast.
 * Produces exact deltas and plain-language impact text.
 */
export function compareForecasts(
  base: ForecastResult,
  scenario: ForecastResult
): ForecastComparison {
  const lowestBalanceDelta = scenario.summary.lowestBalance - base.summary.lowestBalance;
  const lowestBalanceDateChanged =
    scenario.summary.lowestBalanceDate !== base.summary.lowestBalanceDate;
  const endingBalanceDelta = scenario.summary.endingBalance - base.summary.endingBalance;

  let runwayDelta: number | null = null;
  if (base.summary.runwayDays !== null && scenario.summary.runwayDays !== null) {
    runwayDelta = scenario.summary.runwayDays - base.summary.runwayDays;
  } else if (base.summary.runwayDays === null && scenario.summary.runwayDays !== null) {
    // Was safe, now runs out in X days
    runwayDelta = scenario.summary.runwayDays;
  } else if (base.summary.runwayDays !== null && scenario.summary.runwayDays === null) {
    // Was in danger, now avoided
    runwayDelta = -base.summary.runwayDays;
  }

  const baseSeverity = HEALTH_SEVERITY[base.summary.health];
  const scenarioSeverity = HEALTH_SEVERITY[scenario.summary.health];
  const healthWorsened = scenarioSeverity > baseSeverity;

  // Build plain-language delta sentence
  let summaryText = '';
  if (lowestBalanceDelta < 0) {
    summaryText = `Lowest balance drops by ₹${Math.abs(lowestBalanceDelta).toLocaleString('en-IN')}`;
    if (scenario.summary.lowestBalance < 0 && base.summary.lowestBalance >= 0) {
      summaryText += `, dipping below zero on ${scenario.summary.firstNegativeDate}`;
    }
  } else if (lowestBalanceDelta > 0) {
    summaryText = `Lowest balance improves by ₹${lowestBalanceDelta.toLocaleString('en-IN')}`;
  } else {
    summaryText = 'No change in lowest balance';
  }

  return {
    lowestBalanceDelta,
    lowestBalanceDateChanged,
    baseLowestDate: base.summary.lowestBalanceDate,
    scenarioLowestDate: scenario.summary.lowestBalanceDate,
    runwayDelta,
    endingBalanceDelta,
    healthWorsened,
    baseHealth: base.summary.health,
    scenarioHealth: scenario.summary.health,
    summaryText,
  };
}
