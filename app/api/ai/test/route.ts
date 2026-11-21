import { NextRequest, NextResponse } from 'next/server';
import { testAIConnection } from '@/lib/ai';

// Rate Limiter: In-memory sliding window, 10 requests per minute per IP
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;
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

export async function POST(req: NextRequest) {
  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip')?.trim() ||
    'unknown';

  if (!checkRateLimit(clientIp)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait before testing again.' },
      { status: 429 }
    );
  }

  const result = await testAIConnection();
  return NextResponse.json(result);
}
