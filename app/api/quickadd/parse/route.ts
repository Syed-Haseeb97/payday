import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRepository } from '@/lib/db/repository';
import { parseQuickAdd } from '@/lib/quickadd/ai';
import { buildBookingProposal } from '@/lib/quickadd/builder';
import { format } from 'date-fns';

const parseRequestSchema = z.object({
  text: z.string().min(1, 'Text cannot be empty').max(1500, 'Text must be at most 1,500 characters'),
  languageHint: z.string().optional(),
});

// Sliding-window rate limiter: max 15 requests per minute
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 15;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(key) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  validTimestamps.push(now);
  rateLimitMap.set(key, validTimestamps);
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'default-user';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 15 requests per minute.' },
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
    const todayStr = format(new Date(), 'yyyy-MM-dd');

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
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || 'Failed to parse booking text' },
      { status: 500 }
    );
  }
}
