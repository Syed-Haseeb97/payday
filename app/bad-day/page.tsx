'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { BadDayScreen } from '@/components/screens/BadDayScreen';
import { ReminderSheet, type ReminderTarget } from '@/components/reminders/ReminderSheet';
import { PageLoading, ErrorState } from '@/components/ui/Misc';
import { firstName } from '@/lib/format';
import type { BadDay, BadDayItem } from '@/lib/types';

export default function BadDayPage() {
  const [data, setData] = useState<BadDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reminderTarget, setReminderTarget] = useState<ReminderTarget | null>(null);

  const fetchBadDayData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/bad-day');
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch triage`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to compute triage');

      const rawList = json.summary.allRanked || json.summary.topRanked || [];
      const ranked = [...rawList].sort((a: any, b: any) => {
        const aOverdue = (a.daysOverdue ?? 0) > 0 ? 1 : 0;
        const bOverdue = (b.daysOverdue ?? 0) > 0 ? 1 : 0;
        if (aOverdue !== bOverdue) return bOverdue - aOverdue;
        return (b.daysOverdue ?? 0) - (a.daysOverdue ?? 0) || (b.score ?? 0) - (a.score ?? 0);
      });
      const items: BadDayItem[] = ranked.map((item: any, idx: number) => {
        const hasPendingClaim = Boolean(
          item.invoice.payment_claims?.some((c: any) => c.status === 'pending') || item.hasPendingClaim
        );
        return {
          invoice: item.invoice,
          client: item.client,
          booking_title: item.invoice.booking?.title || 'Wedding Photography',
          outstanding: item.balance,
          due_in_days: -(item.daysOverdue ?? 0),
          urgency: item.rank || idx + 1,
          reason: item.oneLineReason || `Overdue by ${item.daysOverdue ?? 0} days`,
          action: hasPendingClaim ? 'review_claim' : 'remind',
        };
      });

      setData({
        today: new Date().toISOString().slice(0, 10),
        overdue_total: json.summary.overdueTotal || 35000,
        due_soon_total: json.summary.dueSoonTotal || 75000,
        items,
      });
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBadDayData();
  }, [fetchBadDayData]);

  if (loading && !data) return <PageLoading label="Ranking who to chase" />;
  if (error || !data) return <ErrorState title="Failed to load triage" message={error || 'Unknown error'} />;

  return (
    <>
      <BadDayScreen
        data={data}
        onRemind={(item) => {
          setReminderTarget({
            invoiceId: item.invoice.id,
            clientFirstName: firstName(item.client.name),
            amount: item.outstanding,
            overdue: item.due_in_days < 0,
          });
        }}
      />
      <ReminderSheet
        target={reminderTarget}
        onClose={() => setReminderTarget(null)}
        onSent={() => fetchBadDayData()}
      />
    </>
  );
}
