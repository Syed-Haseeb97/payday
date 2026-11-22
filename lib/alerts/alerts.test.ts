import { describe, it, expect } from 'vitest';
import { deriveAlerts, GeneratedAlert } from './index';
import { Client, Invoice, RecurringExpense } from '../db/types';
import { ForecastInput } from '../forecast';

describe('Payday Alerts Engine', () => {
  const baseClients: Client[] = [
    {
      id: 'c-reliable',
      user_id: 'u1',
      name: 'Reliable Client',
      payment_reliability: 'reliable',
      average_delay_days: 1,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
    {
      id: 'c-slow',
      user_id: 'u1',
      name: 'Slow Client',
      payment_reliability: 'slow',
      average_delay_days: 12,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
    {
      id: 'c-unreliable',
      user_id: 'u1',
      name: 'Unreliable Client',
      payment_reliability: 'unreliable',
      average_delay_days: 20,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
  ];

  it('triggers Rule 1: warning for invoice 1-7 days overdue', () => {
    const input: ForecastInput = {
      today: '2026-05-10',
      horizonDays: 90,
      openingCash: 200000,
      invoices: [
        {
          id: 'inv-1',
          booking_id: 'b1',
          client_id: 'c-reliable',
          user_id: 'u1',
          invoice_number: 'INV-1',
          milestone_label: 'Advance',
          amount: 25000,
          paid_amount: 0,
          due_date: '2026-05-06', // 4 days overdue
          status: 'overdue',
          created_at: '2026-04-01',
          updated_at: '2026-04-01',
          sent: true,
        },
      ],
      clients: baseClients,
      recurringExpenses: [],
    };

    const alerts = deriveAlerts(input);
    const rule1 = alerts.find((a) => a.ruleName === 'overdue_1_7');
    expect(rule1).toBeDefined();
    expect(rule1?.severity).toBe('warning');
    expect(rule1?.action.type).toBe('reminder');
    expect(rule1?.action.label).toBe('Send reminder');
    expect(rule1?.action.params?.invoiceId).toBe('inv-1');
    expect(rule1?.id).toBe('overdue_1_7_inv-1');
  });

  it('triggers Rule 2: critical for invoice 8+ days overdue', () => {
    const input: ForecastInput = {
      today: '2026-05-10',
      horizonDays: 90,
      openingCash: 200000,
      invoices: [
        {
          id: 'inv-2',
          booking_id: 'b1',
          client_id: 'c-slow',
          user_id: 'u1',
          invoice_number: 'INV-2',
          milestone_label: 'Mid',
          amount: 35000,
          paid_amount: 0,
          due_date: '2026-04-28', // 12 days overdue
          status: 'overdue',
          created_at: '2026-04-01',
          updated_at: '2026-04-01',
          sent: true,
        },
      ],
      clients: baseClients,
      recurringExpenses: [],
    };

    const alerts = deriveAlerts(input);
    const rule2 = alerts.find((a) => a.ruleName === 'overdue_8_plus');
    expect(rule2).toBeDefined();
    expect(rule2?.severity).toBe('critical');
    expect(rule2?.action.type).toBe('reminder');
    expect(rule2?.id).toBe('overdue_8_plus_inv-2');
  });

  it('triggers Rule 3: info heads-up for invoice due in <= 3 days from slow payer', () => {
    const input: ForecastInput = {
      today: '2026-05-10',
      horizonDays: 90,
      openingCash: 200000,
      invoices: [
        {
          id: 'inv-3',
          booking_id: 'b1',
          client_id: 'c-slow',
          user_id: 'u1',
          invoice_number: 'INV-3',
          milestone_label: 'Final',
          amount: 20000,
          paid_amount: 0,
          due_date: '2026-05-12', // 2 days in future
          status: 'sent',
          created_at: '2026-04-01',
          updated_at: '2026-04-01',
          sent: true,
        },
      ],
      clients: baseClients,
      recurringExpenses: [],
    };

    const alerts = deriveAlerts(input);
    const rule3 = alerts.find((a) => a.ruleName === 'slow_due_soon');
    expect(rule3).toBeDefined();
    expect(rule3?.severity).toBe('info');
    expect(rule3?.action.type).toBe('heads_up');
    expect(rule3?.action.label).toBe('Send heads-up');
  });

  it('triggers Rule 6: info heads-up when single invoice > 30% of opening cash is due in <= 14 days', () => {
    const input: ForecastInput = {
      today: '2026-05-10',
      horizonDays: 90,
      openingCash: 100000, // 30% is 30,000
      invoices: [
        {
          id: 'inv-large',
          booking_id: 'b1',
          client_id: 'c-reliable', // Even if reliable
          user_id: 'u1',
          invoice_number: 'INV-LARGE',
          milestone_label: 'Final',
          amount: 50000, // 50,000 > 30,000
          paid_amount: 0,
          due_date: '2026-05-20', // 10 days in future <= 14 days
          status: 'sent',
          created_at: '2026-04-01',
          updated_at: '2026-04-01',
          sent: true,
        },
      ],
      clients: baseClients,
      recurringExpenses: [],
    };

    const alerts = deriveAlerts(input);
    const rule6 = alerts.find((a) => a.ruleName === 'large_due_soon');
    expect(rule6).toBeDefined();
    expect(rule6?.severity).toBe('info');
    expect(rule6?.action.type).toBe('heads_up');
    expect(rule6?.id).toBe('large_due_soon_inv-large');
  });

  it('triggers Rule 4: critical when cash forecast drops below zero', () => {
    const input: ForecastInput = {
      today: '2026-05-01',
      horizonDays: 90,
      openingCash: 20000,
      invoices: [],
      clients: baseClients,
      recurringExpenses: [
        {
          id: 'rent',
          user_id: 'u1',
          name: 'Studio Rent',
          amount: 35000,
          frequency: 'monthly',
          category: 'rent',
          next_due_date: '2026-05-05',
          is_active: true,
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
        },
      ],
    };

    const alerts = deriveAlerts(input);
    const rule4 = alerts.find((a) => a.ruleName === 'forecast_below_zero');
    expect(rule4).toBeDefined();
    expect(rule4?.severity).toBe('critical');
    expect(rule4?.action.type).toBe('link');
    expect(rule4?.action.label).toBe('See what-if');
    expect(rule4?.action.href).toBe('/forecast#recovery-plan');
  });

  it('triggers Rule 5: warning when cash forecast is tight (positive but below 20% buffer)', () => {
    const input: ForecastInput = {
      today: '2026-05-01',
      horizonDays: 90,
      openingCash: 100000, // 20% safe buffer is 20,000
      invoices: [],
      clients: baseClients,
      recurringExpenses: [
        {
          id: 'rent',
          user_id: 'u1',
          name: 'Annual Studio Maintenance',
          amount: 85000, // leaves 15,000 (positive, but < 20,000)
          frequency: 'yearly',
          category: 'rent',
          next_due_date: '2026-05-05',
          is_active: true,
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
        },
      ],
    };

    const alerts = deriveAlerts(input);
    const rule5 = alerts.find((a) => a.ruleName === 'forecast_tight');
    expect(rule5).toBeDefined();
    expect(rule5?.severity).toBe('warning');
    expect(rule5?.action.type).toBe('link');
    expect(rule5?.action.href).toBe('/forecast');
  });

  it('filters out dismissed alerts and actively snoozed alerts', () => {
    const input: ForecastInput = {
      today: '2026-05-10',
      horizonDays: 90,
      openingCash: 200000,
      invoices: [
        {
          id: 'inv-dismissed',
          booking_id: 'b1',
          client_id: 'c-slow',
          user_id: 'u1',
          invoice_number: 'INV-D',
          milestone_label: 'Mid',
          amount: 35000,
          paid_amount: 0,
          due_date: '2026-04-28', // 12 days overdue
          status: 'overdue',
          created_at: '2026-04-01',
          updated_at: '2026-04-01',
          sent: true,
        },
        {
          id: 'inv-snoozed',
          booking_id: 'b2',
          client_id: 'c-reliable',
          user_id: 'u1',
          invoice_number: 'INV-S',
          milestone_label: 'Advance',
          amount: 25000,
          paid_amount: 0,
          due_date: '2026-05-06', // 4 days overdue
          status: 'overdue',
          created_at: '2026-04-01',
          updated_at: '2026-04-01',
          sent: true,
        },
        {
          id: 'inv-active',
          booking_id: 'b3',
          client_id: 'c-reliable',
          user_id: 'u1',
          invoice_number: 'INV-A',
          milestone_label: 'Advance',
          amount: 15000,
          paid_amount: 0,
          due_date: '2026-05-05', // 5 days overdue
          status: 'overdue',
          created_at: '2026-04-01',
          updated_at: '2026-04-01',
          sent: true,
        },
      ],
      clients: baseClients,
      recurringExpenses: [],
    };

    const dismissedIds = new Set(['overdue_8_plus_inv-dismissed']);
    const snoozedUntilMap = new Map<string, string>();
    // Snoozed until tomorrow relative to nowIso 2026-05-10T12:00:00Z
    snoozedUntilMap.set('overdue_1_7_inv-snoozed', '2026-05-11T12:00:00.000Z');

    const alerts = deriveAlerts(input, {
      dismissedIds,
      snoozedUntilMap,
      nowIso: '2026-05-10T12:00:00.000Z',
    });

    const dismissedFound = alerts.find((a) => a.id === 'overdue_8_plus_inv-dismissed');
    const snoozedFound = alerts.find((a) => a.id === 'overdue_1_7_inv-snoozed');
    const activeFound = alerts.find((a) => a.id === 'overdue_1_7_inv-active');

    expect(dismissedFound).toBeUndefined();
    expect(snoozedFound).toBeUndefined();
    expect(activeFound).toBeDefined();
  });

  it('orders alerts strictly: critical > warning > info', () => {
    const input: ForecastInput = {
      today: '2026-05-10',
      horizonDays: 90,
      openingCash: 100000,
      invoices: [
        {
          id: 'inv-info',
          booking_id: 'b1',
          client_id: 'c-slow',
          user_id: 'u1',
          invoice_number: 'INV-INFO',
          milestone_label: 'Final',
          amount: 20000,
          paid_amount: 0,
          due_date: '2026-05-12', // 2 days in future -> info
          status: 'sent',
          created_at: '2026-04-01',
          updated_at: '2026-04-01',
          sent: true,
        },
        {
          id: 'inv-warn',
          booking_id: 'b2',
          client_id: 'c-reliable',
          user_id: 'u1',
          invoice_number: 'INV-WARN',
          milestone_label: 'Advance',
          amount: 25000,
          paid_amount: 0,
          due_date: '2026-05-06', // 4 days overdue -> warning
          status: 'overdue',
          created_at: '2026-04-01',
          updated_at: '2026-04-01',
          sent: true,
        },
        {
          id: 'inv-crit',
          booking_id: 'b3',
          client_id: 'c-slow',
          user_id: 'u1',
          invoice_number: 'INV-CRIT',
          milestone_label: 'Mid',
          amount: 35000,
          paid_amount: 0,
          due_date: '2026-04-28', // 12 days overdue -> critical
          status: 'overdue',
          created_at: '2026-04-01',
          updated_at: '2026-04-01',
          sent: true,
        },
      ],
      clients: baseClients,
      recurringExpenses: [],
    };

    const alerts = deriveAlerts(input);
    expect(alerts.length).toBeGreaterThanOrEqual(3);

    const severityOrder = alerts.map((a) => a.severity);
    const criticalIndices = severityOrder.map((s, idx) => (s === 'critical' ? idx : -1)).filter((i) => i !== -1);
    const warningIndices = severityOrder.map((s, idx) => (s === 'warning' ? idx : -1)).filter((i) => i !== -1);
    const infoIndices = severityOrder.map((s, idx) => (s === 'info' ? idx : -1)).filter((i) => i !== -1);

    if (criticalIndices.length > 0 && warningIndices.length > 0) {
      expect(Math.max(...criticalIndices)).toBeLessThan(Math.min(...warningIndices));
    }
    if (warningIndices.length > 0 && infoIndices.length > 0) {
      expect(Math.max(...warningIndices)).toBeLessThan(Math.min(...infoIndices));
    }
  });

  it('every generated alert has a valid typed action with a non-empty label', () => {
    const input: ForecastInput = {
      today: '2026-05-10',
      horizonDays: 90,
      openingCash: 50000,
      invoices: [
        {
          id: 'inv-1',
          booking_id: 'b1',
          client_id: 'c-slow',
          user_id: 'u1',
          invoice_number: 'INV-1',
          milestone_label: 'Mid',
          amount: 35000,
          paid_amount: 0,
          due_date: '2026-04-28',
          status: 'overdue',
          created_at: '2026-04-01',
          updated_at: '2026-04-01',
          sent: true,
        },
      ],
      clients: baseClients,
      recurringExpenses: [],
    };

    const alerts = deriveAlerts(input);
    for (const alert of alerts) {
      expect(['reminder', 'heads_up', 'link']).toContain(alert.action.type);
      expect(alert.action.label.length).toBeGreaterThan(0);
      expect(alert.title.length).toBeGreaterThan(0);
      expect(alert.message.length).toBeGreaterThan(0);
    }
  });
});
