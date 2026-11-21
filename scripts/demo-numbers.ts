import { generateSeedData } from '../lib/db/seed-data';
import { getIndiaTodayStr } from '../lib/date';
import { deriveInvoiceStatus } from '../lib/invoice-status';
import { computeCashForecast } from '../lib/forecast';
import { rankBadDayActions } from '../lib/ranking';
import { applyScenarios } from '../lib/whatif';
import { parseQuickAddWithRules } from '../lib/quickadd/rules';
import { formatINR } from '../lib/money';

export function getDemoNumbers() {
  const today = getIndiaTodayStr();
  const seed = generateSeedData(today);

  // Total outstanding & overdue
  let totalOutstanding = 0;
  let totalOverdue = 0;

  for (const inv of seed.invoices) {
    const balance = inv.amount - inv.paid_amount;
    const status = deriveInvoiceStatus({
      dueDate: inv.due_date,
      balance,
      totalAmount: inv.amount,
      today,
    });
    if (balance > 0) {
      totalOutstanding += balance;
      if (status === 'overdue') {
        totalOverdue += balance;
      }
    }
  }

  // Bad Day ranking
  const forecastInput = {
    today,
    horizonDays: 90 as const,
    openingCash: seed.settings.opening_cash_balance,
    invoices: seed.invoices,
    clients: seed.clients,
    recurringExpenses: seed.recurringExpenses,
    oneOffExpenses: [],
  };

  const badDaySummary = rankBadDayActions(forecastInput);
  const topAction = badDaySummary.topRanked[0];

  // Baseline forecast
  const baselineForecast = computeCashForecast(forecastInput);
  const baselineLowest = baselineForecast.summary.lowestBalance;
  const baselineLowestDate = baselineForecast.summary.lowestBalanceDate;

  // Mehta late preset (Rohit Mehta delayed by 20 days as in URL preset, or 15 days in UI chip)
  const mehtaClient = seed.clients.find((c) =>
    c.name.toLowerCase().includes('mehta')
  )!;

  const whatIfInput = applyScenarios(forecastInput, [
    { type: 'clientLate', clientId: mehtaClient.id, extraDays: 20 },
  ]);
  const mehtaLateForecast = computeCashForecast(whatIfInput);
  const mehtaLowest = mehtaLateForecast.summary.lowestBalance;
  const mehtaLowestDate = mehtaLateForecast.summary.lowestBalanceDate;

  // Quick Add examples
  const example1 = parseQuickAddWithRules('Sharma wedding 14 Dec, ₹80k, ₹25k advance paid', today);
  const example2 = parseQuickAddWithRules('Priya & Karan engagement 2 Jan 45000 advance 10000 via UPI', today);
  const example3 = parseQuickAddWithRules('Verma ji ki shaadi 20 feb, 1.2 lakh, 30000 advance mil gaya', today);

  return {
    today,
    openingCash: seed.settings.opening_cash_balance,
    totalOutstanding,
    totalOverdue,
    topBadDay: {
      clientName: topAction?.client.name,
      amount: topAction?.balance,
      daysOverdue: topAction?.daysOverdue,
      dueDate: topAction?.invoice.due_date,
      reason: topAction?.oneLineReason,
    },
    forecast: {
      baselineLowest,
      baselineLowestDate,
      mehtaLowest,
      mehtaLowestDate,
      difference: mehtaLowest - baselineLowest,
    },
    quickAdd: [
      { text: 'Sharma wedding 14 Dec, ₹80k, ₹25k advance paid', total: example1.parsed.totalAmount, advance: example1.parsed.advanceAmount },
      { text: 'Priya & Karan engagement 2 Jan 45000 advance 10000 via UPI', total: example2.parsed.totalAmount, advance: example2.parsed.advanceAmount },
      { text: 'Verma ji ki shaadi 20 feb, 1.2 lakh, 30000 advance mil gaya', total: example3.parsed.totalAmount, advance: example3.parsed.advanceAmount },
    ],
  };
}

if (require.main === module) {
  const numbers = getDemoNumbers();
  console.log('=== PAYDAY DEMO NUMBERS (Today: ' + numbers.today + ') ===\n');
  console.log(`Opening Cash: ${formatINR(numbers.openingCash)}`);
  console.log(`Total Outstanding: ${formatINR(numbers.totalOutstanding)}`);
  console.log(`Total Overdue: ${formatINR(numbers.totalOverdue)}\n`);

  console.log('--- Top Bad Day Candidate ---');
  console.log(`Client: ${numbers.topBadDay.clientName}`);
  console.log(`Amount: ${formatINR(numbers.topBadDay.amount || 0)}`);
  console.log(`Days Overdue: ${numbers.topBadDay.daysOverdue} days`);
  console.log(`Reason: ${numbers.topBadDay.reason}\n`);

  console.log('--- 90-Day Cash Forecast ---');
  console.log(`Baseline Lowest Balance: ${formatINR(numbers.forecast.baselineLowest)} (${numbers.forecast.baselineLowestDate})`);
  console.log(`After Mehta Late (20d): ${formatINR(numbers.forecast.mehtaLowest)} (${numbers.forecast.mehtaLowestDate})`);
  console.log(`Impact / Dip: ${formatINR(numbers.forecast.difference)}\n`);

  console.log('--- Quick Add Examples ---');
  for (const ex of numbers.quickAdd) {
    console.log(`"${ex.text}"`);
    console.log(`  -> Total: ${formatINR(ex.total || 0)}, Advance: ${formatINR(ex.advance || 0)}`);
  }
}
