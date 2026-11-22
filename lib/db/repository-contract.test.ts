import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InMemoryRepository, PaydayRepository, SupabaseRepository } from './repository';
import { getIndiaTodayStr } from '../date';

/**
 * Validates Supabase test environment credentials.
 * Refuses to run against production SUPABASE_URL if SUPABASE_TEST_URL equals SUPABASE_URL.
 */
export function validateSupabaseTestConfig(
  testUrl?: string,
  testKey?: string,
  prodUrl?: string
): { enabled: boolean; url?: string; key?: string } {
  if (!testUrl || !testKey || testUrl.trim() === '' || testUrl.includes('your-project')) {
    return { enabled: false };
  }
  if (prodUrl && prodUrl.trim() !== '' && testUrl.trim().toLowerCase() === prodUrl.trim().toLowerCase()) {
    throw new Error('SUPABASE_TEST_URL must not match production SUPABASE_URL. Refusing to run tests against production database.');
  }
  return { enabled: true, url: testUrl.trim(), key: testKey.trim() };
}

/**
 * Shared Contract Test Suite for any PaydayRepository implementation.
 * Guarantees behavioral parity between InMemoryRepository and SupabaseRepository.
 * Only touches rows carrying a unique test prefix and cleans up in reverse foreign key order.
 * Never calls resetDemoData.
 */
export function createContractTestSuite(
  suiteName: string,
  createRepo: () => Promise<PaydayRepository>,
  cleanup?: (repo: PaydayRepository) => Promise<void>
) {
  describe(`Repository Contract Suite: ${suiteName}`, () => {
    let repo: PaydayRepository;
    const testPrefix = `CONTRACT_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_`;
    const createdClientIds: string[] = [];
    const createdBookingIds: string[] = [];

    beforeEach(async () => {
      repo = await createRepo();
    });

    afterEach(async () => {
      // Clean up test rows in reverse order
      for (const bId of createdBookingIds) {
        try {
          await repo.deleteBooking(bId);
        } catch {}
      }
      for (const cId of createdClientIds) {
        try {
          await repo.deleteClient(cId);
        } catch {}
      }
      if (cleanup) {
        await cleanup(repo);
      }
    });

    it('implements Client CRUD operations', async () => {
      const clientName = `${testPrefix}Client_1`;
      const created = await repo.createClient({
        name: clientName,
        phone: '+91 90000 00099',
        email: 'contract.test@example.com',
        payment_reliability: 'new',
        average_delay_days: 0,
        notes: 'Contract test note',
      });
      createdClientIds.push(created.id);

      expect(created.id).toBeDefined();
      expect(created.name).toBe(clientName);

      const fetched = await repo.getClientById(created.id);
      expect(fetched).not.toBeNull();
      expect(fetched?.name).toBe(clientName);

      const all = await repo.getClients();
      expect(all.some((c) => c.id === created.id)).toBe(true);

      const updated = await repo.updateClient(created.id, {
        notes: 'Updated contract test note',
      });
      expect(updated.notes).toBe('Updated contract test note');

      // deleteClient succeeds when client has no bookings
      await repo.deleteClient(created.id);
      const afterDelete = await repo.getClientById(created.id);
      expect(afterDelete).toBeNull();
    });

    it('implements Booking creation with milestone invoices and deletion', async () => {
      const client = await repo.createClient({
        name: `${testPrefix}Client_2`,
        phone: '+91 90000 00098',
        payment_reliability: 'new',
        average_delay_days: 0,
      });
      createdClientIds.push(client.id);

      const bookingTitle = `${testPrefix}Grand Wedding`;
      const { booking, invoices } = await repo.createBooking({
        clientId: client.id,
        title: bookingTitle,
        eventDate: '2026-12-25',
        totalAmount: 120000,
        customMilestones: [
          { label: 'advance', amount: 36000, due: '2026-11-25' },
          { label: 'mid', amount: 60000, due: '2026-12-25' },
          { label: 'final', amount: 24000, due: '2027-01-10' },
        ],
      });
      createdBookingIds.push(booking.id);

      expect(booking.id).toBeDefined();
      expect(invoices.length).toBe(3);

      const fetchedBooking = await repo.getBookingById(booking.id);
      expect(fetchedBooking).not.toBeNull();
      expect(fetchedBooking?.title).toBe(bookingTitle);

      const clientInvoices = await repo.getInvoices({ clientId: client.id });
      expect(clientInvoices.length).toBe(3);

      // deleteClient fails while booking exists
      await expect(repo.deleteClient(client.id)).rejects.toThrow(/Cannot delete client with existing bookings/);

      // deleteBooking removes booking and its milestone invoices
      await repo.deleteBooking(booking.id);
      const afterBookingDelete = await repo.getBookingById(booking.id);
      expect(afterBookingDelete).toBeNull();

      const afterInvoicesDelete = await repo.getInvoices({ clientId: client.id });
      expect(afterInvoicesDelete.length).toBe(0);

      // Now client deletion succeeds
      await repo.deleteClient(client.id);
    });

    it('implements payment recording, rejects overpayment and future dates, and updates metrics', async () => {
      const client = await repo.createClient({
        name: `${testPrefix}Client_3`,
        phone: '+91 90000 00097',
        payment_reliability: 'slow',
        average_delay_days: 12,
      });
      createdClientIds.push(client.id);

      const { booking, invoices } = await repo.createBooking({
        clientId: client.id,
        title: `${testPrefix}Payment Test Event`,
        eventDate: '2026-12-10',
        totalAmount: 50000,
        customMilestones: [
          { label: 'advance', amount: 15000, due: '2026-11-10' },
          { label: 'mid', amount: 25000, due: '2026-12-10' },
          { label: 'final', amount: 10000, due: '2026-12-31' },
        ],
      });
      createdBookingIds.push(booking.id);

      const advInv = invoices.find((i) => i.milestone_label === 'advance')!;

      // 1. Reject future payment date
      await expect(
        repo.recordPayment({
          invoiceId: advInv.id,
          amount: 5000,
          paymentDate: '2099-01-01',
        })
      ).rejects.toThrow(/Payment date cannot be in the future/);

      // 2. Reject overpayment
      await expect(
        repo.recordPayment({
          invoiceId: advInv.id,
          amount: 25000, // exceeds 15,000
          paymentDate: getIndiaTodayStr(),
        })
      ).rejects.toThrow(/cannot exceed remaining balance/);

      // 3. Partial payment: does not update average
      const partialRes = await repo.recordPayment({
        invoiceId: advInv.id,
        amount: 5000,
        paymentDate: getIndiaTodayStr(),
      });
      expect(partialRes.clientLearning).toBeNull();
      expect(partialRes.invoice.paid_amount).toBe(5000);

      // 4. Full remaining payment: updates client delay metrics
      const fullRes = await repo.recordPayment({
        invoiceId: advInv.id,
        amount: 10000,
        paymentDate: getIndiaTodayStr(),
      });
      expect(fullRes.clientLearning).not.toBeNull();
      expect(fullRes.clientLearning?.clientId).toBe(client.id);
      expect(fullRes.invoice.paid_amount).toBe(15000);

      const clientUpdated = await repo.getClientById(client.id);
      expect(clientUpdated?.average_delay_days).toBe(fullRes.clientLearning?.newAverage);
    });

    it('implements dashboard data and forecast inputs queries', async () => {
      const dashboard = await repo.getDashboardData();
      expect(dashboard.totalOutstanding).toBeGreaterThanOrEqual(0);
      expect(dashboard.totalOverdue).toBeGreaterThanOrEqual(0);
      expect(dashboard.agingBuckets).toBeDefined();
      expect(Array.isArray(dashboard.whoOwesRows)).toBe(true);

      const forecastInputs = await repo.getForecastInputs();
      expect(forecastInputs.today).toBeDefined();
      expect(forecastInputs.openingCash).toBeGreaterThan(0);
      expect(Array.isArray(forecastInputs.invoices)).toBe(true);
      expect(Array.isArray(forecastInputs.clients)).toBe(true);
      expect(Array.isArray(forecastInputs.recurringExpenses)).toBe(true);
    });

    it('implements reminders recording and lookup on newly created test invoice', async () => {
      const client = await repo.createClient({
        name: `${testPrefix}Client_Reminder`,
        phone: '+91 90000 00096',
        payment_reliability: 'average',
        average_delay_days: 5,
      });
      createdClientIds.push(client.id);

      const { booking, invoices } = await repo.createBooking({
        clientId: client.id,
        title: `${testPrefix}Reminder Test Event`,
        eventDate: '2026-12-15',
        totalAmount: 40000,
        customMilestones: [
          { label: 'advance', amount: 20000, due: '2026-11-15' },
          { label: 'final', amount: 20000, due: '2026-12-15' },
        ],
      });
      createdBookingIds.push(booking.id);

      const inv = invoices[0];

      const reminder = await repo.recordReminder({
        invoiceId: inv.id,
        tone: 'friendly',
        language: 'en',
        text: 'Hello test reminder',
        channel: 'whatsapp',
      });

      expect(reminder.id).toBeDefined();
      expect(reminder.invoice_id).toBe(inv.id);

      const history = await repo.getReminders(inv.id);
      expect(history.some((r) => r.id === reminder.id)).toBe(true);

      const lastSent = await repo.getLastReminderSent(inv.id);
      expect(lastSent?.id).toBe(reminder.id);
    });

    it('implements alert dismiss and snooze operations safely', async () => {
      const alerts = await repo.getAlerts();
      if (alerts.length > 0) {
        const targetAlert = alerts[0];
        await repo.snoozeAlert(targetAlert.id, 24);
        await repo.dismissAlert(targetAlert.id);
      }
    });
  });
}

// Validation tests proving safety refusals
describe('Supabase Test Safety Validation', () => {
  it('refuses to run if SUPABASE_TEST_URL equals production SUPABASE_URL', () => {
    expect(() => {
      validateSupabaseTestConfig(
        'https://my-project.supabase.co',
        'service-role-key-123',
        'https://my-project.supabase.co'
      );
    }).toThrow(/SUPABASE_TEST_URL must not match production SUPABASE_URL/i);
  });

  it('skips cleanly when SUPABASE_TEST_URL or key is absent or placeholder', () => {
    expect(validateSupabaseTestConfig('', '', 'https://prod.supabase.co').enabled).toBe(false);
    expect(validateSupabaseTestConfig(undefined, undefined, 'https://prod.supabase.co').enabled).toBe(false);
    expect(validateSupabaseTestConfig('https://your-project.supabase.co', 'placeholder', 'https://prod.supabase.co').enabled).toBe(false);
  });

  it('enables tests when separate test credentials are provided', () => {
    const res = validateSupabaseTestConfig(
      'https://test-project.supabase.co',
      'test-key',
      'https://prod-project.supabase.co'
    );
    expect(res.enabled).toBe(true);
    expect(res.url).toBe('https://test-project.supabase.co');
  });
});

// 1. Run contract tests against InMemoryRepository (Always active)
createContractTestSuite('InMemoryRepository', async () => {
  const repo = new InMemoryRepository();
  await repo.resetDemoData();
  return repo;
});

describe('InMemoryRepository Demo Reset', () => {
  it('restores baseline records on demand for InMemory', async () => {
    const repo = new InMemoryRepository();
    await repo.resetDemoData();
    const clients = await repo.getClients();
    expect(clients.length).toBeGreaterThanOrEqual(8);

    const bookings = await repo.getBookings();
    expect(bookings.length).toBeGreaterThanOrEqual(20);
  });
});

// 2. Run contract tests against SupabaseRepository ONLY when test credentials are provided
const testConfig = validateSupabaseTestConfig(
  process.env.SUPABASE_TEST_URL,
  process.env.SUPABASE_TEST_SERVICE_ROLE_KEY,
  process.env.SUPABASE_URL
);

if (testConfig.enabled) {
  createContractTestSuite('SupabaseRepository', async () => {
    return new SupabaseRepository(
      testConfig.url!,
      testConfig.key!
    );
  });
} else {
  describe('SupabaseRepository Contract Suite', () => {
    it.skip('Skipped: SUPABASE_TEST_URL and SUPABASE_TEST_SERVICE_ROLE_KEY environment variables are not set', () => {});
  });
}
