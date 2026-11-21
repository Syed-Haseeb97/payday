import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowDownRight, Clock, Flame, Receipt, Users } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif italic text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)] font-mono">
            Cash overview, aging receivables, and today&apos;s actions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/bad-day"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--money-out)] bg-[var(--money-out-bg)] px-4 py-2 text-xs font-mono font-medium text-[var(--money-out)] hover:opacity-90 transition-opacity"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Bad Day Mode</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Row Placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Outstanding */}
        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)]">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
            <span>Total Outstanding</span>
            <Receipt className="w-4 h-4 text-[var(--money-out)]" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[var(--money-out)]">
            ₹0
          </div>
          <p className="mt-1 text-xs text-[var(--text-faint)] font-mono">
            Across 0 milestone invoices
          </p>
        </div>

        {/* Overdue (30+ Days) */}
        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)]">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
            <span>Severely Overdue</span>
            <Clock className="w-4 h-4 text-[var(--money-warn)]" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[var(--text-primary)]">
            ₹0
          </div>
          <p className="mt-1 text-xs text-[var(--text-faint)] font-mono">
            Aging bucket 30+ days
          </p>
        </div>

        {/* Expected Inflow (Next 30 Days) */}
        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)]">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
            <span>Expected Inflows</span>
            <ArrowUpRight className="w-4 h-4 text-[var(--money-in)]" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[var(--money-in)]">
            ₹0
          </div>
          <p className="mt-1 text-xs text-[var(--text-faint)] font-mono">
            Advance & shoot milestones
          </p>
        </div>

        {/* Active Clients */}
        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)]">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
            <span>Active Clients</span>
            <Users className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[var(--text-primary)]">
            0
          </div>
          <p className="mt-1 text-xs text-[var(--text-faint)] font-mono">
            Couples & event organisers
          </p>
        </div>
      </div>

      {/* Main Content Placeholder */}
      <div className="p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)] text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-line)] flex items-center justify-center">
          <Receipt className="w-6 h-6 text-[var(--text-muted)]" />
        </div>
        <h2 className="font-serif italic text-xl font-bold text-[var(--text-primary)]">
          &ldquo;Who Owes Me&rdquo; Dashboard Ready
        </h2>
        <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
          Per-client receivables, aging buckets (0-7, 8-30, 30+ days), and quick reminder links will appear here once bookings and invoices are added.
        </p>
        <div className="pt-2">
          <Link
            href="/bookings"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--text-primary)] text-[var(--bg-canvas)] px-5 py-2.5 text-xs font-mono uppercase tracking-wider font-semibold hover:opacity-90 transition-opacity"
          >
            Go to Bookings
          </Link>
        </div>
      </div>
    </div>
  );
}
