import { describe, it, expect } from 'vitest';
import { computeRecoveryPlan } from './index';
import { ForecastInput, SAFE_BUFFER_PERCENTAGE } from '../forecast';
import { generateSeedData } from '../db/seed-data';
import { applyScenarios } from '../whatif';

describe('Recovery Plan Engine (lib/recovery)', () => {
  const today = '2026-11-22';
  const openingCash = 100000; // 20% safe buffer = 20,000

  it('no plan needed when healthy (lowest balance >= safe buffer)', () => {
    const input: ForecastInput = {
      today,
      horizonDays: 90,
      openingCash,
      clients: [
        {
          id: 'c1',
          name: 'Healthy Client',
          phone: '+91 90000 00001',
          payment_reliability: 'reliable',
          average_delay_days: 0,
        },
      ],
      invoices: [],
      recurringExpenses: [],
      oneOffExpenses: [{ name: 'Hosting', amount: 10000, date: '2026-11-25' }],
    };

    const plan = computeRecoveryPlan(input);
    expect(plan.needed).toBe(false);
    expect(plan.actions).toHaveLength(0);
    expect(plan.fullyResolved).toBe(true);
    expect(plan.summarySentence).toContain('safe');
  });

  it('orders candidates greedily by largest lowest-balance improvement', () => {
    const input: ForecastInput = {
      today,
      horizonDays: 90,
      openingCash: 50000, // Safe buffer = 10,000
      clients: [
        {
          id: 'c1',
          name: 'Client A',
          phone: '+91 90000 00001',
          payment_reliability: 'average',
          average_delay_days: 0,
        },
        {
          id: 'c2',
          name: 'Client B',
          phone: '+91 90000 00002',
          payment_reliability: 'average',
          average_delay_days: 0,
        },
      ],
      invoices: [
        {
          id: 'inv-small',
          booking_id: 'b1',
          client_id: 'c1',
          milestone_label: 'advance',
          amount: 15000,
          paid_amount: 0,
          due_date: '2026-11-30', // Due on day 8
          sent: true,
        },
        {
          id: 'inv-big',
          booking_id: 'b2',
          client_id: 'c2',
          milestone_label: 'advance',
          amount: 45000,
          paid_amount: 0,
          due_date: '2026-11-30', // Due on day 8
          sent: true,
        },
      ],
      recurringExpenses: [],
      oneOffExpenses: [
        // Outflow causing deficit on day 5 (2026-11-27)
        { name: 'Studio Equipment', amount: 80000, date: '2026-11-27' },
      ],
    };

    const plan = computeRecoveryPlan(input);
    expect(plan.needed).toBe(true);
    expect(plan.actions.length).toBeGreaterThan(0);
    // Big invoice should be picked first because it yields the largest cash boost
    expect(plan.actions[0].invoice.id).toBe('inv-big');
  });

  it('stops greedily once safe buffer is reached', () => {
    const input: ForecastInput = {
      today,
      horizonDays: 90,
      openingCash: 50000, // Safe buffer = 10,000
      clients: [
        {
          id: 'c1',
          name: 'Client 1',
          phone: '+91 90000 00001',
          payment_reliability: 'average',
          average_delay_days: 0,
        },
        {
          id: 'c2',
          name: 'Client 2',
          phone: '+91 90000 00002',
          payment_reliability: 'average',
          average_delay_days: 0,
        },
      ],
      invoices: [
        {
          id: 'inv-1',
          booking_id: 'b1',
          client_id: 'c1',
          milestone_label: 'advance',
          amount: 30000,
          paid_amount: 0,
          due_date: '2026-11-30', // Day 8 (after rent)
          sent: true,
        },
        {
          id: 'inv-2',
          booking_id: 'b2',
          client_id: 'c2',
          milestone_label: 'advance',
          amount: 30000,
          paid_amount: 0,
          due_date: '2026-11-30', // Day 8 (after rent)
          sent: true,
        },
      ],
      recurringExpenses: [],
      oneOffExpenses: [{ name: 'Rent', amount: 55000, date: '2026-11-27' }], // Day 5
    };

    // Deficit: 50k - 55k = -5,000 on 27 Nov. Safe buffer is 10,000.
    // Collecting inv-1 (30k) on 24 Nov raises balance before rent to 80,000 -> ending 25,000 >= 10,000 safe buffer.
    // It should stop at 1 action and not needlessly add inv-2!
    const plan = computeRecoveryPlan(input);
    expect(plan.needed).toBe(true);
    expect(plan.actions).toHaveLength(1);
    expect(plan.fullyResolved).toBe(true);
    expect(plan.resultingLowestBalance).toBeGreaterThanOrEqual(10000);
  });

  it('caps at maximum 5 actions even if deficit remains', () => {
    const clients = Array.from({ length: 8 }, (_, i) => ({
      id: `c${i}`,
      name: `Client ${i}`,
      phone: `+91 90000 0000${i}`,
      payment_reliability: 'average' as const,
      average_delay_days: 0,
    }));

    const invoices = Array.from({ length: 8 }, (_, i) => ({
      id: `inv-${i}`,
      booking_id: `b-${i}`,
      client_id: `c${i}`,
      milestone_label: 'advance' as const,
      amount: 5000,
      paid_amount: 0,
      due_date: '2026-11-30', // Day 8 (after outflow)
      sent: true,
    }));

    const input: ForecastInput = {
      today,
      horizonDays: 90,
      openingCash: 50000,
      clients,
      invoices,
      recurringExpenses: [],
      oneOffExpenses: [{ name: 'Massive Debt', amount: 200000, date: '2026-11-27' }], // Day 5
    };

    const plan = computeRecoveryPlan(input);
    expect(plan.actions.length).toBeLessThanOrEqual(5);
    expect(plan.actions).toHaveLength(5);
    expect(plan.fullyResolved).toBe(false);
  });

  it('tie-breaks by larger balance, then earlier due date', () => {
    const input: ForecastInput = {
      today,
      horizonDays: 90,
      openingCash: 50000,
      clients: [
        { id: 'c1', name: 'Client 1', phone: '+91 90000 00001', payment_reliability: 'average', average_delay_days: 0 },
        { id: 'c2', name: 'Client 2', phone: '+91 90000 00002', payment_reliability: 'average', average_delay_days: 0 },
      ],
      invoices: [
        {
          id: 'inv-later-date',
          booking_id: 'b1',
          client_id: 'c1',
          milestone_label: 'advance',
          amount: 20000,
          paid_amount: 0,
          due_date: '2026-12-02', // Day 10
          sent: true,
        },
        {
          id: 'inv-earlier-date',
          booking_id: 'b2',
          client_id: 'c2',
          milestone_label: 'advance',
          amount: 20000,
          paid_amount: 0,
          due_date: '2026-11-30', // Day 8 (earlier due date wins tie-break)
          sent: true,
        },
      ],
      recurringExpenses: [],
      oneOffExpenses: [{ name: 'Outflow', amount: 65000, date: '2026-11-27' }],
    };

    const plan = computeRecoveryPlan(input);
    expect(plan.actions[0].invoice.id).toBe('inv-earlier-date');
  });

  it('computes expense deferral option (+7 days) when available', () => {
    const input: ForecastInput = {
      today,
      horizonDays: 90,
      openingCash: 30000, // Safe buffer = 6,000
      clients: [
        {
          id: 'c-inflow',
          name: 'Wedding Client',
          phone: '+91 90000 00005',
          payment_reliability: 'reliable',
          average_delay_days: 0,
        },
      ],
      invoices: [
        // Inflow of 25,000 arrives on 2026-11-28 (day 6)
        {
          id: 'inv-inflow',
          booking_id: 'b1',
          client_id: 'c-inflow',
          milestone_label: 'advance',
          amount: 25000,
          paid_amount: 0,
          due_date: '2026-11-28',
          sent: true,
        },
      ],
      recurringExpenses: [],
      oneOffExpenses: [
        // One-off studio equipment payment on 2026-11-25 (day 3) causes shortfall (-5,000)
        // Moving it 7 days later to 2026-12-02 allows 25,000 inflow to arrive first!
        {
          name: 'Studio Equipment',
          amount: 35000,
          date: '2026-11-25',
        },
      ],
    };

    const plan = computeRecoveryPlan(input);
    expect(plan.needed).toBe(true);
    expect(plan.deferral).toBeDefined();
    expect(plan.deferral?.name).toContain('Studio Equipment');
    expect(plan.deferral?.deferredDate).toBe('2026-12-02'); // 25 Nov + 7 days
    expect(plan.deferral?.clearsShortfall).toBe(true);
  });

  it('strictly preserves input objects without mutation', () => {
    const input: ForecastInput = {
      today,
      horizonDays: 90,
      openingCash: 50000,
      clients: [{ id: 'c1', name: 'Client 1', phone: '+91 90000 00001', payment_reliability: 'average', average_delay_days: 5 }],
      invoices: [{ id: 'inv-1', booking_id: 'b1', client_id: 'c1', milestone_label: 'advance', amount: 15000, paid_amount: 0, due_date: '2026-11-10', sent: true }],
      recurringExpenses: [],
      oneOffExpenses: [{ name: 'Expense', amount: 70000, date: '2026-11-25' }],
    };

    const snapshot = JSON.stringify(input);
    computeRecoveryPlan(input);
    expect(JSON.stringify(input)).toBe(snapshot);
  });

  it('demo case: with Mehta-late scenario, recovery plan includes Mehta overdue invoice and raises balance', () => {
    const seed = generateSeedData(today);
    const mehtaClient = seed.clients.find((c) => c.name.toLowerCase().includes('mehta'))!;
    expect(mehtaClient).toBeDefined();

    const baseInput: ForecastInput = {
      today,
      horizonDays: 90,
      openingCash: seed.settings.opening_cash_balance,
      clients: seed.clients,
      invoices: seed.invoices,
      recurringExpenses: seed.recurringExpenses,
      oneOffExpenses: [],
    };

    // Apply Mehta late scenario (Mehta delayed past window)
    const stressedInput = applyScenarios(baseInput, [
      { type: 'clientLate', clientId: mehtaClient.id, extraDays: 25 },
    ]);

    const plan = computeRecoveryPlan(stressedInput);
    expect(plan.needed).toBe(true);
    expect(plan.actions.length).toBeGreaterThan(0);

    // The top action should target Mehta's overdue milestone invoice
    const mehtaOverdueAction = plan.actions.find(
      (a) => a.invoice.client_id === mehtaClient.id && a.isOverdue
    );
    expect(mehtaOverdueAction).toBeDefined();
    expect(mehtaOverdueAction?.invoice.amount - mehtaOverdueAction?.invoice.paid_amount).toBe(35000);
    expect(plan.resultingLowestBalance).toBeGreaterThan(plan.initialLowestBalance);
  });
});
