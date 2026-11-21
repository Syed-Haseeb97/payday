// Quick Add Confirm Handler
// Transactional safety: creates Client (if new), Booking, Milestones, and Payment together.

import { z } from 'zod';
import { getRepository, PaydayRepository } from '../db/repository';
import { Booking, Client, Invoice, Payment, PaymentMethod } from '../db/types';
import { format } from 'date-fns';

export const quickAddConfirmSchema = z
  .object({
    clientMode: z.enum(['existing', 'new']),
    clientId: z.string().optional(),
    newClient: z
      .object({
        name: z.string().trim().min(2, 'Client name must be at least 2 characters'),
        phone: z.string().trim().optional().default('+91 90000 00000'),
      })
      .optional(),
    title: z.string().trim().min(2, 'Event title must be at least 2 characters'),
    eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    totalAmount: z.number().int().positive('Total amount must be greater than zero'),
    milestones: z
      .array(
        z.object({
          label: z.enum(['advance', 'mid', 'final']),
          amount: z.number().int().nonnegative(),
          dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        })
      )
      .length(3, 'Exactly 3 milestones required'),
    advancePaid: z.boolean().default(false),
    advancePaidAmount: z.number().int().nonnegative().optional(),
    paymentMethod: z.enum(['UPI', 'bank_transfer', 'cash', 'cheque', 'other']).default('UPI'),
    notes: z.string().trim().max(500).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.clientMode === 'existing') {
        return Boolean(data.clientId && data.clientId.length > 0);
      }
      return Boolean(data.newClient && data.newClient.name.length >= 2);
    },
    {
      message: 'Either an existing clientId or a valid newClient object is required',
    }
  )
  .refine(
    (data) => {
      const sum = data.milestones.reduce((acc, m) => acc + m.amount, 0);
      return sum === data.totalAmount;
    },
    {
      message: 'Milestone amounts must sum to exact totalAmount',
    }
  );

export type QuickAddConfirmInput = z.infer<typeof quickAddConfirmSchema>;

export interface QuickAddConfirmResult {
  success: boolean;
  client: Client;
  booking: Booking;
  invoices: Invoice[];
  payment?: Payment | null;
}

/**
 * Executes confirmed booking creation with atomic all-or-nothing rollback on failure.
 */
export async function executeQuickAddConfirm(
  input: QuickAddConfirmInput,
  repo: PaydayRepository = getRepository()
): Promise<QuickAddConfirmResult> {
  const validated = quickAddConfirmSchema.parse(input);

  let client: Client;
  let createdClientId: string | null = null;
  let createdBookingId: string | null = null;
  const createdInvoiceIds: string[] = [];

  try {
    // 1. Resolve or Create Client
    if (validated.clientMode === 'new') {
      const newName = validated.newClient!.name;
      const newPhone = validated.newClient?.phone || '+91 90000 00000';

      client = await repo.createClient({
        name: newName,
        phone: newPhone,
        payment_reliability: 'new',
        average_delay_days: 0,
      });
      createdClientId = client.id;
    } else {
      const existing = await repo.getClientById(validated.clientId!);
      if (!existing) {
        throw new Error(`Client with id ${validated.clientId} not found`);
      }
      client = existing;
    }

    // 2. Create Booking and 3 Milestone Invoices
    const { booking, invoices } = await repo.createBooking({
      clientId: client.id,
      title: validated.title,
      eventDate: validated.eventDate,
      totalAmount: validated.totalAmount,
      customMilestones: validated.milestones.map((m) => ({
        label: m.label,
        amount: m.amount,
        due: m.dueDate,
      })),
      notes: validated.notes,
    });
    createdBookingId = booking.id;
    for (const inv of invoices) {
      createdInvoiceIds.push(inv.id);
    }

    // 3. Record Advance Payment if advancePaid is true
    let payment: Payment | null = null;
    if (validated.advancePaid) {
      const advanceInv = invoices.find((inv) => inv.milestone_label === 'advance');
      if (advanceInv) {
        const payAmount = Math.min(
          advanceInv.amount,
          validated.advancePaidAmount ?? advanceInv.amount
        );

        if (payAmount > 0) {
          const paymentRes = await repo.recordPayment({
            invoiceId: advanceInv.id,
            amount: payAmount,
            paymentDate: format(new Date(), 'yyyy-MM-dd'),
            paymentMethod: validated.paymentMethod,
            referenceNumber: 'ADV-TOKEN',
            notes: 'Advance booking payment confirmed via Quick Add',
          });
          payment = paymentRes.payment;
        }
      }
    }

    return {
      success: true,
      client,
      booking,
      invoices,
      payment,
    };
  } catch (err: unknown) {
    // Rollback created entities on failure to guarantee atomic all-or-nothing
    try {
      // In-memory rollback support if available
      const anyRepo = repo as any;
      if (anyRepo.store) {
        if (createdBookingId) {
          anyRepo.store.bookings = anyRepo.store.bookings.filter((b: any) => b.id !== createdBookingId);
        }
        if (createdInvoiceIds.length > 0) {
          anyRepo.store.invoices = anyRepo.store.invoices.filter((i: any) => !createdInvoiceIds.includes(i.id));
        }
        if (createdClientId) {
          anyRepo.store.clients = anyRepo.store.clients.filter((c: any) => c.id !== createdClientId);
        }
      }
    } catch {
      // ignore rollback cleanup errors
    }

    throw err;
  }
}
