'use client';

import React from 'react';
import { InvoiceStatus } from '@/lib/db/types';

interface StatusBadgeProps {
  status: InvoiceStatus;
  daysOverdue?: number;
}

export function StatusBadge({ status, daysOverdue }: StatusBadgeProps) {
  switch (status) {
    case 'paid':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--money-in)] bg-[var(--money-in-bg)] px-2.5 py-0.5 font-mono text-[10px] sm:text-xs uppercase tracking-wider text-[var(--money-in)] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--money-in)]" />
          <span>Paid</span>
        </span>
      );
    case 'overdue':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--money-out)] bg-[var(--money-out-bg)] px-2.5 py-0.5 font-mono text-[10px] sm:text-xs uppercase tracking-wider text-[var(--money-out)] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--money-out)]" />
          <span>
            Overdue{daysOverdue !== undefined && daysOverdue > 0 ? ` (${daysOverdue}d)` : ''}
          </span>
        </span>
      );
    case 'partially_paid':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--money-warn)] bg-[var(--money-warn-bg)] px-2.5 py-0.5 font-mono text-[10px] sm:text-xs uppercase tracking-wider text-[var(--money-warn)] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--money-warn)]" />
          <span>Partially Paid</span>
        </span>
      );
    case 'sent':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-line)] bg-[var(--bg-surface-subtle)] px-2.5 py-0.5 font-mono text-[10px] sm:text-xs uppercase tracking-wider text-[var(--text-primary)] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
          <span>Sent</span>
        </span>
      );
    case 'draft':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-line-subtle)] bg-[var(--bg-surface-subtle)] px-2.5 py-0.5 font-mono text-[10px] sm:text-xs uppercase tracking-wider text-[var(--text-muted)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-faint)]" />
          <span>Draft</span>
        </span>
      );
  }
}
