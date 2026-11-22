// Payday Alerts Engine
// Pure functions in lib/alerts, derived on request from deterministic rules.
// Every alert ends in a single typed action.

import { Client, Invoice } from '../db/types';
import {
  computeCashForecast,
  daysBetween,
  ForecastInput,
  ForecastResult,
  SAFE_BUFFER_PERCENTAGE,
} from '../forecast';
import { formatINR } from '../money';
import { format, parseISO } from 'date-fns';

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertActionType = 'reminder' | 'heads_up' | 'link';

export interface AlertAction {
  type: AlertActionType;
  label: string;
  href?: string;
  params?: {
    invoiceId?: string;
  };
}

export interface GeneratedAlert {
  id: string; // Stable ID: rule_name + entity_id
  severity: AlertSeverity;
  title: string;
  message: string;
  action: AlertAction;
  ruleName: string;
  entityId?: string;
}

export interface AlertFilterOptions {
  dismissedIds?: Set<string>;
  snoozedUntilMap?: Map<string, string>; // alertId -> ISO timestamp
  nowIso?: string;
}

/**
 * Derives actionable alerts deterministically from current invoices, clients, and cash forecast.
 */
export function deriveAlerts(
  input: ForecastInput,
  options?: AlertFilterOptions
): GeneratedAlert[] {
  const { today, invoices, clients, openingCash } = input;
  const clientMap = new Map<string, Client>(clients.map((c) => [c.id, c]));
  const alerts: GeneratedAlert[] = [];

  const dismissedIds = options?.dismissedIds || new Set<string>();
  const snoozedUntilMap = options?.snoozedUntilMap || new Map<string, string>();
  const nowIso = options?.nowIso || today;

  // 1. Evaluate Invoices
  for (const inv of invoices) {
    const balance = inv.amount - inv.paid_amount;
    if (balance <= 0.001) continue; // paid

    const client = clientMap.get(inv.client_id) || {
      id: inv.client_id,
      user_id: inv.user_id,
      name: 'Client',
      payment_reliability: 'average',
      average_delay_days: 0,
      created_at: '',
      updated_at: '',
    };

    const diff = daysBetween(today, inv.due_date);
    const isOverdue = diff < 0;
    const daysOverdue = isOverdue ? Math.abs(diff) : 0;
    const daysUntilDue = !isOverdue ? diff : 0;

    // Rule 1: Invoice 1-7 days overdue -> Warning, Action "Send reminder"
    if (daysOverdue >= 1 && daysOverdue <= 7) {
      alerts.push({
        id: `overdue_1_7_${inv.id}`,
        ruleName: 'overdue_1_7',
        entityId: inv.id,
        severity: 'warning',
        title: `${client.name} Invoice Overdue`,
        message: `Invoice #${inv.invoice_number} (${inv.milestone_label}) for ${formatINR(balance)} is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue.`,
        action: {
          type: 'reminder',
          label: 'Send reminder',
          params: { invoiceId: inv.id },
        },
      });
    }

    // Rule 2: Invoice 8+ days overdue -> Critical, Action "Send reminder"
    if (daysOverdue >= 8) {
      alerts.push({
        id: `overdue_8_plus_${inv.id}`,
        ruleName: 'overdue_8_plus',
        entityId: inv.id,
        severity: 'critical',
        title: `${client.name} Seriously Overdue`,
        message: `Invoice #${inv.invoice_number} (${inv.milestone_label}) for ${formatINR(balance)} is ${daysOverdue} days overdue. Follow-up urgently.`,
        action: {
          type: 'reminder',
          label: 'Send reminder',
          params: { invoiceId: inv.id },
        },
      });
    }

    // Rule 3: Invoice due in 3 days or less from below-average reliability client -> Info, Action "Send heads-up"
    const isBelowAverage =
      client.payment_reliability === 'slow' ||
      client.payment_reliability === 'unreliable';
    if (!isOverdue && daysUntilDue <= 3 && isBelowAverage) {
      alerts.push({
        id: `slow_due_soon_${inv.id}`,
        ruleName: 'slow_due_soon',
        entityId: inv.id,
        severity: 'info',
        title: `Upcoming Due from Slow Payer`,
        message: `${client.name} has a ${formatINR(balance)} milestone due ${daysUntilDue === 0 ? 'today' : `in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`}. They usually delay by ~${client.average_delay_days} days.`,
        action: {
          type: 'heads_up',
          label: 'Send heads-up',
          params: { invoiceId: inv.id },
        },
      });
    }

    // Rule 6: A single unpaid invoice larger than 30% of opening cash is due within 14 days -> Info, Action "Send heads-up"
    const isLarge = balance > openingCash * 0.3;
    if (!isOverdue && daysUntilDue <= 14 && isLarge) {
      alerts.push({
        id: `large_due_soon_${inv.id}`,
        ruleName: 'large_due_soon',
        entityId: inv.id,
        severity: 'info',
        title: `Large Milestone Due Soon`,
        message: `Invoice #${inv.invoice_number} (${client.name}) for ${formatINR(balance)} is due on ${format(parseISO(inv.due_date), 'd MMM')} (>30% of opening cash).`,
        action: {
          type: 'heads_up',
          label: 'Send heads-up',
          params: { invoiceId: inv.id },
        },
      });
    }
  }

  // 2. Evaluate Forecast Runway Rules
  const forecast = computeCashForecast(input);

  // Rule 4: Forecast goes below zero within horizon -> Critical, Action "See what-if" -> /forecast
  if (forecast.summary.firstNegativeDate && forecast.summary.lowestBalance < 0) {
    alerts.push({
      id: `forecast_below_zero_${forecast.summary.firstNegativeDate}`,
      ruleName: 'forecast_below_zero',
      entityId: forecast.summary.firstNegativeDate,
      severity: 'critical',
      title: `Cash Deficit Projected`,
      message: `Cash balance is projected to dip below zero (${formatINR(forecast.summary.lowestBalance)}) on ${format(parseISO(forecast.summary.firstNegativeDate), 'd MMM yyyy')}. You have ${forecast.summary.runwayDays ?? 0} days of runway.`,
      action: {
        type: 'link',
        label: 'See what-if',
        href: '/forecast#recovery-plan',
      },
    });
  } else if (forecast.summary.health === 'tight') {
    // Rule 5: Forecast is tight (positive but under 20% safe buffer) -> Warning, Action "See what-if"
    alerts.push({
      id: `forecast_tight_${forecast.summary.lowestBalanceDate}`,
      ruleName: 'forecast_tight',
      entityId: forecast.summary.lowestBalanceDate,
      severity: 'warning',
      title: `Tight Cash Runway`,
      message: `Cash projected to dip to ${formatINR(forecast.summary.lowestBalance)} on ${format(parseISO(forecast.summary.lowestBalanceDate), 'd MMM yyyy')} (under 20% safe buffer).`,
      action: {
        type: 'link',
        label: 'See what-if',
        href: '/forecast',
      },
    });
  }

  // 3. Filter out dismissed and active snoozed alerts
  const activeAlerts = alerts.filter((alert) => {
    // Dismissed check
    if (dismissedIds.has(alert.id)) {
      return false;
    }
    // Snoozed check
    const snoozedUntil = snoozedUntilMap.get(alert.id);
    if (snoozedUntil && snoozedUntil > nowIso) {
      return false;
    }
    return true;
  });

  // 4. Sort: critical first, then warning, then info
  const severityRank: Record<AlertSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };

  activeAlerts.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

  return activeAlerts;
}
