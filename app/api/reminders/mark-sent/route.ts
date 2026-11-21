import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRepository } from '@/lib/db/repository';

const markSentSchema = z.object({
  invoiceId: z.string().min(1),
  tone: z.enum(['friendly', 'firm', 'final']).default('friendly'),
  language: z.enum(['en', 'hinglish']).default('en'),
  text: z.string().min(1),
  channel: z.enum(['whatsapp', 'sms', 'email']).default('whatsapp'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = markSentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const repo = getRepository();
    const reminder = await repo.recordReminder(parsed.data);

    return NextResponse.json({
      success: true,
      reminder,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || 'Failed to record reminder' },
      { status: 500 }
    );
  }
}
