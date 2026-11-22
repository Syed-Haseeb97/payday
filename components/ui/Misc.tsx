import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden />;
}

export function PageLoading({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" className="space-y-4">
      <span className="sr-only">{label}…</span>
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-64 w-full" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, subtitle, action }: { eyebrow?: ReactNode; title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-sm font-medium text-ink-3">{eyebrow}</p>}
        <h1 tabIndex={-1} data-page-title className="text-[1.75rem] leading-tight font-semibold tracking-tight focus:outline-none sm:text-3xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1.5 max-w-prose text-ink-2">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function Progress({ value, max, tone = 'in', label }: { value: number; max: number; tone?: 'in' | 'primary' | 'out'; label: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const color = tone === 'in' ? 'bg-in' : tone === 'out' ? 'bg-out' : 'bg-primary';
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="h-2 w-full overflow-hidden rounded-full bg-surface-3">
      <div className={cn('h-full rounded-full transition-[width] duration-700', color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ErrorState({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return (
    <div role="alert" className="card p-6 text-center">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-ink-2">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
