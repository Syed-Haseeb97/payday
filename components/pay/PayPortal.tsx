'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Building,
  CreditCard,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { formatINR } from '@/lib/money';

export interface PayPortalProps {
  businessName: string;
  clientFirstName: string;
  milestoneLabel: string;
  eventName: string;
  amount: number;
  paidAmount: number;
  balance: number;
  dueDate: string;
  status: string;
  upiLink: string;
  initialPendingClaim?: {
    id: string;
    claimed_amount: number;
    reference?: string | null;
  } | null;
  token: string;
}

export function PayPortal({
  businessName,
  clientFirstName,
  milestoneLabel,
  eventName,
  amount,
  paidAmount,
  balance,
  dueDate,
  status,
  upiLink,
  initialPendingClaim,
  token,
}: PayPortalProps) {
  const [claimAmount, setClaimAmount] = useState<number>(balance);
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [pendingClaim, setPendingClaim] = useState(initialPendingClaim);

  const isPaid = balance <= 0 || status === 'paid';

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setClaimError(null);

    try {
      const res = await fetch(`/api/pay/${token}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimedAmount: claimAmount,
          reference: reference.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to report payment');
      }

      setPendingClaim(data.claim);
    } catch (err: unknown) {
      setClaimError(err instanceof Error ? err.message : 'Error submitting claim');
    } finally {
      setSubmitting(false);
    }
  };

  const formattedDueDate = dueDate ? format(parseISO(dueDate), 'd MMMM yyyy') : 'On delivery';

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#16181D] py-10 px-4 sm:px-6">
      <main className="max-w-md mx-auto space-y-6">
        {/* Business Branding Header */}
        <header className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#C8C2B5] bg-white font-mono text-[11px] uppercase tracking-wider text-[#5F626A]">
            <Building className="w-3.5 h-3.5 text-[#1D6B52]" />
            <span>Secure Invoice Portal</span>
          </div>
          <h1 className="font-serif italic text-2xl sm:text-3xl font-bold tracking-tight text-[#16181D]">
            {businessName}
          </h1>
          <p className="text-xs text-[#5F626A] font-sans">
            Client Milestone Clearance &amp; Settlement
          </p>
        </header>

        {/* Invoice Summary Card */}
        <section aria-label="Invoice Details" className="p-5 sm:p-6 rounded-2xl bg-white border border-[#C8C2B5] shadow-xs space-y-4">
          <div className="flex items-start justify-between border-b border-[#C8C2B5]/40 pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#5F626A] font-semibold block">
                Billing For
              </span>
              <h2 className="text-base sm:text-lg font-serif font-bold text-[#16181D]">
                Hi {clientFirstName}
              </h2>
              <span className="text-xs text-[#5F626A] block mt-0.5">{eventName}</span>
            </div>

            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${
                isPaid
                  ? 'bg-[#E3EFE8] text-[#1D6B52] border border-[#1D6B52]/20'
                  : paidAmount > 0
                  ? 'bg-[#F6ECD9] text-[#86560D] border border-[#86560D]/20'
                  : 'bg-[#F8E9E4] text-[#B53A26] border border-[#B53A26]/20'
              }`}
            >
              {isPaid ? 'Paid in Full' : paidAmount > 0 ? 'Partially Paid' : 'Payment Due'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 py-1 text-xs font-mono">
            <div>
              <span className="text-[10px] uppercase text-[#5F626A] block">Milestone</span>
              <span className="font-semibold capitalize text-[#16181D]">
                {milestoneLabel} Milestone
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-[#5F626A] block">Due Date</span>
              <span className="font-semibold text-[#16181D]">{formattedDueDate}</span>
            </div>
          </div>

          {/* Amount Due Display */}
          <div className="p-4 rounded-xl bg-[#F5F3EE] border border-[#C8C2B5] flex items-baseline justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#5F626A] font-semibold block">
                {isPaid ? 'Amount Settled' : 'Balance Due'}
              </span>
              <span className="text-2xl sm:text-3xl font-serif font-bold text-[#16181D]">
                {formatINR(isPaid ? amount : balance)}
              </span>
            </div>
            {amount !== balance && !isPaid && (
              <div className="text-right text-[11px] font-mono text-[#5F626A]">
                <span>Total: {formatINR(amount)}</span>
                <span className="block text-[#1D6B52]">Paid: {formatINR(paidAmount)}</span>
              </div>
            )}
          </div>
        </section>

        {/* Payment Action: UPI QR & Deep Link */}
        {!isPaid && (
          <section aria-label="UPI Payment" className="p-5 sm:p-6 rounded-2xl bg-white border border-[#C8C2B5] shadow-xs text-center space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-wider text-[#16181D] font-bold block">
                Instant UPI Payment
              </span>
              <p className="text-xs text-[#5F626A]">
                Scan with GPay, PhonePe, Paytm, or any BHIM UPI app
              </p>
            </div>

            {/* QR Code Canvas */}
            <div className="inline-block p-4 rounded-2xl bg-white border border-[#C8C2B5] shadow-xs">
              <QRCodeSVG
                value={upiLink}
                size={180}
                level="M"
                aria-label={`UPI QR Code for ${formatINR(balance)}`}
              />
            </div>

            {/* Pay via UPI deep link */}
            <div>
              <a
                href={upiLink}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#16181D] text-[#F5F3EE] py-3 px-5 font-mono text-xs uppercase tracking-wider font-semibold hover:opacity-90 transition-opacity"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pay via UPI ({formatINR(balance)})</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>
            </div>
          </section>
        )}

        {/* "I have paid" Claim Form / Status */}
        {!isPaid && (
          <section aria-label="Payment Reporting" className="p-5 sm:p-6 rounded-2xl bg-white border border-[#C8C2B5] shadow-xs space-y-4">
            {pendingClaim ? (
              <div className="p-4 rounded-xl bg-[#E3EFE8] border border-[#1D6B52]/30 text-[#1D6B52] space-y-1.5 text-center">
                <CheckCircle2 className="w-6 h-6 mx-auto text-[#1D6B52]" />
                <h3 className="font-mono text-xs uppercase tracking-wider font-bold">
                  Payment Reported
                </h3>
                <p className="text-xs font-sans">
                  Awaiting confirmation from <strong className="font-semibold">{businessName}</strong>.
                </p>
                <div className="pt-2 border-t border-[#1D6B52]/20 font-mono text-xs flex justify-between">
                  <span>Reported Amount:</span>
                  <strong className="font-bold">{formatINR(pendingClaim.claimed_amount)}</strong>
                </div>
                {pendingClaim.reference && (
                  <div className="font-mono text-[11px] flex justify-between text-[#1D6B52]/80">
                    <span>Reference / UTR:</span>
                    <span>{pendingClaim.reference}</span>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleClaimSubmit} className="space-y-3.5">
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-wider text-[#16181D] font-bold">
                    Already Sent Payment?
                  </h3>
                  <p className="text-xs text-[#5F626A] mt-0.5">
                    Report your payment details so {businessName} can verify and credit your account.
                  </p>
                </div>

                {claimError && (
                  <div className="p-3 rounded-xl bg-[#F8E9E4] border border-[#B53A26] text-xs text-[#B53A26] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{claimError}</span>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="claimed-amount-input"
                    className="block text-xs font-mono uppercase tracking-wider text-[#5F626A] font-semibold mb-1"
                  >
                    Amount Transferred (₹)
                  </label>
                  <input
                    id="claimed-amount-input"
                    type="number"
                    min="1"
                    max={balance}
                    required
                    value={claimAmount || ''}
                    onChange={(e) => setClaimAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-[#C8C2B5] bg-white font-mono text-sm focus:outline-none focus:border-[#16181D]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="claimed-ref-input"
                    className="block text-xs font-mono uppercase tracking-wider text-[#5F626A] font-semibold mb-1"
                  >
                    UPI Reference / UTR Number (Optional)
                  </label>
                  <input
                    id="claimed-ref-input"
                    type="text"
                    placeholder="e.g. 12-digit UTR or transaction ID"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#C8C2B5] bg-white font-mono text-xs focus:outline-none focus:border-[#16181D]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full border border-[#C8C2B5] bg-white py-2.5 px-4 font-mono text-xs uppercase tracking-wider font-semibold text-[#16181D] hover:bg-[#F5F3EE] transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Report Payment'}
                </button>
              </form>
            )}
          </section>
        )}

        {/* Fully Paid Message */}
        {isPaid && (
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#C8C2B5] shadow-xs text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-[#1D6B52]" />
            <h3 className="font-serif italic text-lg font-bold text-[#1D6B52]">
              Invoice Fully Settled
            </h3>
            <p className="text-xs text-[#5F626A] font-sans">
              This invoice has been cleared. Thank you for your prompt payment!
            </p>
          </div>
        )}

        {/* Security & Confidentiality Footer */}
        <footer className="text-center space-y-1 pt-2 text-[11px] font-mono text-[#5F626A]">
          <div className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1D6B52]" />
            <span>End-to-End Encrypted Verification</span>
          </div>
          <p>© {new Date().getFullYear()} {businessName}. Powered by Payday.</p>
        </footer>
      </main>
    </div>
  );
}
