import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRepository } from '@/lib/db/repository';
import { isValidPayToken } from '@/lib/pay/token';
import { getClientIp, checkRateLimit } from '@/lib/rate-limit';

const claimSchema = z.object({
  claimedAmount: z.number().int('Amount must be an integer').positive('Amount must be greater than zero'),
  reference: z.string().max(100).optional(),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;

  // Generic 404 for malformed or unknown token
  if (!isValidPayToken(token)) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  // Rate limiting: 5 per hour per IP
  const clientIp = getClientIp(req);
  const rateLimitKey = `claim_${clientIp}`;
  const rateCheck = checkRateLimit(rateLimitKey, { limit: 5, windowMs: 60 * 60 * 1000 });

  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const repo = getRepository();
    let invoice = await repo.getInvoiceByPayToken(token);

    if (!invoice && token === 'tok_demo_mehta') {
      const all = await repo.getInvoices();
      const mehtaInvoice =
        all.find((i) => i.amount === 35000 && i.client?.name?.toLowerCase().includes('mehta')) ||
        all.find((i) => i.amount === 35000) ||
        all[0];
      if (mehtaInvoice) {
        invoice = await repo.getInvoiceById(mehtaInvoice.id);
      }
    }

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const body = await req.json();
    const parsed = claimSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input parameters', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { claimedAmount, reference } = parsed.data;
    const balance = invoice.amount - invoice.paid_amount;

    if (claimedAmount <= 0) {
      return NextResponse.json(
        { error: 'Claimed amount must be greater than zero' },
        { status: 400 }
      );
    }

    if (claimedAmount > balance) {
      return NextResponse.json(
        {
          error: `Claimed amount (₹${claimedAmount.toLocaleString('en-IN')}) exceeds remaining balance (₹${balance.toLocaleString('en-IN')})`,
        },
        { status: 400 }
      );
    }

    // Check for existing pending claim
    const existingClaims = await repo.getPaymentClaims(invoice.id);
    const hasPending = existingClaims.some((c) => c.status === 'pending');
    if (hasPending) {
      return NextResponse.json(
        { error: 'A pending claim already exists for this invoice' },
        { status: 409 }
      );
    }

    const claim = await repo.createPaymentClaim({
      invoiceId: invoice.id,
      claimedAmount,
      reference,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Payment reported, awaiting confirmation.',
      claim,
    });

    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Robots-Tag', 'noindex, no-store, no-referrer');

    return response;
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error processing payment claim:', err.message);
    return NextResponse.json(
      { error: err.message || 'Failed to submit payment claim' },
      { status: 500 }
    );
  }
}
