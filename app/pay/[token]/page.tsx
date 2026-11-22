import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getRepository } from '@/lib/db/repository';
import { isValidPayToken } from '@/lib/pay/token';
import { DEMO_USER } from '@/lib/db/types';
import { PayPortal } from '@/components/pay/PayPortal';

interface PayPageProps {
  params: Promise<{ token: string }>;
}

export const metadata: Metadata = {
  title: 'Pay Invoice - Arjun Visuals',
  description: 'Secure milestone payment portal',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function PayPage({ params }: PayPageProps) {
  const { token } = await params;

  // Unknown or malformed token renders a generic 404 page revealing nothing about the system
  if (!isValidPayToken(token)) {
    notFound();
  }

  const repo = getRepository();
  const invoice = await repo.getInvoiceByPayToken(token);

  if (!invoice) {
    notFound();
  }

  // Safe client data projection:
  // ONLY client first name (never full legal name, phone, email, notes, or reliability)
  const rawClientName = invoice.client?.name || 'Client';
  const clientFirstName = rawClientName.split(' ')[0] || 'Client';
  const eventName = invoice.booking?.title || 'Wedding Photography';
  const businessName = DEMO_USER.business_name || 'Arjun Visuals';

  const balance = invoice.amount - invoice.paid_amount;
  const pendingClaim = (invoice.payment_claims || []).find((c) => c.status === 'pending');

  const fallbackUpi = `upi://pay?pa=${DEMO_USER.upi_id || 'arjunvisuals@okaxis'}&pn=${encodeURIComponent(
    businessName
  )}&am=${balance}&cu=INR`;

  return (
    <PayPortal
      businessName={businessName}
      clientFirstName={clientFirstName}
      milestoneLabel={invoice.milestone_label}
      eventName={eventName}
      amount={invoice.amount}
      paidAmount={invoice.paid_amount}
      balance={balance}
      dueDate={invoice.due_date}
      status={invoice.status}
      upiLink={invoice.upi_link || fallbackUpi}
      initialPendingClaim={
        pendingClaim
          ? {
              id: pendingClaim.id,
              claimed_amount: pendingClaim.claimed_amount,
              reference: pendingClaim.reference,
            }
          : null
      }
      token={token}
    />
  );
}
