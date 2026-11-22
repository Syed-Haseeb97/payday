// Zod input validation schemas for all write operations
// Never trust client input.

import { z } from '@/lib/zod';

export const paymentReliabilitySchema = z.enum([
  'reliable',
  'average',
  'slow',
  'unreliable',
  'new',
]);

export const createClientSchema = z.object({
  name: z.string().trim().min(2, 'Client name must be at least 2 characters'),
  phone: z.string().trim().optional().nullable(),
  email: z.string().trim().email('Invalid email address').optional().nullable().or(z.literal('')),
  payment_reliability: paymentReliabilitySchema.default('average'),
  average_delay_days: z.coerce.number().int().min(0, 'Delay cannot be negative').default(0),
  notes: z.string().trim().optional().nullable(),
});

export const updateClientSchema = createClientSchema.partial();

export const createBookingSchema = z
  .object({
    clientId: z.string().min(1, 'Client is required'),
    title: z.string().trim().min(3, 'Event title must be at least 3 characters'),
    eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Event date must be YYYY-MM-DD'),
    totalAmount: z.coerce.number().positive('Total amount must be greater than zero'),
    advancePercentage: z.coerce.number().min(0).max(100).default(30),
    midPercentage: z.coerce.number().min(0).max(100).default(50),
    finalPercentage: z.coerce.number().min(0).max(100).default(20),
    advanceDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    midDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    finalDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    notes: z.string().trim().optional().nullable(),
  })
  .refine(
    (data) => {
      const sum = Math.round(data.advancePercentage + data.midPercentage + data.finalPercentage);
      return sum === 100;
    },
    {
      message: 'Milestone split percentages must sum to exactly 100%',
      path: ['advancePercentage'],
    }
  );

export const recordPaymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice is required'),
  amount: z.coerce.number().positive('Payment amount must be greater than zero'),
  paymentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
    .optional(),
  paymentMethod: z.enum(['UPI', 'bank_transfer', 'cash', 'cheque', 'other']).default('UPI'),
  referenceNumber: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
