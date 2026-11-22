'use client';

import { ChevronRight, Search, CreditCard } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ClaimChip, StatusChip } from '@/components/ui/Chip';
import { Money } from '@/components/ui/Money';
import { PageHeader } from '@/components/ui/Misc';
import { Button } from '@/components/ui/Button';
import { RecordPaymentSheet, type RecordTarget } from '@/components/invoices/RecordPaymentSheet';
import { cn } from '@/lib/cn';
import { formatDate, formatINR } from '@/lib/format';
import { Link } from '@/lib/router';
import type { InvoiceSummary } from '@/lib/types';

type Filter = 'all' | 'due' | 'overdue' | 'partial' | 'claimed' | 'paid';

const FILTERS: { id: Filter; label: string; test: (s: InvoiceSummary) => boolean }[] = [
  { id: 'all', label: 'All', test: () => true },
  { id: 'overdue', label: 'Overdue', test: (s) => s.invoice.status === 'overdue' },
  { id: 'due', label: 'Due', test: (s) => s.invoice.status === 'sent' },
  { id: 'partial', label: 'Partial', test: (s) => s.invoice.status === 'partially_paid' },
  { id: 'claimed', label: 'Claimed', test: (s) => Boolean(s.pending_claim) },
  { id: 'paid', label: 'Paid', test: (s) => s.invoice.status === 'paid' },
];

export function InvoicesScreen({ invoices, onRefresh }: { invoices: InvoiceSummary[]; onRefresh?: () => void }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [recordTarget, setRecordTarget] = useState<RecordTarget | null>(null);

  const visible = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter)!;
    const q = query.trim().toLowerCase();
    return invoices.filter((s) => f.test(s) && (!q || `${s.client_name} ${s.client_company ?? ''} ${s.invoice.invoice_number} ${s.booking_title}`.toLowerCase().includes(q)));
  }, [invoices, filter, query]);

  const outstanding = invoices.reduce((t, s) => t + s.outstanding, 0);
  const collected = invoices.reduce((t, s) => t + s.invoice.paid_amount, 0);

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Money" title="Invoices" subtitle="Every milestone, who's paid and who hasn't." />

      <div className="grid grid-cols-2 gap-3 lg:max-w-xl">
        <div className="card p-4">
          <p className="text-sm font-medium text-ink-2">Outstanding</p>
          <Money value={outstanding} roll className="mt-1 block text-2xl font-semibold" />
        </div>
        <div className="card p-4">
          <p className="text-sm font-medium text-ink-2">Collected</p>
          <Money value={collected} roll className="mt-1 block text-2xl font-semibold text-in" />
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label="Filter invoices" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
          {FILTERS.map((f) => {
            const count = invoices.filter(f.test).length;
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(f.id)}
                className={cn('flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors', active ? 'border-primary bg-primary text-on-primary' : 'border-line-strong bg-surface text-ink-2 hover:text-ink')}
              >
                {f.label}
                <span className={cn('num rounded-full px-1.5 text-xs', active ? 'bg-on-primary/15' : 'bg-surface-3')}>{count}</span>
              </button>
            );
          })}
        </div>
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
          <label htmlFor="inv-search" className="sr-only">
            Search invoices
          </label>
          <input id="inv-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search client or invoice" className="min-h-11 w-full rounded-full border border-line-strong bg-surface pr-4 pl-10 text-sm placeholder:text-ink-3 focus:border-primary" />
        </div>
      </div>

      <ul className="card divide-y divide-line overflow-hidden p-0" aria-live="polite">
        {visible.length === 0 && <li className="p-8 text-center text-ink-2">No invoices match.</li>}
        {visible.map((s) => (
          <li key={s.invoice.id}>
            <div className="flex items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-surface-2 sm:px-5">
              <Link to={`/invoices/${s.invoice.id}`} className="min-w-0 flex-1 block">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-semibold">{s.client_company ?? s.client_name}</span>
                  <span className="text-sm text-ink-3">{s.invoice.milestone_label}</span>
                </div>
                <p className="num mt-0.5 text-xs text-ink-3">
                  {s.invoice.invoice_number} · due {formatDate(s.invoice.due_date)}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <StatusChip status={s.invoice.status} />
                  {s.pending_claim && <ClaimChip amount={s.pending_claim.claimed_amount} />}
                </div>
              </Link>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="num font-semibold">{formatINR(s.invoice.status === 'paid' ? s.invoice.amount : s.outstanding)}</p>
                  <p className="text-xs text-ink-3">{s.invoice.status === 'paid' ? 'received' : s.invoice.paid_amount > 0 ? `of ${formatINR(s.invoice.amount)}` : 'to collect'}</p>
                </div>
                {s.invoice.status !== 'paid' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={CreditCard}
                    onClick={() =>
                      setRecordTarget({
                        invoiceId: s.invoice.id,
                        label: `${s.client_name} · ${s.invoice.milestone_label}`,
                        outstanding: s.outstanding,
                      })
                    }
                  >
                    Pay
                  </Button>
                )}
                <Link to={`/invoices/${s.invoice.id}`} className="text-ink-3 hover:text-ink" aria-label={`View invoice ${s.invoice.invoice_number}`}>
                  <ChevronRight className="size-5 shrink-0" aria-hidden />
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <RecordPaymentSheet
        target={recordTarget}
        onClose={() => setRecordTarget(null)}
        onRecorded={() => onRefresh?.()}
      />
    </div>
  );
}
