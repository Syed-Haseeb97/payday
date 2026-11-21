'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from './AppNav';

export function MobileNav() {
  const pathname = usePathname();

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
              className={`flex flex-col items-center justify-center p-1.5 rounded-xl text-[10px] font-mono tracking-tight transition-colors ${
                isActive
                  ? item.isSpecial
                    ? 'text-[var(--money-out)] font-semibold'
                    : 'text-[var(--text-primary)] font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div
                className={`p-1 rounded-lg ${
                  isActive
                    ? item.isSpecial
                      ? 'bg-[var(--money-out-bg)]'
                      : 'bg-[var(--bg-surface-subtle)]'
                    : ''
                }`}
              >
                <Icon className={`w-4 h-4 ${item.isSpecial ? 'text-[var(--money-out)]' : ''}`} />
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
