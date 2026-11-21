import { NextRequest, NextResponse } from 'next/server';
import { testAIConnection } from '@/lib/ai';
import { getClientIp, checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);

  if (!checkRateLimit(clientIp, { limit: 10 }).allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  const result = await testAIConnection();
  return NextResponse.json(result);
}
