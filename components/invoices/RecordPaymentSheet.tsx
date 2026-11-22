'use client';

import { Banknote, Landmark, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Segmented, TextField } from '@/components/ui/Field';
import { Sheet } from '@/components/ui/Sheet';
import { formatINR } from '@/lib/format';
import type { PaymentMethod } from '@/lib/types';

export interface RecordTarget {
  invoiceId: string;
  label: string;
  outstanding: number;
}

interface Props {
  target: RecordTarget | null;
  onClose: () => void;
  onRecorded?: () => void;
}

export function RecordPaymentSheet({ target, onClose, onRecorded }: Props) {
  return (
    <Sheet
      open={Boolean(target)}
      onClose={onClose}
      title="Record Payment"
      description={target ? `${target.label} · ${formatINR(target.outstanding)} outstanding` : undefined}
    >
      {target && <Body key={target.invoiceId} target={target} onRecorded={onRecorded} onClose={onClose} />}
    </Sheet>
  );
}

function Body({ target, onRecorded, onClose }: { target: RecordTarget; onRecorded?: () => void; onClose: () => void }) {
  const [amount, setAmount] = useState(String(target.outstanding));
  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [reference, setReference] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [error, setError] = useState<string>();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(amount) || 0;
    if (value <= 0) return setError('Enter the amount you received');
    if (value > target.outstanding) return setError(`Payment amount cannot exceed remaining balance of ${formatINR(target.outstanding)}`);
    setError(undefined);
    setState('loading');
    try {
      const methodMap: Record<PaymentMethod, 'UPI' | 'bank_transfer' | 'cash'> = {
        upi: 'UPI',
        bank: 'bank_transfer',
        cash: 'cash',
      };
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: target.invoiceId,
          amount: value,
          paymentMethod: methodMap[method] || 'UPI',
          referenceNumber: reference || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to record payment');
      }
      setState('done');
      setTimeout(() => {
        onRecorded?.();
        onClose();
      }, 500);
    } catch (err) {
      setState('idle');
      setError((err as Error).message);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="sr-only">Record Payment</div>
      <div>
        <label htmlFor="amount-input" className="mb-1.5 block text-sm font-medium text-ink-2">
          Amount received
        </label>
        <div className="relative">
          <span className="num pointer-events-none absolute inset-y-0 left-4 flex items-center text-ink-3">₹</span>
          <input
            id="amount-input"
            type="number"
            name="amount"
            className="num w-full rounded-2xl border border-line-strong bg-surface-2 pr-4 pl-9 min-h-12 text-ink focus:border-primary aria-invalid:border-out"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-invalid={error ? true : undefined}
          />
        </div>
        {error && (
          <p role="alert" className="mt-1.5 text-xs text-out font-medium">
            {error}
          </p>
        )}
      </div>

      <Segmented
        legend="Method"
        value={method}
        onChange={setMethod}
        options={[
          { value: 'upi', label: <><Smartphone className="size-4" aria-hidden />UPI</> },
          { value: 'bank', label: <><Landmark className="size-4" aria-hidden />Bank</> },
          { value: 'cash', label: <><Banknote className="size-4" aria-hidden />Cash</> },
        ]}
      />
      <TextField label="Reference (optional)" placeholder="UTR / transaction ID" value={reference} onChange={(e) => setReference(e.target.value)} />
      <Button type="submit" full size="lg" state={state} doneLabel="Payment recorded">
        Confirm Receipt
      </Button>
    </form>
  );
}
