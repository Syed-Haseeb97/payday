// Real-path AI connection testing
// Sends a tiny fixed prompt ("Reply with the single word: ok")
// Never logs or returns keys, URLs with credentials, or raw error text.

import { getLLMConfig, isLLMConfigured } from './config';

export type AIConnectionErrorKind =
  | 'none'
  | 'not_configured'
  | 'timeout'
  | 'http_error'
  | 'empty_response'
  | 'other';

export interface AIConnectionTestResult {
  ok: boolean;
  latencyMs: number;
  modelUsed: string;
  errorKind: AIConnectionErrorKind;
}

export async function testAIConnection(): Promise<AIConnectionTestResult> {
  if (!isLLMConfigured()) {
    return {
      ok: false,
      latencyMs: 0,
      modelUsed: '',
      errorKind: 'not_configured',
    };
  }

  const config = getLLMConfig();
  const startTime = Date.now();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const url = `${config.baseUrl.replace(/\/+$/, '')}/chat/completions`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: 'Reply with the single word: ok' }],
        temperature: 0.1,
        max_tokens: 10,
      }),
      signal: controller.signal,
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      return {
        ok: false,
        latencyMs,
        modelUsed: config.model,
        errorKind: 'http_error',
      };
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return {
        ok: false,
        latencyMs,
        modelUsed: config.model,
        errorKind: 'empty_response',
      };
    }

    return {
      ok: true,
      latencyMs,
      modelUsed: config.model,
      errorKind: 'none',
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    const isAbort =
      err instanceof Error &&
      (err.name === 'AbortError' || err.message.toLowerCase().includes('abort'));

    return {
      ok: false,
      latencyMs,
      modelUsed: config.model,
      errorKind: isAbort ? 'timeout' : 'other',
    };
  } finally {
    clearTimeout(timer);
  }
}
