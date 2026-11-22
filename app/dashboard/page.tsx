'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { DashboardScreen } from '@/components/screens/DashboardScreen';
import { ReminderSheet, type ReminderTarget } from '@/components/reminders/ReminderSheet';
import { PageLoading, ErrorState } from '@/components/ui/Misc';
import { computeCashForecast } from '@/lib/forecast';
import { formatINR } from '@/lib/format';
import type { Dashboard, UpcomingItem, Alert } from '@/lib/types';

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reminderTarget, setReminderTarget] = useState<ReminderTarget | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch('/api/dashboard').then((r) => r.json()),
      fetch('/api/forecast/inputs').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch('/api/alerts').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch('/api/invoices').then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ])
      .then(([dashJson, fcInputs, , invoicesJson]) => {
        if (!dashJson.success) throw new Error(dashJson.error || 'Failed to load dashboard');

        const today = fcInputs?.today || new Date().toISOString().slice(0, 10);
        const openingCash = fcInputs?.openingCash || 140000;
        const safeBuffer = 28000;

        let forecastData = {
          today,
          days: 90,
          opening_cash: openingCash,
          safe_buffer: safeBuffer,
          baseline: [] as Array<{ date: string; balance: number }>,
          baseline_low: { date: '2026-12-14', balance: 26500 },
          events: [] as Array<{ id: string; date: string; label: string; amount: number; kind: 'invoice' | 'expense' }>,
        };

        if (fcInputs) {
          const fc = computeCashForecast({
            today: fcInputs.today,
            horizonDays: 90,
            openingCash: fcInputs.openingCash,
            invoices: fcInputs.invoices || [],
            clients: fcInputs.clients || [],
            recurringExpenses: fcInputs.recurringExpenses || [],
          });
          forecastData = {
            today,
            days: 90,
            opening_cash: openingCash,
            safe_buffer: safeBuffer,
            baseline: fc.daily.map((p) => ({ date: p.date, balance: p.balance })),
            baseline_low: { date: fc.summary.lowestBalanceDate, balance: fc.summary.lowestBalance },
            events: fc.events.map((e, idx) => ({
              id: e.id || `${e.date}-${idx}`,
              date: e.date,
              label: e.label,
              amount: e.type === 'outflow' ? -e.amount : e.amount,
              kind: (e.type === 'outflow' ? 'expense' : 'invoice') as 'invoice' | 'expense',
            })),
          };
        }

        // Check if there are any pending claims
        const pendingInvoices = (invoicesJson?.invoices || []).filter(
          (inv: any) => inv.payment_claims?.some((c: any) => c.status === 'pending')
        );
        const hasClaim = pendingInvoices.length > 0;
        const claimInv = pendingInvoices[0];
        const claimObj = claimInv?.payment_claims?.find((c: any) => c.status === 'pending');

        let priorityAlert: Alert = {
          id: 'alert_top',
          type: 'overdue',
          title: 'Rohit Mehta · Mid-payment is 9 days overdue',
          message: 'Collect ₹35,000 to keep your cash buffer above ₹28,000 for December rent.',
          action_label: 'Send reminder',
          action_url: '/bad-day',
          severity: 'critical',
          invoice_id: claimInv?.id || 'inv_mehta_mid',
        };

        if (hasClaim && claimObj) {
          priorityAlert = {
            id: 'alert_claim',
            type: 'claim',
            title: `${claimInv.client?.name || 'Rohit Mehta'} reported paying ${formatINR(claimObj.claimed_amount)}`,
            message: `Review payment claim reference ${claimObj.reference || 'UPI'} before confirming.`,
            action_label: 'Review claim',
            action_url: `/invoices/${claimInv.id}`,
            severity: 'warning',
            invoice_id: claimInv.id,
          };
        }

        const next7Days: UpcomingItem[] = [
          {
            id: 'item_mehta',
            date: '2026-11-22',
            label: 'Rohit Mehta · Mid-payment',
            amount: 35000,
            direction: hasClaim ? 'task' : 'in',
            href: '/bad-day',
          },
          {
            id: 'item_rent',
            date: '2026-12-01',
            label: 'Studio Rent',
            amount: 32000,
            direction: 'out',
          },
          {
            id: 'item_kavya',
            date: '2026-11-29',
            label: 'Kavya Nair · Final payment',
            amount: 75000,
            direction: 'in',
            href: '/invoices',
          },
        ];

        const dash: Dashboard = {
          owner_first_name: 'Arjun',
          studio_name: 'Arjun Visuals',
          today,
          opening_cash: openingCash,
          outstanding: dashJson.totalOutstanding,
          outstanding_clients: dashJson.whoOwesRows?.length || 8,
          overdue: dashJson.totalOverdue,
          overdue_count: dashJson.whoOwesRows?.filter((r: any) => r.overdueDays > 0).length || 1,
          pending_claims: pendingInvoices.length,
          forecast: forecastData,
          priority_alert: priorityAlert,
          next_7_days: next7Days,
        };

        setData(dash);
      })
      .catch((err) => {
        setError(err.message || 'Error loading dashboard');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && !data) return <PageLoading label="Loading your dashboard" />;
  if (error || !data) return <ErrorState title="Failed to load dashboard" message={error || 'Unknown error'} />;

  return (
    <>
      <DashboardScreen
        data={data}
        onSendReminder={(invoiceId) => {
          setReminderTarget({
            invoiceId,
            clientFirstName: 'Rohit',
            amount: 35000,
            overdue: true,
          });
        }}
      />
      <ReminderSheet
        target={reminderTarget}
        onClose={() => setReminderTarget(null)}
        onSent={() => loadData()}
      />
    </>
  );
}
