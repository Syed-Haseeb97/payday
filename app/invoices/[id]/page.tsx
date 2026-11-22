'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import { notFound } from 'next/navigation';
import { InvoiceDetailScreen } from '@/components/screens/InvoiceDetailScreen';
import { ReminderSheet, type ReminderTarget } from '@/components/reminders/ReminderSheet';
import { RecordPaymentSheet, type RecordTarget } from '@/components/invoices/RecordPaymentSheet';
import { getPayLinkUrl } from '@/lib/pay/token';
import type { InvoiceDetail } from '@/lib/types';

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [detail, setDetail] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reminderTarget, setReminderTarget] = useState<ReminderTarget | null>(null);
  const [recordTarget, setRecordTarget] = useState<RecordTarget | null>(null);

  const fetchInvoice = useCallback(async () => {
    try {
      const res = await fetch(`/api/invoices/${id}`);
      if (!res.ok) {
        if (res.status === 404) notFound();
        throw new Error('Failed to load invoice');
      }
      const data = await res.json();
      const inv = data.invoice || data;

      // Fetch milestones if booking exists
      let milestones = [inv];
      if (inv.booking_id) {
        try {
          const invsRes = await fetch('/api/invoices');
          if (invsRes.ok) {
            const invsData = await invsRes.json();
            const all = invsData.invoices || [];
            const bookingInvoices = all.filter((x: any) => x.booking_id === inv.booking_id);
            if (bookingInvoices.length > 0) {
              milestones = bookingInvoices;
            }
          }
        } catch {
          // ignore milestone fetch error
        }
      }

      const pending_claim = inv.payment_claims?.find((c: any) => c.status === 'pending');
      const pay_link = inv.pay_token ? getPayLinkUrl(inv.pay_token) : '';

      const invoiceDetail: InvoiceDetail = {
        invoice: {
          ...inv,
          pay_token: inv.pay_token || '',
        },
        client: inv.client || {
          id: inv.client_id,
          name: 'Client',
          payment_reliability: 'average',
          average_delay_days: 0,
        },
        booking: inv.booking || {
          id: inv.booking_id,
          client_id: inv.client_id,
          title: inv.milestone_label || 'Booking',
          event_date: inv.due_date,
          total_amount: inv.amount,
          advance_percentage: 100,
          mid_percentage: 0,
          final_percentage: 0,
          status: 'confirmed',
        },
        milestones,
        outstanding: Math.max(0, inv.amount - (inv.paid_amount || 0)),
        pay_link,
        pending_claim,
        today: new Date().toISOString().slice(0, 10),
      };

      setDetail(invoiceDetail);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  if (loading) {
    return (
      <div className="space-y-5 animate-in fade-in duration-150">
        <div className="h-6 w-32 rounded-lg bg-surface border border-line" />
        <div className="h-14 w-64 rounded-xl bg-surface border border-line" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="h-64 rounded-2xl bg-surface border border-line" />
          <div className="h-64 rounded-2xl bg-surface border border-line" />
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="p-8 text-center">
        <p className="text-out font-medium">{error || 'Invoice not found'}</p>
      </div>
    );
  }

  return (
    <>
      <InvoiceDetailScreen
        detail={detail}
        onChanged={fetchInvoice}
        onSendReminder={() =>
          setReminderTarget({
            invoiceId: detail.invoice.id,
            clientFirstName: detail.client.name.split(' ')[0] || 'Client',
            amount: detail.outstanding,
            overdue: detail.invoice.status === 'overdue',
          })
        }
        onRecordPayment={() =>
          setRecordTarget({
            invoiceId: detail.invoice.id,
            label: `${detail.client.name} · ${detail.invoice.milestone_label}`,
            outstanding: detail.outstanding,
          })
        }
      />

      <ReminderSheet
        target={reminderTarget}
        onClose={() => setReminderTarget(null)}
        onSent={() => {
          fetchInvoice();
          setReminderTarget(null);
        }}
      />

      <RecordPaymentSheet
        target={recordTarget}
        onClose={() => setRecordTarget(null)}
        onRecorded={() => {
          fetchInvoice();
          setRecordTarget(null);
        }}
      />
    </>
  );
}
