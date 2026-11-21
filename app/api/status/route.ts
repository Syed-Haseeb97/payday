import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/db/repository';
import { getLLMConfig, isLLMConfigured } from '@/lib/ai/config';
import { isDailyCapReached } from '@/lib/rate-limit';

export async function GET() {
  const repo = getRepository();
  const config = getLLMConfig();
  const resetEnabled = repo.isDemoMode() || process.env.NEXT_PUBLIC_DEMO_RESET === 'true';
  const capReached = await isDailyCapReached();

  return NextResponse.json({
    dataMode: repo.isDemoMode() ? 'demo' : 'supabase',
    llmConfigured: isLLMConfigured() && !capReached,
    primaryModel: config.model || '',
    fallbackModel: config.fallbackModel || '',
    resetEnabled,
    ...(capReached ? { status: 'ai_cap_reached', aiStatus: 'ai_cap_reached' } : {}),
  });
}
