'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, UserPlus, Edit2, AlertCircle, Phone, Mail, Receipt, ChevronRight } from 'lucide-react';
import { Client, PaymentReliability } from '@/lib/db/types';
import { ReliabilityBadge } from '@/components/ui/ReliabilityBadge';
import { Modal } from '@/components/ui/Modal';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    payment_reliability: 'average' as PaymentReliability,
    average_delay_days: 0,
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchClients = () => {
    setLoading(true);
    setError(null);
    fetch('/api/clients')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load clients');
        return res.json();
      })
      .then((json) => {
        if (!json.success) throw new Error(json.error || 'Failed to load');
        setClients(json.clients || []);
      })
      .catch((err) => {
        setError(err.message || 'Error fetching clients');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const openAddModal = () => {
    setEditingClient(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      payment_reliability: 'average',
      average_delay_days: 0,
      notes: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      phone: client.phone || '',
      email: client.email || '',
      payment_reliability: client.payment_reliability,
      average_delay_days: client.average_delay_days,
      notes: client.notes || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});

    try {
      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';
      const method = editingClient ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        if (json.errors) {
          setFormErrors(json.errors);
        } else {
          throw new Error(json.error || 'Failed to save client');
        }
        return;
      }

      setIsModalOpen(false);
      fetchClients();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-[var(--bg-surface-subtle)] rounded-xl opacity-70" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)] p-5 opacity-70" />
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
          Error Loading Clients
        </h2>
        <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">{error}</p>
        <button
          onClick={fetchClients}
          type="button"
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
            Clients
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)] font-mono">
            Client contacts, payment reliability ratings, and historical average payment delay
          </p>
        </div>
        <button
          onClick={openAddModal}
          type="button"
          className="inline-flex items-center gap-2 rounded-full bg-[var(--text-primary)] text-[var(--bg-canvas)] px-4 py-2.5 text-xs font-mono uppercase tracking-wider font-semibold hover:opacity-90 transition-opacity self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Client</span>
        </button>
      </div>

      {/* Clients Grid */}
      {clients.length === 0 ? (
        <div className="p-10 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)] text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-[var(--bg-surface-subtle)] flex items-center justify-center">
            <Users className="w-6 h-6 text-[var(--text-muted)]" />
          </div>
          <h2 className="font-serif italic text-xl font-bold text-[var(--text-primary)]">
            No Clients Found
          </h2>
          <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
            Add your first client to start creating bookings and milestone invoices.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--text-primary)] text-[var(--bg-canvas)] px-4 py-2 text-xs font-mono uppercase tracking-wider"
          >
            Add Client
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clients.map((client) => (
            <div
              key={client.id}
              className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)] flex flex-col justify-between space-y-4 hover:border-[var(--text-primary)]/40 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <h3 className="font-medium text-base text-[var(--text-primary)]">
                      {client.name}
                    </h3>
                    <div className="flex items-center gap-2 pt-0.5">
                      <ReliabilityBadge
                        reliability={client.payment_reliability}
                        delayDays={client.average_delay_days}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => openEditModal(client)}
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] transition-colors"
                    title="Edit client"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-3.5 space-y-1.5 text-xs font-mono text-[var(--text-muted)]">
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[var(--text-faint)]" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[var(--text-faint)]" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                </div>

                {client.notes && (
                  <p className="mt-3 text-xs text-[var(--text-muted)] line-clamp-2 bg-[var(--bg-surface-subtle)]/60 p-2.5 rounded-xl border border-[var(--border-line-subtle)]">
                    {client.notes}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-[var(--border-line-subtle)] flex items-center justify-between text-xs font-mono">
                <span className="text-[var(--text-faint)]">
                  Avg delay: {client.average_delay_days} days
                </span>
                <Link
                  href={`/invoices?clientId=${client.id}`}
                  className="inline-flex items-center gap-1 text-[var(--text-primary)] font-medium hover:underline"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>View Invoices</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Client Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClient ? 'Edit Client' : 'Add New Client'}
        description="Payment reliability affects the 90-day cash forecast."
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Client Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Rohit Mehta (Mehta Weddings)"
              className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-line)] bg-[var(--bg-canvas)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--text-primary)]"
            />
            {formErrors.name && (
              <p className="text-[11px] text-[var(--money-out)] mt-1 font-mono">{formErrors.name[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Phone (WhatsApp)
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 90000 00001"
                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-line)] bg-[var(--bg-canvas)] text-[var(--text-primary)] text-sm font-mono focus:outline-none focus:border-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="client@example.fake"
                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-line)] bg-[var(--bg-canvas)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--text-primary)]"
              />
              {formErrors.email && (
                <p className="text-[11px] text-[var(--money-out)] mt-1 font-mono">{formErrors.email[0]}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Payment Reliability
              </label>
              <select
                value={formData.payment_reliability}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    payment_reliability: e.target.value as PaymentReliability,
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-line)] bg-[var(--bg-canvas)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--text-primary)]"
              >
                <option value="reliable">Reliable (0–2 days late)</option>
                <option value="average">Average (5–8 days late)</option>
                <option value="slow">Slow (~12 days late)</option>
                <option value="unreliable">Unreliable (15+ days late)</option>
                <option value="new">New Client (no history)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Average Delay (Days)
              </label>
              <input
                type="number"
                min="0"
                value={formData.average_delay_days}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    average_delay_days: parseInt(e.target.value, 10) || 0,
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-line)] bg-[var(--bg-canvas)] text-[var(--text-primary)] text-sm font-mono focus:outline-none focus:border-[var(--text-primary)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Internal Notes
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Prefers UPI, always confirm via WhatsApp..."
              className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-line)] bg-[var(--bg-canvas)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--text-primary)]"
            />
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
              disabled={submitting}
              className="px-5 py-2 rounded-full bg-[var(--text-primary)] text-[var(--bg-canvas)] text-xs font-mono uppercase tracking-wider font-semibold disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingClient ? 'Update Client' : 'Create Client'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
