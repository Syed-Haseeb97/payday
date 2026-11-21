import { daysOverdue, type AgingInvoice } from './aging';

export type ReceivableInvoice = AgingInvoice & { clientId: string };

export type ClientRef = {
  id: string;
  name: string;
  reliability: 'reliable' | 'average' | 'slow' | 'unreliable' | 'new';
};

export type WhoOwesRow = {
  clientId: string;
  name: string;
  reliability: ClientRef['reliability'];
  outstanding: number;
  overdueTotal: number;
  oldestOverdueDueDate: string | null;
  maxDaysOverdue: number;
};

/**
 * "Who owes me" rows: one per client with unpaid, sent invoices.
 * Sorted by overdue total, then outstanding (both descending), then name.
 * Invoices whose client is not in `clients` are ignored.
 */
export function buildWhoOwesMe(
  invoices: ReceivableInvoice[],
  clients: ClientRef[],
  today: string,
): WhoOwesRow[] {
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const rows = new Map<string, WhoOwesRow>();

  for (const inv of invoices) {
    if (!inv.sent) continue;
    const balance = inv.amount - inv.paidAmount;
    if (balance <= 0) continue;

    const client = clientById.get(inv.clientId);
    if (!client) continue;

    let row = rows.get(inv.clientId);
    if (!row) {
      row = {
        clientId: client.id,
        name: client.name,
        reliability: client.reliability,
        outstanding: 0,
        overdueTotal: 0,
        oldestOverdueDueDate: null,
        maxDaysOverdue: 0,
      };
      rows.set(inv.clientId, row);
    }

    row.outstanding += balance;

    const days = daysOverdue(inv.dueDate, today);
    if (days > 0) {
      row.overdueTotal += balance;
      row.maxDaysOverdue = Math.max(row.maxDaysOverdue, days);
      if (row.oldestOverdueDueDate === null || inv.dueDate < row.oldestOverdueDueDate) {
        row.oldestOverdueDueDate = inv.dueDate;
      }
    }
  }

  return [...rows.values()].sort((a, b) => {
    if (b.overdueTotal !== a.overdueTotal) return b.overdueTotal - a.overdueTotal;
    if (b.outstanding !== a.outstanding) return b.outstanding - a.outstanding;
    return a.name.localeCompare(b.name);
  });
}
