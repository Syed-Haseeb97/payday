import { WhatIfScenario } from './index';

export type AskScenarioCandidateType =
  | 'clientLate'
  | 'loseBooking'
  | 'addExpense'
  | 'invoicePaidEarly';

export interface AskScenarioCandidate {
  type: AskScenarioCandidateType;
  clientText?: string;
  bookingText?: string;
  invoiceText?: string;
  extraDays?: number;
  amount?: number;
  date?: string;
  name?: string;
}

export interface AskPaydayCandidateResult {
  scenarios: AskScenarioCandidate[];
  mode: 'ai' | 'rules';
  rawQuestion: string;
}

export interface AskPaydayResolvedScenario {
  scenario: WhatIfScenario;
  displayText: string;
  type: WhatIfScenario['type'];
  originalCandidate: AskScenarioCandidate;
}

export interface AskPaydayAmbiguity {
  scenarioIndex: number;
  type: 'client' | 'booking';
  query: string;
  candidates: { id: string; name: string }[];
}

export interface AskPaydayResponse {
  ok: boolean;
  mode: 'ai' | 'rules';
  rawQuestion: string;
  resolvedScenarios: AskPaydayResolvedScenario[];
  ambiguities: AskPaydayAmbiguity[];
  warnings: string[];
}
