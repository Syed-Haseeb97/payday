import { z } from '@/lib/zod';
import { PaymentMethod } from '../db/types';

export const quickAddPaymentMethodSchema = z.enum([
  'upi',
  'cash',
  'bank_transfer',
  'other',
]);
export type QuickAddPaymentMethod = z.infer<typeof quickAddPaymentMethodSchema>;

export const parsedBookingSchema = z.object({
  clientName: z.string().trim().nullable().default(null),
  eventName: z.string().trim().nullable().optional().default(null),
  eventDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .nullable()
    .default(null),
  totalAmount: z
    .number()
    .int('Total amount must be whole rupees')
    .positive('Total amount must be greater than zero')
    .nullable()
    .default(null),
  advanceAmount: z
    .number()
    .int('Advance amount must be whole rupees')
    .nonnegative()
    .nullable()
    .optional()
    .default(null),
  advancePaid: z.boolean().default(false),
  advancePaidAmount: z
    .number()
    .int('Advance paid amount must be whole rupees')
    .nonnegative()
    .nullable()
    .optional()
    .default(null),
  paymentMethod: quickAddPaymentMethodSchema.nullable().optional().default(null),
  splitPercents: z
    .tuple([z.number(), z.number(), z.number()])
    .nullable()
    .optional()
    .default(null),
  notes: z.string().trim().max(200, 'Notes max 200 characters').nullable().optional().default(null),
});

export type ParsedBooking = z.infer<typeof parsedBookingSchema>;

export interface QuickAddParseResult {
  parsed: ParsedBooking;
  confidence: number; // 0 to 1
  warnings: string[];
  sources: Record<string, string>; // mapping from field to matched substring
  source: 'ai' | 'rules';
}

export interface ExtractedField<T> {
  value: T;
  matchedPhrase: string;
  confidence: number;
}

export interface MatchedClient {
  id: string;
  name: string;
  phone?: string | null;
  similarity: number;
  paymentReliability: string;
}

export interface BuiltMilestone {
  label: 'advance' | 'mid' | 'final';
  milestoneLabel: string;
  amount: number;
  dueDate: string;
}

export interface BuiltBookingProposal {
  clientName: string;
  matchedClients: MatchedClient[];
  title: string;
  eventDate: string;
  totalAmount: number;
  milestones: BuiltMilestone[];
  advancePaid: boolean;
  advancePaidAmount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  confidence: number;
  warnings: string[];
  sources: Record<string, string>;
  source: 'ai' | 'rules';
}
