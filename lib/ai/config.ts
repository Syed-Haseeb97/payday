// Server-side LLM configuration
// NEVER import this file in client-side components.

export interface LLMConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  fallbackModel: string;
  timeoutMs: number;
  maxRetries: number;
}

export function getLLMConfig(): LLMConfig {
  return {
    baseUrl: (process.env.LLM_BASE_URL || '').trim(),
    apiKey: (process.env.LLM_API_KEY || '').trim(),
    model: (process.env.LLM_MODEL || '').trim(),
    fallbackModel: (process.env.LLM_FALLBACK_MODEL || '').trim(),
    timeoutMs: 10000, // 10 second timeout per brief requirement
    maxRetries: 1,    // 1 retry before fallback per brief requirement
  };
}

export function isLLMConfigured(): boolean {
  const apiKey = (process.env.LLM_API_KEY || '').trim();
  const baseUrl = (process.env.LLM_BASE_URL || '').trim();
  const model = (process.env.LLM_MODEL || '').trim();

  // All three must be non-empty
  if (!apiKey || !baseUrl || !model) {
    return false;
  }

  // Key must not be a placeholder
  if (/^(your[-_]|placeholder|<|xxx|example)/i.test(apiKey) || apiKey === 'none' || apiKey === 'null') {
    return false;
  }

  return true;
}
