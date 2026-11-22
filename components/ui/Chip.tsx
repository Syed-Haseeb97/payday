import { Ban, CircleCheck, CircleDashed, Clock, FileText, HandCoins, Hourglass, Sparkles, ThumbsUp, TriangleAlert, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { formatINR } from '@/lib/format';
import type { Invoice, PaymentReliability } from '@/lib/types';

export type Tone = 'in' | 'out' | 'warn' | 'primary' | 'neutral';

const tones: Record<Tone, string> = {
  in: 'bg-in/12 text-in border-in/25',
  out: 'bg-out/12 text-out border-out/30',
  warn: 'bg-warn/12 text-warn border-warn/30',
  primary: 'bg-primary/12 text-primary-text border-primary/30',
  neutral: 'bg-surface-2 text-ink-2 border-line',
};

/** Status is always icon + text, never colour alone. */
export function Chip({ tone = 'neutral', icon: Icon, children, className }: { tone?: Tone; icon?: LucideIcon; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold whitespace-nowrap', tones[tone], className)}>
      {Icon && <Icon className="size-3.5 shrink-0" aria-hidden strokeWidth={2.4} />}
      {children}
    </span>
  );
}

const statusMap: Record<Invoice['status'], { label: string; tone: Tone; icon: LucideIcon }> = {
  paid: { label: 'Paid', tone: 'in', icon: CircleCheck },
  partially_paid: { label: 'Partial', tone: 'primary', icon: CircleDashed },
  sent: { label: 'Due', tone: 'neutral', icon: Clock },
  overdue: { label: 'Overdue', tone: 'out', icon: TriangleAlert },
  draft: { label: 'Draft', tone: 'neutral', icon: FileText },
};

export function StatusChip({ status }: { status: Invoice['status'] }) {
  const s = statusMap[status] || statusMap.draft;
  return (
    <Chip tone={s.tone} icon={s.icon}>
      {s.label}
    </Chip>
  );
}

export function ClaimChip({ amount }: { amount: number }) {
  return (
    <Chip tone="warn" icon={HandCoins}>
      {`Payment claimed: ${formatINR(amount)}`}
    </Chip>
  );
}

const relMap: Record<PaymentReliability, { label: string; tone: Tone; icon: LucideIcon }> = {
  reliable: { label: 'Reliable', tone: 'in', icon: ThumbsUp },
  average: { label: 'Average', tone: 'neutral', icon: Clock },
  slow: { label: 'Slow payer', tone: 'warn', icon: Hourglass },
  unreliable: { label: 'Unreliable', tone: 'out', icon: Ban },
  new: { label: 'New client', tone: 'primary', icon: Sparkles },
};

export function ReliabilityChip({ reliability, delayDays }: { reliability: PaymentReliability; delayDays?: number }) {
  const r = relMap[reliability] || relMap.new;
  return (
    <Chip tone={r.tone} icon={r.icon}>
      {r.label}
      {delayDays ? <span className="num font-medium">· ~{delayDays}d late</span> : null}
    </Chip>
  );
}
