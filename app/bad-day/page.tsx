import React from 'react';
import { Flame, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function BadDayPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--money-out)] bg-[var(--money-out-bg)] px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-[var(--money-out)] font-semibold mb-2">
            <Flame className="w-3.5 h-3.5" />
            <span>Signature Triage Feature</span>
          </div>
          <h1 className="font-serif italic text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
            Bad Day Mode
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)] font-mono">
            Today&apos;s top actions ranked strictly by cash impact, overdue days, and client reliability
          </p>
        </div>
      </div>

      {/* Triage Overview Card */}
      <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)]">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-line-subtle)]">
          <div>
            <h2 className="text-sm font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold">
              Today&apos;s Cash Priority Stack
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Ranked mathematically: High impact + High overdue + High probability of collection
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
              Urgent Collectible
            </span>
            <div className="text-xl font-serif font-bold text-[var(--money-out)]">
              ₹0
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="py-12 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-[var(--money-in-bg)] flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-[var(--money-in)]" />
          </div>
          <h3 className="font-serif italic text-xl font-bold text-[var(--text-primary)]">
            Zero Critical Overdues
          </h3>
          <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
            When unpaid invoices or upcoming cash dips emerge, Bad Day Mode generates prioritized 1-tap actions (with prefilled WhatsApp reminders in Friendly, Firm, or Final tones).
          </p>
        </div>
      </div>
    </div>
  );
}
