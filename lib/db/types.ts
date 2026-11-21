// Payday Data Model Types

export type PaymentReliability = 'high' | 'medium' | 'low';

export type BookingStatus = 'inquiry' | 'confirmed' | 'completed' | 'cancelled';

export type InvoiceStatus = 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue';

export type PaymentMethod = 'UPI' | 'bank_transfer' | 'cash' | 'cheque' | 'other';

export type ExpenseFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export type ExpenseCategory = 'rent' | 'emi' | 'salary' | 'software' | 'operational' | 'other';

export type ReminderTone = 'friendly' | 'firm' | 'final';

export type ReminderLanguage = 'en' | 'hinglish';

export type AlertType = 'overdue_invoice' | 'cash_dip' | 'upcoming_expense' | 'unconfirmed_booking' | 'general';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface User {
  id: string;
  email: string;
  full_name: string;
  business_name: string;
  phone?: string | null;
  upi_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  payment_reliability: PaymentReliability;
  average_delay_days: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  client_id: string;
  title: string;
  event_date: string; // YYYY-MM-DD
  total_amount: number;
  advance_percentage: number; // default 30
  mid_percentage: number; // default 50
  final_percentage: number; // default 20
  status: BookingStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  client?: Client;
  invoices?: Invoice[];
}

export interface Invoice {
  id: string;
  user_id: string;
  booking_id: string;
  client_id: string;
  invoice_number: string;
  milestone_label: string;
  amount: number;
  paid_amount: number;
  due_date: string; // YYYY-MM-DD
  status: InvoiceStatus;
  upi_link?: string | null;
  upi_qr_placeholder?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Calculated/Joined fields
  client?: Client;
  booking?: Booking;
  payments?: Payment[];
  days_overdue?: number;
}

export interface Payment {
  id: string;
  user_id: string;
  invoice_id: string;
  amount: number;
  payment_date: string; // YYYY-MM-DD
  payment_method: PaymentMethod;
  reference_number?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface RecurringExpense {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  frequency: ExpenseFrequency;
  next_due_date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  invoice_id: string;
  tone: ReminderTone;
  language: ReminderLanguage;
  text: string;
  sent_at?: string | null;
  channel: 'whatsapp' | 'sms' | 'email';
  created_at: string;
}

export interface Alert {
  id: string;
  user_id: string;
  type: AlertType;
  title: string;
  message: string;
  action_label: string;
  action_url: string;
  severity: AlertSeverity;
  is_resolved: boolean;
  created_at: string;
}

export interface Settings {
  id: string;
  user_id: string;
  opening_cash_balance: number;
  currency: string;
  locale: string;
  created_at: string;
  updated_at: string;
}

// Hardcoded Single Demo User Context
export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

export const DEMO_USER: User = {
  id: DEMO_USER_ID,
  email: 'arjun@example.com',
  full_name: 'Arjun Verma',
  business_name: 'Arjun Visuals',
  phone: '+919876543210',
  upi_id: 'arjunvisuals@okaxis',
  created_at: '2026-11-01T00:00:00Z',
  updated_at: '2026-11-01T00:00:00Z',
};
