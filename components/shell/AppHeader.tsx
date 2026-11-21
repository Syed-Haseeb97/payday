'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { Camera, Database, Zap, HelpCircle } from 'lucide-react';
import { QuickAddModal } from '../quickadd/QuickAddModal';
import { GuidedDemoModal } from '../demo/GuidedDemoModal';

export function AppHeader() {
  const [isDemo, setIsDemo] = useState(true);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [guidedDemoOpen, setGuidedDemoOpen] = useState(false);

  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.dataMode) {
          setIsDemo(data.dataMode === 'demo');
        } else if (typeof data.isDemo === 'boolean') {
          setIsDemo(data.isDemo);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[var(--bg-canvas)] border-b border-[var(--border-line)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand & Studio Info */}
          <div className="flex items-center gap-4">
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

            {/* Pricing link in header */}
            <Link
              href="/pricing"
              className="hidden lg:inline-flex items-center px-3 py-1 rounded-full border border-line bg-surface text-xs font-mono font-medium text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors"
            >
              <span>Pricing</span>
            </Link>
          </div>

          {/* Right Section: Guided Demo, Quick Add, Status & Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Guided Demo Button */}
            <button
              type="button"
              onClick={() => setGuidedDemoOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-line bg-surface text-xs font-mono font-medium text-[var(--text-primary)] hover:bg-surface-subtle transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>Guided Demo</span>
            </button>

            <button
              type="button"
              onClick={() => setQuickAddOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-canvas)] text-xs font-mono font-medium hover:opacity-90 transition-opacity"
            >
              <Zap className="w-3.5 h-3.5 text-[var(--money-in)]" />
              <span>Quick Add</span>
            </button>

            {isDemo ? (
              <div className="hidden xl:inline-flex items-center gap-1.5 rounded-full border border-[var(--money-warn)] bg-[var(--money-warn-bg)] px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-[var(--money-warn)] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--money-warn)]" />
                <span>Demo data (not saved)</span>
              </div>
            ) : (
              <div className="hidden xl:inline-flex items-center gap-1.5 rounded-full border border-[var(--money-in)] bg-[var(--money-in-bg)] px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-[var(--money-in)] font-medium">
                <Database className="w-3 h-3 text-[var(--money-in)]" />
                <span>Supabase Connected</span>
              </div>
            )}

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Global Modals */}
      <QuickAddModal isOpen={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
      <GuidedDemoModal
        isOpen={guidedDemoOpen}
        onClose={() => setGuidedDemoOpen(false)}
        onOpenQuickAdd={() => setQuickAddOpen(true)}
      />
    </>
  );
}
