'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  CalendarDays, 
  Plus, 
  Receipt, 
  AlertCircle, 
  Calendar, 
  ChevronRight,
  Calculator
} from 'lucide-react';
import { Booking, Client } from '@/lib/db/types';
import { formatINR } from '@/lib/money';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { splitMilestones } from '@/lib/milestones';
import { format, subDays, addDays } from 'date-fns';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});

  // Form State
  const [formData, setFormData] = useState({
    clientId: '',
    title: '',
    eventDate: '',
    totalAmount: 120000,
    advancePercentage: 30,
    midPercentage: 50,
    finalPercentage: 20,
    advanceDueDate: '',
    midDueDate: '',
    finalDueDate: '',
    notes: '',
  });

  const fetchBookings = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch('/api/bookings').then((r) => r.json()),
      fetch('/api/clients').then((r) => r.json()),
    ])
      .then(([bookingsRes, clientsRes]) => {
        if (!bookingsRes.success) throw new Error(bookingsRes.error || 'Failed to load bookings');
        setBookings(bookingsRes.bookings || []);
        setClients(clientsRes.clients || []);
      })
      .catch((err) => {
        setError(err.message || 'Error fetching data');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const openNewBookingModal = () => {
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const defaultEventObj = addDays(now, 45);
    const defaultEventDate = format(defaultEventObj, 'yyyy-MM-dd');
    const defaultMidObj = subDays(defaultEventObj, 30);
    const defaultFinalObj = addDays(defaultEventObj, 7);

    setFormData({
      clientId: clients[0]?.id || '',
      title: '',
      eventDate: defaultEventDate,
      totalAmount: 120000,
      advancePercentage: 30,
      midPercentage: 50,
      finalPercentage: 20,
      advanceDueDate: todayStr,
      midDueDate: format(defaultMidObj, 'yyyy-MM-dd'),
      finalDueDate: format(defaultFinalObj, 'yyyy-MM-dd'),
      notes: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Recalculate default due dates when eventDate changes
  const handleEventDateChange = (newEventDate: string) => {
    try {
      const eventObj = new Date(newEventDate);
      if (!isNaN(eventObj.getTime())) {
        const midObj = subDays(eventObj, 30);
        const finalObj = addDays(eventObj, 7);
        setFormData((prev) => ({
          ...prev,
          eventDate: newEventDate,
          midDueDate: format(midObj, 'yyyy-MM-dd'),
          finalDueDate: format(finalObj, 'yyyy-MM-dd'),
        }));
        return;
      }
    } catch {}
    setFormData((prev) => ({ ...prev, eventDate: newEventDate }));
  };

  // Calculate live preview of milestone amounts
  let milestonePreview: Array<{ label: string; amount: number }> = [];
  let splitSum = formData.advancePercentage + formData.midPercentage + formData.finalPercentage;
  let splitValid = Math.round(splitSum) === 100;

  if (splitValid && formData.totalAmount > 0) {
    try {
      milestonePreview = splitMilestones(formData.totalAmount, [
        formData.advancePercentage,
        formData.midPercentage,
        formData.finalPercentage,
      ]);
    } catch {}
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        if (json.errors) {
          setFormErrors(json.errors);
        } else {
          throw new Error(json.error || 'Failed to create booking');
        }
        return;
      }

      setIsModalOpen(false);
      fetchBookings();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-[var(--bg-surface-subtle)] rounded-xl animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)] p-5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)] text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-[var(--money-out-bg)] flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-[var(--money-out)]" />
        </div>
        <h2 className="font-serif italic text-2xl font-bold text-[var(--text-primary)]">
          Error Loading Bookings
        </h2>
        <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">{error}</p>
        <button
          onClick={fetchBookings}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--text-primary)] text-[var(--bg-canvas)] px-5 py-2 text-xs font-mono uppercase tracking-wider"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif italic text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
            Bookings
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)] font-mono">
            Wedding packages with automatic 30/50/20 milestone invoice generation
          </p>
        </div>
        <button
          onClick={openNewBookingModal}
          type="button"
          className="inline-flex items-center gap-2 rounded-full bg-[var(--text-primary)] text-[var(--bg-canvas)] px-4 py-2.5 text-xs font-mono uppercase tracking-wider font-semibold hover:opacity-90 transition-opacity self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Booking</span>
        </button>
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="p-10 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)] text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-[var(--bg-surface-subtle)] flex items-center justify-center">
            <CalendarDays className="w-6 h-6 text-[var(--text-muted)]" />
          </div>
          <h2 className="font-serif italic text-xl font-bold text-[var(--text-primary)]">
            No Bookings Found
          </h2>
          <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
            Create a booking with a client to generate milestone invoices automatically.
          </p>
          <button
            onClick={openNewBookingModal}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--text-primary)] text-[var(--bg-canvas)] px-4 py-2 text-xs font-mono uppercase tracking-wider"
          >
            Create Booking
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="p-5 sm:p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)] hover:border-[var(--text-primary)]/40 transition-colors space-y-4"
            >
              {/* Booking Title & Top Info */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-[var(--border-line-subtle)]">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-serif italic text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                      {booking.title}
                    </h3>
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded-full border border-[var(--border-line-subtle)] bg-[var(--bg-surface-subtle)] text-[var(--text-muted)]">
                      {booking.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono text-[var(--text-muted)] mt-1">
                    <span>Client: <strong className="text-[var(--text-primary)]">{booking.client?.name || 'Unknown'}</strong></span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[var(--text-faint)]" />
                      {booking.event_date}
                    </span>
                  </div>
                </div>

                <div className="sm:text-right">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                    Total Package
                  </span>
                  <div className="text-xl sm:text-2xl font-serif font-bold text-[var(--text-primary)]">
                    {formatINR(booking.total_amount)}
                  </div>
                </div>
              </div>

              {/* Milestones Row */}
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-2">
                  Milestone Invoices (Auto-Generated)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {booking.invoices?.map((inv) => (
                    <Link
                      key={inv.id}
                      href={`/invoices?search=${inv.invoice_number}`}
                      className="p-3.5 rounded-xl border border-[var(--border-line)] bg-[var(--bg-canvas)]/60 hover:bg-[var(--bg-surface-subtle)] transition-colors block group"
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-semibold text-[var(--text-primary)] group-hover:underline">
                          {inv.invoice_number}
                        </span>
                        <StatusBadge status={inv.status} daysOverdue={inv.days_overdue} />
                      </div>
                      <div className="mt-2 flex items-baseline justify-between">
                        <span className="text-xs font-mono uppercase text-[var(--text-muted)]">
                          {inv.milestone_label}
                        </span>
                        <span className="font-mono font-bold text-sm text-[var(--text-primary)]">
                          {formatINR(inv.amount)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] font-mono text-[var(--text-faint)]">
                        <span>Due: {inv.due_date}</span>
                        {inv.paid_amount > 0 && inv.paid_amount < inv.amount && (
                          <span className="text-[var(--money-warn)]">
                            Paid {formatINR(inv.paid_amount)}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Booking Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Booking"
        description="Bookings automatically split into milestone invoices with rounding guarantees."
        maxWidth="lg"
      >
        <form onSubmit={handleBookingSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Client *
              </label>
              <select
                required
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-line)] bg-[var(--bg-canvas)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--text-primary)]"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.payment_reliability})
                  </option>
                ))}
              </select>
              {formErrors.clientId && (
                <p className="text-[11px] text-[var(--money-out)] mt-1 font-mono">{formErrors.clientId[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Event Date *
              </label>
              <input
                type="date"
                required
                value={formData.eventDate}
                onChange={(e) => handleEventDateChange(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-line)] bg-[var(--bg-canvas)] text-[var(--text-primary)] text-sm font-mono focus:outline-none focus:border-[var(--text-primary)]"
              />
              {formErrors.eventDate && (
                <p className="text-[11px] text-[var(--money-out)] mt-1 font-mono">{formErrors.eventDate[0]}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Package / Event Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Royal Palace 2-Day Wedding"
                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-line)] bg-[var(--bg-canvas)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--text-primary)]"
              />
              {formErrors.title && (
                <p className="text-[11px] text-[var(--money-out)] mt-1 font-mono">{formErrors.title[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Total Package Amount (₹) *
              </label>
              <input
                type="number"
                min="1000"
                step="100"
                required
                value={formData.totalAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    totalAmount: parseInt(e.target.value, 10) || 0,
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-line)] bg-[var(--bg-canvas)] text-[var(--text-primary)] text-sm font-mono font-semibold focus:outline-none focus:border-[var(--text-primary)]"
              />
              {formErrors.totalAmount && (
                <p className="text-[11px] text-[var(--money-out)] mt-1 font-mono">{formErrors.totalAmount[0]}</p>
              )}
            </div>
          </div>

          {/* Milestone Split Percentage Controls */}
          <div className="p-4 rounded-xl border border-[var(--border-line)] bg-[var(--bg-surface-subtle)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span>Milestone Split (Must sum to 100%)</span>
              </span>
              <span
                className={`text-xs font-mono font-semibold ${
                  splitValid ? 'text-[var(--money-in)]' : 'text-[var(--money-out)]'
                }`}
              >
                Total: {splitSum}% {splitValid ? '✓' : '(Must be 100%)'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="block font-mono text-[11px] text-[var(--text-muted)] mb-1">
                  Advance %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.advancePercentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      advancePercentage: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border-line)] bg-[var(--bg-canvas)] font-mono text-center"
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] text-[var(--text-muted)] mb-1">
                  Shoot Day %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.midPercentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      midPercentage: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border-line)] bg-[var(--bg-canvas)] font-mono text-center"
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] text-[var(--text-muted)] mb-1">
                  Delivery %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.finalPercentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      finalPercentage: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border-line)] bg-[var(--bg-canvas)] font-mono text-center"
                />
              </div>
            </div>

            {/* Editable Due Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-[var(--border-line-subtle)]">
              <div>
                <label className="block font-mono text-[10px] uppercase text-[var(--text-muted)] mb-1">
                  Advance Due
                </label>
                <input
                  type="date"
                  value={formData.advanceDueDate}
                  onChange={(e) => setFormData({ ...formData, advanceDueDate: e.target.value })}
                  className="w-full px-2 py-1 rounded-lg border border-[var(--border-line)] bg-[var(--bg-canvas)] font-mono text-xs"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase text-[var(--text-muted)] mb-1">
                  Shoot Due (30d before)
                </label>
                <input
                  type="date"
                  value={formData.midDueDate}
                  onChange={(e) => setFormData({ ...formData, midDueDate: e.target.value })}
                  className="w-full px-2 py-1 rounded-lg border border-[var(--border-line)] bg-[var(--bg-canvas)] font-mono text-xs"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase text-[var(--text-muted)] mb-1">
                  Delivery Due (+7d)
                </label>
                <input
                  type="date"
                  value={formData.finalDueDate}
                  onChange={(e) => setFormData({ ...formData, finalDueDate: e.target.value })}
                  className="w-full px-2 py-1 rounded-lg border border-[var(--border-line)] bg-[var(--bg-canvas)] font-mono text-xs"
                />
              </div>
            </div>

            {/* Live Calculation Preview */}
            {splitValid && milestonePreview.length === 3 && (
              <div className="pt-2 text-xs font-mono border-t border-[var(--border-line-subtle)] flex items-center justify-between text-[var(--text-primary)]">
                <span>Calculated:</span>
                <span>
                  Adv: <strong>{formatINR(milestonePreview[0].amount)}</strong> · Mid: <strong>{formatINR(milestonePreview[1].amount)}</strong> · Final: <strong>{formatINR(milestonePreview[2].amount)}</strong>
                </span>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-full border border-[var(--border-line)] bg-[var(--bg-surface)] text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !splitValid}
              className="px-5 py-2 rounded-full bg-[var(--text-primary)] text-[var(--bg-canvas)] text-xs font-mono uppercase tracking-wider font-semibold disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Booking & Invoices'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
