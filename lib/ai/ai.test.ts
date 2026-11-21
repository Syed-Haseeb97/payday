import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  suggestDefaultTone,
  validateModelOutput,
  buildWhatsAppDeepLink,
  BANNED_WORDS,
  generateReminderDraft,
  executeCompletionWithFallback,
  getTemplateReminder,
  buildReminderPrompts,
  ReminderContext,
} from './index';

describe('AI Layer - Suggest Default Tone', () => {
  it('suggests "final" for 11+ days overdue or unreliable clients', () => {
    expect(suggestDefaultTone(11, 'reliable')).toBe('final');
    expect(suggestDefaultTone(25, 'average')).toBe('final');
    expect(suggestDefaultTone(0, 'unreliable')).toBe('final');
    expect(suggestDefaultTone(2, 'unreliable')).toBe('final');
  });

  it('suggests "firm" for 4 to 10 days overdue', () => {
    expect(suggestDefaultTone(4, 'average')).toBe('firm');
    expect(suggestDefaultTone(7, 'slow')).toBe('firm');
    expect(suggestDefaultTone(10, 'reliable')).toBe('firm');
  });

  it('suggests "friendly" for <= 3 days overdue (and not unreliable)', () => {
    expect(suggestDefaultTone(0, 'reliable')).toBe('friendly');
    expect(suggestDefaultTone(1, 'average')).toBe('friendly');
    expect(suggestDefaultTone(3, 'slow')).toBe('friendly');
    expect(suggestDefaultTone(-5, 'average')).toBe('friendly');
  });
});

describe('AI Layer - Deterministic Template Fallbacks', () => {
  const ctx: ReminderContext = {
    clientName: 'Rahul',
    eventName: 'Mehta Wedding',
    milestoneLabel: 'Mid Milestone',
    amountFormatted: '₹35,000',
    dueDateFormatted: '10 Nov',
    daysOverdue: 5,
    upiId: 'arjun@okaxis',
  };

  it('generates non-empty templates for all tones in English', () => {
    const tones = ['friendly', 'firm', 'final'] as const;
    for (const tone of tones) {
      const text = getTemplateReminder(tone, 'en', ctx);
      expect(text).toContain('Rahul');
      expect(text).toContain('₹35,000');
      expect(text).toContain('arjun@okaxis');
      expect(text.length).toBeLessThan(600);
    }
  });

  it('generates non-empty templates for all tones in Hinglish', () => {
    const tones = ['friendly', 'firm', 'final'] as const;
    for (const tone of tones) {
      const text = getTemplateReminder(tone, 'hinglish', ctx);
      expect(text).toContain('Rahul');
      expect(text).toContain('₹35,000');
      expect(text.length).toBeLessThan(600);
    }
  });
});

describe('AI Layer - WhatsApp Deep Link Generator', () => {
  it('formats clean phone numbers with country code', () => {
    const link = buildWhatsAppDeepLink('+91 90000 00001', 'Hello Rahul');
    expect(link).toBe('https://wa.me/919000000001?text=Hello%20Rahul');
  });

  it('handles spaces, dashes, parentheses and newlines', () => {
    const link = buildWhatsAppDeepLink('+91 (98765) 43210', 'Hi!\nPayment of ₹35,000');
    expect(link.startsWith('https://wa.me/919876543210?text=')).toBe(true);
    expect(link).toContain(encodeURIComponent('₹35,000'));
    expect(link).toContain(encodeURIComponent('\n'));
  });

  it('works when phone is empty or null', () => {
    const link = buildWhatsAppDeepLink(null, 'Hello there');
    expect(link).toBe('https://wa.me/?text=Hello%20there');
  });
});

describe('AI Layer - Output Validator', () => {
  it('accepts valid polite responses containing the exact formatted amount', () => {
    const validText = 'Hi Rahul, gentle reminder that ₹35,000 for your wedding milestone was due yesterday. Thanks! – Arjun';
    expect(validateModelOutput(validText, '₹35,000')).toBe(true);
  });

  it('accepts variations of the rupee symbol (Rs, Rs., 35,000)', () => {
    const validWithRs = 'Hi Rahul, reminder for Rs 35,000 due for the wedding album. Thanks!';
    expect(validateModelOutput(validWithRs, '₹35,000')).toBe(true);
  });

  it('rejects output missing the amount', () => {
    const missingAmount = 'Hi Rahul, please pay your pending wedding invoice today. Thanks!';
    expect(validateModelOutput(missingAmount, '₹35,000')).toBe(false);
  });

  it('rejects output that is too long (> 600 characters)', () => {
    const tooLong = 'A'.repeat(601) + ' ₹35,000';
    expect(validateModelOutput(tooLong, '₹35,000')).toBe(false);
  });

  it('rejects output with empty or whitespace-only content', () => {
    expect(validateModelOutput('', '₹35,000')).toBe(false);
    expect(validateModelOutput('    ', '₹35,000')).toBe(false);
  });

  it('strictly rejects any banned aggressive or legal threat words', () => {
    for (const banned of BANNED_WORDS) {
      const aggressiveText = `Pay ₹35,000 now or I will contact my ${banned}!`;
      expect(validateModelOutput(aggressiveText, '₹35,000')).toBe(false);
      // Case insensitivity
      const upperAggressive = `Pay ₹35,000 or facing ${banned.toUpperCase()}!`;
      expect(validateModelOutput(upperAggressive, '₹35,000')).toBe(false);
    }
  });
});

describe('AI Client - executeCompletionWithFallback (Mocked fetch)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = {
      ...originalEnv,
      LLM_API_KEY: 'test-secret-api-key-12345',
      LLM_BASE_URL: 'https://api.mock-ai.com/v1',
      LLM_MODEL: 'primary-model',
      LLM_FALLBACK_MODEL: 'fallback-model',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('returns completion from primary model on HTTP 200 success', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Hi Rohit! Reminder for ₹35,000 payment.' } }],
      }),
    });
    global.fetch = mockFetch;

    const result = await executeCompletionWithFallback(
      { messages: [{ role: 'user', content: 'draft reminder' }] },
      () => 'deterministic template fallback'
    );

    expect(result.content).toBe('Hi Rohit! Reminder for ₹35,000 payment.');
    expect(result.modelUsed).toBe('primary-model');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.content).not.toContain('test-secret-api-key-12345');
  });

  it('retries on primary model 500 error and succeeds on 2nd attempt', async () => {
    let callCount = 0;
    const mockFetch = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return { ok: false, status: 500, statusText: 'Internal Server Error' };
      }
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Recovered on attempt 2: ₹35,000' } }],
        }),
      };
    });
    global.fetch = mockFetch;

    const result = await executeCompletionWithFallback(
      { messages: [{ role: 'user', content: 'draft reminder' }] },
      () => 'deterministic template fallback'
    );

    expect(result.content).toBe('Recovered on attempt 2: ₹35,000');
    expect(result.modelUsed).toBe('primary-model');
    expect(callCount).toBe(2);
  });

  it('falls back to fallback-model when primary model repeatedly fails', async () => {
    const mockFetch = vi.fn().mockImplementation(async (url, init) => {
      const body = JSON.parse(init.body as string);
      if (body.model === 'primary-model') {
        return { ok: false, status: 502, statusText: 'Bad Gateway' };
      }
      if (body.model === 'fallback-model') {
        return {
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Fallback model response: ₹35,000' } }],
          }),
        };
      }
      return { ok: false, status: 404 };
    });
    global.fetch = mockFetch;

    const result = await executeCompletionWithFallback(
      { messages: [{ role: 'user', content: 'draft reminder' }] },
      () => 'deterministic template fallback'
    );

    expect(result.content).toBe('Fallback model response: ₹35,000');
    expect(result.modelUsed).toBe('fallback-model');
  });

  it('uses deterministic template fallback when all models fail', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    });
    global.fetch = mockFetch;

    const result = await executeCompletionWithFallback(
      { messages: [{ role: 'user', content: 'draft reminder' }] },
      () => 'Guaranteed deterministic fallback for ₹35,000'
    );

    expect(result.content).toBe('Guaranteed deterministic fallback for ₹35,000');
    expect(result.modelUsed).toBe('deterministic-template');
  });

  it('uses deterministic template fallback when API returns malformed JSON or empty content', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [] }), // empty choices
    });
    global.fetch = mockFetch;

    const result = await executeCompletionWithFallback(
      { messages: [{ role: 'user', content: 'draft reminder' }] },
      () => 'Fallback on empty choices: ₹35,000'
    );

    expect(result.content).toBe('Fallback on empty choices: ₹35,000');
    expect(result.modelUsed).toBe('deterministic-template');
  });

  it('never leaks the API key in the result payload', async () => {
    const secretKey = 'sk-live-super-secret-12345';
    process.env.LLM_API_KEY = secretKey;

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Here is your draft for ₹35,000' } }],
      }),
    });
    global.fetch = mockFetch;

    const result = await executeCompletionWithFallback(
      { messages: [{ role: 'user', content: 'draft' }] },
      () => 'Template fallback'
    );

    expect(result.content).not.toContain(secretKey);
    expect(result.modelUsed).not.toContain(secretKey);
    const jsonString = JSON.stringify(result);
    expect(jsonString).not.toContain(secretKey);
  });

  it('guarantees personal data (notes, phone number, email) never reaches the LLM prompt', () => {
    const sensitiveClient = {
      name: 'Priya Khurana',
      phone: '+91-98765-43210',
      email: 'priya.khurana.personal@gmail.com',
      notes: 'High net worth family, lives in Vasant Vihar, father is a judge, strictly private wedding',
    };

    const { systemPrompt, userPrompt } = buildReminderPrompts(
      'firm',
      'en',
      {
        clientName: sensitiveClient.name,
        eventName: 'Beachside Wedding',
        milestoneLabel: 'Final Payment',
        amountFormatted: '₹40,000',
        dueDateFormatted: '15 Dec 2026',
        daysOverdue: 6,
        businessName: 'Arjun Visuals',
        upiId: 'arjun@okaxis',
      }
    );

    const combinedPrompts = `${systemPrompt}\n${userPrompt}`;

    // Assert that personal sensitive data does NOT appear
    expect(combinedPrompts).not.toContain(sensitiveClient.phone);
    expect(combinedPrompts).not.toContain('9876543210');
    expect(combinedPrompts).not.toContain(sensitiveClient.email);
    expect(combinedPrompts).not.toContain(sensitiveClient.notes);
    expect(combinedPrompts).not.toContain('Khurana'); // Surname omitted, only first name Priya allowed
    expect(combinedPrompts).toContain('Priya');
    expect(combinedPrompts).toContain('₹40,000');
    expect(combinedPrompts).toContain('15 Dec 2026');
  });

  describe('Missing environment variables prevent any network call', () => {
    it('makes NO network call when LLM_API_KEY is empty', async () => {
      process.env.LLM_API_KEY = '';
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      const result = await executeCompletionWithFallback(
        { messages: [{ role: 'user', content: 'test' }] },
        () => 'fallback-result'
      );

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.content).toBe('fallback-result');
      expect(result.modelUsed).toBe('deterministic-template');
    });

    it('makes NO network call when LLM_API_KEY is a placeholder', async () => {
      process.env.LLM_API_KEY = 'your-api-key-here';
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      const result = await executeCompletionWithFallback(
        { messages: [{ role: 'user', content: 'test' }] },
        () => 'fallback-result'
      );

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.content).toBe('fallback-result');
      expect(result.modelUsed).toBe('deterministic-template');
    });

    it('makes NO network call when LLM_BASE_URL is empty', async () => {
      process.env.LLM_BASE_URL = '';
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      const result = await executeCompletionWithFallback(
        { messages: [{ role: 'user', content: 'test' }] },
        () => 'fallback-result'
      );

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.content).toBe('fallback-result');
      expect(result.modelUsed).toBe('deterministic-template');
    });

    it('makes NO network call when LLM_MODEL is empty', async () => {
      process.env.LLM_MODEL = '';
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      const result = await executeCompletionWithFallback(
        { messages: [{ role: 'user', content: 'test' }] },
        () => 'fallback-result'
      );

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.content).toBe('fallback-result');
      expect(result.modelUsed).toBe('deterministic-template');
    });

    it('makes NO network call when all AI environment variables are missing', async () => {
      delete process.env.LLM_API_KEY;
      delete process.env.LLM_BASE_URL;
      delete process.env.LLM_MODEL;
      delete process.env.LLM_FALLBACK_MODEL;
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      const result = await executeCompletionWithFallback(
        { messages: [{ role: 'user', content: 'test' }] },
        () => 'fallback-result'
      );

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.content).toBe('fallback-result');
      expect(result.modelUsed).toBe('deterministic-template');
    });

    it('skips fallback model if LLM_FALLBACK_MODEL is empty', async () => {
      process.env.LLM_FALLBACK_MODEL = '';
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });
      global.fetch = mockFetch;

      const result = await executeCompletionWithFallback(
        { messages: [{ role: 'user', content: 'test' }] },
        () => 'template-after-primary-failure'
      );

      // Primary model runs attempt 1 + retry 1 = 2 calls; fallback model is NOT called
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.content).toBe('template-after-primary-failure');
      expect(result.modelUsed).toBe('deterministic-template');
    });
  });
});
