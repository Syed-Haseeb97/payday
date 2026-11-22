'use client';

import { Info, Pencil } from 'lucide-react';
import { useState } from 'react';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Money } from '@/components/ui/Money';
import { PageHeader } from '@/components/ui/Misc';
import { formatINR, groupDigits, parseRupees } from '@/lib/format';
import type { PricingInputs } from '@/lib/types';

export function PricingScreen({ inputs }: { inputs: PricingInputs }) {
  const [amount, setAmount] = useState(groupDigits(inputs.typical_invoice || 55000));
  const [days, setDays] = useState(inputs.weighted_delay_days || 13);
  const [rate, setRate] = useState(String(inputs.cost_of_money_pct || 1.5));

  const value = parseRupees(amount) ?? 55000;
  const r = Math.max(0, parseFloat(rate) || 0);
  const cost = Math.round((value * (r / 100) * days) / 30);
  const fixed = inputs.fixed_costs.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Pricing" title="What late payments really cost" subtitle="Price with your real costs in view, and see what every day of waiting takes out of your pocket." />

      <p className="font-serif italic text-ink-2 text-sm sm:text-base -mt-2">
        At a {days}-day delay on {formatINR(value)} (at {rate}%/mo), your business absorbs an extra friction cost of {formatINR(cost)} each cycle.
      </p>

      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        <Card as="section" aria-labelledby="delay-title">
          <h2 id="delay-title" className="font-semibold">
            Cost of delay
          </h2>
          <p className="mt-1 text-sm text-ink-2">Money that arrives late is money you have to borrow, or go without.</p>

          <div className="mt-5 space-y-5">
            <div className="rounded-2xl border border-dashed border-warn/50 bg-warn/[0.06] p-3">
              <div className="flex items-center justify-between">
                <label htmlFor="delay-rate" className="flex items-center gap-1.5 text-sm font-medium text-ink-2">
                  <Pencil className="size-3.5" aria-hidden /> Cost of money (editable assumption)
                </label>
                <output htmlFor="delay-rate" className="num font-semibold text-sm">
                  {rate}% / mo
                </output>
              </div>
              <input
                id="delay-rate"
                type="range"
                min="0.5"
                max="5.0"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="mt-2 h-11 w-full cursor-pointer"
                aria-describedby="rate-hint"
              />
              <div className="num flex justify-between text-xs text-ink-3" aria-hidden>
                <span>0.5% (bank rate)</span>
                <span>1.5% (default overdraft)</span>
                <span>5.0% (high credit)</span>
              </div>
              <p id="rate-hint" className="mt-2 flex gap-1.5 text-xs text-ink-3">
                <Info className="mt-px size-3.5 shrink-0" aria-hidden />
                1.5% is an assumption, not a fact. Change it to your credit card, overdraft or business-loan rate.
              </p>
            </div>

            <div>
              <label htmlFor="delay-amount" className="mb-1.5 block text-sm font-medium text-ink-2">
                Invoice amount
              </label>
              <div className="relative">
                <span className="num pointer-events-none absolute inset-y-0 left-4 flex items-center text-ink-3">₹</span>
                <input id="delay-amount" inputMode="numeric" value={amount} onChange={(e) => setAmount(groupDigits(e.target.value))} className="num min-h-12 w-full rounded-2xl border border-line-strong bg-surface-2 pr-4 pl-9 focus:border-primary text-ink" />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <label htmlFor="delay-days" className="text-sm font-medium text-ink-2">
                  Days late
                </label>
                <output htmlFor="delay-days" className="num font-semibold">
                  {days} days
                </output>
              </div>
              <input id="delay-days" type="range" min={0} max={60} step={1} value={days} onChange={(e) => setDays(Number(e.target.value))} className="h-11 w-full cursor-pointer" aria-valuetext={`${days} days`} />
              <div className="num flex justify-between text-xs text-ink-3" aria-hidden>
                <span>0</span>
                <span>30</span>
                <span>60</span>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-out/10 p-4" aria-live="polite">
            <p className="text-sm text-ink-2">
              A {days}-day delay on {formatINR(value)} costs you
            </p>
            <Money value={cost} roll className="mt-1 block text-4xl font-semibold text-out" />
            <p className="mt-1 text-sm text-ink-2">Add a late fee of at least this much to your contract, or ask for a bigger advance.</p>
          </div>
        </Card>

        <Card as="section" aria-labelledby="numbers-title">
          <SectionTitle id="numbers-title">Your Numbers</SectionTitle>
          <dl className="divide-y divide-line">
            {inputs.fixed_costs.map((c) => (
              <div key={c.label} className="flex min-h-12 items-center justify-between gap-3">
                <dt className="text-ink-2">{c.label}</dt>
                <dd className="num font-semibold">{formatINR(c.amount)}</dd>
              </div>
            ))}
            <div className="flex min-h-12 items-center justify-between gap-3">
              <dt className="font-semibold">Fixed costs / month</dt>
              <dd className="num text-lg font-semibold">{formatINR(fixed)}</dd>
            </div>
            <div className="flex min-h-12 items-center justify-between gap-3">
              <dt className="text-ink-2">Safe buffer</dt>
              <dd className="num font-semibold">{formatINR(inputs.safe_buffer)}</dd>
            </div>
            <div className="flex min-h-12 items-center justify-between gap-3">
              <dt className="text-ink-2">Average booking</dt>
              <dd className="num font-semibold">{formatINR(inputs.average_booking)}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  );
}
