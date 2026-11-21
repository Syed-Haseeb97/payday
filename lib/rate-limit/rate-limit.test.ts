import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getClientIp,
  checkRateLimit,
  resetRateLimits,
  getDailyCallLimit,
  isDailyCapReached,
  incrementDailyCallCount,
  setDailyCallCountForTesting,
  resetDailyCallCountersForTesting,
} from './index';
import { executeCompletionWithFallback } from '../ai/client';
import { GET as getStatus } from '@/app/api/status/route';

describe('Rate Limiting & Cost Control Layer', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    resetRateLimits();
    resetDailyCallCountersForTesting();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('IP Extraction', () => {
    it('extracts and trims the FIRST IP from a comma-separated x-forwarded-for header', () => {
      const req = {
        headers: new Headers({
          'x-forwarded-for': '  203.0.113.195 , 70.41.3.18, 150.172.238.178 ',
        }),
      };
      expect(getClientIp(req)).toBe('203.0.113.195');
    });

    it('falls back to trimmed x-real-ip if x-forwarded-for is missing', () => {
      const req = {
        headers: new Headers({
          'x-real-ip': '  198.51.100.24  ',
        }),
      };
      expect(getClientIp(req)).toBe('198.51.100.24');
    });

    it('falls back to "unknown" when neither header is present or non-empty', () => {
      const req = {
        headers: new Headers({}),
      };
      expect(getClientIp(req)).toBe('unknown');

      const reqEmpty = {
        headers: new Headers({
          'x-forwarded-for': '   ',
          'x-real-ip': '',
        }),
      };
      expect(getClientIp(reqEmpty)).toBe('unknown');
    });
  });

  describe('Window Sliding Behaviour', () => {
    it('allows requests up to the limit and blocks exceeding requests', () => {
      const ip = '192.0.2.1';
      const limit = 3;

      const r1 = checkRateLimit(ip, { limit, windowMs: 60000 });
      expect(r1.allowed).toBe(true);
      expect(r1.remaining).toBe(2);

      const r2 = checkRateLimit(ip, { limit, windowMs: 60000 });
      expect(r2.allowed).toBe(true);
      expect(r2.remaining).toBe(1);

      const r3 = checkRateLimit(ip, { limit, windowMs: 60000 });
      expect(r3.allowed).toBe(true);
      expect(r3.remaining).toBe(0);

      const r4 = checkRateLimit(ip, { limit, windowMs: 60000 });
      expect(r4.allowed).toBe(false);
      expect(r4.remaining).toBe(0);
    });

    it('resets after window time elapses', () => {
      const ip = '192.0.2.2';
      const limit = 2;
      const windowMs = 100;

      expect(checkRateLimit(ip, { limit, windowMs }).allowed).toBe(true);
      expect(checkRateLimit(ip, { limit, windowMs }).allowed).toBe(true);
      expect(checkRateLimit(ip, { limit, windowMs }).allowed).toBe(false);

      // Advance time beyond window
      const baseNow = Date.now;
      vi.spyOn(Date, 'now').mockReturnValue(baseNow() + 150);

      expect(checkRateLimit(ip, { limit, windowMs }).allowed).toBe(true);
    });
  });

  describe('Global Daily Call Cap', () => {
    it('defaults daily limit to 400 and respects AI_DAILY_CALL_LIMIT env variable', () => {
      delete process.env.AI_DAILY_CALL_LIMIT;
      expect(getDailyCallLimit()).toBe(400);

      process.env.AI_DAILY_CALL_LIMIT = '50';
      expect(getDailyCallLimit()).toBe(50);
    });

    it('increments daily call count and reports when cap is reached', async () => {
      process.env.AI_DAILY_CALL_LIMIT = '3';

      expect(await isDailyCapReached('2026-11-21')).toBe(false);

      await incrementDailyCallCount('2026-11-21');
      await incrementDailyCallCount('2026-11-21');
      expect(await isDailyCapReached('2026-11-21')).toBe(false);

      await incrementDailyCallCount('2026-11-21');
      expect(await isDailyCapReached('2026-11-21')).toBe(true);
    });

    it('makes AI completion use fallback immediately without network call when daily cap is reached', async () => {
      process.env.LLM_API_KEY = 'real-looking-key-12345';
      process.env.LLM_BASE_URL = 'https://api.mock.com/v1';
      process.env.LLM_MODEL = 'primary-model';
      process.env.AI_DAILY_CALL_LIMIT = '10';

      // Set usage count to 10 (cap reached)
      setDailyCallCountForTesting(10);

      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      const result = await executeCompletionWithFallback(
        { messages: [{ role: 'user', content: 'hello' }] },
        () => 'fallback-because-cap-reached'
      );

      // Fetch must NEVER be called
      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.content).toBe('fallback-because-cap-reached');
      expect(result.modelUsed).toBe('deterministic-template');
    });

    it('reports ai_cap_reached in GET /api/status when daily limit is hit', async () => {
      process.env.LLM_API_KEY = 'real-looking-key-12345';
      process.env.LLM_BASE_URL = 'https://api.mock.com/v1';
      process.env.LLM_MODEL = 'primary-model';
      process.env.AI_DAILY_CALL_LIMIT = '5';

      setDailyCallCountForTesting(5);

      const res = await getStatus();
      const data = await res.json();

      expect(data.status).toBe('ai_cap_reached');
      expect(data.aiStatus).toBe('ai_cap_reached');
      expect(data.llmConfigured).toBe(false); // Disabled when cap is reached
    });
  });
});
