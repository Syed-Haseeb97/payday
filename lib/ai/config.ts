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
    baseUrl: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
    apiKey: process.env.LLM_API_KEY || '',
    model: process.env.LLM_MODEL || 'gpt-4o-mini',
    fallbackModel: process.env.LLM_FALLBACK_MODEL || 'gpt-3.5-turbo',
    timeoutMs: 10000, // 10 second timeout per brief requirement
    maxRetries: 1,    // 1 retry before fallback per brief requirement
  };
}

export function isLLMConfigured(): boolean {
  const apiKey = process.env.LLM_API_KEY;
  return Boolean(apiKey && apiKey.trim().length > 0 && !apiKey.startsWith('your-'));
}
