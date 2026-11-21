import React from 'react';
import { Users, UserPlus } from 'lucide-react';

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif italic text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
            Clients
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)] font-mono">
            Client contacts, payment reliability history, and average delay days
          </p>
        </div>
        <div>
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 rounded-full bg-[var(--text-primary)] text-[var(--bg-canvas)] px-4 py-2 text-xs font-mono uppercase tracking-wider font-semibold opacity-60 cursor-not-allowed"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Client</span>
          </button>
        </div>
      </div>

      {/* Placeholder State */}
      <div className="p-10 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)] text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-line)] flex items-center justify-center">
          <Users className="w-6 h-6 text-[var(--text-muted)]" />
        </div>
        <h2 className="font-serif italic text-xl font-bold text-[var(--text-primary)]">
          Client Directory (Empty)
        </h2>
        <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
          Manage client records with payment reliability tracking (High, Medium, Low) and historical average delay days to calibrate your 90-day cash forecast.
        </p>
      </div>
    </div>
  );
}
