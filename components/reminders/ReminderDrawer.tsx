'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  MessageCircle,
  Copy,
  Check,
  Send,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { ReminderLanguage, ReminderTone } from '@/lib/db/types';

interface ReminderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string;
  defaultTone?: ReminderTone;
  defaultLanguage?: ReminderLanguage;
  clientName?: string;
  amountFormatted?: string;
}

export function ReminderDrawer({
  isOpen,
  onClose,
  invoiceId,
  defaultTone = 'friendly',
  defaultLanguage = 'en',
  clientName,
  amountFormatted,
}: ReminderDrawerProps) {
  const [tone, setTone] = useState<ReminderTone>(defaultTone);
  const [language, setLanguage] = useState<ReminderLanguage>(defaultLanguage);
  const [text, setText] = useState<string>('');
  const [source, setSource] = useState<'ai' | 'template'>('template');
  const [model, setModel] = useState<string | undefined>();
  const [whatsappLink, setWhatsappLink] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [markingSent, setMarkingSent] = useState(false);
  const [markedSent, setMarkedSent] = useState(false);
  const [recentReminderNote, setRecentReminderNote] = useState<string | null>(null);

  // Sync default tone when opened or invoiceId changes
  useEffect(() => {
    if (isOpen && invoiceId) {
      setTone(defaultTone);
      setLanguage(defaultLanguage);
      setMarkedSent(false);
      checkRecentReminder(invoiceId);
      fetchDraft(invoiceId, defaultTone, defaultLanguage);
    }
  }, [isOpen, invoiceId, defaultTone, defaultLanguage]);

  const checkRecentReminder = async (invId: string) => {
    try {
      const res = await fetch(`/api/reminders/status?invoiceId=${invId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.sentWithinTwoDays) {
          const days = data.daysAgo === 0 ? 'today' : data.daysAgo === 1 ? '1 day ago' : `${data.daysAgo} days ago`;
          setRecentReminderNote(`A reminder was already sent ${days}.`);
        } else {
          setRecentReminderNote(null);
        }
      }
    } catch {
      // Ignore
    }
  };

  const fetchDraft = async (
    invId: string,
    currentTone: ReminderTone,
    currentLang: ReminderLanguage
  ) => {
    setLoading(true);
    try {
      const res = await fetch('/api/reminders/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invId,
          tone: currentTone,
          language: currentLang,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate draft');
      const data = await res.json();
      setText(data.text);
      setSource(data.source);
      setModel(data.model);
      setWhatsappLink(data.whatsappDeepLink);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToneChange = (newTone: ReminderTone) => {
    setTone(newTone);
    if (invoiceId) {
      fetchDraft(invoiceId, newTone, language);
    }
  };

  const handleLanguageChange = (newLang: ReminderLanguage) => {
    setLanguage(newLang);
    if (invoiceId) {
      fetchDraft(invoiceId, tone, newLang);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleMarkAsSent = async () => {
    if (!invoiceId || !text) return;
    setMarkingSent(true);
    try {
      const res = await fetch('/api/reminders/mark-sent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          tone,
          language,
          text,
          channel: 'whatsapp',
        }),
      });
      if (res.ok) {
        setMarkedSent(true);
        setRecentReminderNote('Marked as sent just now.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMarkingSent(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto border-l border-[#C8C2B5] p-5 sm:p-6 z-10 animate-in slide-in-from-right duration-200">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#C8C2B5]/50 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#C8C2B5] bg-[#F5F3EE] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[#1D6B52] font-semibold">
                <MessageCircle className="w-3 h-3 text-[#1D6B52]" />
                <span>WhatsApp Reminder</span>
              </div>
              <h2 className="mt-1 font-serif italic text-2xl font-bold text-[#16181D]">
                Draft Payment Reminder
              </h2>
              {clientName && (
                <p className="text-xs text-[#5F626A] font-sans mt-0.5">
                  Client: <span className="font-semibold text-[#16181D]">{clientName}</span>
                  {amountFormatted && ` · ${amountFormatted}`}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-[#5F626A] hover:bg-[#F5F3EE] hover:text-[#16181D] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Gentle Note if recently sent within 2 days */}
          {recentReminderNote && (
            <div className="p-3 rounded-xl border border-[#C8C2B5] bg-[#F6ECD9] text-[#86560D] flex items-center gap-2 text-xs font-sans">
              <Clock className="w-4 h-4 flex-shrink-0 text-[#86560D]" />
              <span>{recentReminderNote} (You can still send another if needed.)</span>
            </div>
          )}

          {/* Tone Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-[#5F626A] font-semibold block">
              Message Tone
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['friendly', 'firm', 'final'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleToneChange(t)}
                  className={`rounded-xl border py-2 text-xs font-mono capitalize font-medium transition-all ${
                    tone === t
                      ? 'border-[#16181D] bg-[#16181D] text-[#F5F3EE]'
                      : 'border-[#C8C2B5] bg-white text-[#5F626A] hover:bg-[#F5F3EE] hover:text-[#16181D]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Language Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-[#5F626A] font-semibold block">
              Language
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'en', label: 'English' },
                { id: 'hinglish', label: 'Hinglish (हिंदी)' },
              ].map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => handleLanguageChange(l.id as ReminderLanguage)}
                  className={`rounded-xl border py-2 text-xs font-mono font-medium transition-all ${
                    language === l.id
                      ? 'border-[#16181D] bg-[#16181D] text-[#F5F3EE]'
                      : 'border-[#C8C2B5] bg-white text-[#5F626A] hover:bg-[#F5F3EE] hover:text-[#16181D]'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Editable Draft Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono uppercase tracking-wider text-[#5F626A] font-semibold block">
                Message Preview
              </label>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider font-bold ${
                    source === 'ai'
                      ? 'bg-[#E3EFE8] text-[#1D6B52]'
                      : 'bg-[#F5F3EE] text-[#5F626A]'
                  }`}
                >
                  {source === 'ai' ? 'AI Draft' : 'Template Draft'}
                </span>
                <button
                  type="button"
                  onClick={() => fetchDraft(invoiceId, tone, language)}
                  disabled={loading}
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-[#5F626A] hover:text-[#16181D] transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  <span>Regenerate</span>
                </button>
              </div>
            </div>

            <textarea
              rows={6}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                // Update whatsapp deep link live with edited text
                const base = whatsappLink.split('?text=')[0];
                if (base) {
                  setWhatsappLink(`${base}?text=${encodeURIComponent(e.target.value)}`);
                }
              }}
              className="w-full text-xs font-sans rounded-xl border border-[#C8C2B5] bg-[#F5F3EE]/40 p-3.5 text-[#16181D] focus:outline-none focus:ring-1 focus:ring-[#16181D] leading-relaxed"
              placeholder="Generating reminder..."
            />
            <div className="flex justify-between text-[10px] font-mono text-[#5F626A]">
              <span>WhatsApp message format</span>
              <span>{text.length} chars</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-5 border-t border-[#C8C2B5]/50 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {/* Open in WhatsApp Primary Action */}
            <a
              href={whatsappLink || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1D6B52] text-[#F5F3EE] py-2.5 text-xs font-mono uppercase tracking-wider font-semibold hover:opacity-95 transition-opacity"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Open in WhatsApp</span>
            </a>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#C8C2B5] bg-white text-[#16181D] py-2.5 text-xs font-mono uppercase tracking-wider font-semibold hover:bg-[#F5F3EE] transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#1D6B52]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>
          </div>

          {/* Mark As Sent Button */}
          <button
            type="button"
            onClick={handleMarkAsSent}
            disabled={markingSent || markedSent}
            className={`w-full py-2 rounded-full text-xs font-mono uppercase tracking-wider font-medium transition-colors border ${
              markedSent
                ? 'border-[#1D6B52] bg-[#E3EFE8] text-[#1D6B52]'
                : 'border-[#C8C2B5] bg-white text-[#5F626A] hover:bg-[#F5F3EE] hover:text-[#16181D]'
            }`}
          >
            {markedSent ? '✓ Marked as Sent' : markingSent ? 'Recording...' : 'Mark as Sent'}
          </button>
        </div>
      </div>
    </div>
  );
}
