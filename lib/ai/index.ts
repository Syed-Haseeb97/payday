// Payday Server-Side AI Layer
// All LLM interactions flow through this isolated module.
// Strictly obeys fallback to deterministic templates so UI never breaks.

import { ReminderLanguage, ReminderTone } from '../db/types';
import { executeCompletionWithFallback } from './client';
import { getTemplateReminder, ReminderContext } from './fallbacks';
import { isLLMConfigured } from './config';

export * from './config';
export * from './fallbacks';
export * from './client';

export interface ReminderDraftResult {
  text: string;
  tone: ReminderTone;
  language: ReminderLanguage;
  modelUsed: string;
  whatsappDeepLink: string;
}

/**
 * Builds a WhatsApp wa.me deep link with prefilled URL-encoded message text
 */
export function buildWhatsAppDeepLink(phone: string | null | undefined, text: string): string {
  const cleanPhone = phone ? phone.replace(/[^\d+]/g, '').replace(/^\+/, '') : '';
  const encodedText = encodeURIComponent(text);
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}

/**
 * Generates a reminder draft for an invoice milestone.
 * Stub function: Uses the environment config, timeout, retry, and fallback structure.
 * When LLM is not configured, directly returns the deterministic template.
 */
export async function generateReminderDraft(
  tone: ReminderTone = 'friendly',
  language: ReminderLanguage = 'en',
  context: ReminderContext,
  clientPhone?: string | null
): Promise<ReminderDraftResult> {
  const fallbackFn = () => getTemplateReminder(tone, language, context);

  // If LLM is not configured, return deterministic template immediately without network call
  if (!isLLMConfigured()) {
    const text = fallbackFn();
    return {
      text,
      tone,
      language,
      modelUsed: 'deterministic-template',
      whatsappDeepLink: buildWhatsAppDeepLink(clientPhone, text),
    };
  }

  // If configured, run through execution engine with timeout + 1 retry + fallback model + template fallback
  const systemPrompt = `You are an assistant for Arjun, a freelance wedding photographer in India. Draft a concise WhatsApp payment reminder in ${tone} tone and ${language} language. Keep it polite, direct, and under 30 words. Include the milestone, amount, due date, and UPI details if provided. Do NOT include placeholders like [Your Name]; sign off as Arjun.`;
  const userPrompt = `Client: ${context.clientName}\nEvent: ${context.eventName}\nMilestone: ${context.milestoneLabel}\nAmount: ${context.amountFormatted}\nDue: ${context.dueDateFormatted}\nOverdue Days: ${context.daysOverdue ?? 0}\nUPI: ${context.upiId ?? 'None'}`;

  const completion = await executeCompletionWithFallback(
    {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.4,
      maxTokens: 120,
    },
    fallbackFn
  );

  return {
    text: completion.content,
    tone,
    language,
    modelUsed: completion.modelUsed,
    whatsappDeepLink: buildWhatsAppDeepLink(clientPhone, completion.content),
  };
}
