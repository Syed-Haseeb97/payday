// Deterministic fallbacks for AI features
// The UI must never break if an LLM times out, hits rate limits, or fails.

import { ReminderLanguage, ReminderTone } from '../db/types';

export interface ReminderContext {
  clientName: string;
  eventName: string;
  milestoneLabel: string;
  amountFormatted: string; // e.g. "₹40,000"
  dueDateFormatted: string; // e.g. "12 Dec"
  daysOverdue?: number;
  upiId?: string;
  upiLink?: string;
  payLink?: string;
}

/**
 * Deterministic template generator for WhatsApp reminder messages.
 * Formatted with prefilled text suitable for wa.me links.
 */
export function getTemplateReminder(
  tone: ReminderTone,
  language: ReminderLanguage,
  ctx: ReminderContext
): string {
  const upiText = ctx.upiId ? ` You can pay via UPI: ${ctx.upiId}` : '';

  if (language === 'hinglish') {
    switch (tone) {
      case 'friendly':
        return `Hi ${ctx.clientName}! Hope you're doing well. Just a quick reminder about the ${ctx.milestoneLabel} payment of ${ctx.amountFormatted} for the ${ctx.eventName} shoot, due on ${ctx.dueDateFormatted}.${upiText} Thank you! – Arjun`;
      case 'firm':
        return `Hello ${ctx.clientName}, payment of ${ctx.amountFormatted} for ${ctx.milestoneLabel} (${ctx.eventName}) is currently ${ctx.daysOverdue ? `${ctx.daysOverdue} days overdue` : 'pending'}. Please clear this today so we can keep the post-production work on schedule.${upiText} Thanks, Arjun`;
      case 'final':
        return `Hi ${ctx.clientName}, this is a final follow-up regarding the pending ${ctx.amountFormatted} for ${ctx.eventName}. As per our agreement, delivery of final files is on hold until payment is completed.${upiText} Please confirm once paid. – Arjun`;
    }
  }

  // English fallback
  switch (tone) {
    case 'friendly':
      return `Hi ${ctx.clientName}! Hope you're having a great day. Just following up regarding the ${ctx.milestoneLabel} invoice of ${ctx.amountFormatted} for ${ctx.eventName}, due on ${ctx.dueDateFormatted}.${upiText} Thanks! – Arjun`;
    case 'firm':
      return `Dear ${ctx.clientName}, this is a reminder that the ${ctx.milestoneLabel} payment of ${ctx.amountFormatted} for ${ctx.eventName} was due on ${ctx.dueDateFormatted}${ctx.daysOverdue ? ` (${ctx.daysOverdue} days ago)` : ''}. Please process this payment at your earliest convenience.${upiText} Regards, Arjun`;
    case 'final':
      return `Dear ${ctx.clientName}, urgent notice regarding overdue balance of ${ctx.amountFormatted} for ${ctx.eventName}. Milestone delivery and editing cannot proceed without payment clearance.${upiText} Please transfer today. – Arjun`;
  }
}
