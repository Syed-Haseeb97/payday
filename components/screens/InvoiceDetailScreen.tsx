'use client';

import { ArrowLeft, CircleCheck, Copy, Link2, Receipt, Send } from 'lucide-react';
import { useState } from 'react';
import { ClaimReviewCard } from '@/components/invoices/ClaimReviewCard';
import { MilestoneTimeline } from '@/components/invoices/MilestoneTimeline';
import { Button, WhatsAppIcon } from '@/components/ui/Button';
import { Card, SectionTitle } from '@/components/ui/Card';
import { ClaimChip, ReliabilityChip, StatusChip } from '@/components/ui/Chip';
import { Money } from '@/components/ui/Money';
import { Progress } from '@/components/ui/Misc';
import { diffDays, firstName, formatDate, formatDateLong, formatDue, formatINR } from '@/lib/format';
import { copyText } from '@/lib/clipboard';
import { Link } from '@/lib/router';
import type { InvoiceDetail } from '@/lib/types';

interface Props {
  detail: InvoiceDetail;
  onChanged: () => void;
  onSendReminder: () => void;
  onRecordPayment: () => void;
}

const methodLabel = { upi: 'UPI', bank: 'Bank transfer', cash: 'Cash' };

export function InvoiceDetailScreen({ detail, onChanged, onSendReminder, onRecordPayment }: Props) {
  const { invoice: inv, client, booking } = detail;
  const [copied, setCopied] = useState<'idle' | 'copied' | 'failed'>('idle');
  const paid = inv.status === 'paid';
  const due = diffDays(detail.today, inv.due_date);

  async function copy() {
    const ok = await copyText(detail.pay_link);
    setCopied(ok ? 'copied' : 'failed');
    if (ok) setTimeout(() => setCopied('idle'), 2400);
  }

  async function resolveClaim(claimId: string, action: 'confirm' | 'reject') {
    const res = await fetch(`/api/claims/${claimId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to resolve claim');
    return data;
  }

  return (
    <div className="space-y-5">
      <Link to="/invoices" className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-ink-2 hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> All invoices
      </Link>

      <header>
        <p className="num text-sm font-medium text-ink-3">{inv.invoice_number}</p>
        <h1 tabIndex={-1} data-page-title className="mt-1 text-[1.75rem] leading-tight font-semibold tracking-tight focus:outline-none sm:text-3xl">
          {client.company ?? client.name} · {inv.milestone_label}
        </h1>
        <p className="mt-1 text-ink-2">
          {client.name} · {booking.title}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <StatusChip status={inv.status} />
          {detail.pending_claim && <ClaimChip amount={detail.pending_claim.claimed_amount} />}
          <ReliabilityChip reliability={client.payment_reliability} delayDays={client.average_delay_days} />
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-6">
        <div className="space-y-5">
          {detail.pending_claim && (
            <ClaimReviewCard
              claim={detail.pending_claim}
              clientFirstName={firstName(client.name)}
              onResolve={resolveClaim}
              onResolved={onChanged}
            />
          )}

          <Card as="section" aria-labelledby="amount-title">
            <h2 id="amount-title" className="text-sm font-medium text-ink-2">
              {paid ? 'Paid in full' : 'Left to collect'}
            </h2>
            <Money value={paid ? inv.amount : detail.outstanding} roll className={`mt-1 block text-4xl font-semibold sm:text-5xl ${paid ? 'text-in' : ''}`} />
            <p className="mt-1 text-sm text-ink-2">
              {paid ? `Settled` : `${formatDue(due)} · ${formatDateLong(inv.due_date)}`}
            </p>
            <div className="mt-4">
              <Progress value={inv.paid_amount} max={inv.amount} label="Amount collected" />
              <p className="num mt-2 flex justify-between text-xs text-ink-3">
                <span>{formatINR(inv.paid_amount)} received</span>
                <span>of {formatINR(inv.amount)}</span>
              </p>
            </div>

            {!paid && (
              <>
                <div className="mt-5 flex items-center gap-3 rounded-2xl border border-line bg-surface-2 px-4 py-3">
                  <Link2 className="size-4 shrink-0 text-ink-3" aria-hidden />
                  <p className="num min-w-0 flex-1 truncate text-sm text-ink-2">{detail.pay_link}</p>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <Button variant="secondary" icon={Copy} onClick={copy} state={copied === 'copied' ? 'done' : 'idle'} doneLabel="Link Copied!">
                    Copy Pay Link
                  </Button>
                  <Button variant="whatsapp" icon={WhatsAppIcon} onClick={onSendReminder}>
                    Send reminder
                  </Button>
                  <Button variant="secondary" icon={CircleCheck} onClick={onRecordPayment}>
                    Record payment
                  </Button>
                </div>
                {copied === 'failed' && (
                  <p role="alert" className="mt-2 text-sm text-out">
                    Couldn't reach the clipboard. Long-press the link above to copy it.
                  </p>
                )}
              </>
            )}
          </Card>

          <Card as="section" aria-labelledby="receipts-title">
            <SectionTitle id="receipts-title">Payment Receipts</SectionTitle>
            {inv.payments && inv.payments.length > 0 ? (
              <ul className="divide-y divide-line">
                {inv.payments.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 py-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-in/12 text-in">
                      <Receipt className="size-[18px]" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {methodLabel[p.method] || p.method} · {formatDate(p.paid_on)}
                      </p>
                      {p.reference && <p className="num truncate text-xs text-ink-3">{p.reference}</p>}
                    </div>
                    <span className="num font-semibold text-in">{formatINR(p.amount, { signed: true })}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-2xl border border-dashed border-line-strong p-5 text-center text-sm text-ink-2">No payments yet. Receipts appear here once you record or confirm one.</p>
            )}
          </Card>
        </div>

        <Card as="section" aria-labelledby="milestones-title" className="h-fit">
          <SectionTitle id="milestones-title">Milestones</SectionTitle>
          <p className="-mt-2 mb-4 text-sm text-ink-2">
            {booking.title} · event {formatDate(booking.event_date)} · <span className="num">{formatINR(booking.total_amount)}</span>
          </p>
          <MilestoneTimeline milestones={detail.milestones} currentId={inv.id} />
        </Card>
      </div>
    </div>
  );
}
