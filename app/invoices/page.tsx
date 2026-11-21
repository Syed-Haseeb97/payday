import React from 'react';
import { Receipt, QrCode } from 'lucide-react';

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif italic text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
            Invoices
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)] font-mono">
            Milestone invoices, payment tracking, UPI links, and WhatsApp reminders
          </p>
        </div>
      </div>

      {/* Placeholder State */}
      <div className="p-10 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)] text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-line)] flex items-center justify-center">
          <Receipt className="w-6 h-6 text-[var(--text-muted)]" />
        </div>
        <h2 className="font-serif italic text-xl font-bold text-[var(--text-primary)]">
          Milestone Invoices (Empty)
        </h2>
        <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
          Each booking automatically generates milestone invoices: Advance (30%), Shoot Day (50%), and Final Delivery (20%) with UPI payment links and partial payment tracking.
        </p>
      </div>
    </div>
  );
}
