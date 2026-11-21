'use client';

import React from 'react';
import { PaymentReliability } from '@/lib/db/types';

interface ReliabilityBadgeProps {
  reliability: PaymentReliability;
  delayDays?: number;
}

export function ReliabilityBadge({ reliability, delayDays }: ReliabilityBadgeProps) {
  switch (reliability) {
    case 'reliable':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--money-in)] bg-[var(--money-in-bg)] px-2.5 py-0.5 font-mono text-[10px] sm:text-xs uppercase tracking-wider text-[var(--money-in)] font-medium">
          <span>Reliable</span>
          {delayDays !== undefined && <span className="opacity-75">({delayDays}d)</span>}
        </span>
      );
    case 'average':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-line)] bg-[var(--bg-surface-subtle)] px-2.5 py-0.5 font-mono text-[10px] sm:text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium">
          <span>Average</span>
          {delayDays !== undefined && <span className="opacity-75">({delayDays}d)</span>}
        </span>
      );
    case 'slow':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--money-warn)] bg-[var(--money-warn-bg)] px-2.5 py-0.5 font-mono text-[10px] sm:text-xs uppercase tracking-wider text-[var(--money-warn)] font-medium">
          <span>Slow</span>
          {delayDays !== undefined && <span className="opacity-75">(~{delayDays}d)</span>}
        </span>
      );
    case 'unreliable':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--money-out)] bg-[var(--money-out-bg)] px-2.5 py-0.5 font-mono text-[10px] sm:text-xs uppercase tracking-wider text-[var(--money-out)] font-medium">
          <span>Unreliable</span>
          {delayDays !== undefined && <span className="opacity-75">({delayDays}d+)</span>}
        </span>
      );
    case 'new':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-line-subtle)] bg-[var(--bg-surface-subtle)] px-2.5 py-0.5 font-mono text-[10px] sm:text-xs uppercase tracking-wider text-[var(--text-faint)]">
          <span>New Client</span>
        </span>
      );
  }
}
