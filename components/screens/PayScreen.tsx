'use client';

import { Check, ChevronDown, Copy, Landmark, ShieldCheck, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { BrandMark } from '@/components/layout/BrandMark';
import { UpiQr } from '@/components/pay/UpiQr';
import { Button, buttonClass } from '@/components/ui/Button';
import { formatDateLong, formatINR, parseRupees } from '@/lib/format';
import { copyText } from '@/lib/clipboard';
import type { PayPage } from '@/lib/types';

interface Props {
  page: PayPage;
  token: string;
}

/** Public, client-facing. Always light. Renders only PayPage fields (no internal data exists in its props). */
export function PayScreen({ page, token }: Props) {
  const [amount, setAmount] = useState(String(page.amount_due));
  const [reference, setReference] = useState('');
  const [errors, setErrors] = useState<{ amount?: string; reference?: string; form?: string }>({});
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [reported, setReported] = useState<number | null>(null);
  const [upiCopied, setUpiCopied] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseRupees(amount);
    const next: typeof errors = {};
    if (!value) next.amount = 'Enter the amount you paid';
    else if (value > page.amount_due) next.amount = `That's more than the ${formatINR(page.amount_due)} due`;
    if (reference.trim() && reference.trim().length < 4) next.reference = 'That reference looks too short';
    setErrors(next);
    if (Object.keys(next).length) return;
    setState('loading');
    try {
      const res = await fetch(`/api/pay/${token}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimedAmount: value!,
          reference: reference.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit payment claim');
      setReported(value!);
      setState('done');
    } catch (err) {
      setErrors({ form: (err as Error).message });
      setState('idle');
    }
  }

  return (
    <div data-theme="light" className="min-h-dvh bg-[#f5f9ff] text-[#0b1f44]">
      <div className="mx-auto max-w-md px-4 pt-6 pb-12">
        <header className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-[#0b1f44] text-sm font-bold text-white" aria-hidden>
            AV
          </span>
          <div>
            <p className="font-semibold text-[#0b1f44]">{page.studio_name}</p>
            <p className="text-xs text-[#50658c]">Wedding photography</p>
          </div>
        </header>

        <main className="mt-6 space-y-4">
          <section className="card overflow-hidden p-0 border border-[#d3e1f8] bg-white shadow-sm" aria-labelledby="pay-hi">
            <div className="bg-[linear-gradient(135deg,rgba(29,78,216,0.12),#ffffff)] px-5 pt-5 pb-4">
              <h1 id="pay-hi" className="text-2xl font-semibold text-[#0b1f44]">
                Hi {page.client_first_name}
              </h1>
              <p className="mt-1 text-[#33496f]">
                Here's your {page.milestone_label?.toLowerCase() || 'invoice'} for {page.studio_name}.
              </p>
              <p className="mt-4 text-sm font-medium text-[#33496f]">Amount due</p>
              <p className="num text-[2.75rem] leading-none font-semibold text-[#0b1f44]">{formatINR(page.amount_due)}</p>
              <p className="num mt-2 text-sm text-[#50658c]">
                {page.invoice_number} · due {formatDateLong(page.due_date)}
              </p>
            </div>

            <div className="flex flex-col items-center border-t border-[#d3e1f8] px-5 py-6">
              <div className="rounded-3xl border border-[#d3e1f8] p-3 shadow-sm bg-white">
                <UpiQr value={page.upi_uri} size={224} />
              </div>
              <p className="mt-3 text-sm text-[#33496f]">Scan with any UPI app</p>
              <a href={page.upi_uri} className={buttonClass('primary', 'lg', true) + ' mt-4'}>
                <Smartphone className="size-5" aria-hidden />
                <span>Pay via UPI</span>
              </a>
              <button
                type="button"
                onClick={async () => {
                  const ok = await copyText(page.upi_id);
                  if (ok) {
                    setUpiCopied(true);
                    setTimeout(() => setUpiCopied(false), 2000);
                  }
                }}
                className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm text-[#33496f] hover:text-[#0b1f44]"
              >
                <span className="num">{page.upi_id}</span>
                {upiCopied ? <Check className="size-4 text-[#0369a1]" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                <span className="sr-only">{upiCopied ? 'UPI ID copied' : 'Copy UPI ID'}</span>
              </button>
            </div>

            <details className="group border-t border-[#d3e1f8]">
              <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-5 font-medium text-[#0b1f44] [&::-webkit-details-marker]:hidden">
                <Landmark className="size-5 text-[#50658c]" aria-hidden />
                <span className="flex-1">Pay by bank transfer instead</span>
                <ChevronDown className="size-5 text-[#50658c] transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 px-5 pb-5 text-sm">
                <dt className="text-[#50658c]">Account name</dt>
                <dd className="font-medium">{page.bank.account_name}</dd>
                <dt className="text-[#50658c]">Bank</dt>
                <dd className="font-medium">{page.bank.bank_name}</dd>
                <dt className="text-[#50658c]">Account no.</dt>
                <dd className="num font-medium">{page.bank.account_number_masked}</dd>
                <dt className="text-[#50658c]">IFSC</dt>
                <dd className="num font-medium">{page.bank.ifsc}</dd>
              </dl>
            </details>
          </section>

          <section className="card p-5 border border-[#d3e1f8] bg-white shadow-sm" aria-labelledby="paid-title">
            {state === 'done' ? (
              <div role="status" className="flex flex-col items-center py-4 text-center">
                <div className="relative mb-4 flex size-16 items-center justify-center">
                  <span className="anim-ring absolute inset-0 rounded-full bg-[#0369a1]/30" aria-hidden />
                  <span className="anim-check flex size-16 items-center justify-center rounded-full bg-[#0369a1] text-white">
                    <Check className="size-8" strokeWidth={3} aria-hidden />
                  </span>
                </div>
                <h2 id="paid-title" className="text-xl font-semibold text-[#0b1f44]">
                  Payment Reported
                </h2>
                <p className="mt-1 text-[#33496f]">
                  {reported ? `Thanks, ${page.client_first_name}. ${formatINR(reported)} is ` : 'Your payment is '}awaiting confirmation from {page.studio_name}.
                </p>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="space-y-4">
                <div>
                  <h2 id="paid-title" className="text-lg font-semibold text-[#0b1f44]">
                    I have paid
                  </h2>
                  <p className="text-sm text-[#33496f]">Already paid? Tell {page.studio_name} so they can confirm it.</p>
                </div>
                {page.claim_pending && <p className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">A payment you reported earlier is still being checked. Report again only if you've made another payment.</p>}
                
                <div>
                  <label htmlFor="claimed-amount-input" className="mb-1.5 block text-sm font-medium text-[#33496f]">
                    Amount paid
                  </label>
                  <div className="relative">
                    <span className="num pointer-events-none absolute inset-y-0 left-4 flex items-center text-[#50658c]">₹</span>
                    <input
                      id="claimed-amount-input"
                      type="number"
                      autoComplete="off"
                      className="num w-full rounded-2xl border border-[#b3c9ee] bg-[#eef4ff] pr-4 pl-9 min-h-12 text-[#0b1f44] focus:border-[#1d4ed8]"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  {errors.amount && <p className="mt-1.5 text-xs text-[#b53a26] font-medium">{errors.amount}</p>}
                </div>

                <div>
                  <label htmlFor="claimed-ref-input" className="mb-1.5 block text-sm font-medium text-[#33496f]">
                    UPI / bank reference (UTR)
                  </label>
                  <input
                    id="claimed-ref-input"
                    type="text"
                    autoComplete="off"
                    placeholder="e.g. 4317 8820 1194"
                    className="w-full rounded-2xl border border-[#b3c9ee] bg-[#eef4ff] px-4 min-h-12 text-[#0b1f44] focus:border-[#1d4ed8]"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                  {errors.reference && <p className="mt-1.5 text-xs text-[#b53a26] font-medium">{errors.reference}</p>}
                  <p className="mt-1.5 text-xs text-[#50658c]">Optional, but it helps confirm faster.</p>
                </div>

                {errors.form && (
                  <p role="alert" className="text-sm font-semibold text-[#b53a26]">
                    {errors.form}
                  </p>
                )}
                <Button type="submit" full size="lg" state={state === 'loading' ? 'loading' : 'idle'}>
                  Report Payment
                </Button>
              </form>
            )}
          </section>
        </main>

        <footer className="mt-8 flex items-center justify-center gap-2 text-xs text-[#50658c]">
          <ShieldCheck className="size-4" aria-hidden />
          Secure payment page by
          <span className="inline-flex items-center gap-1 font-semibold text-[#0b1f44]">
            <BrandMark className="size-4" /> Payday
          </span>
        </footer>
      </div>
    </div>
  );
}
