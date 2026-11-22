import { CircleCheck, CircleDashed, Clock, FileText, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatDate, formatINR } from '@/lib/format';
import { Link } from '@/lib/router';
import type { Invoice } from '@/lib/types';

const icon = { paid: CircleCheck, partially_paid: CircleDashed, sent: Clock, overdue: TriangleAlert, draft: FileText };
const word = { paid: 'Paid', partially_paid: 'Part-paid', sent: 'Due', overdue: 'Overdue', draft: 'Not sent' };

export function MilestoneTimeline({ milestones, currentId }: { milestones: Invoice[]; currentId: string }) {
  return (
    <ol className="relative">
      {milestones.map((m, idx) => {
        const Icon = icon[m.status] || FileText;
        const last = idx === milestones.length - 1;
        const current = m.id === currentId;
        const color = m.status === 'paid' ? 'text-in' : m.status === 'overdue' ? 'text-out' : m.status === 'partially_paid' ? 'text-primary-text' : 'text-ink-3';
        return (
          <li key={m.id} className="relative flex gap-4 pb-5 last:pb-0">
            {!last && <span className={cn('absolute top-9 bottom-1 left-[17px] w-0.5 rounded-full', m.status === 'paid' ? 'bg-in/50' : 'bg-line-strong')} aria-hidden />}
            <span className={cn('relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border-2 bg-surface', m.status === 'paid' ? 'border-in' : m.status === 'overdue' ? 'border-out' : 'border-line-strong', color)}>
              <Icon className="size-4" aria-hidden strokeWidth={2.4} />
            </span>
            <div className={cn('min-w-0 flex-1 rounded-2xl px-3 py-2', current && 'bg-surface-2 ring-1 ring-line-strong')}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                {current ? (
                  <p className="font-semibold">
                    {m.milestone_label} <span className="text-xs font-medium text-ink-3">(this invoice)</span>
                  </p>
                ) : (
                  <Link to={`/invoices/${m.id}`} className="rounded font-semibold underline-offset-4 hover:underline">
                    {m.milestone_label}
                  </Link>
                )}
                <span className="num font-semibold">{formatINR(m.amount)}</span>
              </div>
              <p className="text-sm text-ink-2">
                <span className={cn('font-medium', color)}>{word[m.status]}</span>
                {' · '}
                {m.status === 'paid' ? `settled` : `due ${formatDate(m.due_date)}`}
                {m.status === 'partially_paid' && <span className="num"> · {formatINR(m.paid_amount)} in</span>}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
