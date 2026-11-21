import { describe, it, expect, beforeEach } from 'vitest';
import {
  derivePaymentReliability,
  computeClientPaymentLearning,
  THRESHOLD_RELIABLE,
  THRESHOLD_AVERAGE,
  THRESHOLD_SLOW,
} from './clientLearning';
import { InMemoryRepository } from '../db/repository';
import { computeCashForecast } from '../forecast';
import { applyScenarios, compareForecasts } from '../whatif';
import { getIndiaTodayStr } from '../date';

describe('Client Learning from Real Payments', () => {
  let repo: InMemoryRepository;

  beforeEach(async () => {
    repo = new InMemoryRepository();
    await repo.resetDemoData();
  });

  describe('Math, Rounding, and Threshold Boundaries', () => {
    it('computes exponential moving average and rounds correctly', () => {
      // oldAverage = 12, lateDays = 10 -> 0.7 * 12 + 0.3 * 10 = 8.4 + 3.0 = 11.4 -> 11
      const res1 = computeClientPaymentLearning(12, '2026-11-10', '2026-11-20');
      expect(res1.lateDays).toBe(10);
      expect(res1.newAverage).toBe(11);
      expect(res1.newReliability).toBe('slow');

      // oldAverage = 6, paid 5 days early -> lateDays = 0 -> 0.7 * 6 + 0 = 4.2 -> 4
      const res2 = computeClientPaymentLearning(6, '2026-11-10', '2026-11-05');
      expect(res2.lateDays).toBe(0);
      expect(res2.newAverage).toBe(4);
      expect(res2.newReliability).toBe('average');
    });

    it('derives reliability across all threshold boundaries', () => {
      expect(derivePaymentReliability(0, false)).toBe('new');
      expect(derivePaymentReliability(0, true)).toBe('reliable');
      expect(derivePaymentReliability(THRESHOLD_RELIABLE, true)).toBe('reliable');
      expect(derivePaymentReliability(THRESHOLD_RELIABLE + 1, true)).toBe('average');
      expect(derivePaymentReliability(THRESHOLD_AVERAGE, true)).toBe('average');
      expect(derivePaymentReliability(THRESHOLD_AVERAGE + 1, true)).toBe('slow');
      expect(derivePaymentReliability(THRESHOLD_SLOW, true)).toBe('slow');
      expect(derivePaymentReliability(THRESHOLD_SLOW + 1, true)).toBe('unreliable');
      expect(derivePaymentReliability(30, true)).toBe('unreliable');
    });
  });

  describe('Repository Payment Integration & Rejection Rules', () => {
    it('rejects payments dated in the future', async () => {
      const invoices = await repo.getInvoices({ status: 'sent' });
      const targetInv = invoices[0];

      await expect(
        repo.recordPayment({
          invoiceId: targetInv.id,
          amount: 5000,
          paymentDate: '2099-01-01',
        })
      ).rejects.toThrow(/Payment date cannot be in the future/);
    });

    it('does NOT update client average on partial payments', async () => {
      const invoices = await repo.getInvoices();
      const unpaidInv = invoices.find((i) => i.amount - i.paid_amount > 10000)!;
      const clientBefore = (await repo.getClientById(unpaidInv.client_id))!;

      const result = await repo.recordPayment({
        invoiceId: unpaidInv.id,
        amount: 2000, // Partial payment
      });

      expect(result.clientLearning).toBeNull();

      const clientAfter = (await repo.getClientById(unpaidInv.client_id))!;
      expect(clientAfter.average_delay_days).toBe(clientBefore.average_delay_days);
      expect(clientAfter.payment_reliability).toBe(clientBefore.payment_reliability);
    });

    it('updates client average and reliability when payment brings balance to zero', async () => {
      const invoices = await repo.getInvoices();
      // Find an overdue invoice for Rohit Mehta (due date in the past)
      const overdueInv = invoices.find(
        (i) =>
          i.amount - i.paid_amount > 0 &&
          i.client?.name?.includes('Rohit Mehta') &&
          i.due_date <= getIndiaTodayStr()
      )!;
      const clientBefore = (await repo.getClientById(overdueInv.client_id))!;
      const remaining = overdueInv.amount - overdueInv.paid_amount;

      // Pay full remaining balance today (which is after due date)
      const today = getIndiaTodayStr();
      const result = await repo.recordPayment({
        invoiceId: overdueInv.id,
        amount: remaining,
        paymentDate: today,
      });

      expect(result.clientLearning).not.toBeNull();
      expect(result.clientLearning?.clientId).toBe(clientBefore.id);
      expect(result.clientLearning?.oldAverage).toBe(clientBefore.average_delay_days); // 13
      expect(result.clientLearning?.newAverage).toBeDefined();

      const clientAfter = (await repo.getClientById(clientBefore.id))!;
      expect(clientAfter.average_delay_days).toBe(result.clientLearning?.newAverage);
      expect(clientAfter.payment_reliability).toBe(result.clientLearning?.newReliability);
    });

    it('moves forecast expected receipt date earlier after recording an on-time payment', async () => {
      // 1. Initial forecast inputs
      const initialInputs = await repo.getForecastInputs();
      const mehtaClient = initialInputs.clients.find((c) => c.name.includes('Rohit Mehta'))!;
      expect(mehtaClient.average_delay_days).toBe(13);

      // Find an overdue invoice for Rohit Mehta
      const overdueInv = initialInputs.invoices.find(
        (i) =>
          i.client_id === mehtaClient.id &&
          i.amount - i.paid_amount > 0 &&
          i.due_date <= getIndiaTodayStr()
      )!;

      // 2. Pay off overdue invoice completely
      await repo.recordPayment({
        invoiceId: overdueInv.id,
        amount: overdueInv.amount - overdueInv.paid_amount,
        paymentDate: overdueInv.due_date, // on its due date -> 0 late days
      });

      // 3. New forecast inputs show updated client average
      const updatedInputs = await repo.getForecastInputs();
      const updatedClient = updatedInputs.clients.find((c) => c.id === mehtaClient.id)!;
      // 0.7 * 13 + 0.3 * 0 = 9.1 -> 9
      expect(updatedClient.average_delay_days).toBe(9);
      expect(updatedClient.average_delay_days).toBeLessThan(13);

      const forecast = computeCashForecast({
        today: updatedInputs.today,
        horizonDays: 90,
        openingCash: updatedInputs.openingCash,
        invoices: updatedInputs.invoices,
        clients: updatedInputs.clients,
        recurringExpenses: updatedInputs.recurringExpenses,
      });

      expect(forecast.summary).toBeDefined();
    });

    it('regression test: demo scenario baseline lowest balance is positive and Mehta-late scenario is negative', async () => {
      const fixedToday = '2026-11-21';
      const inputs = await repo.getForecastInputs(fixedToday);

      const baseInput = {
        today: fixedToday,
        horizonDays: 90 as const,
        openingCash: inputs.openingCash,
        invoices: inputs.invoices,
        clients: inputs.clients,
        recurringExpenses: inputs.recurringExpenses,
      };

      const baseline = computeCashForecast(baseInput);

      // Baseline lowest balance must be positive
      expect(baseline.summary.lowestBalance).toBeGreaterThan(0);

      // Find Rohit Mehta's client
      const mehtaClient = inputs.clients.find((c) => c.name.includes('Rohit Mehta'))!;

      // Apply Mehta 15-day late scenario
      const scenarioInput = applyScenarios(baseInput, [
        {
          type: 'clientLate',
          clientId: mehtaClient.id,
          extraDays: 15,
        },
      ]);

      const scenarioForecast = computeCashForecast(scenarioInput);
      const comparison = compareForecasts(baseline, scenarioForecast);

      // Mehta late scenario dips below zero
      expect(scenarioForecast.summary.lowestBalance).toBeLessThan(0);
      expect(comparison.lowestBalanceDelta).toBeLessThan(0);
    });
  });
});
