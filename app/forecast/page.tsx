import React from 'react';
import { TrendingUp, AlertTriangle, Sliders, Calendar } from 'lucide-react';

export default function ForecastPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif italic text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
            90-Day Cash Forecast
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)] font-mono">
            Daily balance projection: Opening cash + Expected receipts − Fixed EMIs &amp; bills
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-line)] bg-[var(--bg-surface)] px-3 py-1 text-xs font-mono text-[var(--text-muted)]">
            <Calendar className="w-3.5 h-3.5" />
            <span>Next 90 Days</span>
          </div>
        </div>
      </div>

      {/* Mandatory Disclaimer Note */}
      <div className="p-3.5 rounded-xl border border-[var(--border-line-subtle)] bg-[var(--bg-surface-subtle)]/70 flex items-center justify-between text-xs text-[var(--text-muted)] font-mono">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-faint)]" />
          <span>Estimates based on the data you entered.</span>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-[var(--text-faint)]">
          Financial Advisory Notice
        </span>
      </div>

      {/* Forecast Metric Cards Placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)]">
          <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
            Opening Balance
          </span>
          <div className="mt-2 text-2xl font-serif font-bold text-[var(--text-primary)]">
            ₹50,000
          </div>
          <span className="text-xs text-[var(--text-faint)] font-mono">
            Bank + Cash reserve
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)]">
          <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
            Lowest Cash Day
          </span>
          <div className="mt-2 text-2xl font-serif font-bold text-[var(--money-warn)]">
            --
          </div>
          <span className="text-xs text-[var(--text-faint)] font-mono">
            Projected lowest balance
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)]">
          <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
            What-If Scenarios
          </span>
          <div className="mt-2 text-2xl font-serif font-bold text-[var(--text-primary)]">
            Ready
          </div>
          <span className="text-xs text-[var(--text-faint)] font-mono">
            Simulate delays &amp; cancellations
          </span>
        </div>
      </div>

      {/* Placeholder Chart / Forecast Surface */}
      <div className="p-10 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)] text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-line)] flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-[var(--text-muted)]" />
        </div>
        <h2 className="font-serif italic text-xl font-bold text-[var(--text-primary)]">
          Daily Balance Projection Curve
        </h2>
        <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
          The 90-day simulation calculates expected invoice collections adjusted for each client&apos;s historical delay, deducting recurring studio rent, equipment EMIs, and salaries.
        </p>
      </div>
    </div>
  );
}
