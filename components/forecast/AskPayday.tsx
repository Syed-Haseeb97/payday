'use client';

import React, { useState } from 'react';
import { Sparkles, ArrowRight, Check, X, HelpCircle, Loader2 } from 'lucide-react';
import { AskPaydayResponse, AskPaydayResolvedScenario } from '@/lib/whatif/ask-types';
import { WhatIfScenario } from '@/lib/whatif';

interface AskPaydayProps {
  onApplyScenarios: (scenarios: WhatIfScenario[]) => void;
}

const EXAMPLE_QUESTIONS = [
  'What if Mehta pays 20 days late?',
  'What if Mehta pays 3 weeks late and I buy a ₹90k lens on 5 Dec?',
  'What if I lose the Sharma winter booking?',
  'Rohit pays his overdue invoice tomorrow',
];

export function AskPayday({ onApplyScenarios }: AskPaydayProps) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<AskPaydayResponse | null>(null);
  const [stagedScenarios, setStagedScenarios] = useState<AskPaydayResolvedScenario[]>([]);

  const handleAsk = async (textToSubmit?: string) => {
    const q = (textToSubmit ?? question).trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    setPreview(null);

    try {
      const res = await fetch('/api/ask/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to interpret question');
      }

      const data: AskPaydayResponse = await res.json();
      setPreview(data);
      setStagedScenarios(data.resolvedScenarios || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error interpreting question';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const removeStagedScenario = (index: number) => {
    setStagedScenarios((prev) => prev.filter((_, i) => i !== index));
  };

  const applyStaged = () => {
    if (stagedScenarios.length > 0) {
      onApplyScenarios(stagedScenarios.map((s) => s.scenario));
      setPreview(null);
      setStagedScenarios([]);
      setQuestion('');
    }
  };

  const cancelPreview = () => {
    setPreview(null);
    setStagedScenarios([]);
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-line space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-line)] flex items-center justify-center text-[var(--text-primary)]">
            <Sparkles className="w-4 h-4 text-[#1D6B52]" />
          </div>
          <div>
            <h4 className="font-serif italic text-base font-bold text-[var(--text-primary)]">
              Ask Payday
            </h4>
            <p className="text-[11px] font-mono text-[var(--text-muted)]">
              Simulate cash what-ifs in plain language
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full border border-line bg-[var(--bg-surface-subtle)] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
          Natural Language
        </span>
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
        className="space-y-2.5"
      >
        <div className="relative">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={600}
            placeholder='e.g. "What if Mehta pays 20 days late?"'
            className="w-full text-xs font-sans rounded-xl border border-[var(--border-line)] bg-surface px-3.5 py-2.5 pr-20 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--border-focus)] transition-all"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-[#16181D] text-[#F5F3EE] text-[11px] font-mono font-medium hover:bg-[#2A2D35] disabled:opacity-50 transition-colors inline-flex items-center gap-1"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <span>Ask</span>
                <ArrowRight className="w-3 h-3" />
              </>
            )}
          </button>
        </div>

        {/* Example Prompt Chips */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] font-mono text-[var(--text-muted)] self-center mr-1">
            Try:
          </span>
          {EXAMPLE_QUESTIONS.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setQuestion(ex);
                handleAsk(ex);
              }}
              className="text-left text-[11px] font-mono px-2.5 py-1 rounded-lg border border-[var(--border-line)] bg-[var(--bg-surface-subtle)] hover:bg-[var(--bg-surface)] hover:border-[var(--text-muted)] text-[var(--text-primary)] transition-all truncate max-w-full"
            >
              &ldquo;{ex}&rdquo;
            </button>
          ))}
        </div>
      </form>

      {error && (
        <div className="p-3 rounded-xl border border-[#B53A26]/30 bg-[#F8E9E4] text-[#B53A26] text-xs font-mono">
          {error}
        </div>
      )}

      {/* Preview Card */}
      {preview && (
        <div className="p-3.5 rounded-xl border border-[#C8C2B5] bg-[var(--bg-surface-subtle)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
                Interpreted Scenarios
              </span>
              <span
                className={`font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  preview.mode === 'ai'
                    ? 'bg-[#E3EFE8] text-[#1D6B52] dark:bg-[#1D6B52]/20 dark:text-[#4ADE80]'
                    : 'bg-[#F6ECD9] text-[#86560D]'
                }`}
              >
                {preview.mode === 'ai' ? 'AI read' : 'Rules read'}
              </span>
            </div>

            <button
              type="button"
              onClick={cancelPreview}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 text-xs"
              title="Dismiss preview"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {stagedScenarios.length === 0 && preview.ambiguities.length === 0 && (
            <p className="text-xs text-[var(--text-muted)] font-mono">
              No matching what-if scenarios could be extracted from this question. Try mentioning client names, payment delays, or expense amounts.
            </p>
          )}

          {/* Staged removable scenario chips */}
          {stagedScenarios.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block">
                Click Apply to simulate:
              </span>
              {stagedScenarios.map((staged, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded-lg border border-[var(--border-line)] bg-surface text-xs font-mono"
                >
                  <span className="font-medium text-[var(--text-primary)] truncate pr-2">
                    {staged.displayText}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeStagedScenario(i)}
                    className="text-[var(--text-muted)] hover:text-[#B53A26] p-1 transition-colors"
                    title="Remove from batch"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Ambiguities */}
          {preview.ambiguities.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[var(--border-line)]">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#86560D]">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Multiple or unclear matches found:</span>
              </div>
              {preview.ambiguities.map((amb, i) => (
                <div key={i} className="text-xs space-y-1 bg-surface p-2.5 rounded-lg border border-line">
                  <span className="font-mono text-[11px] text-[var(--text-muted)]">
                    &ldquo;{amb.query}&rdquo; matches:
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {amb.candidates.map((cand) => (
                      <span
                        key={cand.id}
                        className="px-2 py-0.5 rounded border border-[var(--border-line)] bg-[var(--bg-surface-subtle)] text-[11px] font-mono"
                      >
                        {cand.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {stagedScenarios.length > 0 && (
            <div className="pt-2 border-t border-[var(--border-line)] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={cancelPreview}
                className="px-3 py-1.5 text-xs font-mono rounded-lg border border-[var(--border-line)] bg-surface hover:bg-[var(--bg-surface-subtle)] text-[var(--text-muted)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyStaged}
                className="px-4 py-1.5 text-xs font-mono font-medium rounded-lg bg-[#16181D] text-[#F5F3EE] hover:bg-[#2A2D35] transition-colors inline-flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply to Forecast</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
