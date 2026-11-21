'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Calendar,
  Plus,
  Trash2,
  RotateCcw,
  Receipt,
  Building,
  DollarSign,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Info,
  ShieldCheck,
  Ban,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Area,
} from 'recharts';
import { formatINR, formatCompactINR } from '@/lib/money';
import {
  computeCashForecast,
  ForecastInput,
  ForecastResult,
  ForecastEvent,
  DailyForecastPoint,
  CashHealth,
  addDays,
} from '@/lib/forecast';
import {
  applyScenarios,
  compareForecasts,
  WhatIfScenario,
  ForecastComparison,
} from '@/lib/whatif';
import { Client, Booking, Invoice, RecurringExpense } from '@/lib/db/types';

interface RawForecastInputs {
  today: string;
  openingCash: number;
  invoices: Invoice[];
  clients: Client[];
  recurringExpenses: RecurringExpense[];
  bookings: Booking[];
}

export default function ForecastPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawInputs, setRawInputs] = useState<RawForecastInputs | null>(null);

  // User Interactive State
  const [horizonDays, setHorizonDays] = useState<30 | 60 | 90>(90);
  const [scenarios, setScenarios] = useState<WhatIfScenario[]>([]);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Custom Scenario Form Controls
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientDelayDays, setClientDelayDays] = useState<number>(15);
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [expenseName, setExpenseName] = useState<string>('');
  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState<string>('');

  // Events list filter
  const [eventFilter, setEventFilter] = useState<'all' | 'inflow' | 'outflow'>('all');

  // SSR mounted guard for Recharts
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch forecast inputs
  const fetchInputs = () => {
    setLoading(true);
    setError(null);
    fetch('/api/forecast/inputs')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load forecast inputs');
        return res.json();
      })
      .then((data: RawForecastInputs) => {
        setRawInputs(data);
        if (data.clients.length > 0) {
          // Default client delay to slowest client
          const slowest = [...data.clients].sort(
            (a, b) => b.average_delay_days - a.average_delay_days
          )[0];
          setSelectedClientId(slowest?.id || data.clients[0].id);
        }
        if (data.bookings.length > 0) {
          setSelectedBookingId(data.bookings[0].id);
        }
        setExpenseDate(addDays(data.today, 7));
      })
      .catch((err) => {
        setError(err.message || 'Error fetching forecast inputs');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchInputs();
  }, []);

  // ---------------------------------------------------------------------------
  // Real-Time Pure Forecast Computations (Zero Network Delay)
  // ---------------------------------------------------------------------------

  const baseInput: ForecastInput | null = useMemo(() => {
    if (!rawInputs) return null;
    return {
      today: rawInputs.today,
      horizonDays,
      openingCash: rawInputs.openingCash,
      invoices: rawInputs.invoices,
      clients: rawInputs.clients,
      recurringExpenses: rawInputs.recurringExpenses,
    };
  }, [rawInputs, horizonDays]);

  const baseResult: ForecastResult | null = useMemo(() => {
    if (!baseInput) return null;
    return computeCashForecast(baseInput);
  }, [baseInput]);

  const activeInput: ForecastInput | null = useMemo(() => {
    if (!baseInput) return null;
    return applyScenarios(baseInput, scenarios);
  }, [baseInput, scenarios]);

  const activeResult: ForecastResult | null = useMemo(() => {
    if (!activeInput) return null;
    return computeCashForecast(activeInput);
  }, [activeInput]);

  const comparison: ForecastComparison | null = useMemo(() => {
    if (!baseResult || !activeResult || scenarios.length === 0) return null;
    return compareForecasts(baseResult, activeResult);
  }, [baseResult, activeResult, scenarios]);

  // Client map for quick lookups
  const clientMap = useMemo(() => {
    if (!rawInputs) return new Map<string, Client>();
    return new Map(rawInputs.clients.map((c) => [c.id, c]));
  }, [rawInputs]);

  // Booking map
  const bookingMap = useMemo(() => {
    if (!rawInputs) return new Map<string, Booking>();
    return new Map(rawInputs.bookings.map((b) => [b.id, b]));
  }, [rawInputs]);

  // Find client with largest pending milestone for the health banner suggestion
  const largestPendingClient = useMemo(() => {
    if (!rawInputs || rawInputs.invoices.length === 0) return null;
    const sorted = [...rawInputs.invoices].sort(
      (a, b) => b.amount - b.paid_amount - (a.amount - a.paid_amount)
    );
    const top = sorted[0];
    if (!top) return null;
    const client = clientMap.get(top.client_id);
    return {
      clientName: client?.name || 'Client',
      amount: top.amount - top.paid_amount,
    };
  }, [rawInputs, clientMap]);

  // Chart data preparation
  const chartData = useMemo(() => {
    if (!baseResult || !activeResult) return [];

    return activeResult.daily.map((pt, i) => {
      const basePoint = baseResult.daily[i];
      const dateStr = pt.date;
      const eventsOnDate = activeResult.events.filter((e) => e.date === dateStr);

      return {
        date: dateStr,
        dayIndex: pt.dayIndex,
        balance: pt.balance,
        baselineBalance: basePoint ? basePoint.balance : pt.balance,
        belowZero: pt.balance < 0 ? pt.balance : 0,
        inflow: pt.inflow,
        outflow: pt.outflow,
        events: eventsOnDate,
        isLowest: pt.date === activeResult.summary.lowestBalanceDate,
      };
    });
  }, [baseResult, activeResult]);

  // Y-axis min/max
  const { minBalance, maxBalance } = useMemo(() => {
    if (chartData.length === 0) return { minBalance: 0, maxBalance: 100000 };
    let min = 0;
    let max = 0;
    for (const d of chartData) {
      if (d.balance < min) min = d.balance;
      if (d.balance > max) max = d.balance;
      if (d.baselineBalance < min) min = d.baselineBalance;
      if (d.baselineBalance > max) max = d.baselineBalance;
    }
    // Add 15% headroom
    const buffer = Math.max(50000, Math.round((max - min) * 0.15));
    return {
      minBalance: Math.floor((min - buffer) / 10000) * 10000,
      maxBalance: Math.ceil((max + buffer) / 10000) * 10000,
    };
  }, [chartData]);

  // Filtered upcoming events list
  const filteredEvents = useMemo(() => {
    if (!activeResult) return [];
    let evs = activeResult.events.filter((e) => {
      if (!rawInputs) return true;
      const horizonEndDate = addDays(rawInputs.today, horizonDays - 1);
      return e.date >= rawInputs.today && e.date <= horizonEndDate;
    });

    if (eventFilter === 'inflow') {
      evs = evs.filter((e) => e.type === 'inflow');
    } else if (eventFilter === 'outflow') {
      evs = evs.filter((e) => e.type === 'outflow');
    }

    return evs;
  }, [activeResult, eventFilter, horizonDays, rawInputs]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const groups: Record<string, ForecastEvent[]> = {};
    for (const ev of filteredEvents) {
      if (!groups[ev.date]) groups[ev.date] = [];
      groups[ev.date].push(ev);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredEvents]);

  // ---------------------------------------------------------------------------
  // Preset Scenario Handlers
  // ---------------------------------------------------------------------------

  const applySlowestClientPreset = () => {
    if (!rawInputs) return;
    const slowest = [...rawInputs.clients].sort(
      (a, b) => b.average_delay_days - a.average_delay_days
    )[0];
    if (!slowest) return;

    // Check if already active
    const exists = scenarios.some(
      (s) => s.type === 'clientLate' && s.clientId === slowest.id
    );
    if (exists) return;

    setScenarios((prev) => [
      ...prev,
      { type: 'clientLate', clientId: slowest.id, extraDays: 15 },
    ]);
  };

  const applyBiggestBookingPreset = () => {
    if (!rawInputs) return;
    // Calculate unpaid balance per booking
    const unpaidByBooking = new Map<string, number>();
    for (const inv of rawInputs.invoices) {
      const bal = inv.amount - inv.paid_amount;
      if (bal > 0) {
        unpaidByBooking.set(
          inv.booking_id,
          (unpaidByBooking.get(inv.booking_id) || 0) + bal
        );
      }
    }

    let topBookingId: string | null = null;
    let maxUnpaid = 0;
    unpaidByBooking.forEach((val, key) => {
      if (val > maxUnpaid) {
        maxUnpaid = val;
        topBookingId = key;
      }
    });

    if (!topBookingId) return;

    const exists = scenarios.some(
      (s) => s.type === 'loseBooking' && s.bookingId === topBookingId
    );
    if (exists) return;

    setScenarios((prev) => [
      ...prev,
      { type: 'loseBooking', bookingId: topBookingId! },
    ]);
  };

  const applySurpriseExpensePreset = () => {
    if (!rawInputs) return;
    const targetDate = addDays(rawInputs.today, 7);
    const name = 'Emergency Equipment Repair';
    const amount = 30000;

    const exists = scenarios.some(
      (s) => s.type === 'addExpense' && s.name === name
    );
    if (exists) return;

    setScenarios((prev) => [
      ...prev,
      { type: 'addExpense', name, amount, date: targetDate },
    ]);
  };

  // Custom scenario additions
  const handleAddClientDelay = () => {
    if (!selectedClientId || clientDelayDays <= 0) return;
    setScenarios((prev) => [
      ...prev.filter((s) => !(s.type === 'clientLate' && s.clientId === selectedClientId)),
      { type: 'clientLate', clientId: selectedClientId, extraDays: clientDelayDays },
    ]);
  };

  const handleToggleLoseBooking = (bookingId: string) => {
    const exists = scenarios.some(
      (s) => s.type === 'loseBooking' && s.bookingId === bookingId
    );
    if (exists) {
      setScenarios((prev) =>
        prev.filter((s) => !(s.type === 'loseBooking' && s.bookingId === bookingId))
      );
    } else {
      setScenarios((prev) => [
        ...prev,
        { type: 'loseBooking', bookingId },
      ]);
    }
  };

  const handleAddOneOffExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expenseAmount);
    if (!expenseName.trim() || isNaN(amt) || amt <= 0 || !expenseDate) return;

    setScenarios((prev) => [
      ...prev,
      { type: 'addExpense', name: expenseName.trim(), amount: amt, date: expenseDate },
    ]);

    setExpenseName('');
    setExpenseAmount('');
  };

  const removeScenarioAtIndex = (index: number) => {
    setScenarios((prev) => prev.filter((_, i) => i !== index));
  };

  const resetAllScenarios = () => {
    setScenarios([]);
  };

  // Loading and Error States
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-[#E3EFE8]/50 rounded-xl" />
        <div className="h-28 rounded-2xl bg-white border border-[#C8C2B5] p-5" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-white border border-[#C8C2B5] p-4" />
          ))}
        </div>
        <div className="h-80 rounded-2xl bg-white border border-[#C8C2B5] p-6" />
      </div>
    );
  }

  if (error || !rawInputs || !baseResult || !activeResult) {
    return (
      <div className="p-8 rounded-2xl bg-white border border-[#C8C2B5] text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-[#F8E9E4] flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-[#B53A26]" />
        </div>
        <h2 className="font-serif italic text-2xl font-bold text-[#16181D]">
          Unable to Load Cash Forecast
        </h2>
        <p className="text-sm text-[#5F626A] max-w-md mx-auto">
          {error || 'Could not retrieve forecast inputs.'}
        </p>
        <button
          onClick={fetchInputs}
          type="button"
          className="inline-flex items-center gap-2 rounded-full bg-[#16181D] text-[#F5F3EE] px-5 py-2.5 text-xs font-mono uppercase tracking-wider font-semibold hover:opacity-90 transition-opacity"
        >
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const { summary } = activeResult;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Horizon Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#C8C2B5] bg-white px-3.5 py-1 font-mono text-[11px] uppercase tracking-wider text-[#1D6B52]">
            <span>Financial Modeling &amp; Runway Engine</span>
          </div>
          <h1 className="mt-2 font-serif italic text-3xl sm:text-4xl font-bold tracking-tight text-[#16181D]">
            90-Day Cash Forecast
          </h1>
          <p className="mt-1 text-sm text-[#5F626A] font-sans">
            Opening cash + Expected milestone receipts − Fixed studio EMIs, rent &amp; bills
          </p>
        </div>

        {/* Horizon Toggle & Mobile Scenario Toggle */}
        <div className="flex items-center gap-2.5">
          <div className="inline-flex items-center rounded-full border border-[#C8C2B5] bg-white p-1">
            {([30, 60, 90] as const).map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHorizonDays(h)}
                className={`rounded-full px-3.5 py-1 text-xs font-mono uppercase tracking-wider font-semibold transition-all ${
                  horizonDays === h
                    ? 'bg-[#16181D] text-[#F5F3EE]'
                    : 'text-[#5F626A] hover:text-[#16181D]'
                }`}
              >
                {h}D
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setMobileDrawerOpen((prev) => !prev)}
            className="lg:hidden inline-flex items-center gap-1.5 rounded-full border border-[#C8C2B5] bg-white px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider font-medium text-[#16181D] hover:bg-[#F5F3EE] transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>What-If ({scenarios.length})</span>
          </button>
        </div>
      </div>

      {/* Health Banner (Safe / Tight / Danger) */}
      <div>
        {summary.health === 'safe' && (
          <div className="p-4 sm:p-5 rounded-2xl border border-[#C8C2B5] bg-[#E3EFE8] text-[#1D6B52] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#1D6B52]" />
              <div>
                <div className="font-mono text-xs uppercase tracking-wider font-bold">
                  Status: Healthy Cash Runway
                </div>
                <div className="mt-0.5 text-sm font-sans font-medium">
                  Cash looks healthy for the next {horizonDays} days. Lowest point:{' '}
                  <span className="font-semibold">{formatINR(summary.lowestBalance)}</span> on{' '}
                  <span className="font-semibold">
                    {format(parseISO(summary.lowestBalanceDate), 'd MMM yyyy')}
                  </span>.
                </div>
              </div>
            </div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#1D6B52]/80 self-end sm:self-auto">
              Safe &gt; 20% Reserve
            </div>
          </div>
        )}

        {summary.health === 'tight' && (
          <div className="p-4 sm:p-5 rounded-2xl border border-[#C8C2B5] bg-[#F6ECD9] text-[#86560D] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#86560D]" />
              <div>
                <div className="font-mono text-xs uppercase tracking-wider font-bold">
                  Status: Tight Cash Reserve
                </div>
                <div className="mt-0.5 text-sm font-sans font-medium">
                  Cash will be tight around{' '}
                  <span className="font-semibold">
                    {format(parseISO(summary.lowestBalanceDate), 'd MMM yyyy')}
                  </span>{' '}
                  ({formatINR(summary.lowestBalance)} remaining).
                  {largestPendingClient && (
                    <span>
                      {' '}
                      Consider chasing{' '}
                      <span className="font-semibold underline">
                        {largestPendingClient.clientName}
                      </span>{' '}
                      ({formatINR(largestPendingClient.amount)} pending).
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#86560D]/80 self-end sm:self-auto">
              Reserve &lt; 20%
            </div>
          </div>
        )}

        {summary.health === 'danger' && (
          <div className="p-4 sm:p-5 rounded-2xl border border-[#C8C2B5] bg-[#F8E9E4] text-[#B53A26] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#B53A26]" />
              <div>
                <div className="font-mono text-xs uppercase tracking-wider font-bold">
                  Status: Cash Deficit Projected
                </div>
                <div className="mt-0.5 text-sm font-sans font-medium">
                  Cash projected to go negative (
                  <span className="font-semibold">
                    {formatINR(summary.lowestBalance)}
                  </span>
                  ) on{' '}
                  <span className="font-semibold">
                    {summary.firstNegativeDate
                      ? format(parseISO(summary.firstNegativeDate), 'd MMM yyyy')
                      : 'horizon'}
                  </span>
                  . You have{' '}
                  <span className="font-semibold">
                    {summary.runwayDays !== null ? `${summary.runwayDays} days` : '0 days'}
                  </span>{' '}
                  of runway.
                </div>
              </div>
            </div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#B53A26]/80 self-end sm:self-auto font-bold">
              Negative Balance Alert
            </div>
          </div>
        )}
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Lowest Balance */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#C8C2B5]">
          <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[#5F626A]">
            Lowest Balance
          </span>
          <div
            className={`mt-2 text-xl sm:text-2xl font-serif font-bold ${
              summary.lowestBalance < 0
                ? 'text-[#B53A26]'
                : summary.lowestBalance < rawInputs.openingCash * 0.2
                ? 'text-[#86560D]'
                : 'text-[#16181D]'
            }`}
          >
            {formatINR(summary.lowestBalance)}
          </div>
          <span className="text-[11px] text-[#5F626A] font-mono block mt-1">
            on {format(parseISO(summary.lowestBalanceDate), 'd MMM yyyy')}
          </span>
        </div>

        {/* Runway Days */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#C8C2B5]">
          <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[#5F626A]">
            Cash Runway
          </span>
          <div
            className={`mt-2 text-xl sm:text-2xl font-serif font-bold ${
              summary.runwayDays !== null ? 'text-[#B53A26]' : 'text-[#1D6B52]'
            }`}
          >
            {summary.runwayDays !== null ? `${summary.runwayDays} Days` : `Safe (>${horizonDays}d)`}
          </div>
          <span className="text-[11px] text-[#5F626A] font-mono block mt-1">
            {summary.firstNegativeDate
              ? `Deficit on ${format(parseISO(summary.firstNegativeDate), 'd MMM')}`
              : 'Zero cash day not reached'}
          </span>
        </div>

        {/* Total Projected Receipts */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#C8C2B5]">
          <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[#1D6B52]">
            Projected Receipts
          </span>
          <div className="mt-2 text-xl sm:text-2xl font-serif font-bold text-[#1D6B52]">
            +{formatINR(summary.totalIn)}
          </div>
          <span className="text-[11px] text-[#5F626A] font-mono block mt-1">
            Milestone inflows
          </span>
        </div>

        {/* Total Projected Outflows */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#C8C2B5]">
          <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[#B53A26]">
            Projected Outflows
          </span>
          <div className="mt-2 text-xl sm:text-2xl font-serif font-bold text-[#B53A26]">
            −{formatINR(summary.totalOut)}
          </div>
          <span className="text-[11px] text-[#5F626A] font-mono block mt-1">
            Rent, EMIs, salaries
          </span>
        </div>
      </div>

      {/* Main Grid: Forecast Chart + What-If Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Recharts Chart + Events List (8 cols on desktop) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Recharts Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#C8C2B5] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#C8C2B5]/40 pb-4">
              <div>
                <h3 className="font-serif italic text-lg sm:text-xl font-bold text-[#16181D]">
                  Daily Cash Trajectory
                </h3>
                <p className="text-xs text-[#5F626A] font-mono mt-0.5">
                  Opening cash ₹{formatCompactINR(rawInputs.openingCash)} · Adjusted by client delay patterns
                </p>
              </div>

              {scenarios.length > 0 && (
                <div className="flex items-center gap-3 text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-[#5F626A]">
                    <span className="w-3 h-0.5 border-t border-dashed border-[#8A8680]" />
                    <span>Baseline</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#16181D] font-medium">
                    <span className="w-3 h-0.5 bg-[#16181D]" />
                    <span>What-If Scenario</span>
                  </div>
                </div>
              )}
            </div>

            {/* Recharts Container */}
            <div className="h-80 w-full pt-2">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#E5E1D8"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => {
                        try {
                          return format(parseISO(d), 'd MMM');
                        } catch {
                          return d;
                        }
                      }}
                      stroke="#8A8680"
                      tick={{ fontSize: 10, fontFamily: 'Geist Mono, monospace' }}
                      minTickGap={25}
                    />

                    <YAxis
                      domain={[minBalance, maxBalance]}
                      tickFormatter={(v) => formatCompactINR(v)}
                      stroke="#8A8680"
                      tick={{ fontSize: 10, fontFamily: 'Geist Mono, monospace' }}
                      width={55}
                    />

                    {/* Zero Cash Reference Line */}
                    <ReferenceLine
                      y={0}
                      stroke="#B53A26"
                      strokeWidth={1.5}
                      strokeDasharray="4 2"
                      label={{
                        value: 'Zero Cash',
                        position: 'insideBottomRight',
                        fill: '#B53A26',
                        fontSize: 10,
                        fontFamily: 'Geist Mono, monospace',
                      }}
                    />

                    {/* Baseline Line (shown when scenario active) */}
                    {scenarios.length > 0 && (
                      <Line
                        type="monotone"
                        dataKey="baselineBalance"
                        stroke="#8A8680"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={false}
                        isAnimationActive={false}
                        name="Baseline"
                      />
                    )}

                    {/* Active Projected Balance Line */}
                    <Line
                      type="monotone"
                      dataKey="balance"
                      stroke={
                        summary.health === 'danger'
                          ? '#B53A26'
                          : summary.health === 'tight'
                          ? '#86560D'
                          : '#1D6B52'
                      }
                      strokeWidth={2.5}
                      isAnimationActive={false}
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        if (payload.date === summary.lowestBalanceDate) {
                          return (
                            <svg key={`dot-${payload.date}`}>
                              <circle
                                cx={cx}
                                cy={cy}
                                r={5}
                                fill={summary.health === 'danger' ? '#B53A26' : '#86560D'}
                                stroke="#FFFFFF"
                                strokeWidth={2}
                              />
                            </svg>
                          );
                        }
                        return null;
                      }}
                      name="Projected Balance"
                    />

                    {/* Custom Tooltip */}
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || payload.length === 0) return null;
                        const data = payload[0].payload;
                        const dateFormatted = format(parseISO(data.date), 'EEEE, d MMM yyyy');
                        const isLowest = data.date === summary.lowestBalanceDate;

                        return (
                          <div className="rounded-xl border border-[#C8C2B5] bg-white p-3.5 shadow-sm text-xs font-sans space-y-2 max-w-xs z-50">
                            <div className="flex items-center justify-between gap-2 border-b border-[#C8C2B5]/50 pb-1.5">
                              <span className="font-mono text-[11px] text-[#5F626A]">
                                {dateFormatted}
                              </span>
                              {isLowest && (
                                <span className="inline-block rounded-full bg-[#F6ECD9] text-[#86560D] px-2 py-0.5 font-mono text-[9px] uppercase font-bold">
                                  Lowest Day
                                </span>
                              )}
                            </div>

                            <div className="flex items-baseline justify-between gap-3">
                              <span className="text-[#5F626A] font-mono text-[11px]">
                                Projected Balance:
                              </span>
                              <span
                                className={`font-mono font-bold text-sm ${
                                  data.balance < 0
                                    ? 'text-[#B53A26]'
                                    : data.balance < rawInputs.openingCash * 0.2
                                    ? 'text-[#86560D]'
                                    : 'text-[#16181D]'
                                }`}
                              >
                                {formatINR(data.balance)}
                              </span>
                            </div>

                            {scenarios.length > 0 && (
                              <div className="flex items-baseline justify-between gap-3 text-[11px] text-[#5F626A] font-mono">
                                <span>Baseline:</span>
                                <span>{formatINR(data.baselineBalance)}</span>
                              </div>
                            )}

                            {/* Events on this day */}
                            {data.events && data.events.length > 0 && (
                              <div className="pt-1.5 border-t border-[#C8C2B5]/40 space-y-1">
                                <span className="text-[10px] font-mono uppercase tracking-wider text-[#5F626A] block">
                                  Cash Movements:
                                </span>
                                {data.events.map((ev: ForecastEvent) => (
                                  <div
                                    key={ev.id}
                                    className="flex items-center justify-between text-[11px] gap-2"
                                  >
                                    <span
                                      className={`truncate ${
                                        ev.type === 'inflow'
                                          ? 'text-[#1D6B52]'
                                          : 'text-[#B53A26]'
                                      }`}
                                    >
                                      {ev.label}
                                    </span>
                                    <span
                                      className={`font-mono font-semibold flex-shrink-0 ${
                                        ev.type === 'inflow'
                                          ? 'text-[#1D6B52]'
                                          : 'text-[#B53A26]'
                                      }`}
                                    >
                                      {ev.type === 'inflow' ? '+' : '−'}
                                      {formatINR(ev.amount)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs font-mono text-[#5F626A]">
                  Loading chart engine...
                </div>
              )}
            </div>

            {/* Mandatory Disclaimer */}
            <div className="pt-3 border-t border-[#C8C2B5]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#5F626A] font-mono">
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#5F626A]" />
                <span>Estimates based on the data you entered. Real bank balances may differ.</span>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-[#5F626A]/70">
                Deterministic Model
              </span>
            </div>
          </div>

          {/* Upcoming Events List */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#C8C2B5] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#C8C2B5]/40 pb-4">
              <div>
                <h3 className="font-serif italic text-lg sm:text-xl font-bold text-[#16181D]">
                  Upcoming Cash Movements
                </h3>
                <p className="text-xs text-[#5F626A] font-mono mt-0.5">
                  Chronological schedule within {horizonDays}-day horizon ({filteredEvents.length} events)
                </p>
              </div>

              {/* Event Type Filter Tabs */}
              <div className="inline-flex items-center rounded-full border border-[#C8C2B5] bg-[#F5F3EE] p-0.5 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setEventFilter('all')}
                  className={`rounded-full px-3 py-1 font-medium transition-colors ${
                    eventFilter === 'all'
                      ? 'bg-white text-[#16181D] shadow-2xs font-semibold'
                      : 'text-[#5F626A] hover:text-[#16181D]'
                  }`}
                >
                  All ({activeResult.events.length})
                </button>
                <button
                  type="button"
                  onClick={() => setEventFilter('inflow')}
                  className={`rounded-full px-3 py-1 font-medium transition-colors ${
                    eventFilter === 'inflow'
                      ? 'bg-white text-[#1D6B52] shadow-2xs font-semibold'
                      : 'text-[#5F626A] hover:text-[#1D6B52]'
                  }`}
                >
                  Receipts
                </button>
                <button
                  type="button"
                  onClick={() => setEventFilter('outflow')}
                  className={`rounded-full px-3 py-1 font-medium transition-colors ${
                    eventFilter === 'outflow'
                      ? 'bg-white text-[#B53A26] shadow-2xs font-semibold'
                      : 'text-[#5F626A] hover:text-[#B53A26]'
                  }`}
                >
                  Bills &amp; Outflows
                </button>
              </div>
            </div>

            {/* Grouped Chronological Schedule */}
            {eventsByDate.length === 0 ? (
              <div className="py-12 text-center text-xs font-mono text-[#5F626A]">
                No cash events scheduled within this horizon.
              </div>
            ) : (
              <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                {eventsByDate.map(([dateStr, dayEvents]) => (
                  <div key={dateStr} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#16181D]">
                        {format(parseISO(dateStr), 'd MMM yyyy')}
                      </span>
                      <span className="text-[10px] font-mono text-[#5F626A]">
                        ({format(parseISO(dateStr), 'EEEE')})
                      </span>
                      <div className="flex-1 h-px bg-[#C8C2B5]/30" />
                    </div>

                    <div className="space-y-1.5 pl-2">
                      {dayEvents.map((ev) => (
                        <div
                          key={ev.id}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-[#C8C2B5]/60 bg-[#F5F3EE]/50 hover:bg-[#F5F3EE] transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                ev.type === 'inflow' ? 'bg-[#1D6B52]' : 'bg-[#B53A26]'
                              }`}
                            />
                            <div className="truncate">
                              <span className="text-xs font-sans font-medium text-[#16181D] block truncate">
                                {ev.label}
                              </span>
                              <span className="text-[10px] font-mono uppercase tracking-wider text-[#5F626A]">
                                {ev.source.replace('_', ' ')}
                              </span>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0 pl-2">
                            <span
                              className={`text-xs font-mono font-bold block ${
                                ev.type === 'inflow' ? 'text-[#1D6B52]' : 'text-[#B53A26]'
                              }`}
                            >
                              {ev.type === 'inflow' ? '+' : '−'}
                              {formatINR(ev.amount)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Interactive What-If Scenario Simulator (4 cols on desktop) */}
        <div
          className={`lg:col-span-4 space-y-6 ${
            mobileDrawerOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* What-If Panel Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#C8C2B5] space-y-6 sticky top-6">
            <div className="flex items-center justify-between border-b border-[#C8C2B5]/40 pb-4">
              <div>
                <h3 className="font-serif italic text-lg sm:text-xl font-bold text-[#16181D]">
                  What-If Simulator
                </h3>
                <p className="text-xs text-[#5F626A] font-mono mt-0.5">
                  Stress-test delays, lost bookings &amp; expenses
                </p>
              </div>

              {scenarios.length > 0 && (
                <button
                  type="button"
                  onClick={resetAllScenarios}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#C8C2B5] bg-white px-2.5 py-1 text-[11px] font-mono font-semibold text-[#5F626A] hover:text-[#16181D] hover:bg-[#F5F3EE] transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Quick Preset Stress Tests */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#5F626A] block font-semibold">
                One-Tap Stress Presets
              </span>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={applySlowestClientPreset}
                  className="text-left p-2.5 rounded-xl border border-[#C8C2B5]/80 bg-[#F5F3EE]/60 hover:bg-[#F5F3EE] transition-all text-xs font-sans group"
                >
                  <div className="font-semibold text-[#16181D] flex items-center justify-between">
                    <span>Slowest client pays 15 days late</span>
                    <ArrowRight className="w-3 h-3 text-[#5F626A] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <span className="text-[10px] text-[#5F626A] font-mono block mt-0.5">
                    Delays Rohit Mehta (slowest history) by 15 extra days
                  </span>
                </button>

                <button
                  type="button"
                  onClick={applyBiggestBookingPreset}
                  className="text-left p-2.5 rounded-xl border border-[#C8C2B5]/80 bg-[#F5F3EE]/60 hover:bg-[#F5F3EE] transition-all text-xs font-sans group"
                >
                  <div className="font-semibold text-[#16181D] flex items-center justify-between">
                    <span>Biggest unpaid booking cancelled</span>
                    <ArrowRight className="w-3 h-3 text-[#5F626A] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <span className="text-[10px] text-[#5F626A] font-mono block mt-0.5">
                    Simulates zero receipts from largest upcoming booking
                  </span>
                </button>

                <button
                  type="button"
                  onClick={applySurpriseExpensePreset}
                  className="text-left p-2.5 rounded-xl border border-[#C8C2B5]/80 bg-[#F5F3EE]/60 hover:bg-[#F5F3EE] transition-all text-xs font-sans group"
                >
                  <div className="font-semibold text-[#16181D] flex items-center justify-between">
                    <span>Surprise ₹30,000 expense next week</span>
                    <ArrowRight className="w-3 h-3 text-[#5F626A] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <span className="text-[10px] text-[#5F626A] font-mono block mt-0.5">
                    Adds emergency gear repair outflow on {format(parseISO(addDays(rawInputs.today, 7)), 'd MMM')}
                  </span>
                </button>
              </div>
            </div>

            {/* Before-and-After Comparison Card (shown when scenarios active) */}
            {comparison && (
              <div className="p-4 rounded-xl border border-[#C8C2B5] bg-[#F5F3EE] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-wider font-bold text-[#16181D]">
                    Scenario Impact
                  </span>
                  <span
                    className={`font-mono text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                      comparison.healthWorsened
                        ? 'bg-[#F8E9E4] text-[#B53A26]'
                        : 'bg-[#E3EFE8] text-[#1D6B52]'
                    }`}
                  >
                    {comparison.healthWorsened ? 'Health Worsened' : 'Stable'}
                  </span>
                </div>

                <div className="space-y-2 text-xs font-sans">
                  <div className="flex justify-between items-baseline border-b border-[#C8C2B5]/40 pb-1.5">
                    <span className="text-[#5F626A]">Lowest Point:</span>
                    <div className="font-mono text-right">
                      <span className="text-[#5F626A]">
                        {formatINR(baseResult.summary.lowestBalance)}
                      </span>
                      <span className="text-[#5F626A] mx-1">→</span>
                      <span
                        className={`font-bold ${
                          activeResult.summary.lowestBalance < 0
                            ? 'text-[#B53A26]'
                            : 'text-[#16181D]'
                        }`}
                      >
                        {formatINR(activeResult.summary.lowestBalance)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-baseline border-b border-[#C8C2B5]/40 pb-1.5">
                    <span className="text-[#5F626A]">Runway:</span>
                    <div className="font-mono text-right">
                      <span className="text-[#5F626A]">
                        {baseResult.summary.runwayDays !== null
                          ? `${baseResult.summary.runwayDays}d`
                          : '>90d'}
                      </span>
                      <span className="text-[#5F626A] mx-1">→</span>
                      <span
                        className={`font-bold ${
                          activeResult.summary.runwayDays !== null
                            ? 'text-[#B53A26]'
                            : 'text-[#1D6B52]'
                        }`}
                      >
                        {activeResult.summary.runwayDays !== null
                          ? `${activeResult.summary.runwayDays} days`
                          : '>90d safe'}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <span className="text-[#5F626A]">Ending Balance:</span>
                    <div className="font-mono text-right">
                      <span className="text-[#5F626A]">
                        {formatCompactINR(baseResult.summary.endingBalance)}
                      </span>
                      <span className="text-[#5F626A] mx-1">→</span>
                      <span className="font-bold text-[#16181D]">
                        {formatCompactINR(activeResult.summary.endingBalance)}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] font-mono text-[#5F626A] pt-1 border-t border-[#C8C2B5]/30">
                  {comparison.summaryText}
                </p>
              </div>
            )}

            {/* Active Scenarios List */}
            {scenarios.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#5F626A] block font-semibold">
                  Active What-If Scenarios ({scenarios.length})
                </span>
                <div className="space-y-1.5">
                  {scenarios.map((sc, idx) => {
                    let desc = '';
                    if (sc.type === 'clientLate') {
                      const c = clientMap.get(sc.clientId);
                      desc = `${c ? c.name : 'Client'} pays ${sc.extraDays}d late`;
                    } else if (sc.type === 'loseBooking') {
                      const b = bookingMap.get(sc.bookingId);
                      desc = `Cancel booking "${b ? b.title : 'Booking'}"`;
                    } else if (sc.type === 'addExpense') {
                      desc = `+${formatINR(sc.amount)} expense: ${sc.name}`;
                    } else if (sc.type === 'invoicePaidEarly') {
                      desc = `Invoice paid early on ${sc.newDate}`;
                    }

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-xl border border-[#C8C2B5] bg-white text-xs font-mono"
                      >
                        <span className="truncate pr-2 font-medium text-[#16181D]">
                          {desc}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeScenarioAtIndex(idx)}
                          className="text-[#5F626A] hover:text-[#B53A26] p-1 transition-colors"
                          title="Remove scenario"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Interactive Controls Accordion/Forms */}
            <div className="space-y-4 pt-2 border-t border-[#C8C2B5]/40">
              {/* 1. Client Delay Slider */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-[#16181D] font-semibold block">
                  Simulate Client Delay
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full text-xs font-sans rounded-xl border border-[#C8C2B5] bg-white px-3 py-2 text-[#16181D] focus:outline-none focus:ring-1 focus:ring-[#16181D]"
                >
                  {rawInputs.clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (avg {c.average_delay_days}d delay)
                    </option>
                  ))}
                </select>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono text-[#5F626A]">
                    <span>Additional delay:</span>
                    <span className="font-bold text-[#16181D]">+{clientDelayDays} days</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="45"
                    step="1"
                    value={clientDelayDays}
                    onChange={(e) => setClientDelayDays(Number(e.target.value))}
                    className="w-full accent-[#16181D]"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddClientDelay}
                  className="w-full rounded-full border border-[#C8C2B5] bg-white px-3 py-1.5 text-xs font-mono uppercase tracking-wider font-semibold text-[#16181D] hover:bg-[#F5F3EE] transition-colors"
                >
                  Apply Delay
                </button>
              </div>

              {/* 2. Cancel a Booking */}
              <div className="space-y-2 pt-3 border-t border-[#C8C2B5]/30">
                <label className="text-xs font-mono uppercase tracking-wider text-[#16181D] font-semibold block">
                  Simulate Lost Booking
                </label>
                <select
                  value={selectedBookingId}
                  onChange={(e) => setSelectedBookingId(e.target.value)}
                  className="w-full text-xs font-sans rounded-xl border border-[#C8C2B5] bg-white px-3 py-2 text-[#16181D] focus:outline-none focus:ring-1 focus:ring-[#16181D]"
                >
                  {rawInputs.bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} ({formatINR(b.total_amount)})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleToggleLoseBooking(selectedBookingId)}
                  className="w-full rounded-full border border-[#C8C2B5] bg-white px-3 py-1.5 text-xs font-mono uppercase tracking-wider font-semibold text-[#16181D] hover:bg-[#F5F3EE] transition-colors"
                >
                  Toggle Booking Cancellation
                </button>
              </div>

              {/* 3. Add One-Off Expense */}
              <form onSubmit={handleAddOneOffExpense} className="space-y-2 pt-3 border-t border-[#C8C2B5]/30">
                <label className="text-xs font-mono uppercase tracking-wider text-[#16181D] font-semibold block">
                  Add One-Off Outflow
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lens Calibration / Travel"
                  value={expenseName}
                  onChange={(e) => setExpenseName(e.target.value)}
                  className="w-full text-xs font-sans rounded-xl border border-[#C8C2B5] bg-white px-3 py-1.5 text-[#16181D] focus:outline-none focus:ring-1 focus:ring-[#16181D]"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Amount (₹)"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="w-full text-xs font-mono rounded-xl border border-[#C8C2B5] bg-white px-3 py-1.5 text-[#16181D] focus:outline-none focus:ring-1 focus:ring-[#16181D]"
                  />
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full text-xs font-mono rounded-xl border border-[#C8C2B5] bg-white px-2 py-1.5 text-[#16181D] focus:outline-none focus:ring-1 focus:ring-[#16181D]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-full bg-[#16181D] text-[#F5F3EE] px-3 py-1.5 text-xs font-mono uppercase tracking-wider font-semibold hover:opacity-90 transition-opacity"
                >
                  Add Outflow
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
