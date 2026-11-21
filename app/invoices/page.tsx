'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Receipt, 
  QrCode, 
  Search, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Invoice, PaymentMethod } from '@/lib/db/types';
import { formatINR } from '@/lib/money';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ReliabilityBadge } from '@/components/ui/ReliabilityBadge';
import { Modal } from '@/components/ui/Modal';
import { format } from 'date-fns';

function InvoicesContent() {
  const searchParams = useSearchParams();
  const initialClientFilter = searchParams.get('clientId') || '';
  const initialSearch = searchParams.get('search') || '';

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'outstanding' | 'overdue' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [clientFilter, setClientFilter] = useState(initialClientFilter);

  // Selected Invoice Detail Modal
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Payment Recording Modal
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const fetchInvoices = () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (clientFilter) params.set('clientId', clientFilter);

    fetch(`/api/invoices?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load invoices');
        return res.json();
      })
      .then((json) => {
        if (!json.success) throw new Error(json.error || 'Failed to fetch invoices');
        setInvoices(json.invoices || []);
      })
      .catch((err) => {
        setError(err.message || 'Error loading invoices');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, clientFilter]);

  const openDetailModal = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`);
      const json = await res.json();
      if (json.success && json.invoice) {
        setSelectedInvoice(json.invoice);
        setIsDetailOpen(true);
      }
    } catch {}
  };

  const openPaymentModal = (invoice: Invoice) => {
    const remaining = invoice.amount - invoice.paid_amount;
    setPaymentInvoice(invoice);
    setPaymentAmount(remaining);
    setPaymentDate(format(new Date(), 'yyyy-MM-dd'));
    setPaymentMethod('UPI');
    setPaymentReference('');
    setPaymentNotes('');
    setPaymentError(null);
    setIsPaymentOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInvoice) return;

    const remaining = paymentInvoice.amount - paymentInvoice.paid_amount;
    if (paymentAmount <= 0) {
      setPaymentError('Payment amount must be greater than zero.');
      return;
    }
    if (paymentAmount > remaining + 0.001) {
      setPaymentError(`Payment amount cannot exceed remaining balance of ${formatINR(remaining)}`);
      return;
    }

    setPaymentSubmitting(true);
    setPaymentError(null);

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: paymentInvoice.id,
          amount: paymentAmount,
          paymentDate,
          paymentMethod,
          referenceNumber: paymentReference,
          notes: paymentNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to record payment');
      }

      setIsPaymentOpen(false);
      if (selectedInvoice && selectedInvoice.id === paymentInvoice.id) {
        openDetailModal(paymentInvoice.id);
      }
      fetchInvoices();
    } catch (err) {
      setPaymentError((err as Error).message);
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // Client-side search filtering
  const filteredInvoices = invoices.filter((inv) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const invNumMatch = inv.invoice_number.toLowerCase().includes(query);
    const clientMatch = inv.client?.name?.toLowerCase().includes(query);
    const bookingMatch = inv.booking?.title?.toLowerCase().includes(query);
    return invNumMatch || clientMatch || bookingMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif italic text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
            Milestone Invoices
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)] font-mono">
            Advance, shoot, and final milestone invoices with UPI payment links and partial payment tracking
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {(
            [
              { key: 'all', label: 'All Invoices' },
              { key: 'outstanding', label: 'Outstanding' },
              { key: 'overdue', label: 'Overdue' },
              { key: 'paid', label: 'Paid' },
            ] as const
          ).map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                type="button"
                className={`relative px-3.5 py-1.5 rounded-full text-xs font-mono tracking-wide transition-colors whitespace-nowrap z-10 ${
                  isActive
                    ? 'text-[var(--bg-canvas)] font-semibold'
                    : 'border border-[var(--border-line)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="invoices-filter-pill"
                    transition={{ type: 'spring', stiffness: 480, damping: 36, mass: 0.65 }}
                    className="absolute inset-0 rounded-full bg-[var(--text-primary)] -z-10"
                  />
                )}
                <span>{tab.label}</span>
              </button>
            );
          })}
          {clientFilter && (
            <button
              onClick={() => setClientFilter('')}
              type="button"
              className="px-2.5 py-1 rounded-full text-[11px] font-mono border border-[var(--money-warn)] bg-[var(--money-warn-bg)] text-[var(--money-warn)] flex items-center gap-1"
            >
              <span>Filtered by client</span>
              <span className="font-bold">×</span>
            </button>
          )}
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-[var(--text-faint)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice, client, event..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-full border border-[var(--border-line)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-primary)] font-mono"
          />
        </div>
      </div>

      {/* Invoices List / Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-line)] opacity-70" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)] text-center space-y-3">
          <AlertCircle className="w-6 h-6 text-[var(--money-out)] mx-auto" />
          <p className="text-sm text-[var(--text-muted)]">{error}</p>
          <button
            onClick={fetchInvoices}
            className="px-4 py-1.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-canvas)] text-xs font-mono"
          >
            Retry
          </button>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="p-10 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)] text-center space-y-2">
          <Receipt className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
          <h3 className="font-serif italic text-lg font-bold text-[var(--text-primary)]">
            No Invoices Found
          </h3>
          <p className="text-xs text-[var(--text-muted)] font-mono">
            No invoices match the selected filter criteria.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)] overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-line)] bg-[var(--bg-surface-subtle)] text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Milestone</th>
                  <th className="py-3 px-4">Client &amp; Booking</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-line-subtle)] text-sm">
                {filteredInvoices.map((inv) => {
                  const balance = inv.amount - inv.paid_amount;
                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-[var(--bg-surface-subtle)]/50 transition-colors group cursor-pointer"
                      onClick={() => openDetailModal(inv.id)}
                    >
                      <td className="py-3.5 px-4 font-mono font-semibold text-[var(--text-primary)] group-hover:underline">
                        {inv.invoice_number}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs uppercase text-[var(--text-muted)]">
                        {inv.milestone_label}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[var(--text-primary)] text-sm">
                          {inv.client?.name || 'Client'}
                        </div>
                        <div className="text-xs text-[var(--text-faint)] font-mono truncate max-w-[200px]">
                          {inv.booking?.title}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-[var(--text-muted)]">
                        {inv.due_date}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-medium text-[var(--text-primary)]">
                        {formatINR(inv.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold">
                        {balance > 0 ? (
                          <span className={inv.status === 'overdue' ? 'text-[var(--money-out)]' : 'text-[var(--text-primary)]'}>
                            {formatINR(balance)}
                          </span>
                        ) : (
                          <span className="text-[var(--money-in)]">Settled</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={inv.status} daysOverdue={inv.days_overdue} />
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {balance > 0 && (
                            <button
                              onClick={() => openPaymentModal(inv)}
                              className="px-2.5 py-1 rounded-full bg-[var(--text-primary)] text-[var(--bg-canvas)] text-[11px] font-mono hover:opacity-90"
                            >
                              Pay
                            </button>
                          )}
                          <button
                            type="button"
                            aria-label={`View details for invoice ${inv.invoice_number}`}
                            onClick={() => openDetailModal(inv.id)}
                            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden divide-y divide-[var(--border-line-subtle)]">
            {filteredInvoices.map((inv) => {
              const balance = inv.amount - inv.paid_amount;
              return (
                <div
                  key={inv.id}
                  onClick={() => openDetailModal(inv.id)}
                  className="p-4 hover:bg-[var(--bg-surface-subtle)]/40 transition-colors cursor-pointer space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-sm text-[var(--text-primary)]">
                          {inv.invoice_number}
                        </span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[var(--bg-surface-subtle)] text-[var(--text-muted)]">
                          {inv.milestone_label}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-[var(--text-primary)] mt-1">
                        {inv.client?.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-sm text-[var(--text-primary)]">
                        {formatINR(inv.amount)}
                      </div>
                      <div className="mt-1">
                        <StatusBadge status={inv.status} daysOverdue={inv.days_overdue} />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[var(--border-line-subtle)] flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
                    <span>Due: {inv.due_date}</span>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {balance > 0 ? (
                        <>
                          <span className="font-semibold text-[var(--money-out)]">
                            Due: {formatINR(balance)}
                          </span>
                          <button
                            onClick={() => openPaymentModal(inv)}
                            className="px-2 py-0.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-canvas)] text-[11px] font-mono"
                          >
                            Pay
                          </button>
                        </>
                      ) : (
                        <span className="text-[var(--money-in)] font-semibold">Fully Paid</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Invoice Detail Modal with UPI Placeholder & QR Code */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedInvoice ? `${selectedInvoice.invoice_number} · ${selectedInvoice.milestone_label.toUpperCase()}` : 'Invoice Details'}
        description="Milestone breakdown, UPI payment placeholder, and collection history"
        maxWidth="lg"
      >
        {selectedInvoice && (
          <div className="space-y-5">
            {/* Top Overview Box */}
            <div className="p-4 rounded-xl border border-[var(--border-line)] bg-[var(--bg-surface-subtle)] space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-base text-[var(--text-primary)]">
                    {selectedInvoice.client?.name}
                  </h4>
                  <p className="text-xs font-mono text-[var(--text-muted)] mt-0.5">
                    {selectedInvoice.booking?.title}
                  </p>
                </div>
                <StatusBadge status={selectedInvoice.status} daysOverdue={selectedInvoice.days_overdue} />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border-line-subtle)] text-xs font-mono">
                <div>
                  <span className="text-[var(--text-muted)] uppercase text-[10px] block">Total Amount</span>
                  <strong className="text-sm text-[var(--text-primary)]">{formatINR(selectedInvoice.amount)}</strong>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] uppercase text-[10px] block">Paid Amount</span>
                  <strong className="text-sm text-[var(--money-in)]">{formatINR(selectedInvoice.paid_amount)}</strong>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] uppercase text-[10px] block">Balance Due</span>
                  <strong className="text-sm text-[var(--money-out)]">
                    {formatINR(selectedInvoice.amount - selectedInvoice.paid_amount)}
                  </strong>
                </div>
              </div>
            </div>

            {/* UPI Payment Link & QR Section */}
            {selectedInvoice.amount - selectedInvoice.paid_amount > 0 ? (
              <div className="p-4 rounded-xl border border-[var(--border-line)] bg-[var(--bg-surface)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-[var(--text-muted)]" />
                    <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold">
                      UPI Payment Placeholder (₹)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[var(--text-muted)]">
                    ID: arjunvisuals@okaxis
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                  {/* QR Code Canvas */}
                  <div className="p-3 bg-white rounded-xl border border-[var(--border-line)] flex items-center justify-center shrink-0">
                    <QRCodeSVG
                      value={selectedInvoice.upi_link || 'upi://pay?pa=arjunvisuals@okaxis'}
                      size={110}
                      level="M"
                    />
                  </div>

                  {/* Payment Details & Links */}
                  <div className="space-y-2 text-xs font-mono text-[var(--text-muted)] w-full">
                    <p>
                      Clients can scan with Google Pay, PhonePe, Paytm, or BHIM to pay the pending milestone balance.
                    </p>
                    <div className="p-2 rounded-lg bg-[var(--bg-surface-subtle)] text-[11px] break-all border border-[var(--border-line-subtle)] text-[var(--text-primary)]">
                      {selectedInvoice.upi_link}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={selectedInvoice.upi_link || '#'}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-canvas)] text-xs font-mono font-medium hover:opacity-90"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Open UPI App</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>
                      <button
                        onClick={() => openPaymentModal(selectedInvoice)}
                        className="px-3.5 py-1.5 rounded-full border border-[var(--border-line)] bg-[var(--bg-surface)] text-xs font-mono text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)]"
                      >
                        Record Payment
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[var(--money-in-bg)] border border-[var(--money-in)]/30 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[var(--money-in)] shrink-0" />
                <div className="text-xs font-mono text-[var(--money-in)]">
                  <strong>Invoice Fully Settled.</strong> Zero balance remaining for this milestone.
                </div>
              </div>
            )}

            {/* Payment Receipts History */}
            <div>
              <h5 className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Recorded Payments ({selectedInvoice.payments?.length || 0})
              </h5>
              {!selectedInvoice.payments || selectedInvoice.payments.length === 0 ? (
                <div className="p-3 text-center text-xs font-mono text-[var(--text-faint)] rounded-xl border border-[var(--border-line-subtle)]">
                  No payments recorded yet for this invoice.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {selectedInvoice.payments.map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-xl border border-[var(--border-line-subtle)] bg-[var(--bg-surface-subtle)]/60 flex items-center justify-between text-xs font-mono"
                    >
                      <div>
                        <strong className="text-[var(--text-primary)]">{formatINR(p.amount)}</strong>
                        <span className="text-[var(--text-muted)] ml-2">via {p.payment_method}</span>
                      </div>
                      <span className="text-[var(--text-faint)]">{p.payment_date}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 rounded-full border border-[var(--border-line)] bg-[var(--bg-surface)] text-xs font-mono"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        title="Record Payment"
        description={paymentInvoice ? `Record receipt against ${paymentInvoice.invoice_number}` : ''}
        maxWidth="md"
      >
        {paymentInvoice && (
          <form onSubmit={handleRecordPayment} noValidate className="space-y-4">
            <div className="p-3 rounded-xl bg-[var(--bg-surface-subtle)] text-xs font-mono flex justify-between">
              <span className="text-[var(--text-muted)]">Remaining Balance:</span>
              <strong className="text-[var(--text-primary)]">
                {formatINR(paymentInvoice.amount - paymentInvoice.paid_amount)}
              </strong>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Amount Received (₹) *
              </label>
              <input
                type="number"
                min="1"
                max={paymentInvoice.amount - paymentInvoice.paid_amount}
                step="1"
                required
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-line)] bg-[var(--bg-canvas)] text-[var(--text-primary)] text-sm font-mono font-bold focus:outline-none focus:border-[var(--text-primary)]"
              />
              <span className="text-[11px] text-[var(--text-faint)] mt-1 block font-mono">
                Full or partial payment up to balance.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Payment Date *
                </label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-line)] bg-[var(--bg-canvas)] text-[var(--text-primary)] text-sm font-mono focus:outline-none focus:border-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-line)] bg-[var(--bg-canvas)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--text-primary)]"
                >
                  <option value="UPI">UPI</option>
                  <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Reference / UTR Number
              </label>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g. UPI Ref 3241092..."
                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-line)] bg-[var(--bg-canvas)] text-[var(--text-primary)] text-sm font-mono focus:outline-none focus:border-[var(--text-primary)]"
              />
            </div>

            {paymentError && (
              <div className="p-3 rounded-xl bg-[var(--money-out-bg)] border border-[var(--money-out)]/30 text-xs font-mono text-[var(--money-out)]">
                {paymentError}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsPaymentOpen(false)}
                className="px-4 py-2 rounded-full border border-[var(--border-line)] bg-[var(--bg-surface)] text-xs font-mono text-[var(--text-muted)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={paymentSubmitting}
                className="px-5 py-2 rounded-full bg-[var(--text-primary)] text-[var(--bg-canvas)] text-xs font-mono uppercase tracking-wider font-semibold disabled:opacity-50"
              >
                {paymentSubmitting ? 'Recording...' : 'Confirm Receipt'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-10 w-48 bg-[var(--bg-surface-subtle)] rounded-xl opacity-70" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-line)] opacity-70" />
            ))}
          </div>
        </div>
      }
    >
      <InvoicesContent />
    </Suspense>
  );
}
