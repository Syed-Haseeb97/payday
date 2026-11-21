import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { getRepository } from '@/lib/db/repository';
import { generateReminderDraft } from '@/lib/ai';
import { formatINR } from '@/lib/money';
import { getIndiaTodayStr } from '@/lib/date';
import { daysBetween } from '@/lib/forecast';
import { DEMO_USER } from '@/lib/db/types';

// Rate Limiter: In-memory sliding window, 20 requests per minute per IP
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;
const ipRequestHistory = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = (ipRequestHistory.get(ip) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    ipRequestHistory.set(ip, timestamps);
    return false;
  }

  timestamps.push(now);
  ipRequestHistory.set(ip, timestamps);
  return true;
}

const reminderDraftSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  tone: z.enum(['friendly', 'firm', 'final']).default('friendly'),
  language: z.enum(['en', 'hinglish']).default('en'),
});

export async function POST(req: NextRequest) {
  // Check rate limit
  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

  if (!checkRateLimit(clientIp)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Maximum 20 reminder requests per minute.' },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parsed = reminderDraftSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input parameters', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { invoiceId, tone, language } = parsed.data;
    const repo = getRepository();

    const invoice = await repo.getInvoiceById(invoiceId);
    if (!invoice) {
      return NextResponse.json(
        { error: `Invoice with ID ${invoiceId} not found` },
        { status: 404 }
      );
    }

    const client = invoice.client || (await repo.getClientById(invoice.client_id));
    const booking = invoice.booking || (await repo.getBookingById(invoice.booking_id));

    const todayStr = getIndiaTodayStr();
    const balance = invoice.amount - invoice.paid_amount;
    const diff = daysBetween(todayStr, invoice.due_date);
    const daysOverdue = diff < 0 ? Math.abs(diff) : 0;

    const formattedAmount = formatINR(balance);
    const formattedDueDate = format(parseISO(invoice.due_date), 'd MMM yyyy');

    const draft = await generateReminderDraft(
      tone,
      language,
      {
        clientName: client?.name || 'Valued Client',
        eventName: booking?.title || 'Wedding Photography',
        milestoneLabel: invoice.milestone_label,
        amountFormatted: formattedAmount,
        dueDateFormatted: formattedDueDate,
        daysOverdue,
        businessName: DEMO_USER.business_name || 'Arjun Visuals',
        upiId: DEMO_USER.upi_id || 'arjunvisuals@okaxis',
      },
      client?.phone
    );

    return NextResponse.json({
      success: true,
      text: draft.text,
      source: draft.source,
      model: draft.model,
      whatsappDeepLink: draft.whatsappDeepLink,
      tone,
      language,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error generating reminder draft:', err.message);
    return NextResponse.json(
      { error: 'Failed to generate reminder draft' },
      { status: 500 }
    );
  }
}
