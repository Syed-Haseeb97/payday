'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { notFound, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Send,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Invoice, PaymentClaim } from '@/lib/db/types';
import { formatINR } from '@/lib/money';
import { getPayLinkUrl } from '@/lib/pay/token';
import { StatusBadge } from '@/components/invoices/StatusBadge';
import { ReminderDrawer } from '@/components/reminders/ReminderDrawer';
import { suggestDefaultTone } from '@/lib/ai';

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: invoiceId } = use(params);
  const router = useRouter();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [resolvingClaim, setResolvingClaim] = useState(false);
  const [claimActionError, setClaimActionError] = useState<string | null>(null);
  const [reminderOpen, setReminderOpen] = useState(false);

  const fetchInvoice = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`);
      if (!res.ok) {
        if (res.status === 404) notFound();
        throw new Error('Failed to load invoice');
      }
      const data = await res.json();
      setInvoice(data.invoice || data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading invoice');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  const handleCopyPayLink = () => {
    if (!invoice?.pay_token) return;
    const url = getPayLinkUrl(invoice.pay_token);
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleResolveClaim = async (claimId: string, action: 'confirm' | 'reject') => {
    setResolvingClaim(true);
    setClaimActionError(null);
    try {
      const res = await fetch(`/api/claims/${claimId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to ${action} claim`);
      }
      // Refresh invoice state
      await fetchInvoice();
    } catch (err: unknown) {
      setClaimActionError(err instanceof Error ? err.message : 'Error resolving claim');
    } finally {
      setResolvingClaim(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-4">
        <div className="h-8 w-40 rounded-full bg-surface border border-line animate-pulse" />
        <div className="h-64 rounded-2xl bg-surface border border-line animate-pulse" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-[#B53A26] mx-auto" />
        <h2 className="font-serif italic text-xl font-bold">Invoice Not Found</h2>
        <p className="text-xs text-[var(--text-muted)] font-mono">{error || 'Could not find requested invoice.'}</p>
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#16181D] text-[#F5F3EE] font-mono text-xs uppercase tracking-wider font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Invoices</span>
        </Link>
      </div>
    );
  }

  const balance = invoice.amount - invoice.paid_amount;
  const isSettled = balance <= 0;
  const pendingClaim = (invoice.payment_claims || []).find((c) => c.status === 'pending');

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* Top Back Link & Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Invoices</span>
        </Link>

        {invoice.pay_token && (
          <button
            type="button"
            onClick={handleCopyPayLink}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#C8C2B5] bg-white px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider font-semibold text-[#16181D] hover:bg-[#F5F3EE] transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#1D6B52]" />
                <span className="text-[#1D6B52]">Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#5F626A]" />
                <span>Copy Pay Link</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Main Invoice Card */}
      <div className="p-6 rounded-2xl app-card bg-surface border border-line space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-line)] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm uppercase tracking-wider text-[var(--text-muted)]">
                {invoice.invoice_number}
              </span>
              <span className="inline-block rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-line)] px-2.5 py-0.5 font-mono text-[10px] uppercase font-bold text-[var(--text-muted)]">
                {invoice.milestone_label} Milestone
              </span>
            </div>
            <h1 className="mt-1 font-serif italic text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              {invoice.client?.name || 'Client'}
            </h1>
            <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
              {invoice.booking?.title}
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-1.5">
            <StatusBadge status={invoice.status} daysOverdue={invoice.days_overdue} />
            {pendingClaim && (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider bg-[#F6ECD9] text-[#86560D] border border-[#86560D]/20">
                Payment claimed: {formatINR(pendingClaim.claimed_amount)}
              </span>
            )}
          </div>
        </div>

        {/* Claim Review Section if pending claim exists */}
        {pendingClaim && (
          <div className="p-4 rounded-xl border border-[#86560D]/30 bg-[#F6ECD9]/40 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#86560D]" />
                <span className="font-mono text-xs uppercase tracking-wider font-bold text-[#86560D]">
                  Client Reported Payment
                </span>
              </div>
              <span className="font-mono text-[11px] text-[#86560D]">
                {format(parseISO(pendingClaim.created_at), 'd MMM yyyy, h:mm a')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <span className="text-[10px] uppercase text-[#86560D]/80 block">Claimed Amount</span>
                <strong className="text-sm font-bold text-[#16181D]">
                  {formatINR(pendingClaim.claimed_amount)}
                </strong>
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#86560D]/80 block">Reference / UTR</span>
                <span className="text-[#16181D]">{pendingClaim.reference || 'None provided'}</span>
              </div>
            </div>

            {claimActionError && (
              <div className="p-2 rounded-lg bg-[#F8E9E4] text-[#B53A26] font-mono text-xs">
                {claimActionError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#86560D]/20">
              <button
                type="button"
                disabled={resolvingClaim}
                onClick={() => handleResolveClaim(pendingClaim.id, 'reject')}
                className="px-3.5 py-1.5 rounded-full border border-[#C8C2B5] bg-white font-mono text-xs uppercase tracking-wider font-semibold text-[#5F626A] hover:bg-[#F5F3EE] disabled:opacity-50"
              >
                Reject
              </button>
              <button
                type="button"
                disabled={resolvingClaim}
                onClick={() => handleResolveClaim(pendingClaim.id, 'confirm')}
                className="px-4 py-1.5 rounded-full bg-[#16181D] text-[#F5F3EE] font-mono text-xs uppercase tracking-wider font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {resolvingClaim ? 'Confirming...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        )}

        {/* Amounts and Due Dates Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-line)]">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block">
              Total Invoice
            </span>
            <span className="text-base font-serif font-bold text-[var(--text-primary)]">
              {formatINR(invoice.amount)}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--money-in)] block">
              Paid to Date
            </span>
            <span className="text-base font-serif font-bold text-[var(--money-in)]">
              {formatINR(invoice.paid_amount)}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block">
              Balance Due
            </span>
            <span
              className={`text-base font-serif font-bold ${
                isSettled ? 'text-[var(--money-in)]' : 'text-[var(--money-out)]'
              }`}
            >
              {formatINR(balance)}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block">
              Due Date
            </span>
            <span className="text-xs font-mono font-bold text-[var(--text-primary)]">
              {format(parseISO(invoice.due_date), 'd MMM yyyy')}
            </span>
          </div>
        </div>

        {/* Recorded Payments History */}
        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold block">
            Payment Receipts ({invoice.payments?.length || 0})
          </span>

          {!invoice.payments || invoice.payments.length === 0 ? (
            <p className="text-xs font-mono text-[var(--text-muted)] py-3">
              No payments recorded yet for this invoice.
            </p>
          ) : (
            <div className="space-y-1.5">
              {invoice.payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--border-line)] bg-[var(--bg-surface-subtle)] text-xs font-mono"
                >
                  <div>
                    <span className="font-bold text-[var(--text-primary)]">
                      {formatINR(p.amount)}
                    </span>
                    <span className="text-[var(--text-muted)] ml-2">via {p.payment_method}</span>
                    {p.reference_number && (
                      <span className="text-[var(--text-muted)] ml-2">({p.reference_number})</span>
                    )}
                  </div>
                  <span className="text-[var(--text-muted)]">
                    {format(parseISO(p.payment_date), 'd MMM yyyy')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {!isSettled && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border-line)]">
            <button
              type="button"
              onClick={() => setReminderOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#C8C2B5] bg-white px-4 py-2 font-mono text-xs uppercase tracking-wider font-semibold text-[#16181D] hover:bg-[#F5F3EE] transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Reminder</span>
            </button>

            {invoice.pay_token && (
              <a
                href={getPayLinkUrl(invoice.pay_token)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#C8C2B5] bg-white px-4 py-2 font-mono text-xs uppercase tracking-wider font-semibold text-[#5F626A] hover:bg-[#F5F3EE] transition-colors"
              >
                <span>View Client Pay Page</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Reminder Drawer */}
      {invoice.client && (
        <ReminderDrawer
          isOpen={reminderOpen}
          onClose={() => setReminderOpen(false)}
          invoiceId={invoice.id}
          defaultTone={suggestDefaultTone(
            invoice.days_overdue || 0,
            invoice.client.payment_reliability
          )}
          clientName={invoice.client.name}
          amountFormatted={formatINR(balance)}
        />
      )}
    </div>
  );
}
