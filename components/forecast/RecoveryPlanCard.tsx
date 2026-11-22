'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  CheckCircle2,
  Calendar,
  Send,
  CreditCard,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/Button';
import { RecoveryPlan, RecoveryAction } from '@/lib/recovery';
import { formatINR } from '@/lib/money';

interface RecoveryPlanCardProps {
  plan: RecoveryPlan;
  onOpenReminder: (action: RecoveryAction) => void;
  onRecordPayment: (action: RecoveryAction) => void;
}

export function RecoveryPlanCard({
  plan,
  onOpenReminder,
  onRecordPayment,
}: RecoveryPlanCardProps) {
  if (!plan.needed) return null;

  return (
    <div
      id="recovery-plan"
      className="p-5 sm:p-6 rounded-2xl app-card bg-surface border border-line space-y-5"
    >
      <div className="flex items-start justify-between border-b border-[var(--border-line)] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#F8E9E4] border border-[#B53A26]/20 flex items-center justify-center text-[#B53A26]">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif italic text-lg sm:text-xl font-bold text-[var(--text-primary)]">
                Recovery Plan
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-mono">
                Concrete steps to bridge projected cash shortfall
              </p>
            </div>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider ${
            plan.fullyResolved
              ? 'bg-[var(--money-in-bg)] text-[var(--money-in)] border border-[var(--border-line)]'
              : 'bg-[#F6ECD9] text-[#86560D] border border-[#86560D]/20'
          }`}
        >
          {plan.fullyResolved ? 'Fully Resolves Gap' : 'Partial Recovery'}
        </span>
      </div>

      {/* Deterministic Plain Sentence */}
      <div className="p-3.5 rounded-xl border border-[var(--border-line)] bg-[var(--bg-surface-subtle)] space-y-1.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold block">
          Recommendation
        </span>
        <p className="text-xs sm:text-sm font-sans text-[var(--text-primary)] font-medium leading-relaxed">
          {plan.summarySentence}
        </p>

        <div className="pt-2 border-t border-[var(--border-line)] flex flex-wrap items-center justify-between text-xs font-mono gap-2 text-[var(--text-muted)]">
          <span>
            Current Low:{' '}
            <strong className={plan.initialLowestBalance < 0 ? 'text-[#B53A26]' : 'text-[var(--text-primary)]'}>
              {formatINR(plan.initialLowestBalance)}
            </strong>
          </span>
          <span>→</span>
          <span>
            Projected with Plan:{' '}
            <strong className="text-[var(--money-in)]">
              {formatINR(plan.resultingLowestBalance)}
            </strong>
          </span>
          <span className="text-[11px] text-[var(--text-muted)]">
            (Safe Buffer: {formatINR(plan.safeBuffer)})
          </span>
        </div>
      </div>

      {/* Action Items List */}
      <div className="space-y-3">
        <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold block">
          Prioritized Inflows ({plan.actions.length} action{plan.actions.length === 1 ? '' : 's'})
        </span>

        {plan.actions.map((act, idx) => (
          <div
            key={act.invoice.id}
            className="p-3.5 rounded-xl border border-[var(--border-line)] bg-surface hover:border-[var(--text-muted)] transition-all space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-line)] flex items-center justify-center font-mono text-[10px] font-bold text-[var(--text-primary)]">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-sans font-semibold text-[var(--text-primary)]">
                    {act.client.name}
                  </span>
                  <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded border border-[var(--border-line)] bg-[var(--bg-surface-subtle)] text-[var(--text-muted)]">
                    {act.invoice.milestone_label}
                  </span>
                  {act.isOverdue && (
                    <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-[#F8E9E4] text-[#B53A26] font-semibold">
                      {act.daysOverdueOrToDue}d overdue
                    </span>
                  )}
                </div>

                <p className="text-xs font-mono text-[var(--text-muted)] pl-7">
                  Balance due: <strong className="text-[var(--text-primary)]">{formatINR(act.amount)}</strong> · Due {act.invoice.due_date}
                </p>
              </div>

              <div className="text-right">
                <span className="font-mono text-xs font-bold text-[var(--money-in)] block">
                  +{formatINR(act.effectOnLowestBalance)}
                </span>
                <span className="font-mono text-[10px] text-[var(--text-muted)]">
                  lift on lowest
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-line)] pl-7">
              <button
                type="button"
                onClick={() => onOpenReminder(act)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#1EBE5D] text-[#072e18] text-xs font-mono font-bold transition-colors shadow-sm"
              >
                <WhatsAppIcon className="w-3.5 h-3.5 text-[#072e18]" />
                <span>Send reminder</span>
              </button>

              <button
                type="button"
                onClick={() => onRecordPayment(act)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16181D] text-[#F5F3EE] hover:bg-[#2A2D35] text-xs font-mono font-medium transition-colors"
              >
                <CreditCard className="w-3.5 h-3.5 text-[#E3EFE8]" />
                <span>Record payment</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Flexible Deferral Option if present */}
      {plan.deferral && (
        <div className="p-3.5 rounded-xl border border-[var(--border-line)] bg-[var(--bg-surface-subtle)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#86560D]" />
              <span>Alternative: Defer Upcoming Expense (+7 Days)</span>
            </span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#F6ECD9] text-[#86560D] font-semibold">
              Flexible
            </span>
          </div>

          <p className="text-xs font-sans text-[var(--text-muted)]">
            Moving <strong className="text-[var(--text-primary)]">{plan.deferral.name}</strong> ({formatINR(plan.deferral.amount)}) from {plan.deferral.originalDate} to <strong>{plan.deferral.deferredDate}</strong> improves the lowest balance to{' '}
            <strong className="text-[var(--money-in)]">{formatINR(plan.deferral.resultingLowestBalance)}</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
