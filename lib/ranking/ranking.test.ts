import { describe, it, expect } from 'vitest';
import {
  rankBadDayActions,
  getClientUnreliability,
  W_IMPACT,
  W_URGENCY,
  W_UNRELIABILITY,
  BadDayRankedItem,
} from './index';
import { Client, Invoice, RecurringExpense } from '../db/types';
import { ForecastInput } from '../forecast';
import { generateSeedData } from '../db/seed-data';
import { format } from 'date-fns';

describe('Bad Day Ranking Engine', () => {
  const mockClients: Client[] = [
    {
      id: 'c1',
      user_id: 'u1',
      name: 'Client Alpha (Reliable)',
      payment_reliability: 'reliable',
      average_delay_days: 1,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
    {
      id: 'c2',
      user_id: 'u1',
      name: 'Client Beta (Slow)',
      payment_reliability: 'slow',
      average_delay_days: 12,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
    {
      id: 'c3',
      user_id: 'u1',
      name: 'Client Gamma (Unreliable)',
      payment_reliability: 'unreliable',
      average_delay_days: 18,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
  ];

  const mockExpenses: RecurringExpense[] = [
    {
      id: 'e1',
      user_id: 'u1',
      name: 'Studio Rent',
      amount: 40000,
      frequency: 'monthly',
      category: 'rent',
      next_due_date: '2026-05-05',
      is_active: true,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
  ];

  it('correctly maps client reliability to unreliability factor', () => {
    expect(getClientUnreliability('reliable')).toBe(0.0);
    expect(getClientUnreliability('average')).toBe(0.3);
    expect(getClientUnreliability('new')).toBe(0.5);
    expect(getClientUnreliability('slow')).toBe(0.6);
    expect(getClientUnreliability('unreliable')).toBe(0.9);
  });

  it('weights sum to 1.0', () => {
    expect(W_IMPACT + W_URGENCY + W_UNRELIABILITY).toBe(1.0);
  });

  it('returns empty rankings when there are no candidates', () => {
    const input: ForecastInput = {
      today: '2026-05-01',
      horizonDays: 90,
      openingCash: 100000,
      invoices: [],
      clients: mockClients,
      recurringExpenses: mockExpenses,
    };

    const summary = rankBadDayActions(input);
    expect(summary.topRanked).toHaveLength(0);
    expect(summary.alsoOnList).toHaveLength(0);
    expect(summary.allRanked).toHaveLength(0);
    expect(summary.combinedCashImpact).toBe(0);
    expect(summary.lowestBalanceWith).toBe(summary.lowestBalanceWithout);
  });

  it('correctly labels overdue as "chase" and upcoming <= 10d as "heads_up"', () => {
    const invoices: Invoice[] = [
      {
        id: 'inv-overdue',
        booking_id: 'b1',
        client_id: 'c2',
        user_id: 'u1',
        invoice_number: 'INV-101',
        milestone_label: 'Mid Milestone',
        amount: 30000,
        paid_amount: 0,
        due_date: '2026-04-25', // 6 days overdue relative to 2026-05-01
        status: 'overdue',
        created_at: '2026-04-01',
        updated_at: '2026-04-01',
        sent: true,
      },
      {
        id: 'inv-upcoming',
        booking_id: 'b2',
        client_id: 'c2',
        user_id: 'u1',
        invoice_number: 'INV-102',
        milestone_label: 'Final Milestone',
        amount: 50000,
        paid_amount: 0,
        due_date: '2026-05-08', // 7 days in future <= 10 days
        status: 'sent',
        created_at: '2026-04-01',
        updated_at: '2026-04-01',
        sent: true,
      },
      {
        id: 'inv-far-future',
        booking_id: 'b3',
        client_id: 'c2',
        user_id: 'u1',
        invoice_number: 'INV-103',
        milestone_label: 'Final Milestone Far',
        amount: 50000,
        paid_amount: 0,
        due_date: '2026-06-01', // 31 days in future > 10 days
        status: 'sent',
        created_at: '2026-04-01',
        updated_at: '2026-04-01',
        sent: true,
      },
    ];

    const input: ForecastInput = {
      today: '2026-05-01',
      horizonDays: 90,
      openingCash: 100000,
      invoices,
      clients: mockClients,
      recurringExpenses: mockExpenses,
    };

    const summary = rankBadDayActions(input);
    expect(summary.allRanked).toHaveLength(2); // inv-far-future excluded (>10d)
    const overdueItem = summary.allRanked.find((i: BadDayRankedItem) => i.id === 'inv-overdue');
    const upcomingItem = summary.allRanked.find((i: BadDayRankedItem) => i.id === 'inv-upcoming');

    expect(overdueItem?.actionType).toBe('chase');
    expect(overdueItem?.daysOverdue).toBe(6);
    expect(upcomingItem?.actionType).toBe('heads_up');
    expect(upcomingItem?.daysUntilDue).toBe(7);
  });

  it('breaks ties by larger balance, then earlier due date', () => {
    // Both 5 days overdue from same client reliability, but different balances
    const invoices: Invoice[] = [
      {
        id: 'inv-smaller',
        booking_id: 'b1',
        client_id: 'c1',
        user_id: 'u1',
        invoice_number: 'INV-001',
        milestone_label: 'Mid',
        amount: 20000,
        paid_amount: 0,
        due_date: '2026-04-26',
        status: 'overdue',
        created_at: '2026-04-01',
        updated_at: '2026-04-01',
        sent: true,
      },
      {
        id: 'inv-larger',
        booking_id: 'b2',
        client_id: 'c1',
        user_id: 'u1',
        invoice_number: 'INV-002',
        milestone_label: 'Mid',
        amount: 60000,
        paid_amount: 0,
        due_date: '2026-04-26',
        status: 'overdue',
        created_at: '2026-04-01',
        updated_at: '2026-04-01',
        sent: true,
      },
    ];

    const input: ForecastInput = {
      today: '2026-05-01',
      horizonDays: 90,
      openingCash: 100000,
      invoices,
      clients: mockClients,
      recurringExpenses: mockExpenses,
    };

    const summary = rankBadDayActions(input);
    expect(summary.topRanked[0].id).toBe('inv-larger');
  });

  it('satisfies the product demo requirement on seeded dataset', () => {
    const seed = generateSeedData();
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const input: ForecastInput = {
      today: todayStr,
      horizonDays: 90,
      openingCash: seed.settings.opening_cash_balance,
      invoices: seed.invoices,
      clients: seed.clients,
      recurringExpenses: seed.recurringExpenses,
    };

    const summary = rankBadDayActions(input);

    // 1. Top-ranked item must be a Mehta Weddings invoice
    expect(summary.topRanked.length).toBeGreaterThan(0);
    const topItem = summary.topRanked[0];
    expect(topItem.client.name).toContain('Mehta Weddings');

    // 2. Mehta Weddings final milestone (Rs 95,000) appears in candidates as heads_up
    const mehtaFinal = summary.allRanked.find(
      (item: BadDayRankedItem) => item.client.name.includes('Mehta Weddings') && item.invoice.amount === 95000
    );
    expect(mehtaFinal).toBeDefined();
    expect(mehtaFinal?.actionType).toBe('heads_up');

    // 3. Combined cash impact is positive and lifts the lowest balance
    expect(summary.combinedCashImpact).toBeGreaterThan(0);
    expect(summary.lowestBalanceWith).toBeGreaterThan(summary.lowestBalanceWithout);
  });
});
