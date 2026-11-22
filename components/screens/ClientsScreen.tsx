'use client';

import { Phone } from 'lucide-react';
import { ReliabilityChip } from '@/components/ui/Chip';
import { PageHeader } from '@/components/ui/Misc';
import { formatDate, formatINR, initials } from '@/lib/format';
import type { ClientSummary } from '@/lib/types';

export function ClientsScreen({ clients }: { clients: ClientSummary[] }) {
  const owing = clients.filter((c) => c.outstanding > 0).length;
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="People" title="Clients" subtitle={`${clients.length} clients · ${owing} with money outstanding. Reliability is learned from how they've paid you.`} />
      <ul className="grid gap-3 md:grid-cols-2">
        {clients.map(({ client, outstanding, bookings, next_due }) => (
          <li key={client.id} className="card flex items-start gap-3 p-4 sm:p-5">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-surface-3 font-semibold text-ink-2" aria-hidden>
              {initials(client.name)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <h2 className="font-semibold">{client.name}</h2>
                <span className="num font-semibold">{outstanding > 0 ? formatINR(outstanding) : 'Settled'}</span>
              </div>
              <p className="text-sm text-ink-3">
                {client.company ? `${client.company} · ` : ''}
                {bookings} booking{bookings === 1 ? '' : 's'}
                {next_due ? ` · next due ${formatDate(next_due)}` : ''}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <ReliabilityChip reliability={client.payment_reliability} delayDays={client.average_delay_days} />
                {client.phone && (
                  <a href={`tel:${client.phone}`} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-medium text-ink-2 hover:text-ink">
                    <Phone className="size-4" aria-hidden />
                    <span className="sr-only">Call {client.name}</span>
                    <span aria-hidden>Call</span>
                  </a>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
