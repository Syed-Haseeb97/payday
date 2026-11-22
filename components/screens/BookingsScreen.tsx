'use client';

import { CalendarDays, Plus, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { PageHeader, Progress } from '@/components/ui/Misc';
import { Sheet } from '@/components/ui/Sheet';
import { TextField } from '@/components/ui/Field';
import { cn } from '@/lib/cn';
import { formatDateLong, formatINR, groupDigits, parseRupees } from '@/lib/format';
import type { BookingSummary, Client } from '@/lib/types';

interface Props {
  bookings: BookingSummary[];
  clients?: Client[];
  onRefresh?: () => void;
}

export function BookingsScreen({ bookings, clients = [], onRefresh }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [createdInvoices, setCreatedInvoices] = useState<Array<{ id: string; milestone_label: string; amount: number; due_date: string }> | null>(null);

  // Form state
  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 45);
    return d.toISOString().slice(0, 10);
  });
  const [totalStr, setTotalStr] = useState('1,20,000');
  const [advPct, setAdvPct] = useState(30);
  const [midPct, setMidPct] = useState(50);
  const [finalPct, setFinalPct] = useState(20);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const totalAmount = parseRupees(totalStr) ?? 120000;
  const sumPct = advPct + midPct + finalPct;

  const upcoming = bookings.filter((b) => b.days_to_event >= 0);
  const past = bookings.filter((b) => b.days_to_event < 0);

  const resetForm = () => {
    setTitle('');
    setTotalStr('1,20,000');
    setAdvPct(30);
    setMidPct(50);
    setFinalPct(20);
    setError(undefined);
    setCreatedInvoices(null);
  };

  async function submitBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setError('Enter an event or shoot title');
    if (sumPct !== 100) return setError(`Percentages add up to ${sumPct}%, must be 100%`);
    if (totalAmount <= 0) return setError('Total amount must be greater than zero');
    if (!clientId && clients.length > 0) return setError('Select a client');

    setError(undefined);
    setSaving(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: clientId || clients[0]?.id || 'client_manual',
          title: title.trim(),
          eventDate,
          totalAmount,
          advancePercentage: advPct,
          midPercentage: midPct,
          finalPercentage: finalPct,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create booking');
      }
      setCreatedInvoices(data.invoices || []);
      onRefresh?.();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Calendar"
        title="Bookings"
        subtitle="Weddings ahead, and how much of each you've collected."
        action={
          <Button
            icon={Plus}
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
          >
            New booking
          </Button>
        }
      />

      <Group title="Upcoming" items={upcoming} />
      {past.length > 0 && <Group title="Delivered" items={past} />}

      {/* New Booking Modal */}
      <Sheet
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={createdInvoices ? 'Booking Created' : 'Create Booking & Invoices'}
        description={
          createdInvoices
            ? '3 milestone invoices have been generated and scheduled.'
            : 'Set event milestones. Invoices and collection tasks are generated automatically.'
        }
      >
        {createdInvoices ? (
          <div className="space-y-4 py-2">
            <div className="rounded-2xl border border-in/35 bg-in/10 p-4 text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-in text-on-in mb-2">
                <Check className="size-6" strokeWidth={3} />
              </span>
              <p className="font-semibold text-lg">Milestones Generated</p>
              <p className="text-sm text-ink-2 mt-1">
                Your invoices are now visible in the Money ledger and ready for payments.
              </p>
            </div>
            <ul className="divide-y divide-line card p-0 overflow-hidden">
              {createdInvoices.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between p-3.5">
                  <div>
                    <p className="font-semibold">{inv.milestone_label}</p>
                    <p className="text-xs text-ink-3">Due {inv.due_date}</p>
                  </div>
                  <span className="num font-semibold text-in">{formatINR(inv.amount)}</span>
                </li>
              ))}
            </ul>
            <Button
              full
              variant="secondary"
              onClick={() => {
                setModalOpen(false);
                resetForm();
              }}
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={submitBooking} className="space-y-4" noValidate>
            {clients.length > 0 && (
              <div>
                <label htmlFor="client-select" className="mb-1.5 block text-sm font-medium text-ink-2">
                  Client
                </label>
                <select
                  id="client-select"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full rounded-2xl border border-line-strong bg-surface-2 px-4 min-h-12 text-ink focus:border-primary"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company ? `(${c.company})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <TextField
              label="Event title"
              placeholder="e.g. Verma Wedding · Udaipur"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Event date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                mono
                required
              />
              <TextField
                label="Total amount"
                prefix="₹"
                mono
                inputMode="numeric"
                value={totalStr}
                onChange={(e) => setTotalStr(groupDigits(e.target.value))}
                required
              />
            </div>

            <fieldset>
              <div className="mb-1.5 flex items-center justify-between">
                <legend className="text-sm font-medium text-ink-2">Milestone split (default 30/50/20)</legend>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-2xl border border-line bg-surface-2 p-2.5">
                  <label htmlFor="bk-adv" className="block text-xs font-medium text-ink-3">
                    Advance
                  </label>
                  <div className="flex items-baseline gap-0.5">
                    <input
                      id="bk-adv"
                      type="number"
                      className="num min-h-11 w-full min-w-0 bg-transparent text-lg font-semibold focus:outline-none"
                      value={advPct}
                      onChange={(e) => setAdvPct(Number(e.target.value))}
                    />
                    <span className="text-ink-3">%</span>
                  </div>
                  <p className="num text-xs text-ink-2">{formatINR(Math.round((totalAmount * advPct) / 100))}</p>
                </div>

                <div className="rounded-2xl border border-line bg-surface-2 p-2.5">
                  <label htmlFor="bk-mid" className="block text-xs font-medium text-ink-3">
                    Mid-payment
                  </label>
                  <div className="flex items-baseline gap-0.5">
                    <input
                      id="bk-mid"
                      type="number"
                      className="num min-h-11 w-full min-w-0 bg-transparent text-lg font-semibold focus:outline-none"
                      value={midPct}
                      onChange={(e) => setMidPct(Number(e.target.value))}
                    />
                    <span className="text-ink-3">%</span>
                  </div>
                  <p className="num text-xs text-ink-2">{formatINR(Math.round((totalAmount * midPct) / 100))}</p>
                </div>

                <div className="rounded-2xl border border-line bg-surface-2 p-2.5">
                  <label htmlFor="bk-final" className="block text-xs font-medium text-ink-3">
                    Final delivery
                  </label>
                  <div className="flex items-baseline gap-0.5">
                    <input
                      id="bk-final"
                      type="number"
                      className="num min-h-11 w-full min-w-0 bg-transparent text-lg font-semibold focus:outline-none"
                      value={finalPct}
                      onChange={(e) => setFinalPct(Number(e.target.value))}
                    />
                    <span className="text-ink-3">%</span>
                  </div>
                  <p className="num text-xs text-ink-2">{formatINR(Math.round((totalAmount * finalPct) / 100))}</p>
                </div>
              </div>
              <p className={cn('mt-2 text-xs', sumPct === 100 ? 'text-ink-3' : 'font-semibold text-out')}>
                {sumPct === 100 ? 'Adds up to 100%.' : `Adds up to ${sumPct}%. Adjust to 100%.`}
              </p>
            </fieldset>

            {error && (
              <p role="alert" className="text-sm font-semibold text-out">
                {error}
              </p>
            )}

            <Button type="submit" full size="lg" state={saving ? 'loading' : 'idle'}>
              Create Booking & Invoices
            </Button>
          </form>
        )}
      </Sheet>
    </div>
  );
}

function Group({ title, items }: { title: string; items: BookingSummary[] }) {
  return (
    <section aria-labelledby={`bk-${title}`}>
      <h2 id={`bk-${title}`} className="mb-3 text-[0.8rem] font-semibold tracking-[0.08em] text-ink-2 uppercase">
        {title}
      </h2>
      <ul className="grid gap-3 md:grid-cols-2">
        {items.map((b) => {
          const { booking } = b;
          const parts = [
            ['Advance', booking.advance_percentage],
            ['Mid', booking.mid_percentage],
            ['Final', booking.final_percentage],
          ].filter(([, p]) => Number(p) > 0) as [string, number][];
          return (
            <li key={booking.id} className="card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold">{booking.title}</h3>
                  <p className="text-sm text-ink-3">{b.client_name}</p>
                </div>
                <Chip tone={b.days_to_event >= 0 && b.days_to_event <= 30 ? 'primary' : 'neutral'} icon={CalendarDays}>
                  {b.days_to_event >= 0 ? `in ${b.days_to_event}d` : 'Done'}
                </Chip>
              </div>
              <p className="mt-2 text-sm text-ink-2">{formatDateLong(booking.event_date)}</p>
              <div className="mt-3 flex h-2 gap-1 overflow-hidden rounded-full" aria-hidden>
                {parts.map(([label, pct], i) => (
                  <span key={label} className={cn('h-full rounded-full', i === 0 ? 'bg-primary' : i === 1 ? 'bg-primary/60' : 'bg-primary/30')} style={{ width: `${pct}%` }} />
                ))}
              </div>
              <p className="num mt-1.5 text-xs text-ink-3">{parts.map(([l, p]) => `${l} ${p}%`).join(' · ')}</p>
              <div className="mt-4">
                <Progress value={b.collected} max={booking.total_amount} label={`Collected for ${booking.title}`} />
                <p className="num mt-1.5 flex justify-between text-xs">
                  <span className="text-in">{formatINR(b.collected)} collected</span>
                  <span className="text-ink-3">of {formatINR(booking.total_amount)}</span>
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
