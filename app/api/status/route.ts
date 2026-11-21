import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/db/repository';
import { getLLMConfig, isLLMConfigured } from '@/lib/ai/config';

export async function GET() {
  const repo = getRepository();
  const config = getLLMConfig();
  const resetEnabled = repo.isDemoMode() || process.env.NEXT_PUBLIC_DEMO_RESET === 'true';

  return NextResponse.json({
    dataMode: repo.isDemoMode() ? 'demo' : 'supabase',
    llmConfigured: isLLMConfigured(),
    primaryModel: config.model || '',
    fallbackModel: config.fallbackModel || '',
    resetEnabled,
  });
}
