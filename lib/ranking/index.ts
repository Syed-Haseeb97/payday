// Bad Day Mode - Ranking Engine (Deterministic Code Placeholder)
// Ranks today's top actions by cash impact, combining amount, days overdue, and payment reliability.

export interface BadDayRankedAction {
  id: string;
  rank: number;
  invoiceId: string;
  clientName: string;
  amount: number;
  daysOverdue: number;
  clientReliability: 'high' | 'medium' | 'low';
  oneLineReason: string;
  actionLabel: string;
  actionUrl: string;
  whatsappDeepLink?: string;
}

export function rankBadDayActionsPlaceholder(): BadDayRankedAction[] {
  // Stub structure ready for deterministic calculation in next step
  return [];
}
