'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowUpRight, 
  Clock, 
  Receipt, 
  Users, 
  Flame, 
  AlertCircle, 
  Calendar,
  ChevronRight,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { formatINR } from '@/lib/money';
import { ReliabilityBadge } from '@/components/ui/ReliabilityBadge';
import { WhoOwesRow } from '@/lib/receivables';
import { AgingBucket } from '@/lib/aging';

interface DashboardResponse {
  success: boolean;
  isDemo: boolean;
  totalOutstanding: number;
  totalOverdue: number;
  thisMonthReceived: number;
  agingBuckets: Record<AgingBucket, { count: number; amount: number }>;
  whoOwesRows: WhoOwesRow[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = () => {
    setLoading(true);
    setError(null);
    fetch('/api/dashboard')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load dashboard data');
        return res.json();
      })
      .then((json) => {
        if (!json.success) throw new Error(json.error || 'Failed to parse dashboard');
        setData(json);
      })
      .catch((err) => {
        setError(err.message || 'Error loading dashboard');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-[var(--bg-surface-subtle)] rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)] p-5 animate-pulse" />
          ))}
        </div>
        <div className="h-72 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)] p-6 animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)] text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-[var(--money-out-bg)] flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-[var(--money-out)]" />
        </div>
        <h2 className="font-serif italic text-2xl font-bold text-[var(--text-primary)]">
          Unable to Load Dashboard
        </h2>
        <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
          {error || 'Something went wrong while retrieving receivables data.'}
        </p>
        <button
          onClick={fetchDashboard}
          type="button"
          className="inline-flex items-center gap-2 rounded-full bg-[var(--text-primary)] text-[var(--bg-canvas)] px-5 py-2.5 text-xs font-mono uppercase tracking-wider font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const { totalOutstanding, totalOverdue, thisMonthReceived, agingBuckets, whoOwesRows } = data;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif italic text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
            Who Owes Me
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)] font-mono">
            Outstanding milestone invoices, overdue aging, and payment collection priorities
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/bad-day"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--money-out)] bg-[var(--money-out-bg)] px-4 py-2 text-xs font-mono font-medium text-[var(--money-out)] hover:opacity-90 transition-opacity"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Bad Day Mode</span>
          </Link>
          <Link
            href="/invoices"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border-line)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-medium hover:bg-[var(--bg-surface-subtle)] transition-colors"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>All Invoices</span>
          </Link>
        </div>
      </div>

      {/* Top Level KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Outstanding */}
        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)]">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
            <span>Total Outstanding</span>
            <Receipt className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[var(--text-primary)]">
            {formatINR(totalOutstanding)}
          </div>
          <p className="mt-1 text-xs text-[var(--text-faint)] font-mono">
            Combined unpaid sent balance
          </p>
        </div>

        {/* Total Overdue */}
        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)]">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[var(--money-out)]">
            <span>Total Overdue</span>
            <Clock className="w-4 h-4 text-[var(--money-out)]" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[var(--money-out)]">
            {formatINR(totalOverdue)}
          </div>
          <p className="mt-1 text-xs text-[var(--text-faint)] font-mono">
            Invoices past milestone due date
          </p>
        </div>

        {/* Received This Month */}
        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)]">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[var(--money-in)]">
            <span>Received This Month</span>
            <ArrowUpRight className="w-4 h-4 text-[var(--money-in)]" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[var(--money-in)]">
            {formatINR(thisMonthReceived)}
          </div>
          <p className="mt-1 text-xs text-[var(--text-faint)] font-mono">
            Collected via UPI &amp; transfers
          </p>
        </div>
      </div>

      {/* Aging Receivables Breakdown */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
            Receivables Aging Buckets
          </h2>
          <span className="text-[11px] font-mono text-[var(--text-faint)]">
            Excludes drafts and fully settled invoices
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Not Due */}
          <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-line)]">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
              Not Yet Due
            </div>
            <div className="mt-1.5 text-lg sm:text-xl font-serif font-bold text-[var(--text-primary)]">
              {formatINR(agingBuckets.not_due.amount)}
            </div>
            <div className="mt-1 text-[11px] font-mono text-[var(--text-faint)]">
              {agingBuckets.not_due.count} invoice{agingBuckets.not_due.count === 1 ? '' : 's'}
            </div>
          </div>

          {/* 1 - 7 Days */}
          <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-line)]">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--money-warn)]">
              1–7 Days Overdue
            </div>
            <div className="mt-1.5 text-lg sm:text-xl font-serif font-bold text-[var(--money-warn)]">
              {formatINR(agingBuckets['1_7'].amount)}
            </div>
            <div className="mt-1 text-[11px] font-mono text-[var(--text-faint)]">
              {agingBuckets['1_7'].count} invoice{agingBuckets['1_7'].count === 1 ? '' : 's'}
            </div>
          </div>

          {/* 8 - 30 Days */}
          <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-line)]">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--money-out)]">
              8–30 Days Overdue
            </div>
            <div className="mt-1.5 text-lg sm:text-xl font-serif font-bold text-[var(--money-out)]">
              {formatINR(agingBuckets['8_30'].amount)}
            </div>
            <div className="mt-1 text-[11px] font-mono text-[var(--text-faint)]">
              {agingBuckets['8_30'].count} invoice{agingBuckets['8_30'].count === 1 ? '' : 's'}
            </div>
          </div>

          {/* 30+ Days */}
          <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--money-out)]/40 bg-[var(--money-out-bg)]/20">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--money-out)] font-semibold">
              30+ Days Overdue
            </div>
            <div className="mt-1.5 text-lg sm:text-xl font-serif font-bold text-[var(--money-out)]">
              {formatINR(agingBuckets['30_plus'].amount)}
            </div>
            <div className="mt-1 text-[11px] font-mono text-[var(--money-out)]">
              {agingBuckets['30_plus'].count} critical invoice{agingBuckets['30_plus'].count === 1 ? '' : 's'}
            </div>
          </div>
        </div>
      </div>

      {/* Per-Client Receivables Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold">
              Client Ledger (Who Owes What)
            </h2>
            <p className="text-xs text-[var(--text-muted)] font-mono">
              Sorted by overdue amount descending, then total outstanding
            </p>
          </div>
          <span className="text-xs font-mono text-[var(--text-faint)]">
            {whoOwesRows.length} client{whoOwesRows.length === 1 ? '' : 's'} with balance
          </span>
        </div>

        {whoOwesRows.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)] text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-full bg-[var(--money-in-bg)] flex items-center justify-center">
              <Receipt className="w-5 h-5 text-[var(--money-in)]" />
            </div>
            <h3 className="font-serif italic text-lg font-bold text-[var(--text-primary)]">
              All Clear! No Pending Receivables
            </h3>
            <p className="text-xs text-[var(--text-muted)] font-mono">
              Every client has settled their milestone invoices.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)] overflow-hidden">
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-line)] bg-[var(--bg-surface-subtle)] text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Reliability</th>
                    <th className="py-3 px-4 text-right">Total Owed</th>
                    <th className="py-3 px-4 text-right">Overdue</th>
                    <th className="py-3 px-4">Oldest Due Date</th>
                    <th className="py-3 px-4 text-center">Days Overdue</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-line-subtle)] text-sm">
                  {whoOwesRows.map((row) => (
                    <tr
                      key={row.clientId}
                      className="hover:bg-[var(--bg-surface-subtle)]/50 transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-medium text-[var(--text-primary)]">
                        <Link
                          href={`/invoices?clientId=${row.clientId}`}
                          className="hover:underline flex items-center gap-1.5"
                        >
                          <span>{row.name}</span>
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <ReliabilityBadge reliability={row.reliability} />
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-medium text-[var(--text-primary)]">
                        {formatINR(row.outstanding)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold">
                        {row.overdueTotal > 0 ? (
                          <span className="text-[var(--money-out)]">
                            {formatINR(row.overdueTotal)}
                          </span>
                        ) : (
                          <span className="text-[var(--text-faint)]">₹0</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-[var(--text-muted)]">
                        {row.oldestOverdueDueDate ? (
                          <span>{row.oldestOverdueDueDate}</span>
                        ) : (
                          <span className="text-[var(--text-faint)]">Not overdue</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {row.maxDaysOverdue > 0 ? (
                          <span className="inline-block px-2 py-0.5 rounded-full font-mono text-xs font-semibold text-[var(--money-out)] bg-[var(--money-out-bg)]">
                            {row.maxDaysOverdue}d
                          </span>
                        ) : (
                          <span className="text-xs font-mono text-[var(--text-faint)]">0d</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/invoices?clientId=${row.clientId}`}
                          className="inline-flex items-center gap-1 text-xs font-mono text-[var(--text-muted)] group-hover:text-[var(--text-primary)] hover:underline"
                        >
                          <span>View</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-[var(--border-line-subtle)]">
              {whoOwesRows.map((row) => (
                <Link
                  key={row.clientId}
                  href={`/invoices?clientId=${row.clientId}`}
                  className="block p-4 hover:bg-[var(--bg-surface-subtle)]/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-[var(--text-primary)] text-sm">
                        {row.name}
                      </div>
                      <div className="mt-1">
                        <ReliabilityBadge reliability={row.reliability} />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-sm text-[var(--text-primary)]">
                        {formatINR(row.outstanding)}
                      </div>
                      {row.overdueTotal > 0 ? (
                        <div className="text-xs font-mono text-[var(--money-out)] font-semibold mt-0.5">
                          {formatINR(row.overdueTotal)} overdue
                        </div>
                      ) : (
                        <div className="text-[11px] font-mono text-[var(--text-faint)] mt-0.5">
                          Not overdue
                        </div>
                      )}
                    </div>
                  </div>

                  {row.maxDaysOverdue > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-[var(--border-line-subtle)] flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
                      <span>Oldest: {row.oldestOverdueDueDate}</span>
                      <span className="font-semibold text-[var(--money-out)]">
                        {row.maxDaysOverdue} days overdue
                      </span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
