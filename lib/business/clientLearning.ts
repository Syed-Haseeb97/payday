// Client Learning Module: Updates client payment behavior from real payments.
// Recalculates average_delay_days and payment_reliability when an invoice is fully paid.

import { PaymentReliability } from '../db/types';
import { daysBetween } from '../forecast';

// Named constants for exponential smoothing weights
export const WEIGHT_OLD_AVERAGE = 0.7;
export const WEIGHT_NEW_PAYMENT = 0.3;

// Named thresholds for payment reliability boundaries
export const THRESHOLD_RELIABLE = 2; // reliable up to 2 days late
export const THRESHOLD_AVERAGE = 9;  // average up to 9 days late
export const THRESHOLD_SLOW = 14;    // slow up to 14 days late
// Above 14 days is 'unreliable'

/**
 * Re-derives payment_reliability from averageDelayDays using standardized thresholds.
 * A client with no completed payments stays 'new'.
 */
export function derivePaymentReliability(
  averageDelayDays: number,
  hasCompletedPayments: boolean = true
): PaymentReliability {
  if (!hasCompletedPayments) {
    return 'new';
  }
  if (averageDelayDays <= THRESHOLD_RELIABLE) {
    return 'reliable';
  }
  if (averageDelayDays <= THRESHOLD_AVERAGE) {
    return 'average';
  }
  if (averageDelayDays <= THRESHOLD_SLOW) {
    return 'slow';
  }
  return 'unreliable';
}

export interface ClientPaymentLearningResult {
  lateDays: number;
  newAverage: number;
  newReliability: PaymentReliability;
}

/**
 * Computes updated average_delay_days and payment_reliability for a fully paid invoice.
 * lateDays = max(0, paymentDate minus dueDate in days, computed in India time)
 * newAverage = round(0.7 * oldAverage + 0.3 * lateDays)
 */
export function computeClientPaymentLearning(
  oldAverage: number,
  dueDateYmd: string,
  paymentDateYmd: string
): ClientPaymentLearningResult {
  // Positive when paymentDate > dueDate (i.e. late)
  const diffDays = daysBetween(dueDateYmd, paymentDateYmd);
  const lateDays = Math.max(0, diffDays);

  const newAverage = Math.round(
    WEIGHT_OLD_AVERAGE * oldAverage + WEIGHT_NEW_PAYMENT * lateDays
  );
  const newReliability = derivePaymentReliability(newAverage, true);

  return {
    lateDays,
    newAverage,
    newReliability,
  };
}
