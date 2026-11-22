'use client';

import React, { useEffect, useState } from 'react';
import { PricingScreen } from '@/components/screens/PricingScreen';
import type { PricingInputs } from '@/lib/types';

const DEFAULT_INPUTS: PricingInputs = {
  fixed_costs: [
    { label: 'Studio rent', amount: 45000 },
    { label: 'Camera EMI', amount: 18500 },
    { label: 'Editor salary', amount: 35000 },
  ],
  safe_buffer: 50000,
  average_booking: 320000,
  weighted_delay_days: 13,
  typical_invoice: 55000,
  cost_of_money_pct: 1.5,
};

export default function PricingPage() {
  const [inputs, setInputs] = useState<PricingInputs>(DEFAULT_INPUTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [dashRes, invsRes, bksRes] = await Promise.all([
          fetch('/api/dashboard'),
          fetch('/api/invoices'),
          fetch('/api/bookings'),
        ]);

        const dashData = dashRes.ok ? await dashRes.json() : null;
        const invsData = invsRes.ok ? await invsRes.json() : null;
        const bksData = bksRes.ok ? await bksRes.json() : null;

        const invoices = invsData?.invoices || [];
        const bookings = bksData?.bookings || [];

        const openInvoices = invoices.filter(
          (i: any) => i.status !== 'paid' && i.status !== 'draft' && i.amount - (i.paid_amount || 0) > 0
        );

        let weightedDelay = 13;
        let typical = 55000;
        let avgBooking = 320000;

        if (openInvoices.length > 0) {
          const totalOwed = openInvoices.reduce(
            (sum: number, i: any) => sum + (i.amount - (i.paid_amount || 0)),
            0
          );
          if (totalOwed > 0) {
            const sumDelays = openInvoices.reduce((sum: number, i: any) => {
              const delay = i.client?.average_delay_days || 0;
              const owed = i.amount - (i.paid_amount || 0);
              return sum + delay * owed;
            }, 0);
            weightedDelay = Math.round(sumDelays / totalOwed);
          }
          typical = openInvoices[0].amount - (openInvoices[0].paid_amount || 0);
        }

        if (bookings.length > 0) {
          const totalBookingAmount = bookings.reduce(
            (sum: number, b: any) => sum + (b.total_amount || 0),
            0
          );
          avgBooking = Math.round(totalBookingAmount / bookings.length);
        }

        const safeBuffer = dashData?.safeBuffer || 50000;

        setInputs({
          fixed_costs: DEFAULT_INPUTS.fixed_costs,
          safe_buffer: safeBuffer,
          average_booking: avgBooking,
          weighted_delay_days: weightedDelay || 13,
          typical_invoice: typical || 55000,
          cost_of_money_pct: 1.5,
        });
      } catch (err) {
        console.error('Error loading pricing inputs:', err);
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
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="h-64 rounded-2xl bg-surface border border-line" />
          <div className="h-64 rounded-2xl bg-surface border border-line" />
        </div>
      </div>
    );
  }

  return <PricingScreen inputs={inputs} />;
}
