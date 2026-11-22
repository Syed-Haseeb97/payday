import { NextRequest, NextResponse } from 'next/server';
import { z } from '@/lib/zod';
import { getRepository } from '@/lib/db/repository';
import { getIndiaTodayStr } from '@/lib/date';
import { getClientIp, checkRateLimit, isDailyCapReached, incrementDailyCallCount } from '@/lib/rate-limit';
import { isLLMConfigured } from '@/lib/ai/config';
import { parseAskWithAI } from '@/lib/whatif/ask-ai';
import { parseAskWithRules } from '@/lib/whatif/ask-rules';
import { resolveAskScenarios } from '@/lib/whatif/ask-resolver';
import { AskPaydayResponse } from '@/lib/whatif/ask-types';

const askRequestSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, 'Question cannot be empty')
    .max(600, 'Question cannot exceed 600 characters'),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = askRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { question } = parsed.data;
    const todayStr = getIndiaTodayStr();
    const repo = getRepository();

    let rawCandidates;
    let mode: 'ai' | 'rules' = 'rules';

    const canUseAi = isLLMConfigured() && !(await isDailyCapReached(todayStr));

    if (canUseAi) {
      const aiResult = await parseAskWithAI(question, todayStr);
      rawCandidates = aiResult.scenarios;
      mode = aiResult.mode;
      if (mode === 'ai') {
        await incrementDailyCallCount(todayStr);
      }
    } else {
      rawCandidates = parseAskWithRules(question, todayStr);
      mode = 'rules';
    }

    // Fetch repository state for server-side deterministic resolution
    const [clients, bookings, invoices] = await Promise.all([
      repo.getClients(),
      repo.getBookings(),
      repo.getInvoices(),
    ]);

    const { resolvedScenarios, ambiguities, warnings } = resolveAskScenarios({
      candidates: rawCandidates,
      clients,
      bookings,
      invoices,
      todayStr,
    });

    const response: AskPaydayResponse = {
      ok: true,
      mode,
      rawQuestion: question,
      resolvedScenarios,
      ambiguities,
      warnings,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Ask Payday Parse Error]', error);
    return NextResponse.json(
      { error: 'Failed to process question' },
      { status: 500 }
    );
  }
}
