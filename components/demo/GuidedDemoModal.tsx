'use client';

import React from 'react';
import Link from 'next/link';
import { X, CheckCircle2, ArrowRight, LayoutDashboard, Flame, TrendingUp, Zap, HelpCircle } from 'lucide-react';

export interface GuidedDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQuickAdd: () => void;
}

interface DemoStep {
  number: number;
  title: string;
  subtitle: string;
  href?: string;
  action?: 'quickadd';
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: DemoStep[] = [
  {
    number: 1,
    title: 'Dashboard: Who Owes Me',
    subtitle: 'Track receivables aging, total overdue, and today\'s cash position at a glance.',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    number: 2,
    title: 'Bad Day Mode: Chase These First',
    subtitle: 'Rank overdue invoices by cash impact, urgency, and client unreliability.',
    href: '/bad-day',
    icon: Flame,
  },
  {
    number: 3,
    title: '90-Day Forecast: Mehta Preset',
    subtitle: 'Simulate what happens when Mehta Weddings delays payment and cash drops.',
    href: '/forecast?preset=mehta',
    icon: TrendingUp,
  },
  {
    number: 4,
    title: 'Quick Add: Paste a WhatsApp Message',
    subtitle: 'Extract client, dates, and amounts into milestone invoices with instant preview.',
    action: 'quickadd',
    icon: Zap,
  },
];

export function GuidedDemoModal({ isOpen, onClose, onOpenQuickAdd }: GuidedDemoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)] shadow-xl p-5 sm:p-6 space-y-5"
        role="dialog"
        aria-labelledby="guided-demo-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-[var(--border-line)] bg-[var(--bg-surface-subtle)] font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">
              <HelpCircle className="w-3 h-3" />
              <span>Judge &amp; Evaluator Walkthrough</span>
            </div>
            <h2 id="guided-demo-title" className="font-serif italic text-2xl font-bold text-[var(--text-primary)]">
              Guided Demo Checklist
            </h2>
            <p className="text-xs text-[var(--text-muted)] font-sans">
              4 key flows that solve Arjun’s cash flow problem. Click any step to jump in.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] transition-colors"
            aria-label="Close guided demo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Static Checklist Steps */}
        <div className="space-y-2.5">
          {STEPS.map((step) => {
            const Icon = step.icon;

            if (step.action === 'quickadd') {
              return (
                <button
                  key={step.number}
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenQuickAdd();
                  }}
                  className="w-full text-left p-3.5 rounded-xl border border-[var(--border-line)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-subtle)] transition-colors flex items-start gap-3 group"
                >
                  <div className="w-7 h-7 rounded-lg bg-[var(--text-primary)] text-[var(--bg-canvas)] font-mono text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {step.number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="font-sans font-semibold text-xs sm:text-sm text-[var(--text-primary)] group-hover:underline">
                        {step.title}
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" />
                    </div>
                    <p className="mt-0.5 text-[11px] text-[var(--text-muted)] font-sans line-clamp-2">
                      {step.subtitle}
                    </p>
                  </div>
                </button>
              );
            }

            return (
              <Link
                key={step.number}
                href={step.href!}
                onClick={onClose}
                className="p-3.5 rounded-xl border border-[var(--border-line)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-subtle)] transition-colors flex items-start gap-3 group"
              >
                <div className="w-7 h-7 rounded-lg bg-[var(--text-primary)] text-[var(--bg-canvas)] font-mono text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {step.number}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="font-sans font-semibold text-xs sm:text-sm text-[var(--text-primary)] group-hover:underline">
                      {step.title}
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" />
                  </div>
                  <p className="mt-0.5 text-[11px] text-[var(--text-muted)] font-sans line-clamp-2">
                    {step.subtitle}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-[var(--border-line-subtle)] flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
          <span>Ready to demo · No login required</span>
          <button
            type="button"
            onClick={onClose}
            className="font-semibold text-[var(--text-primary)] hover:underline"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
