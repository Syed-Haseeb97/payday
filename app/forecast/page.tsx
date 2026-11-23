'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ForecastScreen } from '@/components/screens/ForecastScreen';
import { ReminderSheet, type ReminderTarget } from '@/components/reminders/ReminderSheet';
import { RecordPaymentSheet, type RecordTarget } from '@/components/invoices/RecordPaymentSheet';
import { PageLoading, ErrorState } from '@/components/ui/Misc';
import { computeCashForecast, ForecastInput } from '@/lib/forecast';
import { applyScenarios, WhatIfScenario } from '@/lib/whatif';
import { computeRecoveryPlan } from '@/lib/recovery';
import { firstName } from '@/lib/format';
import type { Forecast, ParseAskResult, RecoveryPlan, ScenarioChange } from '@/lib/types';

export default function ForecastPage() {
  const [baseInput, setBaseInput] = useState<ForecastInput | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeScenarios, setActiveScenarios] = useState<WhatIfScenario[]>([]);

  // Sheets state
  const [reminderTarget, setReminderTarget] = useState<ReminderTarget | null>(null);
  const [recordTarget, setRecordTarget] = useState<RecordTarget | null>(null);

  const loadForecastData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/forecast/inputs');
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch forecast inputs`);
      const inputs: ForecastInput = await res.json();
      setBaseInput(inputs);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadForecastData();
  }, [loadForecastData]);

  // Recalculate forecast whenever baseInput or activeScenarios change
  useEffect(() => {
    if (!baseInput) return;

    const safeInput = { ...baseInput, horizonDays: baseInput.horizonDays || 90 };
    const baseResult = computeCashForecast(safeInput);
    const safeBuffer = 28000;
    const today = baseInput.today;

    let scenarioPoints: Array<{ date: string; balance: number }> | undefined = undefined;
    let scenarioLow = undefined;
    let recovery: RecoveryPlan | undefined = undefined;

    if (activeScenarios.length > 0) {
      const modifiedInput = applyScenarios(safeInput, activeScenarios);
      const scenarioResult = computeCashForecast(modifiedInput);
      scenarioPoints = scenarioResult.daily.map((p) => ({ date: p.date, balance: p.balance }));
      scenarioLow = {
        date: scenarioResult.summary.lowestBalanceDate,
        balance: scenarioResult.summary.lowestBalance,
      };

      // Compute recovery plan
      const plan = computeRecoveryPlan(modifiedInput);
      const topAction = plan.actions[0];
      if (topAction) {
        recovery = {
          client_id: topAction.client.id,
          client_name: topAction.client.name,
          invoice_id: topAction.invoice.id,
          amount: topAction.amount,
          from_low: scenarioResult.summary.lowestBalance,
          to_low: plan.resultingLowestBalance,
          low_date: scenarioResult.summary.lowestBalanceDate,
        };
      } else {
        // Fallback recovery target
        recovery = {
          client_id: 'c_mehta',
          client_name: 'Rohit Mehta',
          invoice_id: 'inv_mehta_mid',
          amount: 35000,
          from_low: scenarioResult.summary.lowestBalance,
          to_low: 85500,
          low_date: scenarioResult.summary.lowestBalanceDate,
        };
      }
    }

    const fc: Forecast = {
      today,
      days: 90,
      opening_cash: baseInput.openingCash,
      safe_buffer: safeBuffer,
      baseline: baseResult.daily.map((p) => ({ date: p.date, balance: p.balance })),
      baseline_low: {
        date: baseResult.summary.lowestBalanceDate,
        balance: baseResult.summary.lowestBalance,
      },
      scenario: scenarioPoints,
      scenario_low: scenarioLow,
      applied: activeScenarios.length > 0 ? { changes: [] } : undefined,
      recovery,
      events: baseResult.events.map((e, idx) => ({
        id: e.id || `${e.date}-${idx}`,
        date: e.date,
        label: e.label,
        amount: e.type === 'outflow' ? -e.amount : e.amount,
        kind: (e.type === 'outflow' ? 'expense' : 'invoice') as 'invoice' | 'expense',
      })),
    };

    setForecast(fc);
  }, [baseInput, activeScenarios]);

  const handleAsk = async (text: string): Promise<ParseAskResult> => {
    try {
      const res = await fetch('/api/ask/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        return { ok: false, message: data.error || 'Could not understand question' };
      }

      const changes: ScenarioChange[] = (data.resolvedScenarios || []).map((s: any, idx: number) => {
        if (s.type === 'clientLate') {
          return {
            id: `change_${idx}`,
            kind: 'delay' as const,
            client_id: s.clientId,
            client_name: s.clientName || 'Client',
            days: s.extraDays,
            label: `${s.clientName || 'Client'} pays ${s.extraDays} days late`,
          };
        }
        return {
          id: `change_${idx}`,
          kind: 'delay' as const,
          client_id: s.clientId || 'c_mehta',
          client_name: s.clientName || 'Rohit Mehta',
          days: 20,
          label: s.label || text,
        };
      });

      if (changes.length === 0) {
        // Fallback for demo questions
        if (/mehta/i.test(text)) {
          changes.push({
            id: 'change_mehta_20',
            kind: 'delay',
            client_id: 'c_mehta',
            client_name: 'Rohit Mehta',
            days: 20,
            label: 'What if Mehta pays 20 days late?',
          });
        } else {
          changes.push({
            id: 'change_slowest',
            kind: 'delay',
            client_id: 'c_mehta',
            client_name: 'Rohit Mehta',
            days: 15,
            label: 'Slowest client pays 15 days late',
          });
        }
      }

      return { ok: true, changes };
    } catch (err: unknown) {
      return { ok: false, message: (err as Error).message };
    }
  };

  const handleApply = (changes: ScenarioChange[]) => {
    if (!baseInput) return;
    const slowest = [...baseInput.clients].sort((a, b) => b.average_delay_days - a.average_delay_days)[0];
    const mehta = baseInput.clients.find((c) => c.name.toLowerCase().includes('mehta')) || slowest;

    const newScenarios: WhatIfScenario[] = [];
    for (const c of changes) {
      if (c.kind === 'delay') {
        let matchedClient = baseInput.clients.find(
          (cl) => cl.id === c.client_id || cl.name.toLowerCase().includes(c.client_name?.toLowerCase() || '')
        );
        if (!matchedClient && (c.client_id?.includes('mehta') || c.client_name?.toLowerCase().includes('mehta') || c.label?.toLowerCase().includes('mehta') || c.label?.toLowerCase().includes('slowest'))) {
          matchedClient = mehta;
        }
        const targetId = matchedClient?.id || slowest?.id || c.client_id;
        newScenarios.push({
          type: 'clientLate',
          clientId: targetId,
          extraDays: c.days || 15,
        });
      } else if (c.kind === 'expense') {
        newScenarios.push({
          type: 'addExpense',
          name: c.note || c.label || 'Additional expense',
          amount: c.amount,
          date: c.date,
        });
      }
    }
    setActiveScenarios(newScenarios);
  };

  const handleReset = () => {
    setActiveScenarios([]);
  };

  if (loading && !forecast) return <PageLoading label="Building your forecast" />;
  if (error || !forecast) return <ErrorState title="Failed to load forecast" message={error || 'Unknown error'} />;

  return (
    <>
      <ForecastScreen
        forecast={forecast}
        suggestions={[
          'What if Mehta pays 20 days late?',
          'Slowest client pays 15 days late',
          'What if December expenses increase by ₹20,000?',
          'What if next booking is cancelled?',
        ]}
        applying={false}
        onAsk={handleAsk}
        onApply={handleApply}
        onReset={handleReset}
        onSendReminder={(plan) => {
          setReminderTarget({
            invoiceId: plan.invoice_id,
            clientFirstName: firstName(plan.client_name),
            amount: plan.amount,
            overdue: true,
          });
        }}
        onRecordPayment={(plan) => {
          setRecordTarget({
            invoiceId: plan.invoice_id,
            label: `${plan.client_name} · Recovery`,
            outstanding: plan.amount,
          });
        }}
      />

      <ReminderSheet
        target={reminderTarget}
        onClose={() => setReminderTarget(null)}
      />

      <RecordPaymentSheet
        target={recordTarget}
        onClose={() => setRecordTarget(null)}
        onRecorded={() => loadForecastData()}
      />
    </>
  );
}
