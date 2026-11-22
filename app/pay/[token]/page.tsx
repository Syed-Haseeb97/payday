import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { connection } from 'next/server';
import { getRepository } from '@/lib/db/repository';
import { isValidPayToken } from '@/lib/pay/token';
import { DEMO_USER } from '@/lib/db/types';
import { PayScreen } from '@/components/screens/PayScreen';
import type { PayPage as PayPageType } from '@/lib/types';

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
  await connection();
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
  const businessName = DEMO_USER.business_name || 'Arjun Visuals';
  const balance = invoice.amount - invoice.paid_amount;
  const pendingClaim = (invoice.payment_claims || []).find((c) => c.status === 'pending');
  const upiId = DEMO_USER.upi_id || 'arjunvisuals@okaxis';
  const fallbackUpi = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(
    businessName
  )}&am=${balance}&cu=INR&tn=${encodeURIComponent(`${invoice.invoice_number} ${invoice.milestone_label}`)}`;

  const pageData: PayPageType = {
    studio_name: businessName,
    client_first_name: clientFirstName,
    invoice_number: invoice.invoice_number,
    milestone_label: invoice.milestone_label,
    amount_due: balance,
    due_date: invoice.due_date,
    upi_id: upiId,
    upi_uri: invoice.upi_link || fallbackUpi,
    bank: {
      account_name: businessName,
      bank_name: 'HDFC Bank',
      account_number_masked: 'XXXX XXXX 4821',
      ifsc: 'HDFC0001234',
    },
    claim_pending: Boolean(pendingClaim),
  };

  return <PayScreen page={pageData} token={token} />;
}
