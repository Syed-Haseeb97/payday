import { describe, it, expect } from 'vitest';
import {
  applyScenarios,
  compareForecasts,
  whatIfScenarioSchema,
  WhatIfScenario,
} from './index';
import { computeCashForecast, ForecastInput, addDays } from '../forecast';
import { Client, Invoice, RecurringExpense } from '../db/types';

describe('What-If Engine - Zod Schema Validation', () => {
  it('validates clientLate scenario', () => {
    const valid = { type: 'clientLate', clientId: 'c123', extraDays: 15 };
    expect(whatIfScenarioSchema.parse(valid)).toEqual(valid);

    expect(() =>
      whatIfScenarioSchema.parse({ type: 'clientLate', clientId: '', extraDays: 10 })
    ).toThrow();
    expect(() =>
      whatIfScenarioSchema.parse({ type: 'clientLate', clientId: 'c1', extraDays: 0 })
    ).toThrow();
  });

  it('validates loseBooking scenario', () => {
    const valid = { type: 'loseBooking', bookingId: 'b999' };
    expect(whatIfScenarioSchema.parse(valid)).toEqual(valid);

    expect(() =>
      whatIfScenarioSchema.parse({ type: 'loseBooking', bookingId: '' })
    ).toThrow();
  });

  it('validates addExpense scenario', () => {
    const valid = {
      type: 'addExpense',
      name: 'Drone Repair',
      amount: 15000,
      date: '2026-12-05',
    };
    expect(whatIfScenarioSchema.parse(valid)).toEqual(valid);

    expect(() =>
      whatIfScenarioSchema.parse({ ...valid, amount: -500 })
    ).toThrow();
    expect(() =>
      whatIfScenarioSchema.parse({ ...valid, date: 'not-a-date' })
    ).toThrow();
  });

  it('validates invoicePaidEarly scenario', () => {
    const valid = {
      type: 'invoicePaidEarly',
      invoiceId: 'inv-1',
      newDate: '2026-11-25',
    };
    expect(whatIfScenarioSchema.parse(valid)).toEqual(valid);
  });
});

describe('What-If Engine - Immutability & Stacking', () => {
  const today = '2026-11-20';

  const baseClient: Client = {
    id: 'c1',
    user_id: 'u1',
    name: 'Rohit Mehta',
    phone: '+91 90000 00001',
    email: null,
    payment_reliability: 'slow',
    average_delay_days: 10,
    notes: null,
    created_at: '',
    updated_at: '',
  };

  const invoice1: Invoice = {
    id: 'inv-1',
    user_id: 'u1',
    booking_id: 'b1',
    client_id: 'c1',
    invoice_number: 'INV-001',
    milestone_label: 'mid',
    amount: 50000,
    paid_amount: 0,
    due_date: '2026-11-25',
    sent: true,
    status: 'sent',
    created_at: '',
    updated_at: '',
  };

  const invoice2: Invoice = {
    id: 'inv-2',
    user_id: 'u1',
    booking_id: 'b2',
    client_id: 'c1',
    invoice_number: 'INV-002',
    milestone_label: 'final',
    amount: 70000,
    paid_amount: 0,
    due_date: '2026-12-04',
    sent: true,
    status: 'sent',
    created_at: '',
    updated_at: '',
  };

  const baseInput: ForecastInput = {
    today,
    horizonDays: 30,
    openingCash: 100000,
    invoices: [invoice1, invoice2],
    clients: [baseClient],
    recurringExpenses: [],
    oneOffExpenses: [],
  };

  it('applyScenarios returns a new object and does NOT mutate baseInput', () => {
    const scenarios: WhatIfScenario[] = [
      { type: 'clientLate', clientId: 'c1', extraDays: 15 },
    ];

    const result = applyScenarios(baseInput, scenarios);

    // Deep checks on non-mutation
    expect(baseInput.clients[0].average_delay_days).toBe(10);
    expect(result.clients[0].average_delay_days).toBe(25);
    expect(baseInput.invoices.length).toBe(2);
    expect(result.invoices.length).toBe(2);
    expect(baseInput).not.toBe(result);
  });

  it('clientLate scenario shifts invoice expected date', () => {
    const baseForecast = computeCashForecast(baseInput);
    // Base expected date: 2026-11-25 + 10d = 2026-12-05
    const baseEv = baseForecast.events.find((e) => e.invoiceId === 'inv-1');
    expect(baseEv?.date).toBe('2026-12-05');

    const scenarioInput = applyScenarios(baseInput, [
      { type: 'clientLate', clientId: 'c1', extraDays: 15 },
    ]);
    const scenarioForecast = computeCashForecast(scenarioInput);
    // Scenario expected date: 2026-11-25 + 25d = 2026-12-20
    const scenarioEv = scenarioForecast.events.find((e) => e.invoiceId === 'inv-1');
    expect(scenarioEv?.date).toBe('2026-12-20');
  });

  it('loseBooking scenario excludes invoices for that booking from inflows', () => {
    const scenarioInput = applyScenarios(baseInput, [
      { type: 'loseBooking', bookingId: 'b1' },
    ]);

    expect(scenarioInput.invoices.length).toBe(1);
    expect(scenarioInput.invoices[0].booking_id).toBe('b2');

    const scenarioForecast = computeCashForecast(scenarioInput);
    expect(scenarioForecast.summary.totalIn).toBe(70000); // 120k - 50k
  });

  it('addExpense scenario appends new one-off outflow', () => {
    const scenarioInput = applyScenarios(baseInput, [
      {
        type: 'addExpense',
        name: 'New Camera Lens',
        amount: 35000,
        date: '2026-11-28',
      },
    ]);

    expect(scenarioInput.oneOffExpenses?.length).toBe(1);
    expect(scenarioInput.oneOffExpenses?.[0].name).toBe('New Camera Lens');

    const scenarioForecast = computeCashForecast(scenarioInput);
    expect(scenarioForecast.summary.totalOut).toBe(35000);
    const ev = scenarioForecast.events.find((e) => e.label === 'New Camera Lens');
    expect(ev?.amount).toBe(35000);
    expect(ev?.date).toBe('2026-11-28');
  });

  it('invoicePaidEarly scenario moves expected receipt date forward', () => {
    const scenarioInput = applyScenarios(baseInput, [
      {
        type: 'invoicePaidEarly',
        invoiceId: 'inv-2',
        newDate: '2026-11-22',
      },
    ]);

    const scenarioForecast = computeCashForecast(scenarioInput);
    const ev = scenarioForecast.events.find((e) => e.invoiceId === 'inv-2');
    expect(ev?.date).toBe('2026-11-22');
  });

  it('multiple scenarios stack together correctly', () => {
    const stackedScenarios: WhatIfScenario[] = [
      { type: 'clientLate', clientId: 'c1', extraDays: 10 },
      { type: 'loseBooking', bookingId: 'b2' },
      { type: 'addExpense', name: 'Software Upgrade', amount: 8000, date: '2026-11-24' },
    ];

    const stackedInput = applyScenarios(baseInput, stackedScenarios);
    expect(stackedInput.clients[0].average_delay_days).toBe(20);
    expect(stackedInput.invoices.length).toBe(1); // b2 removed
    expect(stackedInput.oneOffExpenses?.length).toBe(1); // expense added

    const forecast = computeCashForecast(stackedInput);
    expect(forecast.summary.totalIn).toBe(50000);
    expect(forecast.summary.totalOut).toBe(8000);
  });
});

describe('What-If Engine - compareForecasts Deltas & Health Comparison', () => {
  const today = '2026-11-20';

  it('correctly calculates lowest balance delta, runway delta, and flags health worsening', () => {
    const baseInput: ForecastInput = {
      today,
      horizonDays: 30,
      openingCash: 100000,
      invoices: [],
      clients: [],
      recurringExpenses: [],
      oneOffExpenses: [{ name: 'Base Bill', amount: 85000, date: addDays(today, 10) }],
    };

    // Base: drops to 15,000 (tight)
    const baseForecast = computeCashForecast(baseInput);
    expect(baseForecast.summary.health).toBe('tight');
    expect(baseForecast.summary.lowestBalance).toBe(15000);
    expect(baseForecast.summary.runwayDays).toBeNull();

    // Scenario: adds 25,000 expense -> drops to -10,000 on day 15 (danger, runway = 15)
    const scenarioInput = applyScenarios(baseInput, [
      { name: 'Extra Shock', amount: 25000, date: addDays(today, 15), type: 'addExpense' },
    ]);
    const scenarioForecast = computeCashForecast(scenarioInput);
    expect(scenarioForecast.summary.health).toBe('danger');
    expect(scenarioForecast.summary.lowestBalance).toBe(-10000);
    expect(scenarioForecast.summary.runwayDays).toBe(15);

    const comp = compareForecasts(baseForecast, scenarioForecast);

    expect(comp.lowestBalanceDelta).toBe(-25000); // dropped by 25k
    expect(comp.healthWorsened).toBe(true); // tight -> danger
    expect(comp.baseHealth).toBe('tight');
    expect(comp.scenarioHealth).toBe('danger');
    expect(comp.runwayDelta).toBe(15);
    expect(comp.summaryText).toContain('drops by ₹25,000');
    expect(comp.summaryText).toContain('dipping below zero');
  });

  it('reports improvement when a positive scenario occurs', () => {
    const baseInput: ForecastInput = {
      today,
      horizonDays: 30,
      openingCash: 100000,
      invoices: [],
      clients: [],
      recurringExpenses: [],
      oneOffExpenses: [{ name: 'Bill', amount: 90000, date: addDays(today, 5) }],
    };

    const baseForecast = computeCashForecast(baseInput); // lowest 10,000 (day 5)

    // Invoice arrives early before bill
    const client: Client = {
      id: 'c1',
      user_id: 'u1',
      name: 'Client A',
      phone: '+91 90000 00001',
      email: null,
      payment_reliability: 'reliable',
      average_delay_days: 0,
      notes: null,
      created_at: '',
      updated_at: '',
    };
    const inv: Invoice = {
      id: 'inv-early',
      user_id: 'u1',
      booking_id: 'b1',
      client_id: 'c1',
      invoice_number: 'INV-1',
      milestone_label: 'mid',
      amount: 60000,
      paid_amount: 0,
      due_date: addDays(today, 2),
      sent: true,
      status: 'sent',
      created_at: '',
      updated_at: '',
    };

    const inputWithInv = { ...baseInput, invoices: [inv], clients: [client] };
    const forecastWithInv = computeCashForecast(inputWithInv);

    const comp = compareForecasts(baseForecast, forecastWithInv);
    expect(comp.lowestBalanceDelta).toBe(60000);
    expect(comp.healthWorsened).toBe(false);
    expect(comp.summaryText).toContain('improves by ₹60,000');
  });

  it('safely handles scenarios for non-existent clients or bookings without crashing', () => {
    const baseInput: ForecastInput = {
      today,
      horizonDays: 30,
      openingCash: 50000,
      invoices: [],
      clients: [],
      recurringExpenses: [],
    };

    const modified = applyScenarios(baseInput, [
      { type: 'clientLate', clientId: 'non-existent-client', extraDays: 14 },
      { type: 'loseBooking', bookingId: 'non-existent-booking' },
    ]);

    expect(() => computeCashForecast(modified)).not.toThrow();
    const result = computeCashForecast(modified);
    expect(result.summary.lowestBalance).toBe(50000);
  });
});
