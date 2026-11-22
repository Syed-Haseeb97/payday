'use client';

import { CalendarDays, ChartSpline, Flame, House, LayoutGrid, Plus, Settings, Tags, Users, Wallet, type LucideIcon } from 'lucide-react';
import { Suspense, useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { Link } from '@/lib/router';
import { BrandMark } from './BrandMark';
import { QuickAddSheet } from '@/components/quick-add/QuickAddSheet';
import { readTheme, applyTheme } from '@/lib/theme';

type NavItem = { to: string; label: string; icon: LucideIcon; match: (p: string) => boolean; danger?: boolean };

const MORE_PATHS = ['/more', '/clients', '/bookings', '/pricing', '/settings', '/forecast'];

const tabs: NavItem[] = [
  { to: '/dashboard', label: 'Home', icon: House, match: (p) => p === '/dashboard' || p === '/' },
  { to: '/invoices', label: 'Money', icon: Wallet, match: (p) => p.startsWith('/invoices') },
  { to: '/bad-day', label: 'Bad Day', icon: Flame, match: (p) => p === '/bad-day', danger: true },
  { to: '/more', label: 'More', icon: LayoutGrid, match: (p) => MORE_PATHS.some((m) => p.startsWith(m)) },
];

const rail: NavItem[] = [
  { to: '/dashboard', label: 'Home', icon: House, match: (p) => p === '/dashboard' || p === '/' },
  { to: '/forecast', label: 'Forecast', icon: ChartSpline, match: (p) => p === '/forecast' },
  { to: '/invoices', label: 'Money', icon: Wallet, match: (p) => p.startsWith('/invoices') },
  { to: '/bad-day', label: 'Bad Day', icon: Flame, match: (p) => p === '/bad-day', danger: true },
  { to: '/clients', label: 'Clients', icon: Users, match: (p) => p === '/clients' },
  { to: '/bookings', label: 'Bookings', icon: CalendarDays, match: (p) => p === '/bookings' },
  { to: '/pricing', label: 'Pricing', icon: Tags, match: (p) => p === '/pricing' },
  { to: '/settings', label: 'Settings', icon: Settings, match: (p) => p === '/settings' },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-dvh flex flex-col">{children}</div>}>
      <AppShellInner>{children}</AppShellInner>
    </Suspense>
  );
}

function AppShellInner({ children }: { children: ReactNode }) {
  const path = usePathname() || '/';
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  useEffect(() => {
    const handler = () => setQuickAddOpen(true);
    window.addEventListener('open-quick-add', handler);
    return () => window.removeEventListener('open-quick-add', handler);
  }, []);

  // Sync theme
  useEffect(() => {
    if (!path.startsWith('/pay/')) {
      applyTheme(readTheme());
    }
  }, [path]);

  // Move focus to the page heading on navigation so screen readers announce the new page.
  useEffect(() => {
    const h = document.querySelector<HTMLElement>('[data-page-title]');
    if (h && document.activeElement !== document.body) h.focus({ preventScroll: true });
  }, [path]);

  // If public pay page, render without owner navigation
  if (path.startsWith('/pay/')) {
    return <>{children}</>;
  }

  const badDay = path === '/bad-day';

  return (
    <div className={cn('min-h-dvh flex flex-col', badDay ? 'glow-danger' : 'glow-primary')}>
      <a href="#main" className="sr-only z-50 rounded-xl bg-primary px-4 py-3 font-semibold text-on-primary focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>

      {/* Desktop rail */}
      <nav aria-label="Primary" className="fixed inset-y-0 left-0 z-30 hidden w-[88px] flex-col items-center gap-1 border-r border-line bg-surface/70 py-5 backdrop-blur-xl lg:flex">
        <Link to="/dashboard" className="mb-4 rounded-xl" aria-label="Payday home">
          <BrandMark className="size-10" />
        </Link>
        <button
          type="button"
          onClick={() => setQuickAddOpen(true)}
          className="mb-4 flex flex-col items-center justify-center rounded-2xl bg-primary text-on-primary py-2 px-1 text-center shadow-[var(--shadow-fab)] transition-transform hover:scale-105"
          aria-label="Quick Add"
          title="Quick Add"
        >
          <Plus className="size-5" strokeWidth={2.5} aria-hidden />
          <span className="text-[10px] font-semibold leading-tight mt-0.5">Quick Add</span>
        </button>
        {rail.map((item) => (
          <RailLink key={item.to} item={item} active={item.match(path)} />
        ))}
      </nav>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line/60 bg-bg/80 px-4 backdrop-blur-xl lg:hidden">
        <Link to="/dashboard" className="flex min-h-11 items-center gap-2 rounded-xl" aria-label="Payday home">
          <BrandMark className="size-8" />
          <span className="text-[1.05rem] font-semibold tracking-tight">Payday</span>
        </Link>
        <Link to="/settings" className="flex size-11 items-center justify-center rounded-full" aria-label="Settings and profile">
          <span className="flex size-9 items-center justify-center rounded-full border border-line-strong bg-surface-2 text-xs font-bold text-ink-2">AV</span>
        </Link>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pt-5 pb-32 sm:px-6 lg:pt-10 lg:pb-16 lg:pl-[calc(88px+2.5rem)] lg:pr-10 lg:max-w-none xl:pr-16">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>

      {/* Mobile bottom tabs with centre Quick Add FAB */}
      <nav aria-label="Primary" className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/85 backdrop-blur-xl lg:hidden">
        <ul className="mx-auto grid max-w-lg grid-cols-5 items-end px-2">
          {tabs.slice(0, 2).map((t) => (
            <TabLink key={t.to} item={t} active={t.match(path)} />
          ))}
          <li className="flex justify-center">
            <button
              type="button"
              onClick={() => setQuickAddOpen(true)}
              className="group -mt-6 flex flex-col items-center gap-1 rounded-2xl pb-2 focus:outline-none"
              aria-label="Quick Add"
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-[var(--shadow-fab)] ring-4 ring-bg transition-transform group-active:scale-95">
                <Plus className="size-7" strokeWidth={2.5} aria-hidden />
              </span>
              <span className="text-[11px] font-semibold text-ink-2">
                Quick Add
              </span>
            </button>
          </li>
          {tabs.slice(2).map((t) => (
            <TabLink key={t.to} item={t} active={t.match(path)} />
          ))}
        </ul>
      </nav>

      {/* Global Quick Add Sheet */}
      <QuickAddSheet open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </div>
  );
}

function TabLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <li>
      <Link
        to={item.to}
        className={cn(
          'flex min-h-14 flex-col items-center justify-center gap-1 py-1 text-center transition-colors',
          active
            ? item.danger
              ? 'text-out'
              : 'text-primary-text font-semibold'
            : 'text-ink-3 hover:text-ink',
        )}
        aria-current={active ? 'page' : undefined}
      >
        <Icon className="size-5 shrink-0" aria-hidden />
        <span className="text-[11px] leading-none">{item.label}</span>
      </Link>
    </li>
  );
}

function RailLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      className={cn(
        'group relative flex size-12 items-center justify-center rounded-2xl transition-colors',
        active
          ? item.danger
            ? 'bg-out/15 text-out font-bold'
            : 'bg-primary/15 text-primary-text font-bold'
          : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
      )}
      aria-current={active ? 'page' : undefined}
      aria-label={item.label}
      title={item.label}
    >
      <Icon className="size-5" aria-hidden />
      {active && <span className={cn('absolute -left-2 top-3 bottom-3 w-1 rounded-r-full', item.danger ? 'bg-out' : 'bg-primary')} aria-hidden />}
    </Link>
  );
}
