'use client';

import { ArrowDownLeft, ArrowRight, ArrowUpRight, BellRing, ChartSpline, HandCoins, Plus, Send, TriangleAlert } from 'lucide-react';
import { Button, ButtonLink, WhatsAppIcon } from '@/components/ui/Button';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Money } from '@/components/ui/Money';
import { RunwayChart, RunwayLegend } from '@/components/runway/RunwayChart';
import { cn } from '@/lib/cn';
import { diffDays, formatDate, formatDow, formatINR, formatWeekday } from '@/lib/format';
import { Link } from '@/lib/router';
import type { Dashboard } from '@/lib/types';

interface Props {
  data: Dashboard;
  onSendReminder: (invoiceId: string) => void;
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export function DashboardScreen({ data, onSendReminder }: Props) {
  const f = data.forecast;
  const low = f.baseline_low || { date: '2026-12-14', balance: 26500 };
  const gap = low.balance - f.safe_buffer;
  const alert = data.priority_alert;

  return (
    <div className="space-y-5 lg:space-y-6">
      <header className="anim-rise flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ink-3">
            {formatWeekday(data.today)} · {data.studio_name}
          </p>
          <h1 tabIndex={-1} data-page-title className="mt-1 text-[1.75rem] leading-tight font-semibold tracking-tight focus:outline-none sm:text-3xl">
            {greeting()}, {data.owner_first_name}
          </h1>
          {/* Today summary sentence for test 1 */}
          <p className="font-serif italic mt-2 text-ink-2 text-sm sm:text-base">
            {data.overdue > 0
              ? `You have ${formatINR(data.overdue)} overdue across ${data.overdue_count} invoices worth chasing today.`
              : `Collections are on track. Lowest cash point is ${formatINR(low.balance)} on ${formatDate(low.date)}.`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-quick-add'))}
          className="inline-flex min-h-11 items-center gap-1.5 self-start sm:self-auto rounded-full border border-line-strong bg-surface px-4 text-sm font-semibold hover:bg-surface-2 text-ink shrink-0"
        >
          <Plus className="size-4" aria-hidden />
          <span>+ Quick Add</span>
        </button>
      </header>

      {/* Priority alert */}
      {alert && (
        <section aria-labelledby="alert-title" className="card anim-rise relative overflow-hidden border-warn/40 p-4 sm:p-5">
          <div className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-warn/10 blur-2xl" aria-hidden />
          <div className="relative flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-warn/15 text-warn">
              <BellRing className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold tracking-wider text-warn uppercase">Priority · do this today</p>
              <h2 id="alert-title" className="mt-1 leading-snug font-semibold">
                {alert.title}
              </h2>
              <p className="mt-1.5 text-sm text-ink-2">{alert.message}</p>
            </div>
          </div>
          <div className="relative mt-4 flex gap-3">
            <Button
              variant={alert.action_label === 'Send reminder' ? 'whatsapp' : 'primary'}
              icon={alert.action_label === 'Send reminder' ? WhatsAppIcon : Send}
              full
              onClick={() => alert.invoice_id && onSendReminder(alert.invoice_id)}
            >
              {alert.action_label}
            </Button>
            <ButtonLink to={alert.action_url} variant="secondary" className="shrink-0">
              Invoice
            </ButtonLink>
          </div>
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] lg:gap-6">
        {/* Runway hero */}
        <Card as="section" aria-labelledby="runway-title" className="anim-rise overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="runway-title" className="text-sm font-semibold text-ink-2">
                Cash runway · next 90 days
              </h2>
              <p className="mt-2 text-ink-2">
                Lowest point <span className="font-semibold text-ink">{formatDate(low.date)}</span>
              </p>
              <Money value={low.balance} roll className={cn('mt-0.5 block text-[2.5rem] leading-none font-semibold sm:text-5xl', low.balance < 0 ? 'text-out' : low.balance < f.safe_buffer ? 'text-warn' : 'text-in')} />
            </div>
            <ButtonLink to="/forecast" variant="quiet" size="sm" icon={ChartSpline} className="-mr-2 shrink-0">
              <span className="max-sm:sr-only">Open forecast</span>
            </ButtonLink>
          </div>
          <div className="mt-3">
            {gap < 0 ? (
              <Chip tone="warn" icon={TriangleAlert}>
                <span className="num">{formatINR(-gap)}</span> below your {formatINR(f.safe_buffer)} safe buffer
              </Chip>
            ) : (
              <Chip tone="in" icon={ArrowUpRight}>
                Stays above your safe buffer
              </Chip>
            )}
          </div>
          <RunwayChart baseline={f.baseline} safeBuffer={f.safe_buffer} height={250} compact className="mt-2 -mb-1" />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
            <RunwayLegend />
            <Link to="/forecast" className="inline-flex min-h-11 items-center gap-1 rounded-xl text-sm font-semibold text-primary-text hover:underline">
              Test a what-if <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </Card>

        {/* Next 7 days */}
        <Card as="section" aria-labelledby="next7-title" className="anim-rise">
          <SectionTitle id="next7-title">Next 7 days</SectionTitle>
          <ul className="-mx-2 divide-y divide-line">
            {data.next_7_days.map((item) => {
              const Icon = item.direction === 'in' ? ArrowDownLeft : item.direction === 'out' ? ArrowUpRight : HandCoins;
              const days = diffDays(data.today, item.date);
              const body = (
                <>
                  <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', item.direction === 'in' ? 'bg-in/12 text-in' : item.direction === 'out' ? 'bg-out/12 text-out' : 'bg-warn/12 text-warn')}>
                    <Icon className="size-[18px]" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{item.label}</span>
                    <span className="block text-xs text-ink-3">
                      {days === 0 ? 'Today' : `${formatDow(item.date)}, ${formatDate(item.date)}`} · {item.direction === 'in' ? 'Expected in' : item.direction === 'out' ? 'Going out' : 'To review'}
                    </span>
                  </span>
                  <span className={cn('num shrink-0 font-semibold', item.direction === 'in' ? 'text-in' : item.direction === 'out' ? 'text-out' : 'text-warn')}>
                    {item.direction === 'out' ? '-' : item.direction === 'in' ? '+' : ''}
                    {formatINR(item.amount)}
                  </span>
                </>
              );
              return (
                <li key={item.id}>
                  {item.href ? (
                    <Link to={item.href} className="flex min-h-14 items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-surface-2">
                      {body}
                    </Link>
                  ) : (
                    <div className="flex min-h-14 items-center gap-3 px-2 py-2.5">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      {/* KPIs */}
      <section aria-label="Key numbers" className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-6">
        <Kpi label="Opening cash" value={data.opening_cash} sub="In the bank today" />
        <Kpi label="Total Outstanding" value={data.outstanding} sub={`across ${data.outstanding_clients} clients`} to="/invoices" />
        <Kpi label="Overdue" value={data.overdue} sub={`${data.overdue_count} invoice${data.overdue_count === 1 ? '' : 's'} · ${data.pending_claims} claim to review`} tone="out" to="/bad-day" className="col-span-2 lg:col-span-1" />
      </section>
    </div>
  );
}

function Kpi({ label, value, sub, tone, to, className }: { label: string; value: number; sub: string; tone?: 'out'; to?: string; className?: string }) {
  const inner = (
    <>
      <p className="flex items-center gap-1.5 text-sm font-medium text-ink-2">
        {tone === 'out' && <TriangleAlert className="size-4 text-out" aria-hidden />}
        {label}
      </p>
      <Money value={value} roll className={cn('mt-2 block text-2xl font-semibold sm:text-[1.75rem]', tone === 'out' ? 'text-out' : 'text-ink')} />
      <p className="mt-1 text-xs text-ink-3">{sub}</p>
    </>
  );
  return to ? (
    <Link to={to} className={cn('card block p-4 transition-colors hover:border-line-strong sm:p-5', className)}>
      {inner}
    </Link>
  ) : (
    <div className={cn('card p-4 sm:p-5', className)}>{inner}</div>
  );
}
