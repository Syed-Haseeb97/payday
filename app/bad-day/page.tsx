'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Flame,
  Clock,
  Phone,
  Send,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  CreditCard,
  DollarSign,
  Calendar,
  Sparkles,
  Info,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { formatINR } from '@/lib/money';
import { format, parseISO } from 'date-fns';
import { ReliabilityBadge } from '@/components/ui/ReliabilityBadge';
import { ReminderDrawer } from '@/components/reminders/ReminderDrawer';
import { Modal } from '@/components/ui/Modal';
import { BadDayRankedItem, BadDaySummary } from '@/lib/ranking';
import { CashHealth, ForecastEvent } from '@/lib/forecast';
import { Invoice, PaymentMethod } from '@/lib/db/types';
import { suggestDefaultTone } from '@/lib/ai';

interface BadDayApiResponse {
  success: boolean;
  summary: BadDaySummary;
  cashToday: number;
  lowestBalance: number;
  lowestBalanceDate: string;
  health: CashHealth;
  billsNext7Days: ForecastEvent[];
  error?: string;
}

export default function BadDayPage() {
  const [data, setData] = useState<BadDayApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reminder Drawer State
  const [reminderDrawerOpen, setReminderDrawerOpen] = useState(false);
  const [selectedItemForReminder, setSelectedItemForReminder] = useState<BadDayRankedItem | null>(null);

  // Payment Recording Modal State
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentItem, setPaymentItem] = useState<BadDayRankedItem | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const fetchBadDayData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/bad-day');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to fetch bad day triage`);
      }
      const json: BadDayApiResponse = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to compute triage');
      }
      setData(json);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Error loading bad day data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBadDayData();
  }, [fetchBadDayData]);

  const handleOpenReminder = (item: BadDayRankedItem) => {
    setSelectedItemForReminder(item);
    setReminderDrawerOpen(true);
  };

  const handleOpenPayment = (item: BadDayRankedItem) => {
    setPaymentItem(item);
    setPaymentAmount(item.balance);
    setPaymentDate(format(new Date(), 'yyyy-MM-dd'));
    setPaymentMethod('UPI');
    setPaymentReference('');
    setPaymentNotes('');
    setPaymentError(null);
    setIsPaymentOpen(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentItem) return;

    if (paymentAmount <= 0) {
      setPaymentError('Payment amount must be greater than zero.');
      return;
    }
    if (paymentAmount > paymentItem.balance + 0.001) {
      setPaymentError(
        `Payment amount cannot exceed remaining balance of ${formatINR(paymentItem.balance)}`
      );
      return;
    }

    setPaymentSubmitting(true);
    setPaymentError(null);

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: paymentItem.invoice.id,
          amount: paymentAmount,
          paymentDate,
          paymentMethod,
          referenceNumber: paymentReference,
          notes: paymentNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to record payment');
      }

      setIsPaymentOpen(false);
      setPaymentItem(null);
      await fetchBadDayData();
    } catch (err: unknown) {
      const e = err as Error;
      setPaymentError(e.message || 'Error recording payment');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-[#E3EFE8]/40 rounded-xl" />
        <div className="h-28 rounded-2xl bg-white border border-[#C8C2B5] p-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-white border border-[#C8C2B5] p-6" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 rounded-2xl bg-white border border-[#C8C2B5] text-center space-y-4 max-w-xl mx-auto my-12">
        <div className="w-12 h-12 mx-auto rounded-full bg-[#F8E9E4] flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-[#B53A26]" />
        </div>
        <h2 className="font-serif italic text-2xl font-bold text-[#16181D]">
          Unable to Load Bad Day Mode
        </h2>
        <p className="text-sm text-[#5F626A]">
          {error || 'Something went wrong while evaluating prioritized receivables.'}
        </p>
        <button
          onClick={fetchBadDayData}
          type="button"
          className="inline-flex items-center gap-2 rounded-full bg-[#16181D] text-[#F5F3EE] px-5 py-2.5 text-xs font-mono uppercase tracking-wider font-semibold hover:opacity-90 transition-opacity"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const { summary, cashToday, lowestBalance, lowestBalanceDate, health, billsNext7Days } = data;
  const topRanked = summary.topRanked || [];
  const alsoOnList = summary.alsoOnList || [];
  const hasItems = topRanked.length > 0;

  const healthColorClasses =
    health === 'danger'
      ? 'border-[var(--money-out)] bg-[var(--money-out-bg)] text-[var(--money-out)]'
      : health === 'tight'
      ? 'border-[var(--money-warn)] bg-[var(--money-warn-bg)] text-[var(--money-warn)]'
      : 'border-[var(--money-in)] bg-[var(--money-in-bg)] text-[var(--money-in)]';

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Header Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#C8C2B5]/60 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--money-out)] bg-[var(--money-out-bg)] px-3.5 py-1 font-mono text-[11px] uppercase tracking-wider text-[var(--money-out)] font-semibold mb-2">
            <Flame className="w-3.5 h-3.5" />
            <span>Signature Cash Triage</span>
          </div>
          <h1 className="font-serif italic text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
            Bad Day Mode
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)] font-sans">
            Ranked strictly by mathematical cash impact, overdue urgency, and client delay history.
          </p>
        </div>

        {/* Quick Cash Stats Pill */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2 rounded-2xl app-card bg-surface border border-line text-left">
            <span className="block font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
              Cash Balance Today
            </span>
            <span className="font-serif font-bold text-lg text-[var(--text-primary)]">
              {formatINR(cashToday)}
            </span>
          </div>

          <div className="px-4 py-2 rounded-2xl app-card bg-surface border border-line text-left">
            <span className="block font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
              Lowest in 90 Days
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`font-serif font-bold text-lg ${
                  lowestBalance < 0
                    ? 'text-[var(--money-out)]'
                    : health === 'tight'
                    ? 'text-[var(--money-warn)]'
                    : 'text-[var(--money-in)]'
                }`}
              >
                {formatINR(lowestBalance)}
              </span>
              <span className="text-xs text-[var(--text-muted)] font-mono">
                ({format(parseISO(lowestBalanceDate), 'd MMM')})
              </span>
            </div>
          </div>

          <div className={`px-3.5 py-2 rounded-2xl border font-mono text-xs uppercase tracking-wider font-semibold ${healthColorClasses}`}>
            Status: {health}
          </div>
        </div>
      </div>

      {/* 2. Top Summary Impact Card */}
      {hasItems && (
        <div className="p-6 rounded-2xl app-card bg-surface border border-line shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="font-mono text-[11px] uppercase tracking-widest text-[var(--text-muted)] font-semibold">
                Priority Cash Lift Potential
              </span>
              <h2 className="font-serif italic text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                If you collect these {topRanked.length} items:
              </h2>
              <p className="text-sm text-[var(--text-muted)] font-sans">
                Your lowest 90-day balance improves from{' '}
                <span className="font-semibold text-[var(--money-out)] font-mono">
                  {formatINR(summary.lowestBalanceWithout)}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-[var(--money-in)] font-mono">
                  {formatINR(summary.lowestBalanceWith)}
                </span>{' '}
                (a lift of <strong className="text-[var(--text-primary)]">{formatINR(summary.combinedCashImpact)}</strong>).
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/forecast"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#C8C2B5] bg-[#F5F3EE] px-4 py-2 text-xs font-mono uppercase tracking-wider font-semibold text-[#16181D] hover:bg-white transition-colors"
              >
                <span>View 90-Day Chart</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 3. "Do These Today" - Top 3 Ranked Items */}
      {hasItems ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B53A26]" />
              <h2 className="font-serif italic text-xl font-bold text-[var(--text-primary)]">
                Do these today
              </h2>
              <span className="font-mono text-xs text-[var(--text-muted)] font-medium">
                (Top priority collection targets)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {topRanked.map((item) => {
              const cleanPhone = item.client.phone ? item.client.phone.replace(/[^0-9+]/g, '') : '';
              const defaultTone = suggestDefaultTone(item.daysOverdue, item.client.payment_reliability);

              return (
                <div
                  key={item.id}
                  className="rounded-2xl app-card bg-surface border border-line p-5 flex flex-col justify-between space-y-5 hover:border-[var(--text-primary)] transition-colors"
                >
                  <div className="space-y-3.5">
                    {/* Top Row: Action Badge + Rank + Reliability */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[var(--text-primary)] text-[var(--bg-canvas)] flex items-center justify-center font-mono text-xs font-bold">
                          #{item.rank}
                        </span>
                        {item.actionType === 'chase' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider font-bold bg-[var(--money-out-bg)] text-[var(--money-out)]">
                            <Flame className="w-3 h-3" />
                            <span>Chase Overdue</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider font-bold bg-[var(--money-warn-bg)] text-[var(--money-warn)]">
                            <Clock className="w-3 h-3" />
                            <span>Heads-up Nudge</span>
                          </span>
                        )}
                      </div>
                      <ReliabilityBadge reliability={item.client.payment_reliability} />
                    </div>

                    {/* Client & Amount */}
                    <div>
                      <h3 className="font-serif font-bold text-xl text-[var(--text-primary)] truncate">
                        {item.client.name}
                      </h3>
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
                          {item.invoice.milestone_label}
                        </span>
                        <span className="font-serif font-bold text-xl text-[var(--text-primary)]">
                          {formatINR(item.balance)}
                        </span>
                      </div>
                    </div>

                    {/* Overdue / Due in Status */}
                    <div className="rounded-xl bg-[var(--bg-surface-subtle)] p-3 text-xs font-mono space-y-1">
                      <div className="flex items-center justify-between text-[var(--text-muted)]">
                        <span>Timing</span>
                        <span className="font-semibold text-[var(--text-primary)]">
                          {item.daysOverdue > 0
                            ? `${item.daysOverdue} days overdue`
                            : item.daysUntilDue === 0
                            ? 'Due today'
                            : `Due in ${item.daysUntilDue} days`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[var(--text-muted)]">
                        <span>Cash Lift</span>
                        <span className="font-semibold text-[var(--money-in)]">
                          +{formatINR(item.components.cashImpact)}
                        </span>
                      </div>
                    </div>

                    {/* One-Line Reason */}
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed italic border-l-2 border-[var(--border-line)] pl-2.5">
                      {item.oneLineReason}
                    </p>
                  </div>

                  {/* Primary 1-Tap Action Buttons */}
                  <div className="pt-2 border-t border-[#C8C2B5]/40 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleOpenReminder(item)}
                        type="button"
                        className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#16181D] text-[#F5F3EE] py-2 px-3 text-xs font-mono uppercase tracking-wider font-semibold hover:opacity-90 transition-opacity"
                      >
                        <Send className="w-3.5 h-3.5 text-[#E3EFE8]" />
                        <span>{item.actionType === 'chase' ? 'Reminder' : 'Heads-up'}</span>
                      </button>

                      {cleanPhone ? (
                        <a
                          href={`tel:${cleanPhone}`}
                          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#C8C2B5] bg-white text-[#16181D] py-2 px-3 text-xs font-mono uppercase tracking-wider font-semibold hover:bg-[#F5F3EE] transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-[#5F626A]" />
                          <span>Call</span>
                        </a>
                      ) : (
                        <button
                          disabled
                          type="button"
                          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#C8C2B5]/50 bg-white/50 text-[#5F626A] py-2 px-3 text-xs font-mono uppercase tracking-wider font-semibold opacity-50 cursor-not-allowed"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>No Phone</span>
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => handleOpenPayment(item)}
                      type="button"
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-[#C8C2B5] bg-[#F5F3EE] py-1.5 px-3 text-xs font-mono uppercase tracking-wider font-medium text-[#16181D] hover:bg-white transition-colors"
                    >
                      <CreditCard className="w-3 h-3 text-[#1D6B52]" />
                      <span>Record Payment</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="p-10 rounded-2xl bg-white border border-[#C8C2B5] text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#E3EFE8] flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-[#1D6B52]" />
          </div>
          <h2 className="font-serif italic text-2xl sm:text-3xl font-bold text-[#16181D]">
            Nothing to chase today!
          </h2>
          <p className="text-sm text-[#5F626A] max-w-md mx-auto">
            All current invoices are settled or outside the critical 10-day reminder window. Cash trajectory is clear.
          </p>
        </div>
      )}

      {/* 4. "Also on your list" - Ranks 4 and 5 */}
      {alsoOnList.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#5F626A]" />
            <h2 className="font-serif italic text-xl font-bold text-[var(--text-primary)]">
              Also on your list
            </h2>
            <span className="font-mono text-xs text-[var(--text-muted)]">
              (Secondary follow-ups)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alsoOnList.map((item) => {
              const cleanPhone = item.client.phone ? item.client.phone.replace(/[^0-9+]/g, '') : '';

              return (
                <div
                  key={item.id}
                  className="rounded-2xl app-card bg-surface border border-line p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[var(--text-muted)]">
                        #{item.rank}
                      </span>
                      <span className="font-serif font-bold text-base text-[var(--text-primary)]">
                        {item.client.name}
                      </span>
                      <span className="font-mono text-[11px] text-[var(--text-muted)]">
                        ({item.invoice.milestone_label})
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-mono text-[var(--text-muted)]">
                      <span className="font-bold text-[var(--text-primary)]">
                        {formatINR(item.balance)}
                      </span>
                      <span>•</span>
                      <span>
                        {item.daysOverdue > 0
                          ? `${item.daysOverdue}d overdue`
                          : `due in ${item.daysUntilDue}d`}
                      </span>
                      <span>•</span>
                      <span className="text-[var(--money-in)]">
                        +{formatINR(item.components.cashImpact)} lift
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenReminder(item)}
                      type="button"
                      className="inline-flex items-center gap-1 rounded-full bg-[var(--text-primary)] text-[var(--bg-canvas)] px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider font-semibold hover:opacity-90 transition-opacity"
                    >
                      <Send className="w-3 h-3 text-[var(--money-in)]" />
                      <span>Remind</span>
                    </button>
                    {cleanPhone && (
                      <a
                        href={`tel:${cleanPhone}`}
                        className="inline-flex items-center gap-1 rounded-full border border-[var(--border-line)] bg-[var(--bg-surface)] text-[var(--text-primary)] px-3 py-1.5 text-xs font-mono uppercase tracking-wider font-semibold hover:bg-[var(--bg-surface-subtle)] transition-colors"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Call</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. "Bills going out in the next 7 days" strip */}
      <div className="p-5 rounded-2xl app-card bg-surface border border-line space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-[#B53A26]" />
            <h3 className="font-serif italic text-lg font-bold text-[var(--text-primary)]">
              Bills going out in the next 7 days
            </h3>
          </div>
          <span className="font-mono text-xs text-[var(--text-muted)]">
            Fixed outflows you must cover
          </span>
        </div>

        {billsNext7Days && billsNext7Days.length > 0 ? (
          <div className="divide-y divide-[#C8C2B5]/40">
            {billsNext7Days.map((bill, idx) => (
              <div
                key={`${bill.date}_${bill.label}_${idx}`}
                className="py-2.5 flex items-center justify-between text-xs font-mono"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[var(--text-muted)]">
                    {format(parseISO(bill.date), 'EEE, d MMM')}
                  </span>
                  <span className="font-sans font-medium text-[var(--text-primary)] text-sm">
                    {bill.label}
                  </span>
                </div>
                <span className="font-serif font-bold text-sm text-[var(--money-out)]">
                  -{formatINR(bill.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[var(--text-muted)] font-mono py-2">
            No recurring bills or scheduled expenses falling within the next 7 calendar days.
          </p>
        )}
      </div>

      {/* Reminder Slide-Over Drawer */}
      {selectedItemForReminder && (
        <ReminderDrawer
          isOpen={reminderDrawerOpen}
          onClose={() => {
            setReminderDrawerOpen(false);
            setSelectedItemForReminder(null);
          }}
          invoiceId={selectedItemForReminder.invoice.id}
          defaultTone={suggestDefaultTone(
            selectedItemForReminder.daysOverdue,
            selectedItemForReminder.client.payment_reliability
          )}
          clientName={selectedItemForReminder.client.name}
          amountFormatted={formatINR(selectedItemForReminder.balance)}
        />
      )}

      {/* Payment Recording Modal */}
      {isPaymentOpen && paymentItem && (
        <Modal
          isOpen={isPaymentOpen}
          onClose={() => {
            setIsPaymentOpen(false);
            setPaymentItem(null);
          }}
          title={`Record Payment: ${paymentItem.client.name}`}
        >
          <form onSubmit={handleSubmitPayment} className="space-y-4">
            <div className="p-3 rounded-xl bg-[#F5F3EE] border border-[#C8C2B5] text-xs font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-[#5F626A]">Milestone:</span>
                <span className="font-semibold text-[#16181D]">
                  {paymentItem.invoice.milestone_label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5F626A]">Total Amount:</span>
                <span className="font-semibold text-[#16181D]">
                  {formatINR(paymentItem.invoice.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5F626A]">Already Paid:</span>
                <span className="font-semibold text-[#1D6B52]">
                  {formatINR(paymentItem.invoice.paid_amount)}
                </span>
              </div>
              <div className="flex justify-between border-t border-[#C8C2B5] pt-1">
                <span className="text-[#5F626A]">Remaining Balance:</span>
                <span className="font-bold text-[#16181D]">
                  {formatINR(paymentItem.balance)}
                </span>
              </div>
            </div>

            {paymentError && (
              <div className="p-3 rounded-xl bg-[#F8E9E4] border border-[#B53A26] text-xs text-[#B53A26]">
                {paymentError}
              </div>
            )}

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#5F626A] font-semibold mb-1">
                Payment Amount (₹)
              </label>
              <input
                type="number"
                min="1"
                max={paymentItem.balance}
                step="any"
                required
                value={paymentAmount || ''}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-[#C8C2B5] bg-white font-mono text-sm focus:outline-none focus:border-[#16181D]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#5F626A] font-semibold mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#C8C2B5] bg-white font-mono text-xs focus:outline-none focus:border-[#16181D]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#5F626A] font-semibold mb-1">
                  Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 rounded-xl border border-[#C8C2B5] bg-white font-mono text-xs focus:outline-none focus:border-[#16181D]"
                >
                  <option value="UPI">UPI</option>
                  <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#5F626A] font-semibold mb-1">
                Reference / UTR (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. UPI Ref / 12-digit UTR"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#C8C2B5] bg-white font-mono text-xs focus:outline-none focus:border-[#16181D]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsPaymentOpen(false);
                  setPaymentItem(null);
                }}
                className="px-4 py-2 rounded-full border border-[#C8C2B5] bg-white font-mono text-xs uppercase tracking-wider font-semibold text-[#5F626A] hover:bg-[#F5F3EE]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={paymentSubmitting}
                className="px-5 py-2 rounded-full bg-[#16181D] text-[#F5F3EE] font-mono text-xs uppercase tracking-wider font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {paymentSubmitting ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
