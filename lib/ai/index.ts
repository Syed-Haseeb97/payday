// Payday Server-Side AI Layer
// All LLM interactions flow through this isolated module.
// Strictly obeys fallback to deterministic templates so UI never breaks.

import { PaymentReliability, ReminderLanguage, ReminderTone } from '../db/types';
import { executeCompletionWithFallback } from './client';
import { getTemplateReminder, ReminderContext } from './fallbacks';
import { getLLMConfig, isLLMConfigured } from './config';

export * from './config';
export * from './fallbacks';
export * from './client';

export const BANNED_WORDS = [
  'lawyer',
  'legal action',
  'police',
  'court',
  'penalty',
  'defaulter',
  'fraud',
  'cheat',
  'blacklist',
] as const;

export interface StructuredReminderInput {
  clientName: string;
  eventName: string;
  milestoneLabel: string;
  amountFormatted: string; // e.g. "₹35,000"
  dueDateFormatted: string; // e.g. "9 Nov 2026"
  daysOverdue: number;
  businessName: string;
  upiId?: string;
  upiLink?: string;
}

export interface ReminderDraftResult {
  text: string;
  source: 'ai' | 'template';
  model?: string;
  whatsappDeepLink: string;
}

/**
 * Suggests default reminder tone based on days overdue and client reliability.
 * - Not yet due or 1-3 days overdue -> friendly
 * - 4-10 days overdue -> firm
 * - 11+ days overdue or unreliable client -> final
 */
export function suggestDefaultTone(
  daysOverdue: number,
  reliability: PaymentReliability
): ReminderTone {
  if (daysOverdue >= 11 || reliability === 'unreliable') {
    return 'final';
  }
  if (daysOverdue >= 4) {
    return 'firm';
  }
  return 'friendly';
}

/**
 * Sanitizes client-provided data before passing to AI prompts.
 * Strips control characters, normalizes whitespace, and caps length.
 */
export function sanitizeClientData(str: string, maxLength: number): string {
  if (!str) return '';
  return str
    .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/**
 * Validates model output before returning to UI.
 * Must be non-empty, under 600 characters, contain exact formatted amount,
 * and contain none of the banned words.
 */
export function validateModelOutput(
  text: string,
  amountFormatted: string
): boolean {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed.length === 0 || trimmed.length > 600) return false;

  const lower = trimmed.toLowerCase();

  // 1. Check for banned words
  for (const banned of BANNED_WORDS) {
    if (lower.includes(banned.toLowerCase())) {
      return false;
    }
  }

  // 2. Check for exact formatted amount or rupee variations
  // Accepts "₹35,000", "Rs 35,000", "Rs. 35,000", or "35,000"
  const cleanAmount = amountFormatted.replace(/[^\d,.]/g, '').trim();
  const hasExactAmount =
    trimmed.includes(amountFormatted) ||
    trimmed.includes(`Rs ${cleanAmount}`) ||
    trimmed.includes(`Rs. ${cleanAmount}`) ||
    trimmed.includes(`Rs.${cleanAmount}`) ||
    trimmed.includes(cleanAmount);

  if (!hasExactAmount) {
    return false;
  }

  return true;
}

/**
 * Builds a WhatsApp wa.me deep link with prefilled URL-encoded message text.
 * Strips phone to digits only (using fake phone number digits only).
 */
export function buildWhatsAppDeepLink(
  phone: string | null | undefined,
  text: string
): string {
  // Strip non-digits
  const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
  const encodedText = encodeURIComponent(text);
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}

/**
 * Generates an AI-powered WhatsApp reminder draft with strict guardrails and
 * deterministic template fallback.
 */
export async function generateReminderDraft(
  tone: ReminderTone,
  language: ReminderLanguage,
  input: StructuredReminderInput,
  clientPhone?: string | null
): Promise<ReminderDraftResult> {
  // Sanitize structured data
  const safeClientFirstName = sanitizeClientData(
    input.clientName.split(' ')[0] || 'Client',
    30
  );
  const safeBusinessName = sanitizeClientData(
    input.businessName || 'Arjun Visuals',
    50
  );
  const safeEventName = sanitizeClientData(input.eventName, 50);
  const safeMilestone = sanitizeClientData(input.milestoneLabel, 30);
  const safeAmount = sanitizeClientData(input.amountFormatted, 20);
  const safeDueDate = sanitizeClientData(input.dueDateFormatted, 25);
  const safeUpiId = sanitizeClientData(input.upiId || 'arjunvisuals@okaxis', 35);

  const fallbackContext: ReminderContext = {
    clientName: safeClientFirstName,
    eventName: safeEventName,
    milestoneLabel: safeMilestone,
    amountFormatted: safeAmount,
    dueDateFormatted: safeDueDate,
    daysOverdue: input.daysOverdue,
    upiId: safeUpiId,
    upiLink: input.upiLink,
  };

  const templateText = getTemplateReminder(tone, language, fallbackContext);

  // If LLM is not configured, return deterministic template immediately
  if (!isLLMConfigured()) {
    return {
      text: templateText,
      source: 'template',
      model: 'deterministic-template',
      whatsappDeepLink: buildWhatsAppDeepLink(clientPhone, templateText),
    };
  }

  // Construct server-side system and user prompt with structured data only
  const systemPrompt = `You are an AI assistant for ${safeBusinessName}, a freelance wedding photography studio in India.
Your job is to write a single WhatsApp payment reminder message.

Rules:
- Polite, specific, concise, and under 70 words. WhatsApp chat style.
- ALWAYS include the exact amount: ${safeAmount}.
- ALWAYS mention the due date: ${safeDueDate}.
- Include UPI ID for payment: ${safeUpiId}.
- Tone: ${tone}. (${
    tone === 'final'
      ? 'Clear, firm and urgent regarding the milestone, but courteous and respectful.'
      : tone === 'firm'
      ? 'Direct follow-up requesting settlement.'
      : 'Friendly, warm check-in.'
  })
- Language: ${language}. (${
    language === 'hinglish'
      ? 'Natural conversational Hindi in the English/Roman script mixed with English. Respectful, professional.'
      : 'Clear, polite English.'
  })
- NEVER threaten, shame, or mention legal action, courts, lawyers, police, penalties, fraud, or blacklisting.
- Return ONLY the final message body. No subject line, no quotes, no conversational filler.`;

  const userPrompt = `Client: ${safeClientFirstName}
Milestone: ${safeMilestone} (${safeEventName})
Amount: ${safeAmount}
Due Date: ${safeDueDate}
Days Overdue: ${input.daysOverdue}
UPI ID: ${safeUpiId}`;

  try {
    const completion = await executeCompletionWithFallback(
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        maxTokens: 180,
      },
      () => templateText
    );

    // Validate the model output before returning to UI
    const isValid = validateModelOutput(completion.content, safeAmount);

    if (!isValid || completion.modelUsed === 'deterministic-template') {
      return {
        text: templateText,
        source: 'template',
        model: 'deterministic-template',
        whatsappDeepLink: buildWhatsAppDeepLink(clientPhone, templateText),
      };
    }

    return {
      text: completion.content,
      source: 'ai',
      model: completion.modelUsed,
      whatsappDeepLink: buildWhatsAppDeepLink(clientPhone, completion.content),
    };
  } catch {
    // Zero-throw policy for the UI
    return {
      text: templateText,
      source: 'template',
      model: 'deterministic-template',
      whatsappDeepLink: buildWhatsAppDeepLink(clientPhone, templateText),
    };
  }
}
