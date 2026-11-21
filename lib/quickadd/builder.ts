// Quick Add Proposal Builder & Client Matcher
// Pure functions, deterministic, unit-tested.

import { Client, PaymentMethod } from '../db/types';
import { BuiltMilestone, BuiltBookingProposal, MatchedClient, ParsedBooking, QuickAddParseResult } from './types';
import { splitMilestones } from '../milestones';
import { parseISO, subDays, addDays, format, isBefore, isAfter, differenceInDays } from 'date-fns';

const HONORIFICS_REGEX = /^(?:mr|mrs|ms|dr|shri|smt|er|prof)\.?\s+/i;
const SUFFIX_HONORIFICS_REGEX = /\s+(?:ji|sahab|saab|sir|madam)\b/i;

/**
 * Normalizes a client name by stripping punctuation, honorifics, and normalizing spaces.
 */
export function normalizeClientName(name: string): string {
  if (!name) return '';
  let cleaned = name.trim();
  // Strip leading honorifics: Mr. Mrs. Dr. etc.
  cleaned = cleaned.replace(HONORIFICS_REGEX, '');
  // Strip trailing honorifics: "Verma ji", "Sharma saab"
  cleaned = cleaned.replace(SUFFIX_HONORIFICS_REGEX, '');
  // Remove punctuation
  cleaned = cleaned.replace(/[^a-zA-Z0-9\s&]/g, ' ');
  // Collapse whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim().toLowerCase();
  return cleaned;
}

/**
 * Computes Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * Calculates string similarity between 0 and 1
 */
export function calculateNameSimilarity(query: string, candidate: string): number {
  const normQuery = normalizeClientName(query);
  const normCandidate = normalizeClientName(candidate);

  if (!normQuery || !normCandidate) return 0;
  if (normQuery === normCandidate) return 1.0;

  // Exact substring match check
  if (normCandidate.includes(normQuery) || normQuery.includes(normCandidate)) {
    const ratio = Math.min(normQuery.length, normCandidate.length) / Math.max(normQuery.length, normCandidate.length);
    return Math.max(0.85, Number(ratio.toFixed(2)));
  }

  // Token overlap / Jaccard similarity
  const queryTokens = new Set(normQuery.split(' '));
  const candTokens = new Set(normCandidate.split(' '));
  let intersection = 0;
  for (const t of queryTokens) {
    if (candTokens.has(t)) intersection++;
  }
  const union = new Set([...queryTokens, ...candTokens]).size;
  const jaccard = union > 0 ? intersection / union : 0;

  // Levenshtein ratio
  const maxLen = Math.max(normQuery.length, normCandidate.length);
  const dist = levenshteinDistance(normQuery, normCandidate);
  const levScore = maxLen > 0 ? (maxLen - dist) / maxLen : 0;

  return Number(Math.max(jaccard, levScore).toFixed(2));
}

/**
 * Matches a parsed client name against existing clients in the database.
 * Returns matches sorted by descending similarity score.
 */
export function matchClients(queryName: string, existingClients: Client[]): MatchedClient[] {
  if (!queryName || existingClients.length === 0) return [];

  const matches: MatchedClient[] = [];
  for (const client of existingClients) {
    const similarity = calculateNameSimilarity(queryName, client.name);
    if (similarity >= 0.4) {
      matches.push({
        id: client.id,
        name: client.name,
        phone: client.phone,
        similarity,
        paymentReliability: client.payment_reliability,
      });
    }
  }

  return matches.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Builds milestone invoices from parsed data according to business rules:
 * - Default 30/50/20.
 * - If advanceAmount stated, advance milestone is that amount, remainder split 5:2 between shoot-day and final.
 * - If splitPercents stated, must sum to 100.
 * - All amounts integer rupees. Remainder goes to final milestone.
 * - Default due dates: advance = today, shoot-day = 30d before event (or today if passed), final = 7d after event.
 * - If advancePaid is true and paid amount > advance milestone, raise advance milestone to that amount!
 */
export function buildMilestones(options: {
  totalAmount: number;
  eventDate: string; // YYYY-MM-DD
  todayStr: string;  // YYYY-MM-DD
  advanceAmount?: number | null;
  advancePaid?: boolean;
  advancePaidAmount?: number | null;
  splitPercents?: [number, number, number] | null;
}): BuiltMilestone[] {
  const { totalAmount, eventDate, todayStr, splitPercents } = options;
  let advanceAmount = options.advanceAmount ?? null;
  const advancePaid = options.advancePaid ?? false;
  const advancePaidAmount = options.advancePaidAmount ?? null;

  const today = parseISO(todayStr);
  const event = parseISO(eventDate);

  // Due Dates
  const advanceDueDate = todayStr;
  const shootDayRaw = subDays(event, 30);
  const shootDayDueDate = isBefore(shootDayRaw, today) ? todayStr : format(shootDayRaw, 'yyyy-MM-dd');
  const finalDueDate = format(addDays(event, 7), 'yyyy-MM-dd');

  // Handle advancePaidAmount raising advance milestone if necessary
  if (advancePaid && advancePaidAmount && advancePaidAmount > 0) {
    if (advanceAmount === null || advancePaidAmount > advanceAmount) {
      advanceAmount = advancePaidAmount;
    }
  }

  // Case 1: Custom percentage split given
  if (splitPercents && splitPercents.length === 3) {
    const splits = splitMilestones(totalAmount, splitPercents);
    return [
      {
        label: 'advance',
        milestoneLabel: 'Advance (Booking Token)',
        amount: splits[0].amount,
        dueDate: advanceDueDate,
      },
      {
        label: 'mid',
        milestoneLabel: 'Shoot Day Milestone',
        amount: splits[1].amount,
        dueDate: shootDayDueDate,
      },
      {
        label: 'final',
        milestoneLabel: 'Final Delivery Milestone',
        amount: splits[2].amount,
        dueDate: finalDueDate,
      },
    ];
  }

  // Case 2: Exact advance amount stated
  if (advanceAmount !== null && advanceAmount > 0) {
    // If advance >= totalAmount, advance takes full total and others are 0
    if (advanceAmount >= totalAmount) {
      return [
        {
          label: 'advance',
          milestoneLabel: 'Advance (Full Payment)',
          amount: totalAmount,
          dueDate: advanceDueDate,
        },
        {
          label: 'mid',
          milestoneLabel: 'Shoot Day Milestone',
          amount: 0,
          dueDate: shootDayDueDate,
        },
        {
          label: 'final',
          milestoneLabel: 'Final Delivery Milestone',
          amount: 0,
          dueDate: finalDueDate,
        },
      ];
    }

    const first = Math.round(advanceAmount);
    const remainder = totalAmount - first;

    // Split remainder between shoot day and final in 5:2 ratio
    const second = Math.round((remainder * 5) / 7);
    const last = remainder - second;

    return [
      {
        label: 'advance',
        milestoneLabel: 'Advance (Booking Token)',
        amount: first,
        dueDate: advanceDueDate,
      },
      {
        label: 'mid',
        milestoneLabel: 'Shoot Day Milestone',
        amount: second,
        dueDate: shootDayDueDate,
      },
      {
        label: 'final',
        milestoneLabel: 'Final Delivery Milestone',
        amount: last,
        dueDate: finalDueDate,
      },
    ];
  }

  // Case 3: Default 30/50/20 split
  const defaultSplits = splitMilestones(totalAmount, [30, 50, 20]);
  return [
    {
      label: 'advance',
      milestoneLabel: 'Advance (30% Token)',
      amount: defaultSplits[0].amount,
      dueDate: advanceDueDate,
    },
    {
      label: 'mid',
      milestoneLabel: 'Shoot Day Milestone (50%)',
      amount: defaultSplits[1].amount,
      dueDate: shootDayDueDate,
    },
    {
      label: 'final',
      milestoneLabel: 'Final Delivery Milestone (20%)',
      amount: defaultSplits[2].amount,
      dueDate: finalDueDate,
    },
  ];
}

/**
 * Assembles a complete preview booking proposal from a parsed result and DB clients.
 */
export function buildBookingProposal(
  parseResult: QuickAddParseResult,
  existingClients: Client[],
  todayStr: string
): BuiltBookingProposal {
  const { parsed, confidence, warnings, sources, source } = parseResult;

  const clientName = parsed.clientName || 'New Client';
  const matchedClients = matchClients(clientName, existingClients);

  const eventDate = parsed.eventDate || todayStr;
  const totalAmount = parsed.totalAmount && parsed.totalAmount > 0 ? parsed.totalAmount : 0;
  const title = parsed.eventName || `${clientName} Wedding`;

  const milestones =
    totalAmount > 0
      ? buildMilestones({
          totalAmount,
          eventDate,
          todayStr,
          advanceAmount: parsed.advanceAmount,
          advancePaid: parsed.advancePaid,
          advancePaidAmount: parsed.advancePaidAmount,
          splitPercents: parsed.splitPercents,
        })
      : [];

  const advancePaid = parsed.advancePaid;
  const advancePaidAmount = parsed.advancePaidAmount ?? parsed.advanceAmount ?? (milestones[0]?.amount ?? 0);

  let paymentMethod: PaymentMethod = 'UPI';
  if (parsed.paymentMethod === 'cash') paymentMethod = 'cash';
  else if (parsed.paymentMethod === 'bank_transfer') paymentMethod = 'bank_transfer';
  else if (parsed.paymentMethod === 'other') paymentMethod = 'other';

  return {
    clientName,
    matchedClients,
    title,
    eventDate,
    totalAmount,
    milestones,
    advancePaid,
    advancePaidAmount,
    paymentMethod,
    notes: parsed.notes || undefined,
    confidence,
    warnings,
    sources,
    source,
  };
}
