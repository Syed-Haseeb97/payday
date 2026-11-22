'use client';

import React, { useEffect, useState } from 'react';
import { ClientsScreen } from '@/components/screens/ClientsScreen';
import type { ClientSummary } from '@/lib/types';

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [clientsRes, invoicesRes, bookingsRes] = await Promise.all([
          fetch('/api/clients'),
          fetch('/api/invoices'),
          fetch('/api/bookings'),
        ]);

        const clientsData = await clientsRes.json();
        const invoicesData = await invoicesRes.json();
        const bookingsData = await bookingsRes.json();

        const rawClients = clientsData.clients || [];
        const rawInvoices = invoicesData.invoices || [];
        const rawBookings = bookingsData.bookings || [];

        const summaries: ClientSummary[] = rawClients
          .map((c: any) => {
            const clientInvoices = rawInvoices.filter(
              (i: any) => i.client_id === c.id && i.status !== 'paid' && i.status !== 'draft'
            );
            const outstanding = clientInvoices.reduce(
              (sum: number, i: any) => sum + Math.max(0, i.amount - (i.paid_amount || 0)),
              0
            );
            const count = rawBookings.filter((b: any) => b.client_id === c.id).length;
            const dueDates = clientInvoices
              .filter((i: any) => Math.max(0, i.amount - (i.paid_amount || 0)) > 0)
              .map((i: any) => i.due_date)
              .sort();

            return {
              client: {
                id: c.id,
                name: c.name,
                phone: c.phone || undefined,
                email: c.email || undefined,
                payment_reliability: c.payment_reliability || 'average',
                average_delay_days: c.average_delay_days || 0,
                company: c.notes?.match(/company:\s*([^\n]+)/i)?.[1] || undefined,
              },
              outstanding,
              bookings: count,
              next_due: dueDates[0],
            };
          })
          .sort((a: ClientSummary, b: ClientSummary) => b.outstanding - a.outstanding);

        setClients(summaries);
      } catch (err) {
        console.error('Error loading clients:', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-5 animate-in fade-in duration-150">
        <div className="h-16 w-48 rounded-2xl bg-surface border border-line" />
        <div className="grid gap-3 md:grid-cols-2">
          <div className="h-28 rounded-2xl bg-surface border border-line" />
          <div className="h-28 rounded-2xl bg-surface border border-line" />
        </div>
      </div>
    );
  }

  return <ClientsScreen clients={clients} />;
}
