'use client';

import React, { useEffect, useState } from 'react';
import { SettingsScreen } from '@/components/screens/SettingsScreen';
import { readTheme, writeTheme, applyTheme, type Theme } from '@/lib/theme';
import type { SettingsStatus, TestAiResult } from '@/lib/types';

export default function SettingsPage() {
  const [theme, setTheme] = useState<Theme>('light');
  const [status, setStatus] = useState<SettingsStatus>({
    supabase: {
      connected: false,
      project: 'In-Memory Demo',
      region: 'local memory',
    },
    ai: {
      provider: 'Local Rule Parser',
      parse_model: 'Rule-based fallback',
      draft_model: 'Deterministic Templates',
      status: 'ok',
    },
    studio: {
      owner: 'Arjun Visuals',
      studio_name: 'Arjun Visuals',
      upi_id: 'arjunvisuals@okaxis',
      safe_buffer: 50000,
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentTheme = readTheme();
    setTheme(currentTheme);

    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setStatus({
            supabase: {
              connected: data.dataMode === 'supabase',
              project: data.dataMode === 'supabase' ? 'payday-prod' : 'In-Memory Demo',
              region: data.dataMode === 'supabase' ? 'ap-south-1 (Mumbai)' : 'local memory',
            },
            ai: {
              provider: data.llmConfigured ? 'Groq / OpenRouter' : 'Rule-based fallback',
              parse_model: data.primaryModel || 'Local Rule Parser',
              draft_model: data.fallbackModel || 'Deterministic Templates',
              status: 'ok',
            },
            studio: {
              owner: 'Arjun Visuals',
              studio_name: 'Arjun Visuals',
              upi_id: 'arjunvisuals@okaxis',
              safe_buffer: 50000,
            },
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    writeTheme(newTheme);
    applyTheme(newTheme);
  };

  const handleTestAi = async (): Promise<TestAiResult> => {
    const started = performance.now();
    try {
      const res = await fetch('/api/ai/test', { method: 'POST' });
      const data = await res.json();
      return {
        ok: Boolean(data.ok),
        latency_ms: data.latencyMs || Math.round(performance.now() - started),
        model: data.modelUsed || 'AI Model',
      };
    } catch {
      return {
        ok: false,
        latency_ms: Math.round(performance.now() - started),
        model: 'Failed',
      };
    }
  };

  if (loading) {
    return (
      <div className="space-y-5 animate-in fade-in duration-150">
        <div className="h-16 w-48 rounded-2xl bg-surface border border-line" />
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="h-64 rounded-2xl bg-surface border border-line" />
          <div className="h-64 rounded-2xl bg-surface border border-line" />
        </div>
      </div>
    );
  }

  return (
    <SettingsScreen
      status={status}
      theme={theme}
      onThemeChange={handleThemeChange}
      onTestAi={handleTestAi}
    />
  );
}
