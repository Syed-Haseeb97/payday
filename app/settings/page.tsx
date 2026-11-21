import React from 'react';
import { Settings as SettingsIcon, IndianRupee, Bell, Repeat, Lock } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif italic text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
            Settings
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)] font-mono">
            Opening cash balance, recurring expenses, UPI ID, and demo account
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cash & Currency */}
        <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)] space-y-4">
          <div className="flex items-center gap-2 text-sm font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold">
            <IndianRupee className="w-4 h-4 text-[var(--text-muted)]" />
            <span>Cash &amp; Regional Formatting</span>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Opening Cash Reserve
              </label>
              <input
                type="text"
                disabled
                defaultValue="₹50,000"
                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-line)] bg-[var(--bg-surface-subtle)] text-[var(--text-primary)] font-mono text-sm opacity-80 cursor-not-allowed"
              />
              <span className="text-[11px] text-[var(--text-faint)] mt-1 block font-mono">
                Opening cash for 90-day balance projections.
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Currency &amp; Locale
              </label>
              <input
                type="text"
                disabled
                defaultValue="INR (₹) · en-IN (Lakhs / Crores)"
                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-line)] bg-[var(--bg-surface-subtle)] text-[var(--text-primary)] font-mono text-sm opacity-80 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Demo Account Info */}
        <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)] space-y-4">
          <div className="flex items-center gap-2 text-sm font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold">
            <Lock className="w-4 h-4 text-[var(--text-muted)]" />
            <span>Account Profile (Single Demo User)</span>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Photographer Name &amp; Studio
              </label>
              <input
                type="text"
                disabled
                defaultValue="Arjun Verma · Arjun Visuals"
                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-line)] bg-[var(--bg-surface-subtle)] text-[var(--text-primary)] font-mono text-sm opacity-80 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">
                UPI ID for Payment Links &amp; Reminders
              </label>
              <input
                type="text"
                disabled
                defaultValue="arjunvisuals@okaxis"
                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-line)] bg-[var(--bg-surface-subtle)] text-[var(--text-primary)] font-mono text-sm opacity-80 cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
