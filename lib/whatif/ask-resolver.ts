import { Client, Booking, Invoice } from '../db/types';
import {
  AskScenarioCandidate,
  AskPaydayResolvedScenario,
  AskPaydayAmbiguity,
} from './ask-types';
import {
  whatIfScenarioSchema,
  WhatIfScenario,
} from './index';
import {
  normalizeClientName,
  calculateNameSimilarity,
  matchClients,
} from '../quickadd/builder';
import { formatINR } from '../money';

export interface ResolveAskOptions {
  candidates: AskScenarioCandidate[];
  clients: Client[];
  bookings: Booking[];
  invoices: Invoice[];
  todayStr: string;
}

export interface ResolveAskResult {
  resolvedScenarios: AskPaydayResolvedScenario[];
  ambiguities: AskPaydayAmbiguity[];
  warnings: string[];
}

export function resolveAskScenarios(options: ResolveAskOptions): ResolveAskResult {
  const { candidates, clients, bookings, invoices, todayStr } = options;
  const resolvedScenarios: AskPaydayResolvedScenario[] = [];
  const ambiguities: AskPaydayAmbiguity[] = [];
  const warnings: string[] = [];

  const clientMap = new Map<string, Client>(clients.map((c) => [c.id, c]));

  candidates.slice(0, 5).forEach((cand, idx) => {
    switch (cand.type) {
      case 'clientLate': {
        const query = cand.clientText?.trim() || '';
        if (!query) {
          warnings.push(`Scenario ${idx + 1}: Missing client name.`);
          return;
        }

        const matches = matchClients(query, clients);
        if (matches.length === 0) {
          ambiguities.push({
            scenarioIndex: idx,
            type: 'client',
            query,
            candidates: clients.slice(0, 5).map((c) => ({ id: c.id, name: c.name })),
          });
          return;
        }

        // Check if clear single winner or ambiguous
        const isClearWinner =
          matches.length === 1 ||
          (matches[0].similarity >= 0.8 &&
            (matches[1]?.similarity ?? 0) < matches[0].similarity - 0.2);

        if (!isClearWinner) {
          ambiguities.push({
            scenarioIndex: idx,
            type: 'client',
            query,
            candidates: matches.slice(0, 4).map((m) => ({ id: m.id, name: m.name })),
          });
          return;
        }

        const matchedClient = matches[0];
        const extraDays = Math.min(90, Math.max(1, cand.extraDays || 14));
        const scenario: WhatIfScenario = {
          type: 'clientLate',
          clientId: matchedClient.id,
          extraDays,
        };

        const validated = whatIfScenarioSchema.safeParse(scenario);
        if (validated.success) {
          resolvedScenarios.push({
            scenario: validated.data,
            displayText: `${matchedClient.name} pays ${extraDays} days late`,
            type: 'clientLate',
            originalCandidate: cand,
          });
        }
        break;
      }

      case 'loseBooking': {
        const query = cand.bookingText?.trim() || '';
        if (!query) {
          warnings.push(`Scenario ${idx + 1}: Missing booking description.`);
          return;
        }

        // Search bookings by title and associated client name
        const bookingMatches: { booking: Booking; similarity: number }[] = [];
        for (const b of bookings) {
          const client = clientMap.get(b.client_id);
          const combinedTitle = `${client ? client.name : ''} ${b.title}`;
          const titleSim = calculateNameSimilarity(query, b.title);
          const combinedSim = calculateNameSimilarity(query, combinedTitle);
          const maxSim = Math.max(titleSim, combinedSim);

          if (maxSim >= 0.35) {
            bookingMatches.push({ booking: b, similarity: maxSim });
          }
        }

        bookingMatches.sort((a, b) => b.similarity - a.similarity);

        if (bookingMatches.length === 0) {
          ambiguities.push({
            scenarioIndex: idx,
            type: 'booking',
            query,
            candidates: bookings.slice(0, 5).map((b) => ({
              id: b.id,
              name: `${clientMap.get(b.client_id)?.name || 'Client'} — ${b.title}`,
            })),
          });
          return;
        }

        const isClearWinner =
          bookingMatches.length === 1 ||
          (bookingMatches[0].similarity >= 0.75 &&
            (bookingMatches[1]?.similarity ?? 0) < bookingMatches[0].similarity - 0.2);

        if (!isClearWinner) {
          ambiguities.push({
            scenarioIndex: idx,
            type: 'booking',
            query,
            candidates: bookingMatches.slice(0, 4).map((m) => ({
              id: m.booking.id,
              name: `${clientMap.get(m.booking.client_id)?.name || 'Client'} — ${m.booking.title}`,
            })),
          });
          return;
        }

        const chosen = bookingMatches[0].booking;
        const scenario: WhatIfScenario = {
          type: 'loseBooking',
          bookingId: chosen.id,
        };

        const validated = whatIfScenarioSchema.safeParse(scenario);
        if (validated.success) {
          const clientName = clientMap.get(chosen.client_id)?.name || 'Client';
          resolvedScenarios.push({
            scenario: validated.data,
            displayText: `Cancel booking "${chosen.title}" (${clientName})`,
            type: 'loseBooking',
            originalCandidate: cand,
          });
        }
        break;
      }

      case 'addExpense': {
        const amount = Math.min(5000000, Math.max(1, cand.amount || 0));
        const date = cand.date || todayStr;
        const name = cand.name?.trim() || 'New Expense';

        const scenario: WhatIfScenario = {
          type: 'addExpense',
          name,
          amount,
          date,
        };

        const validated = whatIfScenarioSchema.safeParse(scenario);
        if (validated.success) {
          resolvedScenarios.push({
            scenario: validated.data,
            displayText: `+${formatINR(amount)} expense: ${name} on ${date}`,
            type: 'addExpense',
            originalCandidate: cand,
          });
        } else {
          warnings.push(`Scenario ${idx + 1}: Invalid expense details.`);
        }
        break;
      }

      case 'invoicePaidEarly': {
        const query = cand.clientText?.trim() || cand.invoiceText?.trim() || '';
        const targetDate = cand.date || todayStr;

        if (!query) {
          warnings.push(`Scenario ${idx + 1}: Missing client or invoice for early payment.`);
          return;
        }

        // Match client
        const clientMatches = matchClients(query, clients);
        if (clientMatches.length === 0) {
          ambiguities.push({
            scenarioIndex: idx,
            type: 'client',
            query,
            candidates: clients.slice(0, 5).map((c) => ({ id: c.id, name: c.name })),
          });
          return;
        }

        const client = clientMatches[0];
        // Find unpaid invoices for this client
        const clientInvoices = invoices.filter(
          (inv) => inv.client_id === client.id && inv.amount - inv.paid_amount > 0
        );

        if (clientInvoices.length === 0) {
          warnings.push(`No unpaid invoices found for ${client.name}.`);
          return;
        }

        // Sort: overdue first, then by largest balance
        clientInvoices.sort((a, b) => {
          const aOverdue = a.due_date < todayStr ? 1 : 0;
          const bOverdue = b.due_date < todayStr ? 1 : 0;
          if (aOverdue !== bOverdue) return bOverdue - aOverdue;
          return (b.amount - b.paid_amount) - (a.amount - a.paid_amount);
        });

        const chosenInvoice = clientInvoices[0];
        const scenario: WhatIfScenario = {
          type: 'invoicePaidEarly',
          invoiceId: chosenInvoice.id,
          newDate: targetDate,
        };

        const validated = whatIfScenarioSchema.safeParse(scenario);
        if (validated.success) {
          const balance = chosenInvoice.amount - chosenInvoice.paid_amount;
          resolvedScenarios.push({
            scenario: validated.data,
            displayText: `${client.name} pays ${formatINR(balance)} (${chosenInvoice.milestone_label}) early on ${targetDate}`,
            type: 'invoicePaidEarly',
            originalCandidate: cand,
          });
        }
        break;
      }
    }
  });

  return { resolvedScenarios, ambiguities, warnings };
}
