'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { Camera, Database, Zap } from 'lucide-react';
import { QuickAddModal } from '../quickadd/QuickAddModal';

export function AppHeader() {
  const [isDemo, setIsDemo] = useState(true);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.isDemo === 'boolean') {
          setIsDemo(data.isDemo);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[var(--bg-canvas)]/90 backdrop-blur-md border-b border-[var(--border-line)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand & Studio Info */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-[var(--text-primary)] text-[var(--bg-canvas)] flex items-center justify-center font-bold tracking-tighter">
                <Camera className="w-5 h-5 text-[var(--bg-canvas)]" />
              </div>
              <div>
                <span className="font-serif italic font-bold text-xl sm:text-2xl text-[var(--text-primary)] tracking-tight">
                  Payday
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs font-mono uppercase tracking-widest text-[var(--text-muted)]">
                  · Arjun Visuals
                </span>
              </div>
            </Link>
          </div>

          {/* Right Section: Quick Add Button, Status & Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3.5">
            <button
              type="button"
              onClick={() => setQuickAddOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#16181D] text-[#F5F3EE] text-xs font-mono font-medium hover:opacity-90 transition-opacity"
            >
              <Zap className="w-3.5 h-3.5 text-[#E3EFE8]" />
              <span className="hidden sm:inline">Quick Add</span>
              <span className="sm:hidden">Quick Add</span>
            </button>

            {isDemo ? (
              <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[var(--money-warn)] bg-[var(--money-warn-bg)] px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-[var(--money-warn)] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--money-warn)]" />
                <span>Demo data (not saved)</span>
              </div>
            ) : (
              <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[var(--money-in)] bg-[var(--money-in-bg)] px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-[var(--money-in)] font-medium">
                <Database className="w-3 h-3 text-[var(--money-in)]" />
                <span>Supabase Connected</span>
              </div>
            )}

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Global Quick Add Modal */}
      <QuickAddModal isOpen={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </>
  );
}
