/** Payday domain model. All money values are integers in rupees. Dates are ISO `YYYY-MM-DD`. */

export type PaymentReliability = 'reliable' | 'average' | 'slow' | 'unreliable' | 'new';

export interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  payment_reliability: PaymentReliability;
  average_delay_days: number;
  /** Optional trading name, e.g. "Mehta Weddings". */
  company?: string;
}

export type BookingStatus = 'enquiry' | 'confirmed' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  client_id: string;
  title: string;
  event_date: string;
  total_amount: number;
  advance_percentage: number;
  mid_percentage: number;
  final_percentage: number;
  status: BookingStatus;
}

export type InvoiceStatus = 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue';
export type PaymentMethod = 'upi' | 'bank' | 'cash';

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  paid_on: string;
  method: PaymentMethod;
  reference?: string;
}

export interface PaymentClaim {
  id: string;
  invoice_id: string;
  claimed_amount: number;
  reference?: string;
  status: 'pending' | 'confirmed' | 'rejected';
  /** When the client reported it (mock extension). */
  claimed_on?: string;
}

export interface Invoice {
  id: string;
  booking_id: string;
  client_id: string;
  invoice_number: string;
  milestone_label: string;
  amount: number;
  paid_amount: number;
  due_date: string;
  status: InvoiceStatus;
  pay_token: string;
  days_overdue?: number;
  payments?: Payment[];
  payment_claims?: PaymentClaim[];
}

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  id: string;
  type: 'collection_risk' | 'overdue' | 'claim' | 'cash_dip';
  title: string;
  message: string;
  action_label: string;
  action_url: string;
  severity: AlertSeverity;
  /** Invoice the action targets, when there is one. */
  invoice_id?: string;
}

export type ReminderTone = 'friendly' | 'firm' | 'final';
export type ReminderLanguage = 'en' | 'hinglish';

export interface Reminder {
  tone: ReminderTone;
  language: ReminderLanguage;
  text: string;
}

export interface ReminderDraft extends Reminder {
  invoice_id: string;
  client_first_name: string;
  amount: number;
  pay_link: string;
  /** wa.me deep link with the text pre-filled. */
  whatsapp_url: string;
}

/* ---------- Forecast ---------- */

export interface ForecastPoint {
  date: string;
  balance: number;
}

export interface LowPoint {
  date: string;
  balance: number;
}

export interface CashEvent {
  id: string;
  date: string;
  label: string;
  /** Signed: positive = money in, negative = money out. */
  amount: number;
  kind: 'invoice' | 'expense';
  invoice_id?: string;
  client_id?: string;
}

export type ScenarioChange =
  | { id: string; kind: 'delay'; client_id: string; client_name: string; days: number; label: string }
  | { id: string; kind: 'skip'; client_id: string; client_name: string; label: string }
  | { id: string; kind: 'expense'; amount: number; date: string; note: string; label: string };

export interface Scenario {
  changes: ScenarioChange[];
}

export interface RecoveryPlan {
  client_id: string;
  client_name: string;
  invoice_id: string;
  amount: number;
  from_low: number;
  to_low: number;
  low_date: string;
}

export interface Forecast {
  today: string;
  days: number;
  opening_cash: number;
  safe_buffer: number;
  baseline: ForecastPoint[];
  baseline_low: LowPoint;
  scenario?: ForecastPoint[];
  scenario_low?: LowPoint;
  applied?: Scenario;
  recovery?: RecoveryPlan;
  events: CashEvent[];
}

export type ParseAskResult = { ok: true; changes: ScenarioChange[] } | { ok: false; message: string };

/* ---------- View models ---------- */

export interface UpcomingItem {
  id: string;
  date: string;
  label: string;
  amount: number;
  direction: 'in' | 'out' | 'task';
  href?: string;
}

export interface Dashboard {
  owner_first_name: string;
  studio_name: string;
  today: string;
  opening_cash: number;
  outstanding: number;
  outstanding_clients: number;
  overdue: number;
  overdue_count: number;
  pending_claims: number;
  forecast: Forecast;
  priority_alert: Alert;
  next_7_days: UpcomingItem[];
}

export interface BadDayItem {
  invoice: Invoice;
  client: Client;
  booking_title: string;
  outstanding: number;
  /** Negative when overdue. */
  due_in_days: number;
  urgency: number;
  reason: string;
  action: 'remind' | 'review_claim';
  reminded_on?: string;
}

export interface BadDay {
  today: string;
  overdue_total: number;
  due_soon_total: number;
  items: BadDayItem[];
}

export interface InvoiceSummary {
  invoice: Invoice;
  client_name: string;
  client_company?: string;
  booking_title: string;
  outstanding: number;
  pending_claim?: PaymentClaim;
}

export interface InvoiceDetail {
  invoice: Invoice;
  client: Client;
  booking: Booking;
  milestones: Invoice[];
  outstanding: number;
  pay_link: string;
  pending_claim?: PaymentClaim;
  today: string;
}

export interface RecordPaymentInput {
  invoice_id: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
}

/** Public pay page payload. Deliberately contains NO internal fields. */
export interface PayPage {
  studio_name: string;
  client_first_name: string;
  invoice_number: string;
  milestone_label: string;
  amount_due: number;
  due_date: string;
  upi_id: string;
  upi_uri: string;
  bank: { account_name: string; bank_name: string; account_number_masked: string; ifsc: string };
  claim_pending: boolean;
}

export interface ClaimInput {
  claimedAmount: number;
  reference: string;
}

export interface QuickAddDraft {
  client_name: string;
  phone?: string;
  title: string;
  event_date: string;
  total_amount: number;
  advance_percentage: number;
  mid_percentage: number;
  final_percentage: number;
}

export type ParseQuickAddResult =
  | { ok: true; draft: QuickAddDraft; detected: Partial<Record<keyof QuickAddDraft, boolean>> }
  | { ok: false; reason: string };

export interface QuickAddResult {
  client_id: string;
  booking_id: string;
  invoice_ids: string[];
}

export interface SettingsStatus {
  supabase: { connected: boolean; project: string; region: string };
  ai: { provider: string; parse_model: string; draft_model: string; status: 'ok' | 'degraded' | 'down' };
  studio: { owner: string; studio_name: string; upi_id: string; safe_buffer: number };
}

export interface TestAiResult {
  ok: boolean;
  latency_ms: number;
  model: string;
}

export interface ClientSummary {
  client: Client;
  outstanding: number;
  bookings: number;
  next_due?: string;
}

export interface BookingSummary {
  booking: Booking;
  client_name: string;
  collected: number;
  outstanding: number;
  days_to_event: number;
}

export interface PricingInputs {
  fixed_costs: { label: string; amount: number }[];
  safe_buffer: number;
  average_booking: number;
  weighted_delay_days: number;
  typical_invoice: number;
  /** Editable assumption, % per month. */
  cost_of_money_pct: number;
}
