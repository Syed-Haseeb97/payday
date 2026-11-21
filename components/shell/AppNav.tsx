'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  CalendarDays, 
  Receipt, 
  TrendingUp, 
  Flame, 
  Settings 
} from 'lucide-react';

export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/bookings', label: 'Bookings', icon: CalendarDays },
  { href: '/invoices', label: 'Invoices', icon: Receipt },
  { href: '/forecast', label: 'Forecast (90d)', icon: TrendingUp },
  { href: '/bad-day', label: 'Bad Day Mode', icon: Flame, isSpecial: true },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppNav() {
  const pathname = usePathname();
  const [badDayCount, setBadDayCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/bad-day')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.success && data.summary) {
          const count = data.summary.topRanked?.length || 0;
          setBadDayCount(count);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  return (
    <nav className="hidden md:flex items-center gap-1 border-b border-[var(--border-line-subtle)] bg-[var(--bg-canvas)] px-4 sm:px-6 lg:px-8 py-2 overflow-x-auto">
      <div className="max-w-7xl mx-auto w-full flex items-center gap-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/');
          
          if (item.isSpecial) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium tracking-wide transition-all ${
                  isActive
                    ? 'bg-[var(--money-out-bg)] text-[var(--money-out)] border border-[var(--money-out)]'
                    : 'border border-[var(--border-line)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--money-out)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-[var(--money-out)]" />
                <span>{item.label}</span>
                {badDayCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-4 px-1.5 py-0.5 rounded-full font-mono text-[10px] font-bold bg-[#B53A26] text-white">
                    {badDayCount}
                  </span>
                )}
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide transition-colors ${
                isActive
                  ? 'bg-[var(--text-primary)] text-[var(--bg-canvas)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
