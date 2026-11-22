'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { BookingsScreen } from '@/components/screens/BookingsScreen';
import { diffDays } from '@/lib/format';
import type { BookingSummary, Client } from '@/lib/types';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    try {
      const [bookingsRes, clientsRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/clients'),
      ]);

      const bookingsData = await bookingsRes.json();
      const clientsData = await clientsRes.json();

      const rawBookings = bookingsData.bookings || [];
      const rawClients = clientsData.clients || [];

      const today = new Date().toISOString().slice(0, 10);

      const summaries: BookingSummary[] = rawBookings
        .map((b: any) => {
          const ownInvoices = b.invoices || [];
          const collected = ownInvoices.reduce((sum: number, i: any) => sum + (i.paid_amount || 0), 0);
          const outstanding = Math.max(0, b.total_amount - collected);
          const days_to_event = diffDays(today, b.event_date);

          return {
            booking: {
              id: b.id,
              client_id: b.client_id,
              title: b.title,
              event_date: b.event_date,
              total_amount: b.total_amount,
              advance_percentage: b.advance_percentage,
              mid_percentage: b.mid_percentage,
              final_percentage: b.final_percentage,
              status: b.status || 'confirmed',
            },
            client_name: b.client?.name || 'Client',
            collected,
            outstanding,
            days_to_event,
          };
        })
        .sort((a: BookingSummary, b: BookingSummary) => a.booking.event_date.localeCompare(b.booking.event_date));

      const parsedClients: Client[] = rawClients.map((c: any) => ({
        id: c.id,
        name: c.name,
        phone: c.phone || undefined,
        email: c.email || undefined,
        payment_reliability: c.payment_reliability || 'average',
        average_delay_days: c.average_delay_days || 0,
        company: c.notes?.match(/company:\s*([^\n]+)/i)?.[1] || undefined,
      }));

      setBookings(summaries);
      setClients(parsedClients);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-150">
        <div className="h-16 w-48 rounded-2xl bg-surface border border-line" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-32 rounded-2xl bg-surface border border-line" />
          <div className="h-32 rounded-2xl bg-surface border border-line" />
        </div>
      </div>
    );
  }

  return <BookingsScreen bookings={bookings} clients={clients} onRefresh={fetchBookings} />;
}
