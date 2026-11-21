import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRepository } from '@/lib/db/repository';
import { parseQuickAdd } from '@/lib/quickadd/ai';
import { buildBookingProposal } from '@/lib/quickadd/builder';
import { getIndiaTodayStr } from '@/lib/date';
import { getClientIp, checkRateLimit } from '@/lib/rate-limit';

const parseRequestSchema = z.object({
  text: z.string().min(1, 'Text cannot be empty').max(1500, 'Text must be at most 1,500 characters'),
  languageHint: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!checkRateLimit(ip).allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = parseRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { text } = parsed.data;
    const repo = getRepository();
    const todayStr = getIndiaTodayStr();

    // Parse text using AI with deterministic rules fallback & reconciliation
    const parseResult = await parseQuickAdd(text, todayStr);

    // Fetch existing clients to find matches
    const existingClients = await repo.getClients();

    // Assemble proposal
    const proposal = buildBookingProposal(parseResult, existingClients, todayStr);

    return NextResponse.json({
      success: true,
      proposal,
      parseResult,
    });
  } catch (error: unknown) {
    console.error('Error parsing booking text:', error);
    return NextResponse.json(
      { error: 'Failed to parse booking text' },
      { status: 500 }
    );
  }
}
