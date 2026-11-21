'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from './AppNav';

export function MobileNav() {
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
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-canvas)]/95 backdrop-blur-md border-t border-[var(--border-line)] pb-safe">
      <div className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center p-1.5 rounded-xl text-[10px] font-mono tracking-tight transition-colors ${
                isActive
                  ? item.isSpecial
                    ? 'text-[var(--money-out)] font-semibold'
                    : 'text-[var(--text-primary)] font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div
                className={`relative p-1 rounded-lg ${
                  isActive
                    ? item.isSpecial
                      ? 'bg-[var(--money-out-bg)]'
                      : 'bg-[var(--bg-surface-subtle)]'
                    : ''
                }`}
              >
                <Icon className={`w-4 h-4 ${item.isSpecial ? 'text-[var(--money-out)]' : ''}`} />
                {item.isSpecial && badDayCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-3.5 h-3.5 px-1 rounded-full font-mono text-[9px] font-bold bg-[#B53A26] text-white flex items-center justify-center">
                    {badDayCount}
                  </span>
                )}
              </div>
              <span className="mt-0.5 truncate max-w-[52px]">
                {item.isSpecial ? 'Bad Day' : item.label.split(' ')[0]}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
