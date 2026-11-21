import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { testAIConnection } from './test-connection';
import { GET as getStatus } from '@/app/api/status/route';

describe('System Status & Test AI Probe', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('GET /api/status returns only expected fields and never secrets', async () => {
    process.env.LLM_API_KEY = 'super-secret-key-that-must-never-leak';
    process.env.LLM_BASE_URL = 'https://api.openai.com/v1?token=secret-token';
    process.env.LLM_MODEL = 'test-model-alpha';
    process.env.LLM_FALLBACK_MODEL = 'test-model-beta';

    const response = await getStatus();
    const data = await response.json();

    expect(data).toHaveProperty('dataMode');
    expect(['demo', 'supabase']).toContain(data.dataMode);
    expect(data).toHaveProperty('llmConfigured', true);
    expect(data).toHaveProperty('primaryModel', 'test-model-alpha');
    expect(data).toHaveProperty('fallbackModel', 'test-model-beta');
    expect(data).toHaveProperty('resetEnabled');

    // Assert strictly that secrets NEVER leak
    const payloadStr = JSON.stringify(data);
    expect(payloadStr).not.toContain('super-secret-key');
    expect(payloadStr).not.toContain('secret-token');
    expect(payloadStr).not.toContain('api.openai.com');
  });

  it('testAIConnection returns not_configured when LLM is not configured', async () => {
    delete process.env.LLM_API_KEY;
    const result = await testAIConnection();

    expect(result.ok).toBe(false);
    expect(result.errorKind).toBe('not_configured');
    expect(result.latencyMs).toBe(0);
  });

  it('testAIConnection returns ok: true when model responds with ok', async () => {
    process.env.LLM_API_KEY = 'valid-key';
    process.env.LLM_BASE_URL = 'https://api.mock.com/v1';
    process.env.LLM_MODEL = 'primary-model';

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'ok' } }],
      }),
    });
    global.fetch = mockFetch;

    const result = await testAIConnection();

    expect(result.ok).toBe(true);
    expect(result.errorKind).toBe('none');
    expect(result.modelUsed).toBe('primary-model');
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('testAIConnection returns http_error on non-200 HTTP status', async () => {
    process.env.LLM_API_KEY = 'valid-key';
    process.env.LLM_BASE_URL = 'https://api.mock.com/v1';
    process.env.LLM_MODEL = 'primary-model';

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    });
    global.fetch = mockFetch;

    const result = await testAIConnection();

    expect(result.ok).toBe(false);
    expect(result.errorKind).toBe('http_error');
  });

  it('testAIConnection returns empty_response when content is blank', async () => {
    process.env.LLM_API_KEY = 'valid-key';
    process.env.LLM_BASE_URL = 'https://api.mock.com/v1';
    process.env.LLM_MODEL = 'primary-model';

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '   ' } }],
      }),
    });
    global.fetch = mockFetch;

    const result = await testAIConnection();

    expect(result.ok).toBe(false);
    expect(result.errorKind).toBe('empty_response');
  });
});
