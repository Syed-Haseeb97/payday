// Dynamic Seed Data Generator for Payday
// All dates are generated RELATIVE TO TODAY so the demo never goes stale.
// Produces typed in-memory objects and SQL statements for Supabase.

import { addDays, subDays, format, parseISO } from 'date-fns';
import {
  User,
  Client,
  Booking,
  Invoice,
  Payment,
  RecurringExpense,
  Settings,
  DEMO_USER_ID,
} from './types';
import { splitMilestones } from '../milestones';

export interface SeedDataBundle {
  user: User;
  settings: Settings;
  clients: Client[];
  bookings: Booking[];
  invoices: Invoice[];
  payments: Payment[];
  recurringExpenses: RecurringExpense[];
}

export function generateSeedData(baseDateStr?: string): SeedDataBundle {
  const today = baseDateStr ? parseISO(baseDateStr) : new Date();
  const d = (daysOffset: number) => format(addDays(today, daysOffset), 'yyyy-MM-dd');

  // 1. User
  const user: User = {
    id: DEMO_USER_ID,
    email: 'arjun@example.com',
    full_name: 'Arjun Verma',
    business_name: 'Arjun Visuals',
    phone: '+91 90000 00000',
    upi_id: 'arjunvisuals@okaxis',
    created_at: `${d(-180)}T00:00:00Z`,
    updated_at: `${d(0)}T00:00:00Z`,
  };

  // 2. Settings (Opening cash balance around ₹1,40,000)
  const settings: Settings = {
    id: '00000000-0000-0000-0000-000000000002',
    user_id: user.id,
    opening_cash_balance: 140000,
    currency: 'INR',
    locale: 'en-IN',
    created_at: `${d(-180)}T00:00:00Z`,
    updated_at: `${d(0)}T00:00:00Z`,
  };

  // 3. 8 Clients with distinct reliability profiles
  const clients: Client[] = [
    {
      id: 'c1000000-0000-0000-0000-000000000001',
      user_id: user.id,
      name: 'Priya Sharma (Sharma Nuptials)',
      phone: '+91 90000 00001',
      email: 'priya.sharma@example.fake',
      payment_reliability: 'reliable', // 0-2 days
      average_delay_days: 1,
      notes: 'Prompt payer, prefers UPI transfers immediately upon milestone delivery.',
      created_at: `${d(-160)}T00:00:00Z`,
      updated_at: `${d(0)}T00:00:00Z`,
    },
    {
      id: 'c1000000-0000-0000-0000-000000000002',
      user_id: user.id,
      name: 'Vikram Malhotra (Malhotra Reception)',
      phone: '+91 90000 00002',
      email: 'vikram.malhotra@example.fake',
      payment_reliability: 'reliable', // 0-2 days
      average_delay_days: 2,
      notes: 'Clear communication, high budget corporate family wedding.',
      created_at: `${d(-150)}T00:00:00Z`,
      updated_at: `${d(0)}T00:00:00Z`,
    },
    {
      id: 'c1000000-0000-0000-0000-000000000003',
      user_id: user.id,
      name: 'Rohan & Neha Kapoor',
      phone: '+91 90000 00003',
      email: 'rohan.kapoor@example.fake',
      payment_reliability: 'average', // 5-8 days
      average_delay_days: 6,
      notes: 'Takes around a week after WhatsApp follow-up to release NEFT.',
      created_at: `${d(-140)}T00:00:00Z`,
      updated_at: `${d(0)}T00:00:00Z`,
    },
    {
      id: 'c1000000-0000-0000-0000-000000000004',
      user_id: user.id,
      name: 'Siddharth Verma (Verma Grand Sangeet)',
      phone: '+91 90000 00004',
      email: 'sid.verma@example.fake',
      payment_reliability: 'average', // 5-8 days
      average_delay_days: 7,
      notes: 'Busy finance executive, responds after second friendly ping.',
      created_at: `${d(-120)}T00:00:00Z`,
      updated_at: `${d(0)}T00:00:00Z`,
    },
    {
      id: 'c1000000-0000-0000-0000-000000000005',
      user_id: user.id,
      name: 'Deepak Gupta (Gupta Traditional)',
      phone: '+91 90000 00005',
      email: 'deepak.gupta@example.fake',
      payment_reliability: 'average', // 5-8 days
      average_delay_days: 8,
      notes: 'Family elders approve payments, usually clears in 8-10 days.',
      created_at: `${d(-100)}T00:00:00Z`,
      updated_at: `${d(0)}T00:00:00Z`,
    },
    {
      id: 'c1000000-0000-0000-0000-000000000006',
      user_id: user.id,
      name: 'Rohit Mehta (Mehta Weddings)',
      phone: '+91 90000 00006',
      email: 'rohit.mehta@example.fake',
      payment_reliability: 'slow', // about 12 days
      average_delay_days: 12,
      notes: 'Habitual slow payer. Requires firm reminders; always delays until album delivery.',
      created_at: `${d(-90)}T00:00:00Z`,
      updated_at: `${d(0)}T00:00:00Z`,
    },
    {
      id: 'c1000000-0000-0000-0000-000000000007',
      user_id: user.id,
      name: 'Kunal Singhania (Singhania Destination)',
      phone: '+91 90000 00007',
      email: 'kunal.singhania@example.fake',
      payment_reliability: 'unreliable', // 15+ days
      average_delay_days: 22,
      notes: 'Extremely delayed. Ignores friendly WhatsApp messages; owes long overdue balance.',
      created_at: `${d(-80)}T00:00:00Z`,
      updated_at: `${d(0)}T00:00:00Z`,
    },
    {
      id: 'c1000000-0000-0000-0000-000000000008',
      user_id: user.id,
      name: 'Ananya Iyer (Iyer Engagement)',
      phone: '+91 90000 00008',
      email: 'ananya.iyer@example.fake',
      payment_reliability: 'new', // no history
      average_delay_days: 0,
      notes: 'New client, first booking for upcoming pre-wedding & engagement ceremony.',
      created_at: `${d(-10)}T00:00:00Z`,
      updated_at: `${d(0)}T00:00:00Z`,
    },
  ];

  // Helper map
  const c = (idx: number) => clients[idx].id;

  // 4. 25 Bookings across 6 months ago to 5 months future (Peak season Nov-Feb)
  // Total amounts between ₹40,000 and ₹2,50,000
  interface RawBookingDef {
    id: string;
    clientId: string;
    title: string;
    offsetDays: number; // event date relative to today
    amount: number;
    status: 'completed' | 'confirmed';
    bookingOffsetDays: number;
  }

  const bookingDefs: RawBookingDef[] = [
    // Historical completed (Months -6 to -1)
    { id: 'b1000000-0000-0000-0000-000000000001', clientId: c(0), title: 'Sharma Pre-Wedding Shoot', offsetDays: -150, amount: 45000, status: 'completed', bookingOffsetDays: -175 },
    { id: 'b1000000-0000-0000-0000-000000000002', clientId: c(0), title: 'Sharma 2-Day Wedding', offsetDays: -130, amount: 160000, status: 'completed', bookingOffsetDays: -160 },
    { id: 'b1000000-0000-0000-0000-000000000003', clientId: c(1), title: 'Malhotra Intimate Roka', offsetDays: -140, amount: 50000, status: 'completed', bookingOffsetDays: -165 },
    { id: 'b1000000-0000-0000-0000-000000000004', clientId: c(1), title: 'Malhotra 3-Day Luxury Wedding', offsetDays: -110, amount: 240000, status: 'completed', bookingOffsetDays: -145 },
    { id: 'b1000000-0000-0000-0000-000000000005', clientId: c(2), title: 'Kapoor Engagement Night', offsetDays: -125, amount: 60000, status: 'completed', bookingOffsetDays: -140 },
    { id: 'b1000000-0000-0000-0000-000000000006', clientId: c(2), title: 'Kapoor Cocktail & Haldi', offsetDays: -95, amount: 90000, status: 'completed', bookingOffsetDays: -120 },
    { id: 'b1000000-0000-0000-0000-000000000007', clientId: c(3), title: 'Verma Sangeet Celebration', offsetDays: -90, amount: 75000, status: 'completed', bookingOffsetDays: -115 },
    { id: 'b1000000-0000-0000-0000-000000000008', clientId: c(3), title: 'Verma Reception Party', offsetDays: -75, amount: 110000, status: 'completed', bookingOffsetDays: -100 },
    { id: 'b1000000-0000-0000-0000-000000000009', clientId: c(4), title: 'Gupta Traditional Haldi', offsetDays: -80, amount: 40000, status: 'completed', bookingOffsetDays: -100 },
    { id: 'b1000000-0000-0000-0000-000000000010', clientId: c(4), title: 'Gupta Full Wedding Package', offsetDays: -60, amount: 145000, status: 'completed', bookingOffsetDays: -85 },
    { id: 'b1000000-0000-0000-0000-000000000011', clientId: c(5), title: 'Mehta Pre-Wedding Teaser', offsetDays: -70, amount: 55000, status: 'completed', bookingOffsetDays: -90 },
    { id: 'b1000000-0000-0000-0000-000000000012', clientId: c(6), title: 'Singhania Goa Pre-Wedding', offsetDays: -65, amount: 80000, status: 'completed', bookingOffsetDays: -80 },
    { id: 'b1000000-0000-0000-0000-000000000013', clientId: c(1), title: 'Malhotra Post-Wedding Brunch', offsetDays: -45, amount: 42000, status: 'completed', bookingOffsetDays: -55 },
    { id: 'b1000000-0000-0000-0000-000000000014', clientId: c(0), title: 'Sharma Family Milestone', offsetDays: -30, amount: 48000, status: 'completed', bookingOffsetDays: -45 },

    // ACTIVE / SCRIPTED BAD MONTH BOOKINGS (Immediate past, present, next 3 weeks)
    // Booking 15: Singhania Big Fat Wedding (with severely overdue final payment)
    { id: 'b1000000-0000-0000-0000-000000000015', clientId: c(6), title: 'Singhania Grand Palace Wedding', offsetDays: -40, amount: 250000, status: 'confirmed', bookingOffsetDays: -70 },
    // Booking 16: Mehta Main Wedding (SCRIPTED: Final ₹90,000+ due in 8 days; Mid invoice of ₹35k was due 12 days ago & overdue)
    { id: 'b1000000-0000-0000-0000-000000000016', clientId: c(5), title: 'Mehta Grand Regal Wedding', offsetDays: 1, amount: 180000, status: 'confirmed', bookingOffsetDays: -45 },
    // Booking 17: Sharma Winter Wedding (large receipt due in ~10 days)
    { id: 'b1000000-0000-0000-0000-000000000017', clientId: c(0), title: 'Sharma Winter Nuptials', offsetDays: 15, amount: 215000, status: 'confirmed', bookingOffsetDays: -30 },
    // Booking 18: Kapoor Destination Sangeet (large receipt due in ~18 days)
    { id: 'b1000000-0000-0000-0000-000000000018', clientId: c(2), title: 'Kapoor Udaipur Sangeet', offsetDays: 25, amount: 175000, status: 'confirmed', bookingOffsetDays: -20 },
    // Booking 19: Ananya Iyer First Booking
    { id: 'b1000000-0000-0000-0000-000000000019', clientId: c(7), title: 'Iyer South Indian Engagement', offsetDays: 12, amount: 65000, status: 'confirmed', bookingOffsetDays: -8 },

    // UPCOMING HIGH SEASON BOOKINGS (Peak Dec-Feb, Months +1 to +5)
    { id: 'b1000000-0000-0000-0000-000000000020', clientId: c(1), title: 'Malhotra Anniversary Gala', offsetDays: 38, amount: 85000, status: 'confirmed', bookingOffsetDays: -15 },
    { id: 'b1000000-0000-0000-0000-000000000021', clientId: c(3), title: 'Verma Delhi Royal Wedding', offsetDays: 52, amount: 230000, status: 'confirmed', bookingOffsetDays: -10 },
    { id: 'b1000000-0000-0000-0000-000000000022', clientId: c(4), title: 'Gupta Spring Reception', offsetDays: 70, amount: 120000, status: 'confirmed', bookingOffsetDays: -5 },
    { id: 'b1000000-0000-0000-0000-000000000023', clientId: c(7), title: 'Iyer Traditional Wedding', offsetDays: 95, amount: 190000, status: 'confirmed', bookingOffsetDays: -3 },
    { id: 'b1000000-0000-0000-0000-000000000024', clientId: c(0), title: 'Sharma Destination Vows', offsetDays: 120, amount: 220000, status: 'confirmed', bookingOffsetDays: -2 },
    { id: 'b1000000-0000-0000-0000-000000000025', clientId: c(2), title: 'Kapoor Summer Reception', offsetDays: 145, amount: 95000, status: 'confirmed', bookingOffsetDays: -1 },
  ];

  const bookings: Booking[] = bookingDefs.map((b) => ({
    id: b.id,
    user_id: user.id,
    client_id: b.clientId,
    title: b.title,
    event_date: d(b.offsetDays),
    total_amount: b.amount,
    advance_percentage: 30,
    mid_percentage: 50,
    final_percentage: 20,
    status: b.status,
    notes: `Package booking for ${b.title}`,
    created_at: `${d(b.bookingOffsetDays)}T00:00:00Z`,
    updated_at: `${d(b.bookingOffsetDays)}T00:00:00Z`,
  }));

  // 5. Invoices and Payments Generation
  const invoices: Invoice[] = [];
  const payments: Payment[] = [];

  let invCounter = 1;
  let payCounter = 1;

  for (const b of bookingDefs) {
    const splits = splitMilestones(b.amount, [30, 50, 20]); // advance, mid, final
    const bookingDateStr = d(b.bookingOffsetDays);
    const eventDateStr = d(b.offsetDays);

    // Default dates
    const advanceDueStr = bookingDateStr;
    const midDueOffset = Math.max(b.bookingOffsetDays, b.offsetDays - 30);
    const midDueStr = d(midDueOffset);
    const finalDueStr = d(b.offsetDays + 7);

    const milestoneDefs = [
      { label: 'advance' as const, amount: splits[0].amount, due: advanceDueStr },
      { label: 'mid' as const, amount: splits[1].amount, due: midDueStr },
      { label: 'final' as const, amount: splits[2].amount, due: finalDueStr },
    ];

    for (const m of milestoneDefs) {
      const invId = `i1000000-0000-0000-0000-${String(invCounter).padStart(12, '0')}`;
      const invNum = `INV-${String(invCounter).padStart(4, '0')}`;
      invCounter++;

      let paidAmount = 0;
      let sent = true;

      // Determine payment status based on scenario
      if (b.status === 'completed') {
        // Historical bookings: fully paid
        paidAmount = m.amount;
      } else if (b.id === 'b1000000-0000-0000-0000-000000000015') {
        // Singhania Grand Palace (Total 250k: Adv 75k, Mid 125k, Final 50k)
        if (m.label === 'advance') {
          paidAmount = m.amount; // paid
        } else if (m.label === 'mid') {
          paidAmount = 75000; // partially paid (50k remaining, overdue by ~35 days!)
        } else {
          // Final 50k unpaid, due d(-33) -> severely overdue 30+ days
          paidAmount = 0;
        }
      } else if (b.id === 'b1000000-0000-0000-0000-000000000016') {
        // Mehta Grand Regal (Total 180k: Adv 54k, Mid 90k, Final 36k)
        // SCRIPTED: Let's adjust amounts so Final is ₹90,000+ per prompt specification!
        // Prompt requirement: "Mehta Weddings (slow payer) has a large final milestone (₹90,000+) due within the next 12 days, and a smaller invoice already 12 days overdue."
        // Let's set Mehta milestones:
        // Mid invoice: ₹35,000 due 12 days ago (due d(-12)), unpaid -> 12 days overdue!
        // Final milestone: ₹95,000 due in 8 days (due d(8)), unpaid -> due within 12 days!
        // Advance: ₹50,000 paid at booking.
        if (m.label === 'advance') {
          m.amount = 50000;
          paidAmount = 50000;
        } else if (m.label === 'mid') {
          m.amount = 35000;
          m.due = d(-12); // Exactly 12 days overdue!
          paidAmount = 0; // Unpaid
        } else {
          m.amount = 95000; // ₹90,000+
          m.due = d(8);   // Due in 8 days (< 12 days)
          paidAmount = 0;
        }
      } else if (b.id === 'b1000000-0000-0000-0000-000000000017') {
        // Sharma Winter Nuptials (Adv paid, Mid due in 10 days = large receipt due in next 3 weeks)
        if (m.label === 'advance') {
          paidAmount = m.amount;
        } else if (m.label === 'mid') {
          m.due = d(10); // Due in 10 days: ₹107,500
          paidAmount = 0;
        } else {
          m.due = d(22);
          paidAmount = 0;
        }
      } else if (b.id === 'b1000000-0000-0000-0000-000000000018') {
        // Kapoor Udaipur Sangeet (Adv paid, Mid due in 18 days = second large receipt in next 3 weeks)
        if (m.label === 'advance') {
          paidAmount = m.amount;
        } else if (m.label === 'mid') {
          m.due = d(18); // Due in 18 days: ₹87,500
          paidAmount = 0;
        } else {
          m.due = d(32);
          paidAmount = 0;
        }
      } else if (b.id === 'b1000000-0000-0000-0000-000000000019') {
        // Ananya Iyer (New client: advance paid, mid due in 5 days)
        if (m.label === 'advance') {
          paidAmount = m.amount;
        } else {
          paidAmount = 0;
        }
      } else {
        // Future bookings (+38 days to +145 days)
        if (m.label === 'advance') {
          // Some future bookings have advances paid, some pending
          if (b.offsetDays < 60) {
            paidAmount = m.amount;
          } else {
            sent = true;
            paidAmount = 0;
          }
        } else {
          // Mid and Final for distant future bookings
          sent = b.offsetDays < 90;
          paidAmount = 0;
        }
      }

      // Record payments if any
      if (paidAmount > 0) {
        const payId = `p1000000-0000-0000-0000-${String(payCounter).padStart(12, '0')}`;
        payCounter++;
        payments.push({
          id: payId,
          user_id: user.id,
          invoice_id: invId,
          amount: paidAmount,
          payment_date: m.due <= d(0) ? m.due : d(-1),
          payment_method: 'UPI',
          reference_number: `UPI-${100000 + payCounter}`,
          notes: `Payment for ${invNum} (${m.label})`,
          created_at: `${m.due <= d(0) ? m.due : d(-1)}T12:00:00Z`,
        });
      }

      invoices.push({
        id: invId,
        user_id: user.id,
        booking_id: b.id,
        client_id: b.clientId,
        invoice_number: invNum,
        milestone_label: m.label,
        amount: m.amount,
        paid_amount: paidAmount,
        due_date: m.due,
        sent,
        status: 'sent', // derived at runtime
        upi_link: `upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=${m.amount - paidAmount}&cu=INR`,
        upi_qr_placeholder: null,
        notes: `${m.label.toUpperCase()} milestone for ${b.title}`,
        created_at: `${bookingDateStr}T00:00:00Z`,
        updated_at: `${d(0)}T00:00:00Z`,
      });
    }
  }

  // 6. Recurring Expenses
  // SCRIPTED: Rent, one EMI, and assistant salary all fall within the same 5-day window about 3 weeks out (d(19) to d(23))
  const recurringExpenses: RecurringExpense[] = [
    {
      id: 'e1000000-0000-0000-0000-000000000001',
      user_id: user.id,
      name: 'Studio Rent (Indiranagar)',
      amount: 45000,
      frequency: 'monthly',
      next_due_date: d(20), // Exactly in window (~3 weeks out)
      category: 'rent',
      is_active: true,
      created_at: `${d(-180)}T00:00:00Z`,
      updated_at: `${d(0)}T00:00:00Z`,
    },
    {
      id: 'e1000000-0000-0000-0000-000000000002',
      user_id: user.id,
      name: 'Sony FX3 Cinema Kit EMI',
      amount: 28000,
      frequency: 'monthly',
      next_due_date: d(21), // In window
      category: 'emi',
      is_active: true,
      created_at: `${d(-180)}T00:00:00Z`,
      updated_at: `${d(0)}T00:00:00Z`,
    },
    {
      id: 'e1000000-0000-0000-0000-000000000003',
      user_id: user.id,
      name: 'Assistant Photographer Salary (Rohan)',
      amount: 35000,
      frequency: 'monthly',
      next_due_date: d(22), // In window
      category: 'salary',
      is_active: true,
      created_at: `${d(-180)}T00:00:00Z`,
      updated_at: `${d(0)}T00:00:00Z`,
    },
    {
      id: 'e1000000-0000-0000-0000-000000000004',
      user_id: user.id,
      name: 'Godox Studio Lighting EMI',
      amount: 14000,
      frequency: 'monthly',
      next_due_date: d(5), // earlier in month
      category: 'emi',
      is_active: true,
      created_at: `${d(-180)}T00:00:00Z`,
      updated_at: `${d(0)}T00:00:00Z`,
    },
    {
      id: 'e1000000-0000-0000-0000-000000000005',
      user_id: user.id,
      name: 'Adobe CC & Cloud Backup',
      amount: 4500,
      frequency: 'monthly',
      next_due_date: d(15),
      category: 'software',
      is_active: true,
      created_at: `${d(-180)}T00:00:00Z`,
      updated_at: `${d(0)}T00:00:00Z`,
    },
    {
      id: 'e1000000-0000-0000-0000-000000000006',
      user_id: user.id,
      name: 'Studio & Gear Insurance (Annual)',
      amount: 36000,
      frequency: 'yearly',
      next_due_date: d(23), // Annual policy renewal in same window!
      category: 'insurance',
      is_active: true,
      created_at: `${d(-180)}T00:00:00Z`,
      updated_at: `${d(0)}T00:00:00Z`,
    },
  ];

  return {
    user,
    settings,
    clients,
    bookings,
    invoices,
    payments,
    recurringExpenses,
  };
}

/**
 * Generates valid SQL INSERT statements for Supabase Postgres
 */
export function generateSeedSQL(baseDateStr?: string): string {
  const seed = generateSeedData(baseDateStr);

  const escapeStr = (str: string | null | undefined) =>
    str ? `'${str.replace(/'/g, "''")}'` : 'NULL';

  const lines: string[] = [
    '-- Payday Dynamic Synthetic Seed Data',
    '-- Generated relative to runtime date',
    '',
    'BEGIN;',
    '',
    '-- 1. Insert User',
    `INSERT INTO users (id, email, full_name, business_name, phone, upi_id, created_at, updated_at)
VALUES (${escapeStr(seed.user.id)}, ${escapeStr(seed.user.email)}, ${escapeStr(seed.user.full_name)}, ${escapeStr(seed.user.business_name)}, ${escapeStr(seed.user.phone)}, ${escapeStr(seed.user.upi_id)}, ${escapeStr(seed.user.created_at)}, ${escapeStr(seed.user.updated_at)})
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;`,
    '',
    '-- 2. Insert Settings',
    `INSERT INTO settings (id, user_id, opening_cash_balance, currency, locale, created_at, updated_at)
VALUES (${escapeStr(seed.settings.id)}, ${escapeStr(seed.settings.user_id)}, ${seed.settings.opening_cash_balance}, ${escapeStr(seed.settings.currency)}, ${escapeStr(seed.settings.locale)}, ${escapeStr(seed.settings.created_at)}, ${escapeStr(seed.settings.updated_at)})
ON CONFLICT (id) DO UPDATE SET opening_cash_balance = EXCLUDED.opening_cash_balance;`,
    '',
    '-- 3. Insert Clients',
    ...seed.clients.map(
      (c) =>
        `INSERT INTO clients (id, user_id, name, phone, email, payment_reliability, average_delay_days, notes, created_at, updated_at)
VALUES (${escapeStr(c.id)}, ${escapeStr(c.user_id)}, ${escapeStr(c.name)}, ${escapeStr(c.phone)}, ${escapeStr(c.email)}, ${escapeStr(c.payment_reliability)}, ${c.average_delay_days}, ${escapeStr(c.notes)}, ${escapeStr(c.created_at)}, ${escapeStr(c.updated_at)})
ON CONFLICT (id) DO NOTHING;`
    ),
    '',
    '-- 4. Insert Bookings',
    ...seed.bookings.map(
      (b) =>
        `INSERT INTO bookings (id, user_id, client_id, title, event_date, total_amount, advance_percentage, mid_percentage, final_percentage, status, notes, created_at, updated_at)
VALUES (${escapeStr(b.id)}, ${escapeStr(b.user_id)}, ${escapeStr(b.client_id)}, ${escapeStr(b.title)}, ${escapeStr(b.event_date)}, ${b.total_amount}, ${b.advance_percentage}, ${b.mid_percentage}, ${b.final_percentage}, ${escapeStr(b.status)}, ${escapeStr(b.notes)}, ${escapeStr(b.created_at)}, ${escapeStr(b.updated_at)})
ON CONFLICT (id) DO NOTHING;`
    ),
    '',
    '-- 5. Insert Invoices',
    ...seed.invoices.map(
      (inv) =>
        `INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, upi_link, notes, created_at, updated_at)
VALUES (${escapeStr(inv.id)}, ${escapeStr(inv.user_id)}, ${escapeStr(inv.booking_id)}, ${escapeStr(inv.client_id)}, ${escapeStr(inv.invoice_number)}, ${escapeStr(inv.milestone_label)}, ${inv.amount}, ${inv.paid_amount}, ${escapeStr(inv.due_date)}, ${inv.sent}, ${escapeStr(inv.status)}, ${escapeStr(inv.upi_link)}, ${escapeStr(inv.notes)}, ${escapeStr(inv.created_at)}, ${escapeStr(inv.updated_at)})
ON CONFLICT (id) DO NOTHING;`
    ),
    '',
    '-- 6. Insert Payments',
    ...seed.payments.map(
      (p) =>
        `INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES (${escapeStr(p.id)}, ${escapeStr(p.user_id)}, ${escapeStr(p.invoice_id)}, ${p.amount}, ${escapeStr(p.payment_date)}, ${escapeStr(p.payment_method)}, ${escapeStr(p.reference_number)}, ${escapeStr(p.notes)}, ${escapeStr(p.created_at)})
ON CONFLICT (id) DO NOTHING;`
    ),
    '',
    '-- 7. Insert Recurring Expenses',
    ...seed.recurringExpenses.map(
      (e) =>
        `INSERT INTO recurring_expenses (id, user_id, name, amount, frequency, next_due_date, category, is_active, created_at, updated_at)
VALUES (${escapeStr(e.id)}, ${escapeStr(e.user_id)}, ${escapeStr(e.name)}, ${e.amount}, ${escapeStr(e.frequency)}, ${escapeStr(e.next_due_date)}, ${escapeStr(e.category)}, ${e.is_active}, ${escapeStr(e.created_at)}, ${escapeStr(e.updated_at)})
ON CONFLICT (id) DO NOTHING;`
    ),
    '',
    'COMMIT;',
  ];

  return lines.join('\n');
}
