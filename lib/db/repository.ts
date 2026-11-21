// Repository layer for Payday
// Supports both Supabase Postgres and in-memory store (for demo mode)
// All business logic resides here, isolated from UI components.

import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import { format, addDays, subDays, parseISO, isSameMonth } from 'date-fns';
import {
  Client,
  Booking,
  Invoice,
  Payment,
  RecurringExpense,
  Reminder,
  ReminderTone,
  ReminderLanguage,
  Settings,
  DEMO_USER_ID,
  PaymentMethod,
} from './types';
import { generateSeedData, SeedDataBundle } from './seed-data';
import { splitMilestones } from '../milestones';
import { deriveInvoiceStatus } from '../invoice-status';
import { daysOverdue, buildAgingSummary, AgingInvoice } from '../aging';
import { buildWhoOwesMe, WhoOwesRow, ClientRef } from '../receivables';
import { BadDaySummary, rankBadDayActions } from '../ranking';
import { GeneratedAlert, deriveAlerts } from '../alerts';

export interface DashboardViewData {
  totalOutstanding: number;
  totalOverdue: number;
  thisMonthReceived: number;
  agingBuckets: ReturnType<typeof buildAgingSummary>;
  whoOwesRows: WhoOwesRow[];
}

export interface ForecastInputs {
  today: string;
  openingCash: number;
  invoices: Invoice[];
  clients: Client[];
  recurringExpenses: RecurringExpense[];
  bookings: Booking[];
}

export interface PaydayRepository {
  isDemoMode(): boolean;
  getClients(): Promise<Client[]>;
  getClientById(id: string): Promise<Client | null>;
  createClient(data: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Client>;
  updateClient(id: string, data: Partial<Client>): Promise<Client>;

  getBookings(): Promise<Booking[]>;
  getBookingById(id: string): Promise<Booking | null>;
  createBooking(data: {
    clientId: string;
    title: string;
    eventDate: string;
    totalAmount: number;
    advancePercentage?: number;
    midPercentage?: number;
    finalPercentage?: number;
    advanceDueDate?: string;
    midDueDate?: string;
    finalDueDate?: string;
    notes?: string | null;
  }): Promise<{ booking: Booking; invoices: Invoice[] }>;

  getInvoices(filter?: { status?: string; clientId?: string }): Promise<Invoice[]>;
  getInvoiceById(id: string): Promise<Invoice | null>;

  getPayments(filter?: { invoiceId?: string }): Promise<Payment[]>;
  recordPayment(data: {
    invoiceId: string;
    amount: number;
    paymentDate?: string;
    paymentMethod?: PaymentMethod;
    referenceNumber?: string | null;
    notes?: string | null;
  }): Promise<{ payment: Payment; invoice: Invoice }>;

  getRecurringExpenses(): Promise<RecurringExpense[]>;
  getSettings(): Promise<Settings>;
  getDashboardData(todayStr?: string): Promise<DashboardViewData>;
  getForecastInputs(todayStr?: string): Promise<ForecastInputs>;

  // Bad Day & Alerts
  getBadDaySummary(todayStr?: string): Promise<BadDaySummary>;
  getAlerts(todayStr?: string): Promise<GeneratedAlert[]>;
  dismissAlert(alertId: string): Promise<void>;
  snoozeAlert(alertId: string, hours?: number): Promise<void>;

  // Reminders
  getReminders(invoiceId?: string): Promise<Reminder[]>;
  recordReminder(data: {
    invoiceId: string;
    tone: ReminderTone;
    language: ReminderLanguage;
    text: string;
    channel?: 'whatsapp' | 'sms' | 'email';
  }): Promise<Reminder>;
  getLastReminderSent(invoiceId: string): Promise<Reminder | null>;
}

// Global reference for in-memory persistence across hot module reloads in Next.js development
declare global {
  // eslint-disable-next-line no-var
  var __payday_in_memory_store: SeedDataBundle | undefined;
}

export class InMemoryRepository implements PaydayRepository {
  private store: SeedDataBundle;

  constructor() {
    if (!global.__payday_in_memory_store) {
      global.__payday_in_memory_store = generateSeedData();
    }
    this.store = global.__payday_in_memory_store;
  }

  isDemoMode(): boolean {
    return true;
  }

  private getTodayStr(): string {
    return format(new Date(), 'yyyy-MM-dd');
  }

  private enrichInvoice(inv: Invoice, todayStr?: string): Invoice {
    const today = todayStr || this.getTodayStr();
    const derivedStatus = deriveInvoiceStatus({
      amount: inv.amount,
      paidAmount: inv.paid_amount,
      dueDate: inv.due_date,
      sent: inv.sent,
      today,
    });
    const overdueDays = daysOverdue(inv.due_date, today);

    const client = this.store.clients.find((c) => c.id === inv.client_id);
    const booking = this.store.bookings.find((b) => b.id === inv.booking_id);
    const payments = this.store.payments.filter((p) => p.invoice_id === inv.id);

    return {
      ...inv,
      status: derivedStatus,
      days_overdue: overdueDays,
      client,
      booking,
      payments,
    };
  }

  async getClients(): Promise<Client[]> {
    return [...this.store.clients].sort((a, b) => a.name.localeCompare(b.name));
  }

  async getClientById(id: string): Promise<Client | null> {
    const client = this.store.clients.find((c) => c.id === id);
    return client ? { ...client } : null;
  }

  async createClient(data: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Client> {
    const newClient: Client = {
      id: `c1000000-0000-0000-0000-${String(this.store.clients.length + 1).padStart(12, '0')}`,
      user_id: DEMO_USER_ID,
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      payment_reliability: data.payment_reliability || 'average',
      average_delay_days: data.average_delay_days || 0,
      notes: data.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.store.clients.push(newClient);
    return { ...newClient };
  }

  async updateClient(id: string, data: Partial<Client>): Promise<Client> {
    const index = this.store.clients.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Client not found: ${id}`);
    }
    const updated = {
      ...this.store.clients[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    this.store.clients[index] = updated;
    return { ...updated };
  }

  async getBookings(): Promise<Booking[]> {
    return this.store.bookings
      .map((b) => {
        const client = this.store.clients.find((c) => c.id === b.client_id);
        const invoices = this.store.invoices
          .filter((inv) => inv.booking_id === b.id)
          .map((inv) => this.enrichInvoice(inv));
        return {
          ...b,
          client,
          invoices,
        };
      })
      .sort((a, b) => b.event_date.localeCompare(a.event_date));
  }

  async getBookingById(id: string): Promise<Booking | null> {
    const booking = this.store.bookings.find((b) => b.id === id);
    if (!booking) return null;

    const client = this.store.clients.find((c) => c.id === booking.client_id);
    const invoices = this.store.invoices
      .filter((inv) => inv.booking_id === booking.id)
      .map((inv) => this.enrichInvoice(inv));

    return {
      ...booking,
      client,
      invoices,
    };
  }

  async createBooking(data: {
    clientId: string;
    title: string;
    eventDate: string;
    totalAmount: number;
    advancePercentage?: number;
    midPercentage?: number;
    finalPercentage?: number;
    advanceDueDate?: string;
    midDueDate?: string;
    finalDueDate?: string;
    notes?: string | null;
  }): Promise<{ booking: Booking; invoices: Invoice[] }> {
    const client = await this.getClientById(data.clientId);
    if (!client) {
      throw new Error(`Client not found: ${data.clientId}`);
    }

    const advancePct = data.advancePercentage ?? 30;
    const midPct = data.midPercentage ?? 50;
    const finalPct = data.finalPercentage ?? 20;

    // Validate and calculate milestone splits using pure function
    const splits = splitMilestones(data.totalAmount, [advancePct, midPct, finalPct]);

    const bookingId = `b1000000-0000-0000-0000-${String(this.store.bookings.length + 1).padStart(12, '0')}`;
    const todayStr = this.getTodayStr();

    const newBooking: Booking = {
      id: bookingId,
      user_id: DEMO_USER_ID,
      client_id: data.clientId,
      title: data.title,
      event_date: data.eventDate,
      total_amount: data.totalAmount,
      advance_percentage: advancePct,
      mid_percentage: midPct,
      final_percentage: finalPct,
      status: 'confirmed',
      notes: data.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Calculate milestone due dates
    const eventDateObj = parseISO(data.eventDate);
    const bookingDateObj = parseISO(todayStr);

    const defaultMidDateObj = subDays(eventDateObj, 30);
    const midDateObj = defaultMidDateObj < bookingDateObj ? bookingDateObj : defaultMidDateObj;
    const finalDateObj = addDays(eventDateObj, 7);

    const advanceDueDate = data.advanceDueDate || todayStr;
    const midDueDate = data.midDueDate || format(midDateObj, 'yyyy-MM-dd');
    const finalDueDate = data.finalDueDate || format(finalDateObj, 'yyyy-MM-dd');

    const milestoneDefinitions = [
      { label: 'advance', amount: splits[0].amount, due: advanceDueDate },
      { label: 'mid', amount: splits[1].amount, due: midDueDate },
      { label: 'final', amount: splits[2].amount, due: finalDueDate },
    ];

    const createdInvoices: Invoice[] = [];

    for (const m of milestoneDefinitions) {
      const invCount = this.store.invoices.length + 1;
      const invId = `i1000000-0000-0000-0000-${String(invCount).padStart(12, '0')}`;
      const invNum = `INV-${String(invCount).padStart(4, '0')}`;

      const newInv: Invoice = {
        id: invId,
        user_id: DEMO_USER_ID,
        booking_id: bookingId,
        client_id: data.clientId,
        invoice_number: invNum,
        milestone_label: m.label,
        amount: m.amount,
        paid_amount: 0,
        due_date: m.due,
        sent: true,
        status: 'sent',
        upi_link: `upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=${m.amount}&cu=INR`,
        upi_qr_placeholder: null,
        notes: `${m.label.toUpperCase()} milestone for ${data.title}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      this.store.invoices.push(newInv);
      createdInvoices.push(this.enrichInvoice(newInv));
    }

    this.store.bookings.push(newBooking);

    return {
      booking: {
        ...newBooking,
        client,
        invoices: createdInvoices,
      },
      invoices: createdInvoices,
    };
  }

  async getInvoices(filter?: { status?: string; clientId?: string }): Promise<Invoice[]> {
    const today = this.getTodayStr();
    let result = this.store.invoices.map((inv) => this.enrichInvoice(inv, today));

    if (filter?.clientId) {
      result = result.filter((inv) => inv.client_id === filter.clientId);
    }

    if (filter?.status && filter.status !== 'all') {
      if (filter.status === 'outstanding') {
        result = result.filter((inv) => inv.amount - inv.paid_amount > 0);
      } else {
        result = result.filter((inv) => inv.status === filter.status);
      }
    }

    return result.sort((a, b) => b.due_date.localeCompare(a.due_date));
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    const invoice = this.store.invoices.find((i) => i.id === id);
    if (!invoice) return null;
    return this.enrichInvoice(invoice);
  }

  async getPayments(filter?: { invoiceId?: string }): Promise<Payment[]> {
    let result = [...this.store.payments];
    if (filter?.invoiceId) {
      result = result.filter((p) => p.invoice_id === filter.invoiceId);
    }
    return result
      .map((p) => {
        const inv = this.store.invoices.find((i) => i.id === p.invoice_id);
        return {
          ...p,
          invoice: inv ? this.enrichInvoice(inv) : undefined,
        };
      })
      .sort((a, b) => b.payment_date.localeCompare(a.payment_date));
  }

  async recordPayment(data: {
    invoiceId: string;
    amount: number;
    paymentDate?: string;
    paymentMethod?: PaymentMethod;
    referenceNumber?: string | null;
    notes?: string | null;
  }): Promise<{ payment: Payment; invoice: Invoice }> {
    const invoice = this.store.invoices.find((i) => i.id === data.invoiceId);
    if (!invoice) {
      throw new Error(`Invoice not found: ${data.invoiceId}`);
    }

    const remainingBalance = invoice.amount - invoice.paid_amount;
    if (data.amount > remainingBalance + 0.001) {
      throw new Error(
        `Payment amount (₹${data.amount}) cannot exceed remaining balance (₹${remainingBalance})`
      );
    }

    const payCount = this.store.payments.length + 1;
    const paymentId = `p1000000-0000-0000-0000-${String(payCount).padStart(12, '0')}`;
    const paymentDate = data.paymentDate || this.getTodayStr();

    const payment: Payment = {
      id: paymentId,
      user_id: DEMO_USER_ID,
      invoice_id: invoice.id,
      amount: data.amount,
      payment_date: paymentDate,
      payment_method: data.paymentMethod || 'UPI',
      reference_number: data.referenceNumber || `UPI-${100000 + payCount}`,
      notes: data.notes || `Payment of ₹${data.amount} for ${invoice.invoice_number}`,
      created_at: new Date().toISOString(),
    };

    // Update invoice paid amount
    invoice.paid_amount = Number((invoice.paid_amount + data.amount).toFixed(2));
    invoice.updated_at = new Date().toISOString();
    // Refresh upi link balance
    const newBalance = invoice.amount - invoice.paid_amount;
    invoice.upi_link = `upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=${newBalance}&cu=INR`;

    this.store.payments.push(payment);

    return {
      payment,
      invoice: this.enrichInvoice(invoice),
    };
  }

  async getRecurringExpenses(): Promise<RecurringExpense[]> {
    return [...this.store.recurringExpenses].sort((a, b) =>
      a.next_due_date.localeCompare(b.next_due_date)
    );
  }

  async getSettings(): Promise<Settings> {
    return { ...this.store.settings };
  }

  async getDashboardData(todayStr?: string): Promise<DashboardViewData> {
    const today = todayStr || this.getTodayStr();
    const todayDate = parseISO(today);

    // 1. Calculate this month's payments received
    let thisMonthReceived = 0;
    for (const p of this.store.payments) {
      try {
        const payDate = parseISO(p.payment_date);
        if (isSameMonth(payDate, todayDate)) {
          thisMonthReceived += p.amount;
        }
      } catch {
        // ignore
      }
    }

    // 2. Prepare aging invoices
    const agingInvoices: AgingInvoice[] = this.store.invoices.map((inv) => ({
      amount: inv.amount,
      paidAmount: inv.paid_amount,
      dueDate: inv.due_date,
      sent: inv.sent,
    }));

    const agingBuckets = buildAgingSummary(agingInvoices, today);

    const totalOutstanding =
      agingBuckets.not_due.amount +
      agingBuckets['1_7'].amount +
      agingBuckets['8_30'].amount +
      agingBuckets['30_plus'].amount;

    const totalOverdue =
      agingBuckets['1_7'].amount +
      agingBuckets['8_30'].amount +
      agingBuckets['30_plus'].amount;

    // 3. Prepare Who Owes Me rows using canonical receivables logic
    const receivableInvoices = this.store.invoices.map((inv) => ({
      amount: inv.amount,
      paidAmount: inv.paid_amount,
      dueDate: inv.due_date,
      sent: inv.sent,
      clientId: inv.client_id,
    }));

    const clientRefs: ClientRef[] = this.store.clients.map((c) => ({
      id: c.id,
      name: c.name,
      reliability: c.payment_reliability,
    }));

    const whoOwesRows = buildWhoOwesMe(receivableInvoices, clientRefs, today);

    return {
      totalOutstanding,
      totalOverdue,
      thisMonthReceived,
      agingBuckets,
      whoOwesRows,
    };
  }

  async getForecastInputs(todayStr?: string): Promise<ForecastInputs> {
    const today = todayStr || this.getTodayStr();
    const settings = await this.getSettings();
    const clients = await this.getClients();
    const bookings = await this.getBookings();
    const recurringExpenses = await this.getRecurringExpenses();
    const allInvoices = await this.getInvoices();
    const unpaidInvoices = allInvoices.filter((inv) => (inv.amount - inv.paid_amount) > 0);

    return {
      today,
      openingCash: settings.opening_cash_balance,
      invoices: unpaidInvoices,
      clients,
      recurringExpenses,
      bookings,
    };
  }

  async getBadDaySummary(todayStr?: string): Promise<BadDaySummary> {
    const inputs = await this.getForecastInputs(todayStr);
    return rankBadDayActions({ ...inputs, horizonDays: 90 });
  }

  async getAlerts(todayStr?: string): Promise<GeneratedAlert[]> {
    const inputs = await this.getForecastInputs(todayStr);
    const dismissedIds = new Set<string>();
    const snoozedUntilMap = new Map<string, string>();

    if (this.store.alertStates) {
      for (const [id, state] of Object.entries(this.store.alertStates)) {
        if (state.isDismissed) {
          dismissedIds.add(id);
        }
        if (state.snoozedUntil) {
          snoozedUntilMap.set(id, state.snoozedUntil);
        }
      }
    }

    return deriveAlerts(
      { ...inputs, horizonDays: 90 },
      {
        dismissedIds,
        snoozedUntilMap,
        nowIso: new Date().toISOString(),
      }
    );
  }

  async dismissAlert(alertId: string): Promise<void> {
    if (!this.store.alertStates) {
      this.store.alertStates = {};
    }
    this.store.alertStates[alertId] = {
      isDismissed: true,
      snoozedUntil: null,
    };
  }

  async snoozeAlert(alertId: string, hours: number = 24): Promise<void> {
    if (!this.store.alertStates) {
      this.store.alertStates = {};
    }
    const snoozedUntil = new Date(Date.now() + hours * 3600 * 1000).toISOString();
    this.store.alertStates[alertId] = {
      isDismissed: false,
      snoozedUntil,
    };
  }

  async getReminders(invoiceId?: string): Promise<Reminder[]> {
    if (!this.store.reminders) {
      this.store.reminders = [];
    }
    if (invoiceId) {
      return this.store.reminders.filter((r) => r.invoice_id === invoiceId);
    }
    return [...this.store.reminders];
  }

  async recordReminder(data: {
    invoiceId: string;
    tone: ReminderTone;
    language: ReminderLanguage;
    text: string;
    channel?: 'whatsapp' | 'sms' | 'email';
  }): Promise<Reminder> {
    if (!this.store.reminders) {
      this.store.reminders = [];
    }
    const reminder: Reminder = {
      id: `rem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: DEMO_USER_ID,
      invoice_id: data.invoiceId,
      tone: data.tone,
      language: data.language,
      text: data.text,
      sent_at: new Date().toISOString(),
      channel: data.channel || 'whatsapp',
      created_at: new Date().toISOString(),
    };
    this.store.reminders.push(reminder);
    return reminder;
  }

  async getLastReminderSent(invoiceId: string): Promise<Reminder | null> {
    const list = await this.getReminders(invoiceId);
    if (list.length === 0) return null;
    const sorted = [...list].sort((a, b) => {
      const timeA = a.sent_at || a.created_at;
      const timeB = b.sent_at || b.created_at;
      return timeB.localeCompare(timeA);
    });
    return sorted[0] || null;
  }
}

export class SupabaseRepository implements PaydayRepository {
  private client: SupabaseClient;
  private alertStates: Record<string, { isDismissed: boolean; snoozedUntil?: string | null }> = {};
  private reminders: Reminder[] = [];

  constructor(url: string, serviceKey: string) {
    this.client = createSupabaseClient(url, serviceKey, {
      auth: { persistSession: false },
    });
  }

  isDemoMode(): boolean {
    return false;
  }

  private getTodayStr(): string {
    return format(new Date(), 'yyyy-MM-dd');
  }

  async getClients(): Promise<Client[]> {
    const { data, error } = await this.client
      .from('clients')
      .select('*')
      .eq('user_id', DEMO_USER_ID)
      .order('name');
    if (error) throw error;
    return data || [];
  }

  async getClientById(id: string): Promise<Client | null> {
    const { data, error } = await this.client
      .from('clients')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async createClient(data: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Client> {
    const { data: created, error } = await this.client
      .from('clients')
      .insert({
        user_id: DEMO_USER_ID,
        name: data.name,
        phone: data.phone,
        email: data.email,
        payment_reliability: data.payment_reliability,
        average_delay_days: data.average_delay_days,
        notes: data.notes,
      })
      .select()
      .single();
    if (error) throw error;
    return created;
  }

  async updateClient(id: string, data: Partial<Client>): Promise<Client> {
    const { data: updated, error } = await this.client
      .from('clients')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return updated;
  }

  async getBookings(): Promise<Booking[]> {
    const { data, error } = await this.client
      .from('bookings')
      .select('*, client:clients(*), invoices(*)')
      .eq('user_id', DEMO_USER_ID)
      .order('event_date', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getBookingById(id: string): Promise<Booking | null> {
    const { data, error } = await this.client
      .from('bookings')
      .select('*, client:clients(*), invoices(*)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async createBooking(data: {
    clientId: string;
    title: string;
    eventDate: string;
    totalAmount: number;
    advancePercentage?: number;
    midPercentage?: number;
    finalPercentage?: number;
    advanceDueDate?: string;
    midDueDate?: string;
    finalDueDate?: string;
    notes?: string | null;
  }): Promise<{ booking: Booking; invoices: Invoice[] }> {
    const advancePct = data.advancePercentage ?? 30;
    const midPct = data.midPercentage ?? 50;
    const finalPct = data.finalPercentage ?? 20;

    const splits = splitMilestones(data.totalAmount, [advancePct, midPct, finalPct]);
    const todayStr = this.getTodayStr();

    const { data: booking, error: bookingErr } = await this.client
      .from('bookings')
      .insert({
        user_id: DEMO_USER_ID,
        client_id: data.clientId,
        title: data.title,
        event_date: data.eventDate,
        total_amount: data.totalAmount,
        advance_percentage: advancePct,
        mid_percentage: midPct,
        final_percentage: finalPct,
        notes: data.notes,
      })
      .select('*, client:clients(*)')
      .single();

    if (bookingErr) throw bookingErr;

    const eventDateObj = parseISO(data.eventDate);
    const bookingDateObj = parseISO(todayStr);
    const defaultMidDateObj = subDays(eventDateObj, 30);
    const midDateObj = defaultMidDateObj < bookingDateObj ? bookingDateObj : defaultMidDateObj;
    const finalDateObj = addDays(eventDateObj, 7);

    const advanceDueDate = data.advanceDueDate || todayStr;
    const midDueDate = data.midDueDate || format(midDateObj, 'yyyy-MM-dd');
    const finalDueDate = data.finalDueDate || format(finalDateObj, 'yyyy-MM-dd');

    const milestoneDefinitions = [
      { label: 'advance', amount: splits[0].amount, due: advanceDueDate },
      { label: 'mid', amount: splits[1].amount, due: midDueDate },
      { label: 'final', amount: splits[2].amount, due: finalDueDate },
    ];

    const { count } = await this.client
      .from('invoices')
      .select('*', { count: 'exact', head: true });

    let invCounter = (count || 0) + 1;
    const invoiceInserts = milestoneDefinitions.map((m) => {
      const num = `INV-${String(invCounter++).padStart(4, '0')}`;
      return {
        user_id: DEMO_USER_ID,
        booking_id: booking.id,
        client_id: data.clientId,
        invoice_number: num,
        milestone_label: m.label,
        amount: m.amount,
        paid_amount: 0,
        due_date: m.due,
        sent: true,
        status: 'sent',
        upi_link: `upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=${m.amount}&cu=INR`,
      };
    });

    const { data: invoices, error: invErr } = await this.client
      .from('invoices')
      .insert(invoiceInserts)
      .select();

    if (invErr) throw invErr;

    return { booking, invoices: invoices || [] };
  }

  async getInvoices(filter?: { status?: string; clientId?: string }): Promise<Invoice[]> {
    let query = this.client
      .from('invoices')
      .select('*, client:clients(*), booking:bookings(*)')
      .eq('user_id', DEMO_USER_ID)
      .order('due_date', { ascending: false });

    if (filter?.clientId) {
      query = query.eq('client_id', filter.clientId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const today = this.getTodayStr();
    let enriched = (data || []).map((inv) => {
      const status = deriveInvoiceStatus({
        amount: inv.amount,
        paidAmount: inv.paid_amount,
        dueDate: inv.due_date,
        sent: inv.sent,
        today,
      });
      return {
        ...inv,
        status,
        days_overdue: daysOverdue(inv.due_date, today),
      };
    });

    if (filter?.status && filter.status !== 'all') {
      if (filter.status === 'outstanding') {
        enriched = enriched.filter((i) => i.amount - i.paid_amount > 0);
      } else {
        enriched = enriched.filter((i) => i.status === filter.status);
      }
    }

    return enriched;
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    const { data, error } = await this.client
      .from('invoices')
      .select('*, client:clients(*), booking:bookings(*), payments(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const today = this.getTodayStr();
    return {
      ...data,
      status: deriveInvoiceStatus({
        amount: data.amount,
        paidAmount: data.paid_amount,
        dueDate: data.due_date,
        sent: data.sent,
        today,
      }),
      days_overdue: daysOverdue(data.due_date, today),
    };
  }

  async getPayments(filter?: { invoiceId?: string }): Promise<Payment[]> {
    let query = this.client
      .from('payments')
      .select('*, invoice:invoices(*)')
      .eq('user_id', DEMO_USER_ID)
      .order('payment_date', { ascending: false });

    if (filter?.invoiceId) {
      query = query.eq('invoice_id', filter.invoiceId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async recordPayment(data: {
    invoiceId: string;
    amount: number;
    paymentDate?: string;
    paymentMethod?: PaymentMethod;
    referenceNumber?: string | null;
    notes?: string | null;
  }): Promise<{ payment: Payment; invoice: Invoice }> {
    const inv = await this.getInvoiceById(data.invoiceId);
    if (!inv) throw new Error(`Invoice not found: ${data.invoiceId}`);

    const remaining = inv.amount - inv.paid_amount;
    if (data.amount > remaining + 0.001) {
      throw new Error(`Payment cannot exceed remaining balance of ₹${remaining}`);
    }

    const paymentDate = data.paymentDate || this.getTodayStr();

    const { data: payment, error: payErr } = await this.client
      .from('payments')
      .insert({
        user_id: DEMO_USER_ID,
        invoice_id: inv.id,
        amount: data.amount,
        payment_date: paymentDate,
        payment_method: data.paymentMethod || 'UPI',
        reference_number: data.referenceNumber,
        notes: data.notes,
      })
      .select()
      .single();

    if (payErr) throw payErr;

    const newPaidAmount = Number((inv.paid_amount + data.amount).toFixed(2));
    const newBalance = inv.amount - newPaidAmount;
    const upiLink = `upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=${newBalance}&cu=INR`;

    const { data: updatedInv, error: invUpdateErr } = await this.client
      .from('invoices')
      .update({
        paid_amount: newPaidAmount,
        upi_link: upiLink,
        updated_at: new Date().toISOString(),
      })
      .eq('id', inv.id)
      .select('*, client:clients(*), booking:bookings(*)')
      .single();

    if (invUpdateErr) throw invUpdateErr;

    return { payment, invoice: updatedInv };
  }

  async getRecurringExpenses(): Promise<RecurringExpense[]> {
    const { data, error } = await this.client
      .from('recurring_expenses')
      .select('*')
      .eq('user_id', DEMO_USER_ID)
      .order('next_due_date');
    if (error) throw error;
    return data || [];
  }

  async getSettings(): Promise<Settings> {
    const { data, error } = await this.client
      .from('settings')
      .select('*')
      .eq('user_id', DEMO_USER_ID)
      .single();
    if (error) throw error;
    return data;
  }

  async getDashboardData(todayStr?: string): Promise<DashboardViewData> {
    const today = todayStr || this.getTodayStr();
    const todayDate = parseISO(today);

    const [invoices, clients, payments] = await Promise.all([
      this.getInvoices(),
      this.getClients(),
      this.getPayments(),
    ]);

    let thisMonthReceived = 0;
    for (const p of payments) {
      try {
        const d = parseISO(p.payment_date);
        if (isSameMonth(d, todayDate)) {
          thisMonthReceived += p.amount;
        }
      } catch {
        // ignore
      }
    }

    const agingInvoices: AgingInvoice[] = invoices.map((inv) => ({
      amount: inv.amount,
      paidAmount: inv.paid_amount,
      dueDate: inv.due_date,
      sent: inv.sent,
    }));

    const agingBuckets = buildAgingSummary(agingInvoices, today);

    const totalOutstanding =
      agingBuckets.not_due.amount +
      agingBuckets['1_7'].amount +
      agingBuckets['8_30'].amount +
      agingBuckets['30_plus'].amount;

    const totalOverdue =
      agingBuckets['1_7'].amount +
      agingBuckets['8_30'].amount +
      agingBuckets['30_plus'].amount;

    const receivableInvoices = invoices.map((inv) => ({
      amount: inv.amount,
      paidAmount: inv.paid_amount,
      dueDate: inv.due_date,
      sent: inv.sent,
      clientId: inv.client_id,
    }));

    const clientRefs: ClientRef[] = clients.map((c) => ({
      id: c.id,
      name: c.name,
      reliability: c.payment_reliability,
    }));

    const whoOwesRows = buildWhoOwesMe(receivableInvoices, clientRefs, today);

    return {
      totalOutstanding,
      totalOverdue,
      thisMonthReceived,
      agingBuckets,
      whoOwesRows,
    };
  }

  async getForecastInputs(todayStr?: string): Promise<ForecastInputs> {
    const today = todayStr || this.getTodayStr();
    const settings = await this.getSettings();
    const clients = await this.getClients();
    const bookings = await this.getBookings();
    const recurringExpenses = await this.getRecurringExpenses();
    const allInvoices = await this.getInvoices();
    const unpaidInvoices = allInvoices.filter((inv) => (inv.amount - inv.paid_amount) > 0);

    return {
      today,
      openingCash: settings.opening_cash_balance,
      invoices: unpaidInvoices,
      clients,
      recurringExpenses,
      bookings,
    };
  }

  async getBadDaySummary(todayStr?: string): Promise<BadDaySummary> {
    const inputs = await this.getForecastInputs(todayStr);
    return rankBadDayActions({ ...inputs, horizonDays: 90 });
  }

  async getAlerts(todayStr?: string): Promise<GeneratedAlert[]> {
    const inputs = await this.getForecastInputs(todayStr);
    const dismissedIds = new Set<string>();
    const snoozedUntilMap = new Map<string, string>();

    for (const [id, state] of Object.entries(this.alertStates)) {
      if (state.isDismissed) {
        dismissedIds.add(id);
      }
      if (state.snoozedUntil) {
        snoozedUntilMap.set(id, state.snoozedUntil);
      }
    }

    return deriveAlerts(
      { ...inputs, horizonDays: 90 },
      {
        dismissedIds,
        snoozedUntilMap,
        nowIso: new Date().toISOString(),
      }
    );
  }

  async dismissAlert(alertId: string): Promise<void> {
    this.alertStates[alertId] = {
      isDismissed: true,
      snoozedUntil: null,
    };
  }

  async snoozeAlert(alertId: string, hours: number = 24): Promise<void> {
    const snoozedUntil = new Date(Date.now() + hours * 3600 * 1000).toISOString();
    this.alertStates[alertId] = {
      isDismissed: false,
      snoozedUntil,
    };
  }

  async getReminders(invoiceId?: string): Promise<Reminder[]> {
    if (invoiceId) {
      return this.reminders.filter((r) => r.invoice_id === invoiceId);
    }
    return [...this.reminders];
  }

  async recordReminder(data: {
    invoiceId: string;
    tone: ReminderTone;
    language: ReminderLanguage;
    text: string;
    channel?: 'whatsapp' | 'sms' | 'email';
  }): Promise<Reminder> {
    const reminder: Reminder = {
      id: `rem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: DEMO_USER_ID,
      invoice_id: data.invoiceId,
      tone: data.tone,
      language: data.language,
      text: data.text,
      sent_at: new Date().toISOString(),
      channel: data.channel || 'whatsapp',
      created_at: new Date().toISOString(),
    };
    this.reminders.push(reminder);
    return reminder;
  }

  async getLastReminderSent(invoiceId: string): Promise<Reminder | null> {
    const list = await this.getReminders(invoiceId);
    if (list.length === 0) return null;
    const sorted = [...list].sort((a, b) => {
      const timeA = a.sent_at || a.created_at;
      const timeB = b.sent_at || b.created_at;
      return timeB.localeCompare(timeA);
    });
    return sorted[0] || null;
  }
}

// Factory to select Supabase vs InMemory
let repositoryInstance: PaydayRepository | null = null;

export function getRepository(): PaydayRepository {
  if (repositoryInstance) return repositoryInstance;

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const isValidUrl = url && !url.includes('your-project.supabase.co') && url.startsWith('http');
  const isValidKey = serviceKey && !serviceKey.includes('your-supabase-service-role-key');

  if (isValidUrl && isValidKey) {
    repositoryInstance = new SupabaseRepository(url, serviceKey);
  } else {
    repositoryInstance = new InMemoryRepository();
  }

  return repositoryInstance;
}
