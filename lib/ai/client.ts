// Server-side OpenAI-compatible Chat Completions client
// Implements 10s timeout, 1 retry, model fallback, and deterministic template fallback.

import { getLLMConfig, isLLMConfigured } from './config';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

interface FetchCompletionResult {
  content: string;
  modelUsed: string;
}

/**
 * Executes a single HTTP request to OpenAI-compatible endpoint with strict 10s timeout
 */
async function fetchWithTimeout(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  timeoutMs: number,
  temperature: number = 0.3,
  maxTokens: number = 500
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`LLM API returned status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('LLM API returned empty completion content');
    }

    return content.trim();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Executes completion with timeout, 1 retry, and model fallback
 */
export async function executeCompletionWithFallback(
  options: CompletionOptions,
  deterministicFallback: () => string
): Promise<FetchCompletionResult> {
  const config = getLLMConfig();

  // If not configured, immediately use deterministic fallback without latency
  if (!isLLMConfigured()) {
    return {
      content: deterministicFallback(),
      modelUsed: 'deterministic-template',
    };
  }

  // Attempt 1: Primary Model (with 1 retry)
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const content = await fetchWithTimeout(
        config.baseUrl,
        config.apiKey,
        config.model,
        options.messages,
        config.timeoutMs,
        options.temperature,
        options.maxTokens
      );
      return { content, modelUsed: config.model };
    } catch (err) {
      console.warn(`[lib/ai] Primary model attempt ${attempt + 1} failed:`, (err as Error).message);
      if (attempt === config.maxRetries) break;
      // Brief pause before retry
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // Attempt 2: Fallback Model (if different from primary)
  if (config.fallbackModel && config.fallbackModel !== config.model) {
    try {
      const content = await fetchWithTimeout(
        config.baseUrl,
        config.apiKey,
        config.fallbackModel,
        options.messages,
        config.timeoutMs,
        options.temperature,
        options.maxTokens
      );
      return { content, modelUsed: config.fallbackModel };
    } catch (err) {
      console.warn(`[lib/ai] Fallback model failed:`, (err as Error).message);
    }
  }

  // Final Attempt: Deterministic rule/template engine (guaranteed zero failure)
  return {
    content: deterministicFallback(),
    modelUsed: 'deterministic-template',
  };
}
