// Unified Rate Limiting and Cost Control Layer
// Client IP extraction, sliding-window rate limiting, and global daily LLM caps.

import { getIndiaTodayStr } from '../date';
import { getRepository } from '../db/repository';

export interface RateLimitOptions {
  limit?: number;
  windowMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

// In-memory sliding window store
const ipRequestHistory = new Map<string, number[]>();

// In-memory daily counter store (used in demo mode and for test/fallback)
const inMemoryUsageCounters = new Map<string, number>();

/**
 * Derives client IP from the FIRST value of x-forwarded-for, trimmed.
 * Falls back to x-real-ip (trimmed), then "unknown".
 */
export function getClientIp(
  req: { headers: { get: (name: string) => string | null } } | Request | Headers
): string {
  let forwarded: string | null = null;
  let realIp: string | null = null;

  if ('headers' in req && req.headers && typeof req.headers.get === 'function') {
    forwarded = req.headers.get('x-forwarded-for');
    realIp = req.headers.get('x-real-ip');
  } else if ('get' in req && typeof req.get === 'function') {
    forwarded = (req as Headers).get('x-forwarded-for');
    realIp = (req as Headers).get('x-real-ip');
  }

  if (forwarded && typeof forwarded === 'string') {
    const first = forwarded.split(',')[0].trim();
    if (first.length > 0) return first;
  }

  if (realIp && typeof realIp === 'string') {
    const trimmed = realIp.trim();
    if (trimmed.length > 0) return trimmed;
  }

  return 'unknown';
}

/**
 * Checks in-memory sliding window rate limit for a client IP.
 * Default: 20 requests per minute.
 */
export function checkRateLimit(
  ip: string,
  options: RateLimitOptions = {}
): RateLimitResult {
  const limit = options.limit ?? 20;
  const windowMs = options.windowMs ?? 60 * 1000;

  const now = Date.now();
  const timestamps = (ipRequestHistory.get(ip) || []).filter(
    (t) => now - t < windowMs
  );

  if (timestamps.length >= limit) {
    ipRequestHistory.set(ip, timestamps);
    return {
      allowed: false,
      remaining: 0,
    };
  }

  timestamps.push(now);
  ipRequestHistory.set(ip, timestamps);

  return {
    allowed: true,
    remaining: limit - timestamps.length,
  };
}

/**
 * Resets sliding window rate limits (used for unit tests).
 */
export function resetRateLimits(): void {
  ipRequestHistory.clear();
}

/**
 * Returns configured daily LLM call limit (env AI_DAILY_CALL_LIMIT, default 400).
 */
export function getDailyCallLimit(): number {
  const envVal = process.env.AI_DAILY_CALL_LIMIT;
  if (!envVal) return 400;
  const parsed = parseInt(envVal, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 400;
}

/**
 * Retrieves today's total LLM calls count.
 */
export async function getDailyCallCount(dateStr?: string): Promise<number> {
  const today = dateStr || getIndiaTodayStr();
  const repo = getRepository();

  if (!repo.isDemoMode()) {
    try {
      // In Supabase mode, read from usage_counters table
      const client = (repo as unknown as { client: unknown }).client as {
        from: (table: string) => {
          select: (col: string) => {
            eq: (col1: string, val1: string) => {
              eq: (col2: string, val2: string) => {
                single: () => Promise<{ data: { count: number } | null }>;
              };
            };
          };
        };
      };

      if (client && typeof client.from === 'function') {
        const { data } = await client
          .from('usage_counters')
          .select('count')
          .eq('date', today)
          .eq('name', 'llm_calls')
          .single();

        if (data && typeof data.count === 'number') {
          return data.count;
        }
        return 0;
      }
    } catch {
      // Graceful fallback to memory on network/credentials absence
    }
  }

  return inMemoryUsageCounters.get(today) || 0;
}

/**
 * Atomically increments the daily LLM calls counter.
 */
export async function incrementDailyCallCount(dateStr?: string): Promise<number> {
  const today = dateStr || getIndiaTodayStr();
  const repo = getRepository();

  if (!repo.isDemoMode()) {
    try {
      const client = (repo as unknown as { client: unknown }).client as {
        rpc: (
          fn: string,
          params: { p_date: string; p_name: string; p_increment: number }
        ) => Promise<{ data: number | null; error: unknown }>;
      };

      if (client && typeof client.rpc === 'function') {
        const { data, error } = await client.rpc('increment_usage_counter', {
          p_date: today,
          p_name: 'llm_calls',
          p_increment: 1,
        });

        if (!error && typeof data === 'number') {
          return data;
        }
      }
    } catch {
      // Graceful fallback to memory
    }
  }

  const current = inMemoryUsageCounters.get(today) || 0;
  const updated = current + 1;
  inMemoryUsageCounters.set(today, updated);
  return updated;
}

/**
 * Returns true if the daily LLM cap has been reached.
 */
export async function isDailyCapReached(dateStr?: string): Promise<boolean> {
  const count = await getDailyCallCount(dateStr);
  return count >= getDailyCallLimit();
}

/**
 * Resets daily call counters (used for unit tests).
 */
export function resetDailyCallCountersForTesting(): void {
  inMemoryUsageCounters.clear();
}

/**
 * Sets daily call count directly (used for unit tests).
 */
export function setDailyCallCountForTesting(count: number, dateStr?: string): void {
  const today = dateStr || getIndiaTodayStr();
  inMemoryUsageCounters.set(today, count);
}
