import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeQuickAddConfirm, QuickAddConfirmInput } from './confirm';
import { InMemoryRepository } from '../db/repository';

describe('Quick Add Confirm - Transactional All-or-Nothing Rollback', () => {
  let repo: InMemoryRepository;

  beforeEach(async () => {
    repo = new InMemoryRepository();
    await repo.resetDemoData();
  });

  const baseInput: QuickAddConfirmInput = {
    clientMode: 'new',
    newClient: {
      name: 'Ananya Roy',
      phone: '+91 90000 00099',
    },
    title: 'Roy Destination Wedding',
    eventDate: '2026-12-20',
    totalAmount: 100000,
    milestones: [
      { label: 'advance', amount: 30000, dueDate: '2026-11-25' },
      { label: 'mid', amount: 50000, dueDate: '2026-12-20' },
      { label: 'final', amount: 20000, dueDate: '2027-01-10' },
    ],
    advancePaid: true,
    advancePaidAmount: 30000,
    paymentMethod: 'UPI',
  };

  it('rolls back client creation if createBooking fails', async () => {
    const clientsBefore = await repo.getClients();

    // Inject failure into createBooking
    vi.spyOn(repo, 'createBooking').mockRejectedValueOnce(
      new Error('Simulated database disk failure during createBooking')
    );

    await expect(executeQuickAddConfirm(baseInput, repo)).rejects.toThrow(
      'Simulated database disk failure during createBooking'
    );

    const clientsAfter = await repo.getClients();
    expect(clientsAfter.length).toBe(clientsBefore.length);
    expect(clientsAfter.find((c) => c.name === 'Ananya Roy')).toBeUndefined();
  });

  it('rolls back booking and client creation if recording payment fails', async () => {
    const clientsBefore = await repo.getClients();
    const bookingsBefore = await repo.getBookings();
    const invoicesBefore = await repo.getInvoices();

    // Inject failure into recordPayment
    vi.spyOn(repo, 'recordPayment').mockRejectedValueOnce(
      new Error('Simulated gateway timeout during recordPayment')
    );

    await expect(executeQuickAddConfirm(baseInput, repo)).rejects.toThrow(
      'Simulated gateway timeout during recordPayment'
    );

    const clientsAfter = await repo.getClients();
    const bookingsAfter = await repo.getBookings();
    const invoicesAfter = await repo.getInvoices();

    // Verify compensation deleted everything
    expect(clientsAfter.length).toBe(clientsBefore.length);
    expect(clientsAfter.find((c) => c.name === 'Ananya Roy')).toBeUndefined();
    expect(bookingsAfter.length).toBe(bookingsBefore.length);
    expect(bookingsAfter.find((b) => b.title === 'Roy Destination Wedding')).toBeUndefined();
    expect(invoicesAfter.length).toBe(invoicesBefore.length);
  });

  it('rejects duplicate booking confirmed within 2 minutes with friendly message', async () => {
    // 1. First confirmation succeeds
    const result = await executeQuickAddConfirm(baseInput, repo);
    expect(result.success).toBe(true);

    // 2. Immediate duplicate confirmation attempt
    await expect(
      executeQuickAddConfirm(
        {
          ...baseInput,
          clientMode: 'existing',
          clientId: result.client.id,
          newClient: undefined,
        },
        repo
      )
    ).rejects.toThrow(
      /was already confirmed a moment ago\. Please wait 2 minutes before creating a duplicate\./
    );
  });

  it('deleteClient rejects deletion when client has active bookings', async () => {
    const clients = await repo.getClients();
    const clientWithBookings = clients[0];

    await expect(repo.deleteClient(clientWithBookings.id)).rejects.toThrow(
      /Cannot delete client with existing bookings/
    );
  });

  it('deleteBooking deletes the booking, all its invoices, and payments', async () => {
    const result = await executeQuickAddConfirm(baseInput, repo);
    expect(result.success).toBe(true);

    // Assert it was created
    const booking = await repo.getBookingById(result.booking.id);
    expect(booking).not.toBeNull();

    const bookingInvoices = await repo.getInvoices({ clientId: result.client.id });
    expect(bookingInvoices.length).toBe(3);

    // Delete booking
    await repo.deleteBooking(result.booking.id);

    // Assert booking, invoices, payments are completely removed
    const bookingAfter = await repo.getBookingById(result.booking.id);
    expect(bookingAfter).toBeNull();

    const invoicesAfter = await repo.getInvoices({ clientId: result.client.id });
    expect(invoicesAfter.length).toBe(0);

    const paymentsAfter = await repo.getPayments({ invoiceId: result.invoices[0].id });
    expect(paymentsAfter.length).toBe(0);

    // Client without bookings can now be deleted safely
    await repo.deleteClient(result.client.id);
    const clientAfter = await repo.getClientById(result.client.id);
    expect(clientAfter).toBeNull();
  });
});
