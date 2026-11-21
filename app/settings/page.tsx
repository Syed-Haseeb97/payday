'use client';

import React, { useEffect, useState } from 'react';
import { 
  IndianRupee, 
  RotateCcw, 
  Lock, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw,
  Server,
  Sparkles,
  Zap
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface SystemStatus {
  dataMode: 'demo' | 'supabase';
  llmConfigured: boolean;
  primaryModel: string;
  fallbackModel: string;
  resetEnabled: boolean;
}

export default function SettingsPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [isDemo, setIsDemo] = useState(true);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const [testingAi, setTestingAi] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data: SystemStatus) => {
        if (data && data.dataMode) {
          setStatus(data);
          setIsDemo(data.dataMode === 'demo');
        }
      })
      .catch(() => {});
  }, []);

  const handleTestAi = async () => {
    setTestingAi(true);
    setAiTestResult(null);
    try {
      const res = await fetch('/api/ai/test', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setAiTestResult({
          ok: false,
          message: data.error || 'Rate limit exceeded or request error.',
        });
        return;
      }

      if (data.ok) {
        setAiTestResult({
          ok: true,
          message: `Connected successfully (${data.latencyMs}ms) using ${data.modelUsed}.`,
        });
      } else {
        let desc = 'Connection failed.';
        if (data.errorKind === 'not_configured') {
          desc = 'AI is not configured. Set the required LLM environment variables (base URL, key, model) in your server environment to enable real AI drafts.';
        } else if (data.errorKind === 'timeout') {
          desc = 'Request timed out after 10 seconds.';
        } else if (data.errorKind === 'http_error') {
          desc = 'LLM API endpoint returned an HTTP error. Verify your API key and model name.';
        } else if (data.errorKind === 'empty_response') {
          desc = 'LLM API returned an empty completion.';
        } else {
          desc = 'Unable to reach configured LLM endpoint.';
        }
        setAiTestResult({ ok: false, message: desc });
      }
    } catch {
      setAiTestResult({
        ok: false,
        message: 'Network error checking AI connection.',
      });
    } finally {
      setTestingAi(false);
    }
  };

  const handleResetConfirm = async () => {
    setResetting(true);
    setResetError(null);
    try {
      const res = await fetch('/api/demo/reset', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reset demo dataset');
      }
      setResetSuccess(true);
      setTimeout(() => {
        setIsResetOpen(false);
        setResetSuccess(false);
        window.location.reload();
      }, 1000);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Error executing reset');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif italic text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
            Settings
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)] font-mono">
            System status, AI configuration, opening cash, and demo data controls
          </p>
        </div>
      </div>

      {/* System Status Card */}
      <div className="p-6 rounded-2xl app-card bg-[var(--bg-surface)] border border-[var(--border-line)] space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold">
            <Server className="w-4 h-4 text-[var(--text-muted)]" />
            <span>System Status &amp; AI Integration</span>
          </div>
          <span className={`inline-flex px-2.5 py-1 rounded-full border font-mono text-[10px] uppercase tracking-wider font-semibold ${
            status?.dataMode === 'supabase'
              ? 'border-[var(--money-in)] bg-[var(--money-in-bg)] text-[var(--money-in)]'
              : 'border-[var(--border-line)] bg-[var(--bg-surface-subtle)] text-[var(--text-muted)]'
          }`}>
            Mode: {status?.dataMode === 'supabase' ? 'Supabase Postgres' : 'In-Memory Demo'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-3.5 rounded-xl border border-[var(--border-line)] bg-[var(--bg-surface-subtle)] space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
              AI Reminders &amp; Parsing
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                status?.llmConfigured ? 'bg-[var(--money-in)]' : 'bg-[var(--money-warn)]'
              }`} />
              <span className="font-mono text-sm font-medium text-[var(--text-primary)]">
                {status?.llmConfigured ? 'AI drafts on' : 'Using templates'}
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-faint)] font-mono">
              {status?.llmConfigured 
                ? 'External LLM configured with automated fallback to templates.' 
                : '100% offline deterministic templates active.'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-[var(--border-line)] bg-[var(--bg-surface-subtle)] space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
              Configured Models
            </div>
            <div className="font-mono text-xs text-[var(--text-primary)] truncate">
              Primary: <span className="font-semibold">{status?.primaryModel || 'None'}</span>
            </div>
            <div className="font-mono text-xs text-[var(--text-muted)] truncate">
              Fallback: <span>{status?.fallbackModel || 'None'}</span>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-[var(--border-line-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-[var(--text-faint)] font-mono">
            Test the live server-to-LLM connection with a lightweight probe.
          </p>
          <button
            type="button"
            disabled={testingAi}
            onClick={handleTestAi}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border-line)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-mono font-medium text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors self-start sm:self-auto touch-target disabled:opacity-50"
          >
            {testingAi ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Testing...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Test AI connection</span>
              </>
            )}
          </button>
        </div>

        {aiTestResult && (
          <div className={`p-3 rounded-xl border text-xs font-mono flex items-start gap-2 ${
            aiTestResult.ok
              ? 'border-[var(--money-in)] bg-[var(--money-in-bg)] text-[var(--money-in)]'
              : 'border-[var(--money-warn)] bg-[var(--money-warn-bg)] text-[var(--money-warn)]'
          }`}>
            {aiTestResult.ok ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed">{aiTestResult.message}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cash & Currency */}
        <div className="p-6 rounded-2xl app-card bg-[var(--bg-surface)] border border-[var(--border-line)] space-y-4">
          <div className="flex items-center gap-2 text-sm font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold">
            <IndianRupee className="w-4 h-4 text-[var(--text-muted)]" />
            <span>Cash &amp; Regional Formatting</span>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Opening Cash Reserve
              </label>
              <input
                type="text"
                disabled
                defaultValue="₹1,40,000"
                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-line)] bg-[var(--bg-surface-subtle)] text-[var(--text-primary)] font-mono text-sm opacity-80 cursor-not-allowed"
              />
              <span className="text-[11px] text-[var(--text-faint)] mt-1 block font-mono">
                Opening cash for 90-day balance projections.
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Currency &amp; Locale
              </label>
              <input
                type="text"
                disabled
                defaultValue="INR (₹) · en-IN (Lakhs / Crores)"
                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-line)] bg-[var(--bg-surface-subtle)] text-[var(--text-primary)] font-mono text-sm opacity-80 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Demo Account Info */}
        <div className="p-6 rounded-2xl app-card bg-[var(--bg-surface)] border border-[var(--border-line)] space-y-4">
          <div className="flex items-center gap-2 text-sm font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold">
            <Lock className="w-4 h-4 text-[var(--text-muted)]" />
            <span>Account Profile (Single Demo User)</span>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Photographer Name &amp; Studio
              </label>
              <input
                type="text"
                disabled
                defaultValue="Arjun Verma · Arjun Visuals"
                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-line)] bg-[var(--bg-surface-subtle)] text-[var(--text-primary)] font-mono text-sm opacity-80 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">
                UPI ID for Payment Links &amp; Reminders
              </label>
              <input
                type="text"
                disabled
                defaultValue="arjunvisuals@okaxis"
                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-line)] bg-[var(--bg-surface-subtle)] text-[var(--text-primary)] font-mono text-sm opacity-80 cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Demo Data Management & Reset Action */}
      <div className="p-6 rounded-2xl app-card bg-[var(--bg-surface)] border border-[var(--border-line)] space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold">
              <RotateCcw className="w-4 h-4 text-[var(--money-warn)]" />
              <span>Demo Dataset Control</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] font-sans">
              Restore the initial 8 clients, 25 bookings, milestone invoices, and expenses relative to today.
            </p>
          </div>
          <span className="inline-flex px-2.5 py-1 rounded-full border border-[var(--money-warn)] bg-[var(--money-warn-bg)] font-mono text-[10px] uppercase tracking-wider text-[var(--money-warn)] font-semibold">
            {isDemo ? 'In-Memory Demo' : 'Supabase Connected'}
          </span>
        </div>

        {/* Note on relative to today per Section 7 */}
        {(isDemo || status?.resetEnabled) && (
          <div className="p-3 rounded-xl border border-[var(--border-line-subtle)] bg-[var(--bg-surface-subtle)] text-xs font-mono text-[var(--text-muted)] flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[var(--money-in)] flex-shrink-0" />
            <span>Demo data dates are relative to today.</span>
          </div>
        )}

        <div className="pt-3 border-t border-[var(--border-line-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-xs text-[var(--text-faint)] font-mono">
            Useful if you tested Quick Add or marked invoices as paid during an evaluation.
          </p>
          <button
            type="button"
            onClick={() => setIsResetOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--money-warn)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-mono font-medium text-[var(--money-warn)] hover:bg-[var(--money-warn-bg)] transition-colors self-start sm:self-auto touch-target"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isResetOpen}
        onClose={() => !resetting && setIsResetOpen(false)}
        title="Reset Demo Dataset?"
      >
        <div className="space-y-4 pt-1">
          <div className="p-3.5 rounded-xl border border-[var(--money-warn)] bg-[var(--money-warn-bg)] text-xs text-[var(--money-warn)] flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              This will wipe all newly added bookings, customized invoices, and payment records, and restore the initial synthetic dataset with dates aligned to today.
            </p>
          </div>

          {resetSuccess && (
            <div className="p-3 rounded-xl border border-[var(--money-in)] bg-[var(--money-in-bg)] text-xs text-[var(--money-in)] flex items-center gap-2 font-mono">
              <CheckCircle2 className="w-4 h-4" />
              <span>Demo data successfully reset! Refreshing...</span>
            </div>
          )}

          {resetError && (
            <div className="p-3 rounded-xl border border-[var(--money-out)] bg-[var(--money-out-bg)] text-xs text-[var(--money-out)] font-mono">
              {resetError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-line)]">
            <button
              type="button"
              disabled={resetting}
              onClick={() => setIsResetOpen(false)}
              className="px-4 py-2 rounded-full border border-[var(--border-line)] bg-[var(--bg-surface)] text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={resetting || resetSuccess}
              onClick={handleResetConfirm}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--money-warn)] text-white text-xs font-mono font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {resetting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Resetting...</span>
                </>
              ) : (
                <span>Confirm &amp; Reset</span>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
