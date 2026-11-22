'use client';

import { Check, Flame, HandCoins, Send } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Chip, ClaimChip, ReliabilityChip, StatusChip } from '@/components/ui/Chip';
import { Money } from '@/components/ui/Money';
import { cn } from '@/lib/cn';
import { formatDue, formatINR } from '@/lib/format';
import type { BadDay, BadDayItem } from '@/lib/types';

interface Props {
  data: BadDay;
  onRemind: (item: BadDayItem) => void;
}

export function BadDayScreen({ data, onRemind }: Props) {
  return (
    <div className="space-y-6">
      <header className="anim-rise">
        <p className="flex items-center gap-2 text-sm font-semibold tracking-wider text-out uppercase">
          <Flame className="size-4" aria-hidden /> Bad day mode
        </p>
        <h1 tabIndex={-1} data-page-title className="mt-2 text-[1.75rem] leading-tight font-semibold tracking-tight focus:outline-none sm:text-3xl">
          Breathe. Here's who to chase first.
        </h1>
        <p className="mt-1.5 max-w-prose text-ink-2">Ranked by what moves your cash the most. One action each, then put the phone down.</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <div className="card border-out/35 bg-out/[0.06] p-4">
          <p className="text-sm font-medium text-ink-2">Overdue now</p>
          <Money value={data.overdue_total} roll className="mt-1 block text-2xl font-semibold text-out" />
        </div>
        <div className="card p-4">
          <p className="text-sm font-medium text-ink-2">Due in 14 days</p>
          <Money value={data.due_soon_total} roll className="mt-1 block text-2xl font-semibold" />
        </div>
      </div>

      <ol className="space-y-3" aria-label="Triage list, most urgent first">
        {data.items.map((item, idx) => (
          <TriageRow key={item.invoice.id} item={item} rank={idx + 1} onRemind={onRemind} />
        ))}
      </ol>
    </div>
  );
}

function TriageRow({ item, rank, onRemind }: { item: BadDayItem; rank: number; onRemind: (i: BadDayItem) => void }) {
  const overdue = item.due_in_days < 0;
  const top = rank === 1;
  const pendingClaim = item.invoice.payment_claims?.find((c) => c.status === 'pending');

  return (
    <li className={cn('card anim-rise relative overflow-hidden p-4 sm:p-5', top && 'border-out/45')} style={{ animationDelay: `${rank * 50}ms` }}>
      {top && <div className="absolute inset-y-0 left-0 w-1 bg-out" aria-hidden />}
      <div className="flex items-start gap-3 sm:gap-4">
        <span className={cn('num flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold', top ? 'bg-out text-on-out' : 'bg-surface-3 text-ink-2')} aria-label={`Rank ${rank}`}>
          {rank}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 className="font-semibold">
              {item.client.name}
              {item.client.company && <span className="font-normal text-ink-3"> · {item.client.company}</span>}
            </h2>
            <span className="num text-xl font-semibold">{formatINR(item.outstanding)}</span>
          </div>
          <p className={cn('mt-0.5 text-sm font-medium', overdue ? 'text-out' : 'text-ink-2')}>
            {item.invoice.milestone_label} · {formatDue(item.due_in_days)}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <ReliabilityChip reliability={item.client.payment_reliability} delayDays={item.client.average_delay_days} />
            {overdue && <StatusChip status="overdue" />}
            {pendingClaim && <ClaimChip amount={pendingClaim.claimed_amount} />}
            {item.reminded_on && (
              <Chip tone="in" icon={Check}>
                Reminded today
              </Chip>
            )}
          </div>
          <p className="mt-2 text-sm text-ink-2">{item.reason}</p>
          <div className="mt-3">
            {item.action === 'review_claim' ? (
              <ButtonLink to={`/invoices/${item.invoice.id}`} variant="primary" icon={HandCoins} full className="sm:w-auto">
                Review claim
              </ButtonLink>
            ) : (
              <Button icon={Send} variant={top ? 'danger' : item.reminded_on ? 'secondary' : 'primary'} full className="sm:w-auto" onClick={() => onRemind(item)}>
                {item.reminded_on ? 'Remind again' : (
                  <>
                    <span className="sr-only">Draft WhatsApp Reminder · </span>
                    <span>Send reminder</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
