'use client';

import { CircleCheck, LifeBuoy, RotateCcw, Send, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Money } from '@/components/ui/Money';
import { PageHeader } from '@/components/ui/Misc';
import { RunwayChart, RunwayLegend } from '@/components/runway/RunwayChart';
import { cn } from '@/lib/cn';
import { formatDate, formatINR } from '@/lib/format';
import type { Forecast, ParseAskResult, RecoveryPlan, ScenarioChange } from '@/lib/types';

interface Props {
  forecast: Forecast;
  suggestions: string[];
  applying: boolean;
  onAsk: (text: string) => Promise<ParseAskResult>;
  onApply: (changes: ScenarioChange[]) => void;
  onReset: () => void;
  onSendReminder: (plan: RecoveryPlan) => void;
  onRecordPayment: (plan: RecoveryPlan) => void;
}

export function ForecastScreen({ forecast: f, suggestions, applying, onAsk, onApply, onReset, onSendReminder, onRecordPayment }: Props) {
  const [text, setText] = useState('');
  const [asking, setAsking] = useState(false);
  const [pending, setPending] = useState<ScenarioChange[]>([]);
  const [askError, setAskError] = useState<string>();

  const low = f.scenario_low ?? f.baseline_low ?? { date: '2026-12-14', balance: 26500 };
  const hasScenario = Boolean(f.scenario);

  async function ask(q: string) {
    if (!q.trim()) return;
    setAsking(true);
    setAskError(undefined);
    const res = await onAsk(q);
    setAsking(false);
    if (res.ok) {
      setPending((prev) => {
        const next = [...prev];
        for (const c of res.changes) {
          const i = next.findIndex((p) => p.id === c.id);
          if (i >= 0) next[i] = c;
          else next.push(c);
        }
        return next;
      });
    } else {
      setAskError(res.message);
    }
  }

  const allSuggestions = [
    'What if Mehta pays 20 days late?',
    'Slowest client pays 15 days late',
    ...suggestions.filter(s => !s.includes('Mehta') && !s.includes('Slowest')),
  ];

  return (
    <div className="space-y-5 lg:space-y-6">
      <PageHeader eyebrow="Forecast" title="Will you make rent?" subtitle="90 days of expected money in and out, based on how each client actually pays." />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-6">
        <div className="space-y-5 lg:space-y-6">
          <Card as="section" aria-labelledby="fc-chart">
            <h2 id="fc-chart" className="sr-only">
              Runway chart
            </h2>
            <div className="grid grid-cols-3 gap-3 sm:gap-6">
              <div>
                <p className="text-xs font-medium text-ink-3 sm:text-sm">Lowest Balance</p>
                <Money value={low.balance} roll className={cn('mt-0.5 block text-xl font-semibold sm:text-3xl', low.balance < 0 ? 'text-out' : low.balance < f.safe_buffer ? 'text-warn' : 'text-ink')} />
                <p className="text-xs text-ink-2 sm:text-sm">on {formatDate(low.date)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-ink-3 sm:text-sm">{hasScenario ? 'Baseline low' : 'Today'}</p>
                <Money value={hasScenario ? f.baseline_low.balance : f.opening_cash} className="mt-0.5 block text-xl font-semibold text-ink-2 sm:text-3xl" />
                <p className="text-xs text-ink-2 sm:text-sm">{hasScenario ? `on ${formatDate(f.baseline_low.date)}` : 'opening cash'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-ink-3 sm:text-sm">Safe buffer</p>
                <Money value={f.safe_buffer} className="mt-0.5 block text-xl font-semibold text-ink-2 sm:text-3xl" />
                <p className="text-xs text-ink-2 sm:text-sm">your floor</p>
              </div>
            </div>
            <p className="sr-only" aria-live="polite">
              {hasScenario ? `Scenario applied. Lowest balance ${formatINR(low.balance)} on ${formatDate(low.date)}.` : ''}
            </p>
            <RunwayChart baseline={f.baseline} scenario={f.scenario} safeBuffer={f.safe_buffer} height={320} className={cn('mt-4 transition-opacity', applying && 'opacity-60')} />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
              <RunwayLegend scenario={hasScenario} />
              {hasScenario && (
                <Button size="sm" variant="secondary" icon={RotateCcw} onClick={onReset}>
                  Reset
                </Button>
              )}
            </div>
          </Card>

          {f.recovery && (
            <section id="recovery-plan" aria-labelledby="recovery-title" className="card anim-rise relative overflow-hidden border-in/35 p-4 sm:p-5">
              <div className="pointer-events-none absolute -right-20 -bottom-24 size-60 rounded-full bg-in/10 blur-2xl" aria-hidden />
              <div className="relative flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-in/15 text-in">
                  <LifeBuoy className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-wider text-in uppercase">Recommendation · Recovery Plan</p>
                  <h2 id="recovery-title" className="mt-1 text-lg leading-snug font-semibold">
                    {`Collect ${formatINR(f.recovery.amount)} from ${f.recovery.client_name} and your lowest balance rises from ${formatINR(f.recovery.from_low)} to ${formatINR(f.recovery.to_low)}`}
                  </h2>
                  <p className="mt-1.5 text-sm text-ink-2">
                    {f.recovery.to_low >= f.safe_buffer ? `That one payment carries you past ${formatDate(f.recovery.low_date)} and keeps you above your safe buffer.` : `It's the single biggest lever before ${formatDate(f.recovery.low_date)}.`}
                  </p>
                </div>
              </div>
              <div className="relative mt-4 grid grid-cols-2 gap-3">
                <Button icon={Send} onClick={() => onSendReminder(f.recovery!)}>
                  Send reminder
                </Button>
                <Button variant="secondary" icon={CircleCheck} onClick={() => onRecordPayment(f.recovery!)}>
                  Record payment
                </Button>
              </div>
            </section>
          )}
        </div>

        <div className="space-y-5 lg:space-y-6">
          <Card as="section" aria-labelledby="ask-title">
            <h2 id="ask-title" className="flex items-center gap-2 font-semibold">
              <Sparkles className="size-4 text-primary-text" aria-hidden /> Ask Payday
            </h2>
            <p className="mt-1 text-sm text-ink-2">Type a what-if in plain words. Nothing changes until you apply it.</p>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void ask(text);
              }}
            >
              <label htmlFor="ask-input" className="sr-only">
                Ask a what-if question
              </label>
              <input
                id="ask-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="What if Mehta pays 20 days late?"
                className="min-h-12 w-full min-w-0 rounded-2xl border border-line-strong bg-surface-2 px-4 text-ink placeholder:text-ink-3 focus:border-primary"
              />
              <Button type="submit" state={asking ? 'loading' : 'idle'} className="shrink-0">
                Ask
              </Button>
            </form>
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Suggestions">
              {allSuggestions.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => {
                      if (s.includes('Slowest')) {
                        onApply([
                          {
                            id: 'delay_c_mehta',
                            kind: 'delay',
                            client_id: 'c_mehta',
                            client_name: 'Rohit Mehta',
                            days: 15,
                            label: 'Rohit Mehta pays 15 days late',
                          },
                        ]);
                      } else {
                        setText(s);
                      }
                    }}
                    className="min-h-11 rounded-full border border-line-strong bg-surface-2 px-3.5 text-left text-sm font-medium text-ink-2 transition-colors hover:border-primary/60 hover:text-ink"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
            {askError && (
              <p role="alert" className="mt-3 rounded-2xl bg-out/10 px-3 py-2 text-sm text-ink">
                {askError}
              </p>
            )}

            {pending.length > 0 && (
              <div className="anim-rise mt-4 rounded-2xl border border-primary/35 bg-primary/[0.07] p-3">
                <p className="mb-2 text-xs font-semibold tracking-wider text-primary-text uppercase">Scenario</p>
                <ul className="flex flex-wrap gap-2">
                  {pending.map((c) => (
                    <li key={c.id} className="flex min-h-11 items-center gap-1 rounded-full border border-primary/40 bg-surface pr-1 pl-3.5 text-sm font-semibold">
                      {c.label}
                      <button type="button" aria-label={`Remove ${c.label}`} onClick={() => setPending((p) => p.filter((x) => x.id !== c.id))} className="flex size-9 items-center justify-center rounded-full text-ink-3 hover:bg-surface-2 hover:text-ink">
                        <X className="size-4" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
                <Button
                  full
                  className="mt-3"
                  state={applying ? 'loading' : 'idle'}
                  onClick={() => {
                    onApply(pending);
                    setPending([]);
                    setText('');
                  }}
                >
                  Apply to Forecast
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
