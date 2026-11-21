import { describe, it, expect } from 'vitest';
import { buildWhoOwesMe, type ClientRef, type ReceivableInvoice } from './receivables';

const clients: ClientRef[] = [
  { id: 'c1', name: 'Asha Rao', reliability: 'reliable' },
  { id: 'c2', name: 'Bhavesh Mehta', reliability: 'unreliable' },
  { id: 'c3', name: 'Chitra Nair', reliability: 'new' },
];

const today = '2025-03-31';

describe('buildWhoOwesMe', () => {
  it('sorts clients by overdue total descending', () => {
    const invoices: ReceivableInvoice[] = [
      { clientId: 'c1', amount: 5000, paidAmount: 0, dueDate: '2025-03-01', sent: true },
      { clientId: 'c2', amount: 20000, paidAmount: 0, dueDate: '2025-03-10', sent: true },
    ];
    const rows = buildWhoOwesMe(invoices, clients, today);
    expect(rows.map((r) => r.clientId)).toEqual(['c2', 'c1']);
    expect(rows[0]).toMatchObject({
      name: 'Bhavesh Mehta',
      reliability: 'unreliable',
      outstanding: 20000,
      overdueTotal: 20000,
      oldestOverdueDueDate: '2025-03-10',
      maxDaysOverdue: 21,
    });
    expect(rows[1]).toMatchObject({
      outstanding: 5000,
      overdueTotal: 5000,
      oldestOverdueDueDate: '2025-03-01',
      maxDaysOverdue: 30,
    });
  });

  it('gives overdueTotal 0 and null oldest date when only not-yet-due invoices exist', () => {
    const invoices: ReceivableInvoice[] = [
      { clientId: 'c3', amount: 8000, paidAmount: 0, dueDate: '2025-04-15', sent: true },
    ];
    const rows = buildWhoOwesMe(invoices, clients, today);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      clientId: 'c3',
      outstanding: 8000,
      overdueTotal: 0,
      oldestOverdueDueDate: null,
      maxDaysOverdue: 0,
    });
  });

  it('reduces outstanding by partial payments', () => {
    const invoices: ReceivableInvoice[] = [
      { clientId: 'c1', amount: 10000, paidAmount: 4000, dueDate: '2025-03-20', sent: true },
    ];
    const rows = buildWhoOwesMe(invoices, clients, today);
    expect(rows[0]).toMatchObject({
      outstanding: 6000,
      overdueTotal: 6000,
    });
  });

  it('ignores draft and fully paid invoices and omits zero-outstanding clients', () => {
    const invoices: ReceivableInvoice[] = [
      { clientId: 'c1', amount: 10000, paidAmount: 0, dueDate: '2025-03-01', sent: false },
      { clientId: 'c2', amount: 10000, paidAmount: 10000, dueDate: '2025-03-01', sent: true },
    ];
    expect(buildWhoOwesMe(invoices, clients, today)).toEqual([]);
  });
});
