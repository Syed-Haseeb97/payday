// What-If Scenario Simulation Engine (Deterministic Code Placeholder)
// Supports: "client X pays N days late", "lose booking Y", "add expense Z"

export interface WhatIfScenarioInput {
  clientDelayOverrides?: Record<string, number>; // clientId -> extra delay days
  excludedBookingIds?: string[];                  // canceled/lost bookings
  addedExpenses?: Array<{ name: string; amount: number; date: string }>;
}

export interface WhatIfComparison {
  baselineLowestPoint: number;
  simulatedLowestPoint: number;
  lowestPointDelta: number;
  runwayDaysBaseline: number;
  runwayDaysSimulated: number;
}

export function simulateWhatIfPlaceholder(_scenario: WhatIfScenarioInput): WhatIfComparison {
  // Stub structure ready for deterministic calculation in next step
  return {
    baselineLowestPoint: 12000,
    simulatedLowestPoint: -8000,
    lowestPointDelta: -20000,
    runwayDaysBaseline: 90,
    runwayDaysSimulated: 42,
  };
}
