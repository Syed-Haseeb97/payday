'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { InvoicesScreen } from '@/components/screens/InvoicesScreen';
import type { InvoiceSummary } from '@/lib/types';

function InvoicesPageContent() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId') || '';

  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = useCallback(async () => {
    try {
      const url = clientId ? `/api/invoices?clientId=${encodeURIComponent(clientId)}` : '/api/invoices';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load invoices');
      const data = await res.json();
      const raw = data.invoices || [];

      const summaries: InvoiceSummary[] = raw.map((i: any) => {
        const pending_claim = i.payment_claims?.find((c: any) => c.status === 'pending');
        return {
          invoice: {
            ...i,
            pay_token: i.pay_token || '',
          },
          client_name: i.client?.name || 'Unknown',
          client_company: i.client?.company || undefined,
          booking_title: i.booking?.title || i.milestone_label || 'Booking',
          outstanding: Math.max(0, i.amount - (i.paid_amount || 0)),
          pending_claim,
        };
      });

      setInvoices(summaries);
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  if (loading) {
    return (
      <div className="space-y-5 animate-in fade-in duration-150">
        <div className="h-16 w-48 rounded-2xl bg-surface border border-line" />
        <div className="grid grid-cols-2 gap-3 lg:max-w-xl">
          <div className="h-20 rounded-2xl bg-surface border border-line" />
          <div className="h-20 rounded-2xl bg-surface border border-line" />
        </div>
        <div className="h-48 rounded-2xl bg-surface border border-line" />
      </div>
    );
  }

  return <InvoicesScreen invoices={invoices} onRefresh={fetchInvoices} />;
}

export default function InvoicesPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-5">
          <div className="h-16 w-48 rounded-2xl bg-surface border border-line" />
        </div>
      }
    >
      <InvoicesPageContent />
    </Suspense>
  );
}
