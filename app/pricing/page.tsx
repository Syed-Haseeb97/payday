'use client';

import React, { useEffect, useState, useId } from 'react';
import Link from 'next/link';
import { 
  Check, 
  ArrowRight, 
  Calculator, 
  Receipt, 
  Flame, 
  TrendingUp, 
  Zap, 
  Sliders, 
  ShieldAlert, 
  CreditCard,
  Building,
  HelpCircle
} from 'lucide-react';
import { formatINR } from '@/lib/money';
import { computeCostOfDelay } from '@/lib/business/costOfDelay';
import { RollingNumber } from '@/components/ui/RollingNumber';

export default function PricingPage() {
  const [overdueAmount, setOverdueAmount] = useState<number>(125000);
  const [monthlyRate, setMonthlyRate] = useState<number>(1.5);
  const [selectedPlanPrice, setSelectedPlanPrice] = useState<number>(299);
  const [loading, setLoading] = useState(true);
  const rateInputId = useId();

  // Fetch actual overdue amount from user's active database
  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && typeof data.totalOverdue === 'number') {
          setOverdueAmount(data.totalOverdue);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const delayCalculation = computeCostOfDelay({
    overdueAmount,
    monthlyRatePercent: monthlyRate,
    planMonthlyPrice: selectedPlanPrice,
  });

  return (
    <div className="space-y-12 max-w-5xl mx-auto pb-12">
      {/* 1. Hero Section */}
      <div className="space-y-4 pt-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-line)] bg-[var(--bg-surface)] px-3.5 py-1 font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--money-in)]" />
          <span>Business Case &amp; Proposed Pricing</span>
        </div>
        <h1 className="font-serif italic text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--text-primary)] leading-[0.98]">
          Know who owes you, and whether you can pay rent next month.
        </h1>
        <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-2xl font-sans leading-relaxed">
          The practical economics of why solo wedding photographers and videographers switch from physical notebooks to Payday.
        </p>
      </div>

      {/* 2. The Problem in Three Plain Sentences */}
      <div className="p-6 sm:p-8 rounded-2xl app-card bg-[var(--bg-surface)] border border-[var(--border-line)] space-y-4">
        <h2 className="text-xs font-mono uppercase tracking-widest text-[var(--text-muted)] font-semibold">
          The Core Problem
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
          <div className="space-y-1.5 border-l-2 border-[var(--money-out)] pl-4">
            <span className="font-mono text-xs font-bold text-[var(--money-out)]">01 · Lumpy Income</span>
            <p className="text-sm text-[var(--text-primary)] font-medium leading-relaxed">
              Money arrives late: client wedding milestones are scattered across advance, shoot date, and final album delivery.
            </p>
          </div>
          <div className="space-y-1.5 border-l-2 border-[var(--money-warn)] pl-4">
            <span className="font-mono text-xs font-bold text-[var(--money-warn)]">02 · Fixed Outflows</span>
            <p className="text-sm text-[var(--text-primary)] font-medium leading-relaxed">
              Bills arrive on time: studio rent, camera equipment EMIs, assistant salaries, and software subscriptions never pause.
            </p>
          </div>
          <div className="space-y-1.5 border-l-2 border-[var(--text-primary)] pl-4">
            <span className="font-mono text-xs font-bold text-[var(--text-primary)]">03 · Passive Tools</span>
            <p className="text-sm text-[var(--text-primary)] font-medium leading-relaxed">
              Notebooks cannot forecast: paper ledgers track what was agreed, but cannot project cash runway or test what-if delays.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Your Numbers (Live Delay Cost Calculator) */}
      <div className="p-6 sm:p-8 rounded-2xl app-card bg-[var(--bg-surface)] border border-[var(--border-line)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border-line-subtle)]">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[var(--money-out)] font-semibold">
              <Calculator className="w-3.5 h-3.5" />
              <span>Interactive ROI Calculation</span>
            </div>
            <h2 className="font-serif italic text-2xl font-bold text-[var(--text-primary)] mt-0.5">
              Your Numbers: The Real Cost of Delayed Receivables
            </h2>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-[var(--border-line)] bg-[var(--bg-surface-subtle)] font-mono text-[11px] text-[var(--text-muted)]">
            Computed from active data
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-5">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Total Overdue Today
              </label>
              <div className="text-3xl font-serif font-bold text-[var(--money-out)] tabular-nums">
                {formatINR(overdueAmount)}
              </div>
              <p className="text-[11px] font-mono text-[var(--text-faint)] mt-1">
                Sum of all milestone invoices currently past their due date.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-[var(--border-line-subtle)]">
              <div className="flex items-center justify-between text-xs font-mono">
                <label htmlFor={rateInputId} className="uppercase tracking-wider text-[var(--text-primary)] font-semibold">
                  Assumed Cost of Delay: {monthlyRate}% / month
                </label>
                <span className="text-[var(--text-faint)]">Editable assumption</span>
              </div>
              <input
                id={rateInputId}
                type="range"
                min="0.5"
                max="3.5"
                step="0.1"
                value={monthlyRate}
                onChange={(e) => setMonthlyRate(parseFloat(e.target.value) || 1.5)}
                className="w-full h-1.5 bg-[var(--border-line)] rounded-lg appearance-none cursor-pointer accent-[var(--text-primary)]"
              />
              <div className="flex justify-between text-[10px] font-mono text-[var(--text-faint)]">
                <span>0.5% (bank rate)</span>
                <span>1.5% (default overdraft)</span>
                <span>3.5% (high-interest EMI)</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-[var(--border-line)] bg-[var(--bg-surface-subtle)] space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-[var(--text-primary)]">
                <HelpCircle className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span>Why this assumption matters</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-sans leading-relaxed">
                When a ₹50,000 wedding payment is late, photographers rely on credit cards or overdrafts at 1.5%–2% per month to pay studio rent and assistants.
              </p>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-7 p-6 rounded-2xl bg-[var(--bg-surface-subtle)] border border-[var(--border-line)] space-y-5">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] font-semibold block">
                Financial Impact
              </span>
              <p className="font-serif italic text-2xl font-bold text-[var(--text-primary)]">
                {delayCalculation.summarySentence}
              </p>
              <p className="text-[11px] font-mono text-[var(--money-warn)] font-medium">
                {delayCalculation.assumptionText}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border-line)]">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] block">
                  Solo Plan Monthly Cost
                </span>
                <span className="text-xl font-serif font-bold text-[var(--text-primary)] tabular-nums">
                  ₹{selectedPlanPrice}
                </span>
                <span className="text-[10px] font-mono text-[var(--text-faint)] block">
                  per month (proposed)
                </span>
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--money-in)] block">
                  Share of Delay Cost
                </span>
                <span className="text-xl font-serif font-bold text-[var(--money-in)] tabular-nums">
                  {delayCalculation.planSharePercent}%
                </span>
                <span className="text-[10px] font-mono text-[var(--text-faint)] block">
                  of 1 month's delay cost
                </span>
              </div>
            </div>

            <p className="text-xs text-[var(--text-muted)] font-sans leading-relaxed pt-1 border-t border-[var(--border-line)]">
              Recovering just one overdue milestone a few days earlier pays for an entire year of Payday Solo.
            </p>
          </div>
        </div>
      </div>

      {/* 4. How Payday Replaces the Notebook */}
      <div className="space-y-6">
        <div>
          <h2 className="font-serif italic text-3xl font-bold text-[var(--text-primary)]">
            How Payday Replaces the Notebook
          </h2>
          <p className="text-xs text-[var(--text-muted)] font-mono mt-1">
            Five purpose-built workflows designed around Indian wedding photography payment cycles
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Milestone Invoices */}
          <Link
            href="/invoices"
            className="p-5 rounded-2xl app-card bg-[var(--bg-surface)] border border-[var(--border-line)] hover:border-[var(--text-primary)] transition-colors group flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-line)] flex items-center justify-center">
                <Receipt className="w-4 h-4 text-[var(--text-primary)]" />
              </div>
              <h3 className="font-serif italic text-lg font-bold text-[var(--text-primary)] group-hover:underline">
                Milestone Invoices (30/50/20)
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-sans leading-relaxed">
                Auto-splits bookings into advance token, event-date balance, and final album delivery with instant UPI QR codes.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border-line-subtle)] flex items-center justify-between text-xs font-mono text-[var(--text-primary)] font-semibold">
              <span>View Invoices</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Bad Day Chase List */}
          <Link
            href="/bad-day"
            className="p-5 rounded-2xl app-card bg-[var(--bg-surface)] border border-[var(--border-line)] hover:border-[var(--money-out)] transition-colors group flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--money-out-bg)] border border-[var(--money-out)]/30 flex items-center justify-center">
                <Flame className="w-4 h-4 text-[var(--money-out)]" />
              </div>
              <h3 className="font-serif italic text-lg font-bold text-[var(--text-primary)] group-hover:underline">
                Bad Day Mode (Chase List)
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-sans leading-relaxed">
                Deterministic mathematical scoring ranks exactly which 3 invoices to chase today for maximum cash relief.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border-line-subtle)] flex items-center justify-between text-xs font-mono text-[var(--money-out)] font-semibold">
              <span>Open Bad Day Mode</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* 90-Day Forecast */}
          <Link
            href="/forecast"
            className="p-5 rounded-2xl app-card bg-[var(--bg-surface)] border border-[var(--border-line)] hover:border-[var(--text-primary)] transition-colors group flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-line)] flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[var(--text-primary)]" />
              </div>
              <h3 className="font-serif italic text-lg font-bold text-[var(--text-primary)] group-hover:underline">
                90-Day Cash Forecast
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-sans leading-relaxed">
                Combines expected client milestones (adjusted by client delay history) with fixed EMIs, rent, and salaries.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border-line-subtle)] flex items-center justify-between text-xs font-mono text-[var(--text-primary)] font-semibold">
              <span>Inspect Forecast</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* What-If Simulator */}
          <Link
            href="/forecast"
            className="p-5 rounded-2xl app-card bg-[var(--bg-surface)] border border-[var(--border-line)] hover:border-[var(--text-primary)] transition-colors group flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-line)] flex items-center justify-center">
                <Sliders className="w-4 h-4 text-[var(--text-primary)]" />
              </div>
              <h3 className="font-serif italic text-lg font-bold text-[var(--text-primary)] group-hover:underline">
                What-If Scenario Simulator
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-sans leading-relaxed">
                Simulate delayed clients, surprise lens repairs, or lost bookings before committing to big expenses.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border-line-subtle)] flex items-center justify-between text-xs font-mono text-[var(--text-primary)] font-semibold">
              <span>Run Scenarios</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Quick Add WhatsApp Parser */}
          <div className="p-5 rounded-2xl app-card bg-[var(--bg-surface)] border border-[var(--border-line)] flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-line)] flex items-center justify-center">
                <Zap className="w-4 h-4 text-[var(--money-in)]" />
              </div>
              <h3 className="font-serif italic text-lg font-bold text-[var(--text-primary)]">
                Quick Add (WhatsApp Parser)
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-sans leading-relaxed">
                Paste raw client chats or speak one sentence. Rules + AI extract the booking with an editable preview before saving.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border-line-subtle)] flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
              <span>Available in Header</span>
              <span className="font-mono text-[10px] uppercase">Always 1-Click</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Proposed Pricing Tiers */}
      <div className="space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-[var(--border-line)] bg-[var(--bg-surface-subtle)] font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">
            <span>Transparent Unit Economics</span>
          </div>
          <h2 className="font-serif italic text-3xl font-bold text-[var(--text-primary)] mt-1">
            Proposed Pricing
          </h2>
          <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
            Clear monthly pricing in Indian Rupees (INR). Paid via UPI autopay.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free Tier */}
          <div className="p-6 rounded-2xl app-card bg-[var(--bg-surface)] border border-[var(--border-line)] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                  Free Tier
                </span>
                <div className="mt-2 text-3xl font-serif font-bold text-[var(--text-primary)]">
                  ₹0
                </div>
                <span className="text-xs font-mono text-[var(--text-faint)]">Forever free</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-sans leading-relaxed">
                For aspiring or beginner photographers tracking their first few shoots.
              </p>
              <ul className="space-y-2.5 text-xs text-[var(--text-primary)] font-sans pt-2 border-t border-[var(--border-line-subtle)]">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[var(--money-in)] flex-shrink-0" />
                  <span>Up to 3 active bookings</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[var(--money-in)] flex-shrink-0" />
                  <span>Manual invoice milestone splits</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[var(--money-in)] flex-shrink-0" />
                  <span>UPI QR code generator</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[var(--money-in)] flex-shrink-0" />
                  <span>Single device access</span>
                </li>
              </ul>
            </div>
            <div className="pt-4 border-t border-[var(--border-line-subtle)] text-center">
              <span className="text-xs font-mono text-[var(--text-muted)]">No card required</span>
            </div>
          </div>

          {/* Solo Tier (Featured) */}
          <div className="p-6 rounded-2xl app-card bg-[var(--bg-surface)] border-2 border-[var(--text-primary)] shadow-md flex flex-col justify-between space-y-6 relative">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-primary)] font-bold">
                  Solo Pro (Recommended)
                </span>
                <span className="inline-flex px-2 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-wider bg-[var(--text-primary)] text-[var(--bg-canvas)] font-bold">
                  Core Tier
                </span>
              </div>
              <div>
                <div className="mt-2 text-3xl font-serif font-bold text-[var(--text-primary)]">
                  ₹299
                  <span className="text-sm font-sans font-normal text-[var(--text-muted)]"> / month</span>
                </div>
                <span className="text-xs font-mono text-[var(--money-in)] font-semibold">
                  Less than ₹10 / day
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-sans leading-relaxed">
                Full operating system for solo wedding photographers and cinematographers.
              </p>
              <ul className="space-y-2.5 text-xs text-[var(--text-primary)] font-sans pt-2 border-t border-[var(--border-line-subtle)]">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[var(--money-in)] flex-shrink-0" />
                  <span className="font-semibold">Unlimited bookings &amp; invoices</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[var(--money-in)] flex-shrink-0" />
                  <span>90-Day Cash Forecast &amp; Runway alerts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[var(--money-in)] flex-shrink-0" />
                  <span>Bad Day Mode (Prioritized debt recovery)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[var(--money-in)] flex-shrink-0" />
                  <span>What-If Scenario Simulator</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[var(--money-in)] flex-shrink-0" />
                  <span>AI WhatsApp Reminders &amp; Quick Add</span>
                </li>
              </ul>
            </div>
            <div className="pt-4 border-t border-[var(--border-line-subtle)] text-center">
              <span className="text-xs font-mono text-[var(--money-in)] font-semibold">
                Annual discount: ₹2,990 / year (2 months free)
              </span>
            </div>
          </div>

          {/* Studio Tier */}
          <div className="p-6 rounded-2xl app-card bg-[var(--bg-surface)] border border-[var(--border-line)] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                  Studio
                </span>
                <div className="mt-2 text-3xl font-serif font-bold text-[var(--text-primary)]">
                  ₹499
                  <span className="text-sm font-sans font-normal text-[var(--text-muted)]"> / month</span>
                </div>
                <span className="text-xs font-mono text-[var(--text-faint)]">For tiny photo teams</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-sans leading-relaxed">
                For photographers with an assistant or studio coordinator.
              </p>
              <ul className="space-y-2.5 text-xs text-[var(--text-primary)] font-sans pt-2 border-t border-[var(--border-line-subtle)]">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[var(--money-in)] flex-shrink-0" />
                  <span>Everything in Solo Pro</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[var(--money-in)] flex-shrink-0" />
                  <span className="font-semibold">+1 Assistant / Editor seat</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[var(--money-in)] flex-shrink-0" />
                  <span>Shared Bad Day collection checklist</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[var(--money-in)] flex-shrink-0" />
                  <span>Multi-account UPI settlement tags</span>
                </li>
              </ul>
            </div>
            <div className="pt-4 border-t border-[var(--border-line-subtle)] text-center">
              <span className="text-xs font-mono text-[var(--text-muted)]">
                Annual: ₹4,990 / year (2 months free)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Who Pays and How it Grows (Go-to-market plan) */}
      <div className="p-6 sm:p-8 rounded-2xl app-card bg-[var(--bg-surface)] border border-[var(--border-line)] space-y-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex px-2 py-0.5 rounded-full border border-[var(--border-line)] bg-[var(--bg-surface-subtle)] font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">
            Go-To-Market Plan
          </span>
          <span className="text-[11px] font-mono text-[var(--text-faint)]">
            (Strategic assumptions, not facts)
          </span>
        </div>

        <h2 className="font-serif italic text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
          Who Pays and How It Grows
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-[var(--text-muted)] font-sans leading-relaxed pt-1">
          <div className="space-y-1.5">
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-primary)] font-bold block">
              1. Direct Payer
            </span>
            <p>
              The business owner pays directly via UPI Autopay (₹299/mo). No credit cards required, fitting Indian banking norms for sole proprietors.
            </p>
          </div>
          <div className="space-y-1.5">
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-primary)] font-bold block">
              2. Distribution Channels
            </span>
            <p>
              Organic acquisition through regional wedding photographer WhatsApp communities, camera rental hubs, and photography institutes.
            </p>
          </div>
          <div className="space-y-1.5">
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-primary)] font-bold block">
              3. Expansion Add-ons
            </span>
            <p>
              Future monetization through optional payment collection gateway integrations (0.8% UPI/netbanking) and 1-click accounting/GST exports.
            </p>
          </div>
        </div>
      </div>

      {/* 7. Guardrails & Disclaimers */}
      <div className="p-5 rounded-2xl border border-[var(--border-line)] bg-[var(--bg-surface-subtle)]/70 space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold">
          <ShieldAlert className="w-4 h-4 text-[var(--text-muted)]" />
          <span>Product Guardrails &amp; Regulatory Disclaimers</span>
        </div>
        <p className="text-xs text-[var(--text-muted)] font-sans leading-relaxed">
          Payday is a financial workflow and communication drafting tool for independent creative businesses. It does not provide legal, tax, or certified accounting advice. All forecast algorithms are deterministic models based on user-entered dates and past average client delays. The demo dataset uses entirely synthetic, fictional client names and mock phone numbers.
        </p>
      </div>
    </div>
  );
}
