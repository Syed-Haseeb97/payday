'use client';

import { Cpu, Database, Moon, Sun, Zap, CircleCheck } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Segmented } from '@/components/ui/Field';
import { PageHeader } from '@/components/ui/Misc';
import { formatINR } from '@/lib/format';
import type { Theme } from '@/lib/theme';
import type { SettingsStatus, TestAiResult } from '@/lib/types';

interface Props {
  status: SettingsStatus;
  theme: Theme;
  onThemeChange: (t: Theme) => void;
  onTestAi: () => Promise<TestAiResult>;
}

export function SettingsScreen({ status, theme, onThemeChange, onTestAi }: Props) {
  const [test, setTest] = useState<{ state: 'idle' | 'loading' | 'done' | 'failed'; result?: TestAiResult }>({ state: 'idle' });

  async function run() {
    setTest({ state: 'loading' });
    try {
      const result = await onTestAi();
      setTest({ state: result.ok ? 'done' : 'failed', result });
    } catch {
      setTest({ state: 'failed' });
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Settings" title="Studio & system" />
      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        <Card as="section" aria-labelledby="ai-title">
          <div className="flex items-start justify-between gap-3">
            <h2 id="ai-title" className="font-semibold">
              AI status
            </h2>
            <Chip tone={status.ai.status === 'ok' ? 'in' : 'warn'} icon={CircleCheck}>
              {status.ai.status === 'ok' ? 'All systems normal' : 'Degraded'}
            </Chip>
          </div>
          <dl className="mt-4 space-y-3">
            <Row icon={<Database className="size-4" aria-hidden />} label="Database">
              <span className="font-semibold text-in">{status.supabase.connected ? 'Supabase connected' : 'In-Memory Demo'}</span>
              <span className="block text-xs text-ink-3">
                {status.supabase.project} · {status.supabase.region}
              </span>
            </Row>
            <Row icon={<Cpu className="size-4" aria-hidden />} label="Parsing model">
              <span className="num font-semibold">{status.ai.parse_model || 'Local Rule Parser'}</span>
            </Row>
            <Row icon={<Cpu className="size-4" aria-hidden />} label="Drafting model">
              <span className="num font-semibold">{status.ai.draft_model || 'Deterministic Templates'}</span>
            </Row>
          </dl>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button icon={Zap} onClick={run} state={test.state === 'loading' ? 'loading' : test.state === 'done' ? 'done' : 'idle'} doneLabel="Connection OK" loadingLabel="Testing…">
              Test AI connection
            </Button>
            <p className="text-sm text-ink-2" aria-live="polite">
              {test.state === 'done' && test.result ? (
                <span>
                  <span className="num">{test.result.model}</span> replied in <span className="num">{test.result.latency_ms} ms</span>
                </span>
              ) : test.state === 'failed' ? (
                <span className="text-out">Couldn't reach the AI gateway.</span>
              ) : null}
            </p>
          </div>
        </Card>

        <div className="space-y-5 lg:space-y-6">
          <Card as="section" aria-labelledby="look-title">
            <SectionTitle id="look-title">Appearance</SectionTitle>
            <Segmented
              legend="Theme"
              value={theme}
              onChange={onThemeChange}
              options={[
                { value: 'dark', label: <><Moon className="size-4" aria-hidden />Dark</> },
                { value: 'light', label: <><Sun className="size-4" aria-hidden />Light</> },
              ]}
            />
          </Card>
          <Card as="section" aria-labelledby="studio-title">
            <SectionTitle id="studio-title">Studio</SectionTitle>
            <dl className="divide-y divide-line">
              {[
                ['Owner', status.studio.owner],
                ['Studio', status.studio.studio_name],
                ['UPI ID', status.studio.upi_id],
                ['Safe buffer', formatINR(status.studio.safe_buffer)],
              ].map(([k, v]) => (
                <div key={k} className="flex min-h-12 items-center justify-between gap-3">
                  <dt className="text-ink-2">{k}</dt>
                  <dd className="num font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-line bg-surface-2 p-3">
      <span className="mt-0.5 text-ink-3">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-ink-3">{label}</p>
        <div className="mt-0.5 text-sm">{children}</div>
      </div>
    </div>
  );
}
