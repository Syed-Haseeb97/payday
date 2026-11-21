import { describe, it, expect } from 'vitest';
import { deriveInvoiceStatus } from './invoice-status';

describe('deriveInvoiceStatus', () => {
  it('returns paid when fully paid', () => {
    expect(
      deriveInvoiceStatus({
        amount: 1000,
        paidAmount: 1000,
        dueDate: '2025-01-10',
        sent: true,
        today: '2025-01-05',
      }),
    ).toBe('paid');
  });

  it('returns partially_paid for a partial payment before due date', () => {
    expect(
      deriveInvoiceStatus({
        amount: 1000,
        paidAmount: 400,
        dueDate: '2025-01-10',
        sent: true,
        today: '2025-01-05',
      }),
    ).toBe('partially_paid');
  });

  it('returns overdue for a partial payment past due date', () => {
    expect(
      deriveInvoiceStatus({
        amount: 1000,
        paidAmount: 400,
        dueDate: '2025-01-01',
        sent: true,
        today: '2025-01-05',
      }),
    ).toBe('overdue');
  });

  it('returns draft when not sent and no payment', () => {
    expect(
      deriveInvoiceStatus({
        amount: 1000,
        paidAmount: 0,
        dueDate: '2025-01-10',
        sent: false,
        today: '2025-01-05',
      }),
    ).toBe('draft');
  });

  it('returns sent when sent before due date with no payment', () => {
    expect(
      deriveInvoiceStatus({
        amount: 1000,
        paidAmount: 0,
        dueDate: '2025-01-10',
        sent: true,
        today: '2025-01-05',
      }),
    ).toBe('sent');
  });

  it('returns overdue when sent with zero payment past due date', () => {
    expect(
      deriveInvoiceStatus({
        amount: 1000,
        paidAmount: 0,
        dueDate: '2025-01-01',
        sent: true,
        today: '2025-01-05',
      }),
    ).toBe('overdue');
  });

  it('treats due date equal to today as not overdue', () => {
    expect(
      deriveInvoiceStatus({
        amount: 1000,
        paidAmount: 0,
        dueDate: '2025-01-05',
        sent: true,
        today: '2025-01-05',
      }),
    ).toBe('sent');
  });

  it('handles an invoice paid to exactly zero balance', () => {
    expect(
      deriveInvoiceStatus({
        amount: 35000,
        paidAmount: 35000,
        dueDate: '2025-01-01', // even if due date was in the past
        sent: true,
        today: '2025-01-05',
      }),
    ).toBe('paid');
  });

  it('handles partial payment with due date of today as partially_paid', () => {
    expect(
      deriveInvoiceStatus({
        amount: 50000,
        paidAmount: 20000,
        dueDate: '2025-01-05',
        sent: true,
        today: '2025-01-05',
      }),
    ).toBe('partially_paid');
  });
});
