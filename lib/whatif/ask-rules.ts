// Deterministic Rules-Based Parser for Ask Payday What-If Questions
// Pure functions, zero AI dependencies, zero clock reads (always takes `todayStr`).

import { AskScenarioCandidate } from './ask-types';
import { parseRupeeAmount, extractDate } from '../quickadd/rules';

/**
 * Splits compound sentences into clauses:
 * "What if Mehta pays 3 weeks late and I buy a ₹90k lens on 5 Dec?" ->
 * ["Mehta pays 3 weeks late", "I buy a ₹90k lens on 5 Dec"]
 */
export function splitQuestionClauses(text: string): string[] {
  let cleaned = text.trim();
  // Strip leading "what if", "agar", "suppose", "kya hoga agar", etc.
  cleaned = cleaned.replace(/^(?:what\s+if|agar|suppose|kya\s+hoga\s+agar|imagine)\s+/i, '');
  cleaned = cleaned.replace(/[?]+$/, '').trim();

  // Split on " and ", " & ", " aur ", commas or semicolons
  const rawParts = cleaned.split(/\s+(?:and|aur|&)\s+|[;,]/i);
  return rawParts.map((p) => p.trim()).filter((p) => p.length > 0);
}

/**
 * Parses a single clause into a candidate what-if scenario.
 */
export function parseSingleClause(clause: string, todayStr: string): AskScenarioCandidate | null {
  const text = clause.trim();
  if (!text) return null;

  // 1. Pattern: Client Late
  // e.g. "Mehta pays 3 weeks late", "Sharma pays 15 days late", "Mehta delays by 2 weeks"
  const lateMatch = text.match(
    /\b([a-zA-Z\s]+?)\s+(?:pays?|pay\s+karega|dega|delays?|delayed)\s*(?:by\s*)?(\d+)\s*(days?|din|weeks?|hafte|hafta)\s*(?:late|delayed)?/i
  );
  if (lateMatch) {
    const rawClient = lateMatch[1].replace(/^(?:what\s+if|if|that)\s+/i, '').trim();
    const count = parseInt(lateMatch[2], 10);
    const unit = lateMatch[3].toLowerCase();
    const isWeeks = unit.startsWith('week') || unit.startsWith('haft');
    const extraDays = Math.min(90, Math.max(1, count * (isWeeks ? 7 : 1)));

    if (rawClient && !isNaN(extraDays)) {
      return {
        type: 'clientLate',
        clientText: rawClient,
        extraDays,
      };
    }
  }

  // 2. Pattern: Lose / Cancel Booking
  // e.g. "I lose the Sharma winter booking", "cancel Sharma booking", "lose Verma wedding"
  const loseMatch = text.match(
    /\b(?:lose|loses?|cancel|cancels?|cancelled|drop|drops?)\s*(?:the\s*)?(.+?)(?:\s+booking|\s+event|\s+shoot|\s+wedding|\s*$)/i
  );
  if (loseMatch && !text.includes('pays') && !text.includes('buy')) {
    const rawBooking = loseMatch[1]
      .replace(/^(?:the|my|a|an)\s+/i, '')
      .replace(/\s+(?:is|will\s+be)\s*$/i, '')
      .trim();
    if (rawBooking.length >= 2) {
      return {
        type: 'loseBooking',
        bookingText: rawBooking,
      };
    }
  }

  // 3. Pattern: Invoice Paid Early / Pays Tomorrow
  // e.g. "Rohit pays his overdue invoice tomorrow", "Mehta pays tomorrow", "Rohit pays on 15 Dec"
  const earlyMatch = text.match(
    /\b([a-zA-Z\s]+?)\s+(?:pays?|pay\s+karega|settles?|clears?)\s*(?:his|her|their)?\s*(?:overdue\s*)?(?:invoice|bill|amount|dues|payment)?\s*(?:on|by|at)?\s*(tomorrow|today|\d{1,2}(?:st|nd|rd|th)?\s+[a-zA-Z]+|\d{4}-\d{2}-\d{2}|\d{1,2}[-/]\d{1,2}(?:[-/]\d{2,4})?)\b/i
  );
  if (earlyMatch && !text.includes('late')) {
    const rawClient = earlyMatch[1].replace(/^(?:what\s+if|if|that)\s+/i, '').trim();
    const datePhrase = earlyMatch[2].trim();
    const extractedDate = extractDate(datePhrase, todayStr);
    if (rawClient && extractedDate) {
      return {
        type: 'invoicePaidEarly',
        clientText: rawClient,
        date: extractedDate.value,
      };
    }
  }

  // 4. Pattern: Add Expense / Buy Item
  // e.g. "I buy a ₹90k lens on 5 Dec", "buy 90k lens 5 Dec", "₹30,000 repair on 10 Dec", "expense 20000 on 15 Dec"
  const extractedDate = extractDate(text, todayStr);
  const amountMatch = text.match(/(?:(?:rs\.?|inr|₹)\s*)?(?:\d+(?:\.\d+)?\s*(?:lakh|lakhs|lac|lacs|k)\b|\d[\d,]*(?:\.\d+)?)/i);
  if (amountMatch) {
    const amount = parseRupeeAmount(amountMatch[0]);
    if (amount !== null && amount > 0) {
      // Check if it describes a purchase or expense
      const isExpenseContext = /\b(?:buy|bought|purchase|purchased|expense|spend|spending|repair|lens|camera|laptop|gear|studio|rent)\b/i.test(text);
      if (isExpenseContext) {
        // Extract item name
        let name = text
          .replace(/^(?:i\s+|we\s+)?(?:buy|purchase|spend|spent|expense|paying\s+for)\s*(?:a|an)?\s*/i, '')
          .replace(/(?:(?:rs\.?|inr|₹)\s*)?(?:\d+(?:\.\d+)?\s*(?:lakh|lakhs|lac|lacs|k)\b|\d[\d,]*(?:\.\d+)?)/gi, '')
          .replace(/\b(?:on|by|at)\s+(?:tomorrow|today|\d{1,2}(?:st|nd|rd|th)?\s+[a-zA-Z]+|\d{4}-\d{2}-\d{2}|\d{1,2}[-/]\d{1,2}(?:[-/]\d{2,4})?)\b/gi, '')
          .trim();

        if (!name || name.length < 2) {
          name = 'Equipment / Expense';
        } else {
          // Capitalize first letter
          name = name.charAt(0).toUpperCase() + name.slice(1);
        }

        const date = extractedDate ? extractedDate.value : todayStr;
        return {
          type: 'addExpense',
          name,
          amount: Math.min(5000000, amount),
          date,
        };
      }
    }
  }

  return null;
}

/**
 * Parses a full user question into candidate scenarios using deterministic rules.
 */
export function parseAskWithRules(text: string, todayStr: string): AskScenarioCandidate[] {
  const clauses = splitQuestionClauses(text);
  const scenarios: AskScenarioCandidate[] = [];

  for (const clause of clauses) {
    const parsed = parseSingleClause(clause, todayStr);
    if (parsed) {
      scenarios.push(parsed);
      if (scenarios.length >= 5) break;
    }
  }

  return scenarios;
}
