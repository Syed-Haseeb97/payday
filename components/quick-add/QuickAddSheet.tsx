'use client';

import { Check, ClipboardPaste, MessageSquareText, Sparkles, TriangleAlert, WandSparkles } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { TextArea, TextField } from '@/components/ui/Field';
import { Sheet } from '@/components/ui/Sheet';
import { Skeleton } from '@/components/ui/Misc';
import { cn } from '@/lib/cn';
import { formatDateLong, formatINR, groupDigits, parseRupees } from '@/lib/format';
import type { QuickAddDraft } from '@/lib/types';

const EXAMPLE = `Sharma wedding 14 Dec, ₹80k, ₹25k advance paid`;

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

type Step =
  | { kind: 'input' }
  | { kind: 'parsing' }
  | { kind: 'error'; reason: string }
  | { kind: 'review'; detected: Partial<Record<keyof QuickAddDraft, boolean>> }
  | { kind: 'success'; count: number };

export function QuickAddSheet({ open, onClose, onCreated }: Props) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Quick add booking"
      description="Paste the client's WhatsApp message. Payday fills in the rest."
      icon={
        <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary-text">
          <WandSparkles className="size-5" aria-hidden />
        </span>
      }
    >
      {open && <Flow onCreated={onCreated} onClose={onClose} />}
    </Sheet>
  );
}

function Flow({ onCreated, onClose }: Omit<Props, 'open'>) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [step, setStep] = useState<Step>({ kind: 'input' });
  const [draft, setDraft] = useState<QuickAddDraft | null>(null);
  const [advancePaidInfo, setAdvancePaidInfo] = useState<{ paid: boolean; amount?: number }>({ paid: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  async function run(input = text) {
    if (!input.trim()) return;
    setStep({ kind: 'parsing' });
    try {
      const res = await fetch('/api/quickadd/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setStep({ kind: 'error', reason: data.error || 'Could not parse text' });
        return;
      }
      const prop = data.proposal;
      const totalAmount = prop.totalAmount || 0;
      const advAmt = prop.milestones?.find((m: { label: string; amount: number }) => m.label === 'advance')?.amount ?? Math.round(totalAmount * 0.3);
      const midAmt = prop.milestones?.find((m: { label: string; amount: number }) => m.label === 'mid')?.amount ?? Math.round(totalAmount * 0.4);
      const advPct = totalAmount > 0 ? Math.round((advAmt / totalAmount) * 100) : 30;
      const midPct = totalAmount > 0 ? Math.round((midAmt / totalAmount) * 100) : 40;
      const finalPct = 100 - advPct - midPct;

      setAdvancePaidInfo({
        paid: Boolean(prop.advancePaid),
        amount: prop.advancePaidAmount,
      });

      const newDraft: QuickAddDraft = {
        client_name: prop.clientName || 'New Client',
        title: prop.title || `${prop.clientName || 'Wedding'} Shoot`,
        event_date: prop.eventDate || new Date().toISOString().slice(0, 10),
        total_amount: totalAmount,
        advance_percentage: advPct,
        mid_percentage: midPct,
        final_percentage: finalPct,
        phone: prop.clientPhone || '+91 90000 00000',
      };
      setDraft(newDraft);
      setStep({
        kind: 'review',
        detected: {
          client_name: true,
          event_date: true,
          total_amount: true,
          advance_percentage: true,
        },
      });
    } catch (err) {
      setStep({ kind: 'error', reason: (err as Error).message });
    }
  }

  async function pasteClipboard() {
    try {
      const t = await navigator.clipboard.readText();
      if (t) setText(t);
    } catch {
      /* permission denied */
    }
  }

  if (step.kind === 'parsing') {
    return (
      <div role="status" className="space-y-4 py-2">
        <p className="flex items-center gap-2 font-medium text-primary-text">
          <Sparkles className="size-4" aria-hidden />
          Reading the message…
        </p>
        <Skeleton className="h-12" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
        <Skeleton className="h-20" />
      </div>
    );
  }

  if (step.kind === 'success') {
    return (
      <div role="status" className="flex flex-col items-center py-8 text-center">
        <div className="relative mb-5 flex size-20 items-center justify-center">
          <span className="anim-ring absolute inset-0 rounded-full bg-in/30" aria-hidden />
          <span className="anim-check flex size-20 items-center justify-center rounded-full bg-in text-on-in">
            <Check className="size-10" strokeWidth={3} aria-hidden />
          </span>
        </div>
        <p className="text-xl font-semibold">Booking confirmed</p>
        <p className="mt-1 max-w-xs text-ink-2">
          {step.count} milestones scheduled. The advance invoice is ready to send.
        </p>
        <Button className="mt-6" variant="secondary" onClick={onClose}>
          Done
        </Button>
      </div>
    );
  }

  if (step.kind === 'review' && draft) {
    const total = draft.advance_percentage + draft.mid_percentage + draft.final_percentage;
    const valid = draft.client_name.trim() && draft.event_date && draft.total_amount > 0 && total === 100;
    const badge = (k: keyof QuickAddDraft) =>
      step.detected[k] ? (
        <Chip tone="in" icon={Check}>
          Detected
        </Chip>
      ) : (
        <Chip tone="warn" icon={TriangleAlert}>
          Check
        </Chip>
      );
    const set = <K extends keyof QuickAddDraft>(k: K, v: QuickAddDraft[K]) => setDraft({ ...draft, [k]: v });

    return (
      <form
        className="space-y-4"
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          if (!valid) return setError(total !== 100 ? `Milestones add up to ${total}%, not 100%` : 'Fill in the highlighted fields');
          setError(undefined);
          setSaving(true);
          try {
            const advAmt = Math.round((draft.total_amount * draft.advance_percentage) / 100);
            const midAmt = Math.round((draft.total_amount * draft.mid_percentage) / 100);
            const finalAmt = draft.total_amount - advAmt - midAmt;
            const res = await fetch('/api/quickadd/confirm', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                clientMode: 'new',
                newClient: {
                  name: draft.client_name,
                  phone: draft.phone || '+91 90000 00000',
                },
                title: draft.title,
                eventDate: draft.event_date,
                totalAmount: draft.total_amount,
                milestones: [
                  { label: 'advance', amount: advAmt, dueDate: new Date().toISOString().slice(0, 10) },
                  { label: 'mid', amount: midAmt, dueDate: draft.event_date },
                  { label: 'final', amount: finalAmt, dueDate: draft.event_date },
                ],
                advancePaid: advancePaidInfo.paid,
                advancePaidAmount: advancePaidInfo.amount,
                paymentMethod: 'UPI',
              }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
              throw new Error(data.error || 'Failed to confirm booking');
            }
            setStep({ kind: 'success', count: data.invoices?.length || 3 });
            onCreated?.();
            onClose();
            router.push('/invoices');
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setSaving(false);
          }
        }}
      >
        <TextField label="Client" value={draft.client_name} onChange={(e) => set('client_name', e.target.value)} badge={badge('client_name')} error={!draft.client_name.trim() ? 'Who is this booking for?' : undefined} autoComplete="off" />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Event date" type="date" value={draft.event_date} onChange={(e) => set('event_date', e.target.value)} badge={badge('event_date')} mono />
          <TextField label="Total" prefix="₹" mono inputMode="numeric" value={draft.total_amount ? groupDigits(draft.total_amount) : ''} onChange={(e) => set('total_amount', parseRupees(e.target.value) ?? 0)} badge={badge('total_amount')} />
        </div>
        <TextField label="Booking title" value={draft.title} onChange={(e) => set('title', e.target.value)} />

        <fieldset>
          <div className="mb-1.5 flex items-center justify-between">
            <legend className="text-sm font-medium text-ink-2">Milestone split</legend>
            {badge('advance_percentage')}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ['advance_percentage', 'Advance'],
                ['mid_percentage', 'Mid'],
                ['final_percentage', 'Final'],
              ] as const
            ).map(([k, label]) => (
              <div key={k} className="rounded-2xl border border-line bg-surface-2 p-2.5">
                <label htmlFor={`qa-${k}`} className="block text-xs font-medium text-ink-3">
                  {label}
                </label>
                <div className="flex items-baseline gap-0.5">
                  <input id={`qa-${k}`} className="num min-h-11 w-full min-w-0 bg-transparent text-lg font-semibold focus:outline-none" inputMode="numeric" value={String(draft[k])} onChange={(e) => set(k, Math.min(100, parseRupees(e.target.value) ?? 0))} />
                  <span className="text-ink-3">%</span>
                </div>
                <p className="num text-xs text-ink-2">{formatINR(Math.round((draft.total_amount * draft[k]) / 100))}</p>
              </div>
            ))}
          </div>
          <p className={cn('mt-2 text-xs', total === 100 ? 'text-ink-3' : 'font-semibold text-out')}>
            {total === 100 ? 'Adds up to 100%.' : `Adds up to ${total}%. Adjust to 100%.`}
          </p>
        </fieldset>

        <p className="rounded-2xl bg-primary/10 px-4 py-3 text-sm text-ink-2">
          <span className="font-semibold text-ink">{draft.client_name || 'Booking'}</span>, {draft.event_date ? formatDateLong(draft.event_date) : 'Upcoming'}, <strong className="num font-semibold text-ink">{formatINR(draft.total_amount)}</strong> in {[draft.advance_percentage, draft.mid_percentage, draft.final_percentage].filter(Boolean).length} payments.
        </p>
        {error && (
          <p role="alert" className="text-sm font-semibold text-out">
            {error}
          </p>
        )}
        <div className="grid grid-cols-[auto_1fr] gap-3">
          <Button variant="secondary" onClick={() => setStep({ kind: 'input' })}>
            Edit original text
          </Button>
          <Button type="submit" size="md" state={saving ? 'loading' : 'idle'}>
            Confirm Booking
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      {step.kind === 'error' && (
        <div role="alert" className="flex gap-3 rounded-2xl border border-out/35 bg-out/10 p-4">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-out" aria-hidden />
          <div>
            <p className="font-semibold">Couldn't read it</p>
            <p className="text-sm text-ink-2">{step.reason} Add the wedding date and the total, then try again.</p>
          </div>
        </div>
      )}
      <TextArea label="WhatsApp message" placeholder="Paste or type client text, e.g. Sharma wedding 14 Dec, ₹80k, ₹25k advance paid" value={text} onChange={(e) => setText(e.target.value)} rows={6} />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" icon={ClipboardPaste} onClick={pasteClipboard}>
          Paste
        </Button>
        <Button
          size="sm"
          variant="quiet"
          icon={MessageSquareText}
          onClick={() => {
            setText(EXAMPLE);
          }}
        >
          Use an example
        </Button>
      </div>
      <Button full size="lg" icon={Sparkles} disabled={!text.trim()} onClick={() => run()}>
        Read it
      </Button>
    </div>
  );
}
