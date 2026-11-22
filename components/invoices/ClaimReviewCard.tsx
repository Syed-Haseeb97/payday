'use client';

import { HandCoins, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { formatDate, formatINR } from '@/lib/format';
import type { PaymentClaim } from '@/lib/types';

interface Props {
  claim: PaymentClaim;
  clientFirstName: string;
  onResolve: (claimId: string, action: 'confirm' | 'reject') => Promise<unknown>;
  onResolved: () => void;
}

export function ClaimReviewCard({ claim, clientFirstName, onResolve, onResolved }: Props) {
  const [state, setState] = useState<'idle' | 'confirming' | 'rejecting' | 'confirmed' | 'rejected'>('idle');

  async function act(action: 'confirm' | 'reject') {
    setState(action === 'confirm' ? 'confirming' : 'rejecting');
    await onResolve(claim.id, action);
    setState(action === 'confirm' ? 'confirmed' : 'rejected');
    setTimeout(onResolved, 600);
  }

  return (
    <section aria-labelledby="claim-title" className="card relative overflow-hidden border-warn/40 p-4 sm:p-5">
      <div className="absolute inset-y-0 left-0 w-1 bg-warn" aria-hidden />
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-warn/15 text-warn">
          <HandCoins className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="claim-title" className="font-semibold">
            Payment claim to review
          </h2>
          <p className="mt-0.5 text-ink-2">
            {clientFirstName} reported paying {formatINR(claim.claimed_amount)}
          </p>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            {claim.reference && (
              <>
                <dt className="text-ink-3">Reference</dt>
                <dd className="num">{claim.reference}</dd>
              </>
            )}
            {claim.claimed_on && (
              <>
                <dt className="text-ink-3">Reported</dt>
                <dd>{formatDate(claim.claimed_on)}</dd>
              </>
            )}
          </dl>
          <p className="mt-2 text-sm text-ink-3">Check your bank app for this credit before confirming.</p>
        </div>
      </div>
      <div className="mt-4 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end sm:gap-3">
        <Button variant="secondary" icon={X} onClick={() => act('reject')} disabled={state !== 'idle'} state={state === 'rejecting' ? 'loading' : 'idle'}>
          {state === 'rejected' ? 'Rejected' : 'Reject'}
        </Button>
        <Button className="scroll-mt-24 scroll-mb-24" onClick={() => act('confirm')} disabled={state !== 'idle' && state !== 'confirmed'} state={state === 'confirming' ? 'loading' : state === 'confirmed' ? 'done' : 'idle'} doneLabel="Confirmed">
          Confirm Payment
        </Button>
      </div>
      <p className="sr-only" aria-live="polite">
        {state === 'confirmed' ? 'Payment confirmed' : state === 'rejected' ? 'Claim rejected' : ''}
      </p>
    </section>
  );
}
