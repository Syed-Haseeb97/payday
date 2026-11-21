import React from 'react';
import { CalendarDays, Plus, MessageSquare } from 'lucide-react';

export default function BookingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif italic text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
            Bookings
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)] font-mono">
            Wedding shoots, event dates, and 30/50/20 milestone invoice schedules
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border-line)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-mono uppercase tracking-wider font-semibold opacity-60 cursor-not-allowed"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>AI Quick Entry</span>
          </button>
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 rounded-full bg-[var(--text-primary)] text-[var(--bg-canvas)] px-4 py-2 text-xs font-mono uppercase tracking-wider font-semibold opacity-60 cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {/* Placeholder State */}
      <div className="p-10 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)] text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-line)] flex items-center justify-center">
          <CalendarDays className="w-6 h-6 text-[var(--text-muted)]" />
        </div>
        <h2 className="font-serif italic text-xl font-bold text-[var(--text-primary)]">
          No Bookings Yet
        </h2>
        <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
          Add wedding bookings manually or paste chat snippets (&ldquo;Sharma wedding 14 Dec, ₹80k, ₹25k advance paid&rdquo;). Bookings automatically split into milestone invoices.
        </p>
      </div>
    </div>
  );
}
