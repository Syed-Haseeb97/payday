// Deterministic Quick Add Rule-Based Parser
// Pure functions, zero AI dependency, zero clock reads (always takes `today` parameter).

import { ExtractedField, ParsedBooking, QuickAddParseResult, QuickAddPaymentMethod } from './types';
import {
  parseISO,
  format,
  addDays,
  setYear,
  isBefore,
  startOfDay,
  nextSaturday,
  nextSunday,
  nextMonday,
  nextTuesday,
  nextWednesday,
  nextThursday,
  nextFriday,
} from 'date-fns';

const MONTH_NAMES: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

/**
 * Parses Indian numeric expressions into whole rupees:
 * "80k", "80,000", "₹80000", "Rs 80k", "1.2 lakh", "1.2L", "1,20,000", "2 lakh 50 thousand"
 */
export function parseRupeeAmount(text: string): number | null {
  const cleaned = text.trim();
  if (!cleaned) return null;

  // 1. Compound: "X lakh Y thousand" e.g. "2 lakh 50 thousand", "1 lakh 20 thousand"
  const compoundMatch = cleaned.match(
    /(?:(?:rs\.?|inr|₹)\s*)?(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs)\s*(?:and\s*)?(\d+(?:\.\d+)?)\s*(?:thousand|k)?/i
  );
  if (compoundMatch) {
    const lakhPart = parseFloat(compoundMatch[1]) * 100000;
    const thousandPart = parseFloat(compoundMatch[2]) * 1000;
    return Math.round(lakhPart + thousandPart);
  }

  // 2. Simple Lakh: "1.2 lakh", "1.2L", "1.2 lac", "15 lakh"
  const lakhMatch = cleaned.match(
    /(?:(?:rs\.?|inr|₹)\s*)?(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs|l)\b/i
  );
  if (lakhMatch) {
    const val = parseFloat(lakhMatch[1]);
    if (!isNaN(val)) return Math.round(val * 100000);
  }

  // 3. Thousands with 'k': "80k", "25 k", "₹80k"
  const kMatch = cleaned.match(/(?:(?:rs\.?|inr|₹)\s*)?(\d+(?:\.\d+)?)\s*k\b/i);
  if (kMatch) {
    const val = parseFloat(kMatch[1]);
    if (!isNaN(val)) return Math.round(val * 1000);
  }

  // 4. Word thousand: "80 thousand", "25 thousand"
  const thousandMatch = cleaned.match(
    /(?:(?:rs\.?|inr|₹)\s*)?(\d+(?:\.\d+)?)\s*(?:thousand|thousands)\b/i
  );
  if (thousandMatch) {
    const val = parseFloat(thousandMatch[1]);
    if (!isNaN(val)) return Math.round(val * 1000);
  }

  // 5. Standard numeric with commas: "80,000", "₹1,20,000", "45000"
  const numMatch = cleaned.match(/(?:(?:rs\.?|inr|₹)\s*)?(\d[\d,]*)(?:\.\d+)?/i);
  if (numMatch) {
    const digitsOnly = numMatch[1].replace(/,/g, '');
    const val = parseInt(digitsOnly, 10);
    if (!isNaN(val) && val > 0) return val;
  }

  return null;
}

/**
 * Extracts all candidate amounts with their positions and matched text
 */
interface AmountCandidate {
  amount: number;
  phrase: string;
  index: number;
  length: number;
  isAdvanceContext: boolean;
  isPaidContext: boolean;
}

export function extractAllAmounts(text: string): AmountCandidate[] {
  const candidates: AmountCandidate[] = [];

  // Patterns for potential amounts
  const amountRegex =
    /(?:(?:rs\.?|inr|₹)\s*)?(?:\d+(?:\.\d+)?\s*(?:lakh|lakhs|lac|lacs)(?:\s*(?:and\s*)?\d+(?:\.\d+)?\s*(?:thousand|k)?)?|\d+(?:\.\d+)?\s*k\b|\d+(?:\.\d+)?\s*(?:lakh|lakhs|lac|lacs|l)\b|\d+(?:\.\d+)?\s*(?:thousand|thousands)\b|\d[\d,]*(?:\.\d+)?)/gi;

  let match: RegExpExecArray | null;
  while ((match = amountRegex.exec(text)) !== null) {
    const phrase = match[0].trim();
    // Exclude if it looks like a day of month or year alone without currency or modifier
    // e.g. "14", "2026", "2"
    if (/^\d{1,4}$/.test(phrase) && !match[0].includes('₹') && !/rs/i.test(match[0])) {
      // Check surrounding context: is it preceded by ₹ / Rs?
      const beforeStr = text.substring(Math.max(0, match.index - 5), match.index);
      if (!/(?:rs\.?|inr|₹)\s*$/i.test(beforeStr)) {
        // If it's a 1 or 2 digit number without currency, it's likely a date or percentage
        if (phrase.length <= 2) continue;
        // If it's 4 digits starting with 202, it's likely a year
        if (phrase.length === 4 && (phrase.startsWith('202') || phrase.startsWith('199'))) continue;
      }
    }

    const amount = parseRupeeAmount(phrase);
    if (amount !== null && amount > 0) {
      const beforeText = text.substring(0, match.index);
      const afterText = text.substring(match.index + match[0].length);

      // Clause boundaries: stop at comma, semicolon, newline
      const beforeClause = beforeText.split(/[,;\n]/).pop() || '';
      const afterClause = afterText.split(/[,;\n]/)[0] || '';

      // Check if advance/token is immediately before this amount in the same clause
      // e.g. "advance 25k", "token 15k", "advance of 25k", "advance: 25k"
      const precededByAdvance = /\b(?:advance|token|booking amount|peshgi|adv)\s*(?:of|is|:|=|amount)?\s*$/i.test(beforeClause);

      // Check if advance/token is immediately after this amount in the same clause
      // BUT make sure it's not actually introducing the NEXT number (e.g. "45000 advance 10000")
      const followedByAdvance =
        /^\s*(?:advance|token|booking amount|peshgi|adv)\b/i.test(afterClause) &&
        !/^\s*(?:advance|token|booking amount|peshgi|adv)\s*(?:of|is|:|=|amount)?\s*(?:rs\.?|inr|₹)?\s*\d/i.test(afterClause);

      const isAdvanceContext = precededByAdvance || followedByAdvance;

      // Check if marked as paid in the local clause
      const clauseForPaid = (beforeClause + ' ' + match[0] + ' ' + afterClause).toLowerCase();
      const isPaidContext =
        /\b(?:mil gaya|mila|received|paid|diya|de diya|pay ho gaya|clear)\b/i.test(clauseForPaid);

      candidates.push({
        amount,
        phrase: match[0],
        index: match.index,
        length: match[0].length,
        isAdvanceContext,
        isPaidContext,
      });
    }
  }

  return candidates;
}

/**
 * Extracts date expressions relative to `today` (ISO string YYYY-MM-DD):
 * "14 Dec", "14th December", "14/12", "14-12-2026", "next Saturday", "this Sunday", "20 feb", "2 Jan"
 */
export function extractDate(
  text: string,
  todayStr: string
): ExtractedField<string> | null {
  const today = parseISO(todayStr);
  const currentYear = today.getFullYear();

  // 1. Explicit Full Date: "14-12-2026", "14/12/2026", "2026-12-14"
  const fullDateIso = text.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  if (fullDateIso) {
    const yr = parseInt(fullDateIso[1], 10);
    const mo = String(parseInt(fullDateIso[2], 10)).padStart(2, '0');
    const da = String(parseInt(fullDateIso[3], 10)).padStart(2, '0');
    return {
      value: `${yr}-${mo}-${da}`,
      matchedPhrase: fullDateIso[0],
      confidence: 0.95,
    };
  }

  const fullDateDmy = text.match(/\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b/);
  if (fullDateDmy) {
    const da = String(parseInt(fullDateDmy[1], 10)).padStart(2, '0');
    const mo = String(parseInt(fullDateDmy[2], 10)).padStart(2, '0');
    const yr = fullDateDmy[3];
    return {
      value: `${yr}-${mo}-${da}`,
      matchedPhrase: fullDateDmy[0],
      confidence: 0.95,
    };
  }

  // 2. Relative Keywords: "today", "tomorrow"
  if (/\btoday\b/i.test(text)) {
    const match = text.match(/\btoday\b/i)!;
    return {
      value: todayStr,
      matchedPhrase: match[0],
      confidence: 0.95,
    };
  }
  if (/\btomorrow\b/i.test(text)) {
    const match = text.match(/\btomorrow\b/i)!;
    return {
      value: format(addDays(today, 1), 'yyyy-MM-dd'),
      matchedPhrase: match[0],
      confidence: 0.95,
    };
  }

  // Relative weekday: "this Sunday", "next Saturday", etc.
  const weekdayRegex = /\b(this|next)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i;
  const weekdayMatch = text.match(weekdayRegex);
  if (weekdayMatch) {
    const dayName = weekdayMatch[2].toLowerCase();
    const isNext = (weekdayMatch[1] || '').toLowerCase() === 'next';

    let targetDate: Date;
    switch (dayName) {
      case 'monday':
        targetDate = nextMonday(today);
        break;
      case 'tuesday':
        targetDate = nextTuesday(today);
        break;
      case 'wednesday':
        targetDate = nextWednesday(today);
        break;
      case 'thursday':
        targetDate = nextThursday(today);
        break;
      case 'friday':
        targetDate = nextFriday(today);
        break;
      case 'saturday':
        targetDate = nextSaturday(today);
        break;
      case 'sunday':
      default:
        targetDate = nextSunday(today);
        break;
    }

    if (isNext) {
      targetDate = addDays(targetDate, 7);
    }

    return {
      value: format(targetDate, 'yyyy-MM-dd'),
      matchedPhrase: weekdayMatch[0],
      confidence: 0.85,
    };
  }

  // 3. Day + Month Name: "14 Dec", "14th December", "20 feb", "2 Jan", "Dec 14"
  const dayMonthRegex = /\b(\d{1,2})(?:st|nd|rd|th)?\s+([a-zA-Z]+)(?:\s+(\d{4}))?\b/i;
  const monthDayRegex = /\b([a-zA-Z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(\d{4}))?\b/i;

  let day: number | null = null;
  let month: number | null = null;
  let year: number | null = null;
  let matched = '';

  const dm = text.match(dayMonthRegex);
  if (dm && MONTH_NAMES[dm[2].toLowerCase()] !== undefined) {
    day = parseInt(dm[1], 10);
    month = MONTH_NAMES[dm[2].toLowerCase()];
    year = dm[3] ? parseInt(dm[3], 10) : null;
    matched = dm[0];
  } else {
    const md = text.match(monthDayRegex);
    if (md && MONTH_NAMES[md[1].toLowerCase()] !== undefined) {
      month = MONTH_NAMES[md[1].toLowerCase()];
      day = parseInt(md[2], 10);
      year = md[3] ? parseInt(md[3], 10) : null;
      matched = md[0];
    }
  }

  // 4. Slash/dash without year: "14/12", "14-12"
  if (day === null) {
    const dmyShort = text.match(/\b(\d{1,2})[-/](\d{1,2})\b/);
    if (dmyShort) {
      const d = parseInt(dmyShort[1], 10);
      const m = parseInt(dmyShort[2], 10) - 1;
      if (d >= 1 && d <= 31 && m >= 0 && m <= 11) {
        day = d;
        month = m;
        matched = dmyShort[0];
      }
    }
  }

  if (day !== null && month !== null) {
    // Resolve year: if year omitted, pick currentYear if date >= today, else currentYear + 1
    if (year === null) {
      const candidateDate = new Date(currentYear, month, day);
      if (isBefore(candidateDate, startOfDay(today))) {
        year = currentYear + 1; // Rollover to next year
      } else {
        year = currentYear;
      }
    }

    const resolvedDate = new Date(year, month, day);
    return {
      value: format(resolvedDate, 'yyyy-MM-dd'),
      matchedPhrase: matched,
      confidence: 0.9,
    };
  }

  return null;
}

/**
 * Extracts percentage splits such as "50% advance", "40-40-20", "50/30/20"
 */
export function extractSplitPercents(
  text: string
): ExtractedField<[number, number, number]> | null {
  // Triple split: "30-50-20", "30/50/20", "30 50 20"
  const tripleMatch = text.match(/\b(\d{1,2})[-/ ](\d{1,2})[-/ ](\d{1,2})\b/);
  if (tripleMatch) {
    const a = parseInt(tripleMatch[1], 10);
    const b = parseInt(tripleMatch[2], 10);
    const c = parseInt(tripleMatch[3], 10);
    if (a + b + c === 100) {
      return {
        value: [a, b, c],
        matchedPhrase: tripleMatch[0],
        confidence: 0.95,
      };
    }
  }

  // Single advance percentage: "50% advance", "40% advance"
  const singleAdvance = text.match(/\b(\d{1,2})%\s*(?:advance|token|booking)\b/i);
  if (singleAdvance) {
    const adv = parseInt(singleAdvance[1], 10);
    if (adv > 0 && adv < 100) {
      // Split remainder in 5:2 ratio
      const rem = 100 - adv;
      const mid = Math.round((rem * 5) / 7);
      const fin = rem - mid;
      return {
        value: [adv, mid, fin],
        matchedPhrase: singleAdvance[0],
        confidence: 0.85,
      };
    }
  }

  return null;
}

/**
 * Extracts payment method: "via UPI", "cash", "bank transfer", "neft"
 */
export function extractPaymentMethod(
  text: string
): ExtractedField<QuickAddPaymentMethod> | null {
  if (/\b(?:via\s+)?upi\b/i.test(text)) {
    const match = text.match(/\b(?:via\s+)?upi\b/i)!;
    return { value: 'upi', matchedPhrase: match[0], confidence: 0.95 };
  }
  if (/\b(?:via\s+)?(?:cash|naqad|nakad)\b/i.test(text)) {
    const match = text.match(/\b(?:via\s+)?(?:cash|naqad|nakad)\b/i)!;
    return { value: 'cash', matchedPhrase: match[0], confidence: 0.9 };
  }
  if (/\b(?:via\s+)?(?:bank transfer|neft|imps|rtgs|account transfer)\b/i.test(text)) {
    const match = text.match(/\b(?:via\s+)?(?:bank transfer|neft|imps|rtgs|account transfer)\b/i)!;
    return { value: 'bank_transfer', matchedPhrase: match[0], confidence: 0.9 };
  }
  return null;
}

/**
 * Extracts Client Name and Event Name based on Indian wedding industry patterns:
 * Words before "wedding", "engagement", "shoot", "sangeet", "reception", "pre-wedding", "shaadi", "ki shaadi"
 */
export function extractClientAndEvent(
  text: string
): { clientName: ExtractedField<string> | null; eventName: ExtractedField<string> | null } {
  const eventKeywords = [
    'ki shaadi',
    'shaadi',
    'wedding',
    'engagement',
    'pre-wedding shoot',
    'pre-wedding',
    'pre wedding',
    'shoot',
    'sangeet',
    'reception',
    'roka',
    'haldi',
    'anniversary',
  ];

  // Try matching "<Client> [ki] <event keyword>"
  for (const keyword of eventKeywords) {
    const regex = new RegExp(`^\\s*([a-zA-Z\\s&]+?)\\s+(?:ki\\s+)?${keyword}\\b`, 'i');
    const match = text.match(regex);
    if (match) {
      let rawName = match[1].trim();
      // Clean up leading greetings like "Hi", "Booking for", "New booking:"
      rawName = rawName.replace(/^(?:hi|hello|hey|booking for|new booking|confirming)\s+/i, '').trim();

      if (rawName.length >= 2) {
        const clientNamePhrase = match[1].trim();
        const eventPhrase = match[0].trim();
        const capitalizedEvent =
          keyword.charAt(0).toUpperCase() + keyword.slice(1).toLowerCase();

        return {
          clientName: {
            value: rawName,
            matchedPhrase: clientNamePhrase,
            confidence: 0.85,
          },
          eventName: {
            value: `${rawName} ${capitalizedEvent}`,
            matchedPhrase: eventPhrase,
            confidence: 0.85,
          },
        };
      }
    }
  }

  // Fallback: Name followed by date or comma, e.g. "Rahul 15 Jan", "Anjali, 80k"
  const nameDateMatch = text.match(
    /^\s*([a-zA-Z\s&]{2,30})\s*(?:,|on|\s)\s*(?:\d{1,2}(?:st|nd|rd|th)?\s+[a-zA-Z]+|\d{1,2}[-/]\d{1,2})/i
  );
  if (nameDateMatch) {
    let name = nameDateMatch[1].trim();
    name = name.replace(/^(?:hi|hello|hey|booking for)\s+/i, '').trim();
    if (name.length >= 2) {
      return {
        clientName: {
          value: name,
          matchedPhrase: nameDateMatch[1].trim(),
          confidence: 0.7,
        },
        eventName: {
          value: `${name} Event`,
          matchedPhrase: nameDateMatch[1].trim(),
          confidence: 0.65,
        },
      };
    }
  }

  return { clientName: null, eventName: null };
}

/**
 * Main Deterministic Rules-Based Parser for Quick Add.
 * Evaluates the text and returns a typed QuickAddParseResult.
 */
export function parseQuickAddWithRules(
  text: string,
  todayStr: string
): QuickAddParseResult {
  const sources: Record<string, string> = {};
  const warnings: string[] = [];

  // 1. Client & Event Name
  const { clientName, eventName } = extractClientAndEvent(text);
  if (clientName) {
    sources['clientName'] = clientName.matchedPhrase;
  } else {
    warnings.push('Client name was not detected. Please verify or enter it below.');
  }
  if (eventName) {
    sources['eventName'] = eventName.matchedPhrase;
  }

  // 2. Date
  const dateField = extractDate(text, todayStr);
  if (dateField) {
    sources['eventDate'] = dateField.matchedPhrase;
  } else {
    warnings.push('Event date was not detected. Please select it below.');
  }

  // 3. Amounts (Total vs Advance)
  const amountCandidates = extractAllAmounts(text);
  let totalAmount: number | null = null;
  let advanceAmount: number | null = null;
  let advancePaid = false;
  let advancePaidAmount: number | null = null;

  if (amountCandidates.length === 1) {
    const single = amountCandidates[0];
    if (single.isAdvanceContext) {
      advanceAmount = single.amount;
      sources['advanceAmount'] = single.phrase;
      if (single.isPaidContext) {
        advancePaid = true;
        advancePaidAmount = single.amount;
        sources['advancePaid'] = single.phrase;
      }
      warnings.push('Only an advance amount was detected. Please specify the total booking amount.');
    } else {
      totalAmount = single.amount;
      sources['totalAmount'] = single.phrase;
    }
  } else if (amountCandidates.length >= 2) {
    // Separate by advance context
    const advanceCands = amountCandidates.filter((c) => c.isAdvanceContext);
    const nonAdvanceCands = amountCandidates.filter((c) => !c.isAdvanceContext);

    if (advanceCands.length > 0 && nonAdvanceCands.length > 0) {
      const adv = advanceCands[0];
      const tot = nonAdvanceCands[0];

      advanceAmount = adv.amount;
      sources['advanceAmount'] = adv.phrase;
      if (adv.isPaidContext) {
        advancePaid = true;
        advancePaidAmount = adv.amount;
        sources['advancePaid'] = adv.phrase;
      }

      totalAmount = tot.amount;
      sources['totalAmount'] = tot.phrase;
    } else {
      // If none explicitly tagged as advance, sort by amount: larger is total, smaller is advance if < total
      const sorted = [...amountCandidates].sort((a, b) => b.amount - a.amount);
      totalAmount = sorted[0].amount;
      sources['totalAmount'] = sorted[0].phrase;

      // Check if second looks like advance or paid
      if (sorted[1].isPaidContext || sorted[1].isAdvanceContext) {
        advanceAmount = sorted[1].amount;
        sources['advanceAmount'] = sorted[1].phrase;
        if (sorted[1].isPaidContext) {
          advancePaid = true;
          advancePaidAmount = sorted[1].amount;
          sources['advancePaid'] = sorted[1].phrase;
        }
      }
    }
  } else {
    warnings.push('Total booking amount was not detected. Please enter it below.');
  }

  // Check advance <= total sanity
  if (totalAmount && advanceAmount && advanceAmount > totalAmount) {
    warnings.push('Advance amount cannot exceed total booking amount.');
  }

  // 4. Split Percentages
  const splitField = extractSplitPercents(text);
  let splitPercents: [number, number, number] | null = null;
  if (splitField) {
    splitPercents = splitField.value;
    sources['splitPercents'] = splitField.matchedPhrase;
  }

  // 5. Payment Method
  const payMethodField = extractPaymentMethod(text);
  let paymentMethod: QuickAddPaymentMethod | null = null;
  if (payMethodField) {
    paymentMethod = payMethodField.value;
    sources['paymentMethod'] = payMethodField.matchedPhrase;
  }

  // Compute confidence score
  let score = 0;
  if (clientName) score += 0.3;
  if (dateField) score += 0.3;
  if (totalAmount) score += 0.3;
  if (advanceAmount !== null) score += 0.1;
  const confidence = Math.min(1.0, Math.max(0.1, Number(score.toFixed(2))));

  const parsed: ParsedBooking = {
    clientName: clientName ? clientName.value : null,
    eventName: eventName ? eventName.value : (clientName ? `${clientName.value} Shoot` : null),
    eventDate: dateField ? dateField.value : null,
    totalAmount,
    advanceAmount,
    advancePaid,
    advancePaidAmount,
    paymentMethod,
    splitPercents,
    notes: null,
  };

  return {
    parsed,
    confidence,
    warnings,
    sources,
    source: 'rules',
  };
}
