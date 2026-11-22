import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRepository } from '@/lib/db/repository';
import { PaymentMethod } from '@/lib/db/types';

const resolveSchema = z.object({
  action: z.enum(['confirm', 'reject']),
  paymentMethod: z.enum(['UPI', 'bank_transfer', 'cash', 'cheque', 'other']).optional(),
  reference: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: claimId } = await context.params;

  try {
    const body = await req.json();
    const parsed = resolveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input parameters', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { action, paymentMethod = 'UPI', reference } = parsed.data;
    const repo = getRepository();

    const claim = await repo.getPaymentClaimById(claimId);
    if (!claim) {
      return NextResponse.json({ error: `Payment claim not found: ${claimId}` }, { status: 404 });
    }

    // Idempotent handling if already confirmed/rejected
    const targetStatus = action === 'confirm' ? 'confirmed' : 'rejected';
    if (claim.status === targetStatus) {
      return NextResponse.json({
        success: true,
        message: `Claim is already ${action}ed`,
        claim,
      });
    }

    if (action === 'confirm') {
      const invoice = await repo.getInvoiceById(claim.invoice_id);
      if (!invoice) {
        return NextResponse.json({ error: `Invoice not found: ${claim.invoice_id}` }, { status: 404 });
      }

      // Check remaining balance to avoid duplicate overpayments if already settled
      const remainingBalance = invoice.amount - invoice.paid_amount;
      const paymentAmount = Math.min(claim.claimed_amount, remainingBalance);

      let paymentResult = null;
      if (paymentAmount > 0) {
        paymentResult = await repo.recordPayment({
          invoiceId: invoice.id,
          amount: paymentAmount,
          paymentMethod: paymentMethod as PaymentMethod,
          referenceNumber: claim.reference || reference || null,
          notes: `Confirmed client payment claim (${claim.id})`,
        });
      }

      const updatedClaim = await repo.resolvePaymentClaim(claim.id, 'confirmed');

      return NextResponse.json({
        success: true,
        action: 'confirm',
        claim: updatedClaim,
        payment: paymentResult?.payment,
        invoice: paymentResult?.invoice,
        clientLearning: paymentResult?.clientLearning,
      });
    } else {
      // Reject action: marks rejected, leaves invoice unpaid, sends no notification
      const updatedClaim = await repo.resolvePaymentClaim(claim.id, 'rejected');

      return NextResponse.json({
        success: true,
        action: 'reject',
        claim: updatedClaim,
      });
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error resolving payment claim:', err.message);
    return NextResponse.json(
      { error: err.message || 'Failed to resolve payment claim' },
      { status: 500 }
    );
  }
}
