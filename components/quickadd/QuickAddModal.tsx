'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Zap,
  Sparkles,
  Mic,
  MicOff,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  CreditCard,
  UserCheck,
  UserPlus,
  RefreshCw,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { formatINR } from '@/lib/money';
import { format, parseISO } from 'date-fns';
import { BuiltBookingProposal, BuiltMilestone, MatchedClient } from '@/lib/quickadd/types';
import { buildMilestones } from '@/lib/quickadd/builder';
import { PaymentMethod } from '@/lib/db/types';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EXAMPLE_CHIPS = [
  'Sharma wedding 14 Dec, ₹80k, ₹25k advance paid',
  'Priya & Karan engagement 2 Jan 45000 advance 10000 via UPI',
  'Verma ji ki shaadi 20 feb, 1.2 lakh, 30000 advance mil gaya',
];

export function QuickAddModal({ isOpen, onClose }: QuickAddModalProps) {
  const router = useRouter();

  // Step state: 1 = input, 2 = preview
  const [step, setStep] = useState<1 | 2>(1);
  const [inputText, setInputText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Proposal state
  const [proposal, setProposal] = useState<BuiltBookingProposal | null>(null);

  // Editable preview form state
  const [clientMode, setClientMode] = useState<'existing' | 'new'>('new');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('+91 90000 00000');
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [milestones, setMilestones] = useState<BuiltMilestone[]>([]);
  const [advancePaid, setAdvancePaid] = useState(false);
  const [advancePaidAmount, setAdvancePaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [notes, setNotes] = useState('');

  // Confirmation state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Web Speech API state
  const [isListening, setIsListening] = useState(false);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setHasSpeechSupport(Boolean(SpeechRecognition));
    }
  }, []);

  const handleVoiceInput = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setInputText('');
      setParsing(false);
      setParseError(null);
      setProposal(null);
      setSubmitting(false);
      setSubmitError(null);
    }
  }, [isOpen]);

  // Recalculate milestones when totalAmount changes
  const updateMilestoneAmounts = (newTotal: number, newAdvanceAmt?: number) => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const updated = buildMilestones({
      totalAmount: newTotal,
      eventDate: eventDate || todayStr,
      todayStr,
      advanceAmount: newAdvanceAmt,
      advancePaid,
      advancePaidAmount,
    });
    setMilestones(updated);
  };

  const handleParse = async () => {
    if (!inputText.trim()) {
      setParseError('Please enter or paste a message to read.');
      return;
    }

    setParsing(true);
    setParseError(null);

    try {
      const res = await fetch('/api/quickadd/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to parse text');
      }

      const p: BuiltBookingProposal = data.proposal;
      setProposal(p);

      // Initialize form from parsed proposal
      const hasMatch = p.matchedClients && p.matchedClients.length > 0 && p.matchedClients[0].similarity >= 0.7;
      if (hasMatch) {
        setClientMode('existing');
        setSelectedClientId(p.matchedClients[0].id);
        setNewClientName(p.clientName);
      } else {
        setClientMode('new');
        setNewClientName(p.clientName || 'New Client');
        setSelectedClientId('');
      }

      setTitle(p.title || 'New Wedding Shoot');
      setEventDate(p.eventDate || format(new Date(), 'yyyy-MM-dd'));
      setTotalAmount(p.totalAmount || 0);
      setMilestones(p.milestones || []);
      setAdvancePaid(p.advancePaid || false);
      setAdvancePaidAmount(p.advancePaidAmount || 0);
      setPaymentMethod(p.paymentMethod || 'UPI');
      setNotes(p.notes || '');

      setStep(2);
    } catch (err: unknown) {
      const e = err as Error;
      setParseError(e.message || 'Error processing text');
    } finally {
      setParsing(false);
    }
  };

  const handleManualEmptyProposal = () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    setProposal({
      clientName: '',
      matchedClients: [],
      title: 'Wedding Shoot',
      eventDate: todayStr,
      totalAmount: 50000,
      milestones: buildMilestones({ totalAmount: 50000, eventDate: todayStr, todayStr }),
      advancePaid: false,
      advancePaidAmount: 0,
      paymentMethod: 'UPI',
      confidence: 0,
      warnings: ['Manual entry mode: fill in booking details below.'],
      sources: {},
      source: 'rules',
    });

    setClientMode('new');
    setNewClientName('');
    setSelectedClientId('');
    setTitle('Wedding Shoot');
    setEventDate(todayStr);
    setTotalAmount(50000);
    setMilestones(buildMilestones({ totalAmount: 50000, eventDate: todayStr, todayStr }));
    setAdvancePaid(false);
    setAdvancePaidAmount(0);
    setPaymentMethod('UPI');
    setNotes('');

    setStep(2);
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        clientMode,
        clientId: clientMode === 'existing' ? selectedClientId : undefined,
        newClient:
          clientMode === 'new'
            ? {
                name: newClientName,
                phone: newClientPhone,
              }
            : undefined,
        title,
        eventDate,
        totalAmount,
        milestones: milestones.map((m) => ({
          label: m.label,
          amount: m.amount,
          dueDate: m.dueDate,
        })),
        advancePaid,
        advancePaidAmount: advancePaid ? advancePaidAmount : undefined,
        paymentMethod,
        notes: notes || undefined,
      };

      const res = await fetch('/api/quickadd/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save confirmed booking');
      }

      onClose();
      // Redirect to invoices or bookings page
      router.push('/invoices');
      router.refresh();
    } catch (err: unknown) {
      const e = err as Error;
      setSubmitError(e.message || 'Error saving booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isFormValid =
    totalAmount > 0 &&
    (clientMode === 'existing' ? Boolean(selectedClientId) : newClientName.trim().length >= 2) &&
    Boolean(eventDate) &&
    title.trim().length >= 2 &&
    milestones.reduce((acc, m) => acc + m.amount, 0) === totalAmount;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-2xl bg-white border border-[#C8C2B5] rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#C8C2B5]/60 bg-[#F5F3EE]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#16181D] text-[#F5F3EE] flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#E3EFE8]" />
            </div>
            <div>
              <h2 className="font-serif italic text-xl font-bold text-[#16181D]">
                {step === 1 ? 'Quick Add Booking' : 'Review Booking Preview'}
              </h2>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#5F626A]">
                {step === 1 ? 'Paste WhatsApp message or shoot note' : 'Nothing saved until confirmed'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#5F626A] hover:text-[#16181D] hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {step === 1 ? (
            /* STEP 1: Textarea & Example Chips */
            <div className="space-y-4">
              <div className="relative">
                <textarea
                  rows={4}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste a WhatsApp message or type: Sharma wedding 14 Dec, ₹80k, ₹25k advance paid"
                  className="w-full p-4 rounded-2xl border border-[#C8C2B5] bg-[#F5F3EE]/40 font-mono text-sm text-[#16181D] placeholder-[#5F626A]/70 focus:outline-none focus:border-[#16181D] transition-colors resize-none"
                />

                {hasSpeechSupport && (
                  <button
                    type="button"
                    onClick={handleVoiceInput}
                    title={isListening ? 'Stop listening' : 'Speak booking details'}
                    className={`absolute bottom-3 right-3 p-2 rounded-full border transition-colors ${
                      isListening
                        ? 'border-[#B53A26] bg-[#F8E9E4] text-[#B53A26]'
                        : 'border-[#C8C2B5] bg-white text-[#5F626A] hover:text-[#16181D]'
                    }`}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {parseError && (
                <div className="p-3.5 rounded-xl bg-[#F8E9E4] border border-[#B53A26] text-xs text-[#B53A26] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Tappable example chips */}
              <div className="space-y-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#5F626A] block">
                  Tap an example to try:
                </span>
                <div className="flex flex-col gap-2">
                  {EXAMPLE_CHIPS.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setInputText(chip)}
                      className="text-left p-2.5 rounded-xl border border-[#C8C2B5]/80 bg-[#F5F3EE] hover:bg-white hover:border-[#16181D] text-xs font-mono text-[#16181D] transition-all"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleManualEmptyProposal}
                  className="text-xs font-mono text-[#5F626A] hover:text-[#16181D] underline"
                >
                  Type manually instead
                </button>

                <button
                  type="button"
                  disabled={parsing || !inputText.trim()}
                  onClick={handleParse}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#16181D] text-[#F5F3EE] font-mono text-xs uppercase tracking-wider font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {parsing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Reading details...</span>
                    </>
                  ) : (
                    <>
                      <span>Read it</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* STEP 2: PREVIEW CARD */
            <div className="space-y-5">
              {/* Warnings Banner */}
              {proposal && proposal.warnings.length > 0 && (
                <div className="p-3.5 rounded-xl bg-[#F6ECD9] border border-[#86560D] text-xs text-[#86560D] space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 font-mono uppercase text-[10px] tracking-wider">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Please check before saving</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5">
                    {proposal.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Source Tag Strip */}
              <div className="flex items-center justify-between pb-3 border-b border-[#C8C2B5]/40 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-[#5F626A]">Parsed via:</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] tracking-wider bg-[#E3EFE8] text-[#1D6B52]">
                    <Sparkles className="w-3 h-3" />
                    <span>{proposal?.source === 'ai' ? 'AI Read' : 'Rules Read'}</span>
                  </span>
                  {proposal?.confidence !== undefined && (
                    <span className="text-[#5F626A] text-[11px]">
                      ({Math.round(proposal.confidence * 100)}% match)
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-mono text-[#5F626A] hover:text-[#16181D] underline"
                >
                  Edit original text
                </button>
              </div>

              {/* Client Selection */}
              <div className="space-y-3 p-4 rounded-2xl bg-[#F5F3EE] border border-[#C8C2B5]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase tracking-wider text-[#5F626A] font-semibold">
                    Client Details
                  </label>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    {proposal?.matchedClients && proposal.matchedClients.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setClientMode(clientMode === 'existing' ? 'new' : 'existing')}
                        className="text-[#1D6B52] underline font-semibold"
                      >
                        {clientMode === 'existing' ? 'Switch to New Client' : 'Match Existing Client'}
                      </button>
                    )}
                  </div>
                </div>

                {clientMode === 'existing' && proposal?.matchedClients && proposal.matchedClients.length > 0 ? (
                  <div>
                    <select
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#C8C2B5] bg-white font-mono text-xs focus:outline-none focus:border-[#16181D]"
                    >
                      {proposal.matchedClients.map((c) => (
                        <option key={c.id} value={c.id}>
                          Existing client: {c.name} ({Math.round(c.similarity * 100)}% match)
                        </option>
                      ))}
                    </select>
                    {proposal.sources['clientName'] && (
                      <span className="block mt-1 font-mono text-[10px] text-[#5F626A]">
                        from: &ldquo;{proposal.sources['clientName']}&rdquo;
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-[#5F626A] mb-1">
                        Client Name
                      </label>
                      <input
                        type="text"
                        required
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        placeholder="e.g. Rohit Sharma"
                        className="w-full px-3 py-2 rounded-xl border border-[#C8C2B5] bg-white font-sans text-sm focus:outline-none focus:border-[#16181D]"
                      />
                      {proposal?.sources['clientName'] && (
                        <span className="block mt-1 font-mono text-[10px] text-[#5F626A]">
                          from: &ldquo;{proposal.sources['clientName']}&rdquo;
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-[#5F626A] mb-1">
                        Phone (Editable placeholder)
                      </label>
                      <input
                        type="text"
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value)}
                        placeholder="+91 90000 00000"
                        className="w-full px-3 py-2 rounded-xl border border-[#C8C2B5] bg-white font-mono text-xs focus:outline-none focus:border-[#16181D]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Event & Total Amount Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#5F626A] font-semibold mb-1">
                    Event Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Sharma Wedding"
                    className="w-full px-3 py-2 rounded-xl border border-[#C8C2B5] bg-white font-sans text-sm focus:outline-none focus:border-[#16181D]"
                  />
                  {proposal?.sources['eventName'] && (
                    <span className="block mt-1 font-mono text-[10px] text-[#5F626A]">
                      from: &ldquo;{proposal.sources['eventName']}&rdquo;
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#5F626A] font-semibold mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => {
                      setEventDate(e.target.value);
                      updateMilestoneAmounts(totalAmount);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[#C8C2B5] bg-white font-mono text-xs focus:outline-none focus:border-[#16181D]"
                  />
                  {proposal?.sources['eventDate'] && (
                    <span className="block mt-1 font-mono text-[10px] text-[#5F626A]">
                      from: &ldquo;{proposal.sources['eventDate']}&rdquo;
                    </span>
                  )}
                </div>
              </div>

              {/* Total Amount & Live Recalculation */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#5F626A] font-semibold mb-1">
                  Total Booking Amount (₹)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={totalAmount || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 0;
                      setTotalAmount(val);
                      updateMilestoneAmounts(val);
                    }}
                    placeholder="80000"
                    className="w-48 px-3 py-2 rounded-xl border border-[#C8C2B5] bg-white font-mono text-base font-bold text-[#16181D] focus:outline-none focus:border-[#16181D]"
                  />
                  <span className="font-serif italic text-lg font-bold text-[#16181D]">
                    {formatINR(totalAmount)}
                  </span>
                </div>
                {proposal?.sources['totalAmount'] && (
                  <span className="block mt-1 font-mono text-[10px] text-[#5F626A]">
                    from: &ldquo;{proposal.sources['totalAmount']}&rdquo;
                  </span>
                )}
              </div>

              {/* Milestone Breakdown Table */}
              <div className="p-4 rounded-2xl bg-[#F5F3EE] border border-[#C8C2B5] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#5F626A] font-semibold">
                    Milestone Invoices Breakdown
                  </span>
                  <span className="text-xs font-mono text-[#5F626A]">
                    Total: <strong className="text-[#16181D]">{formatINR(totalAmount)}</strong>
                  </span>
                </div>

                <div className="space-y-2">
                  {milestones.map((m, idx) => (
                    <div
                      key={m.label}
                      className="p-2.5 rounded-xl bg-white border border-[#C8C2B5] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#16181D] text-[#F5F3EE] flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-sans font-semibold text-[#16181D]">
                          {m.milestoneLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span className="text-[#5F626A]">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={m.amount}
                            onChange={(e) => {
                              const newAmt = parseInt(e.target.value, 10) || 0;
                              const updated = [...milestones];
                              updated[idx].amount = newAmt;
                              setMilestones(updated);
                            }}
                            className="w-24 px-2 py-1 rounded border border-[#C8C2B5] font-mono text-xs font-bold text-[#16181D]"
                          />
                        </div>

                        <div className="flex items-center gap-1 text-[#5F626A]">
                          <span>Due:</span>
                          <input
                            type="date"
                            value={m.dueDate}
                            onChange={(e) => {
                              const updated = [...milestones];
                              updated[idx].dueDate = e.target.value;
                              setMilestones(updated);
                            }}
                            className="px-2 py-1 rounded border border-[#C8C2B5] font-mono text-xs text-[#16181D]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advance Payment Section */}
              <div className="p-4 rounded-2xl bg-white border border-[#C8C2B5] space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="advPaidCheckbox"
                    checked={advancePaid}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setAdvancePaid(checked);
                      if (checked && advancePaidAmount <= 0) {
                        setAdvancePaidAmount(milestones[0]?.amount || 0);
                      }
                    }}
                    className="w-4 h-4 rounded text-[#16181D] border-[#C8C2B5] focus:ring-0"
                  />
                  <label
                    htmlFor="advPaidCheckbox"
                    className="text-xs font-mono uppercase tracking-wider font-semibold text-[#16181D] cursor-pointer"
                  >
                    Advance payment already received
                  </label>
                  {proposal?.sources['advancePaid'] && (
                    <span className="font-mono text-[10px] text-[#1D6B52]">
                      (from: &ldquo;{proposal.sources['advancePaid']}&rdquo;)
                    </span>
                  )}
                </div>

                {advancePaid && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#C8C2B5]/40 text-xs font-mono">
                    <div>
                      <label className="block text-[10px] uppercase text-[#5F626A] mb-1">
                        Paid Amount (₹)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={totalAmount}
                        value={advancePaidAmount || ''}
                        onChange={(e) => setAdvancePaidAmount(parseInt(e.target.value, 10) || 0)}
                        className="w-full px-3 py-2 rounded-xl border border-[#C8C2B5] bg-white font-mono text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase text-[#5F626A] mb-1">
                        Payment Method
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="w-full px-3 py-2 rounded-xl border border-[#C8C2B5] bg-white font-mono text-xs"
                      >
                        <option value="UPI">UPI</option>
                        <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
                        <option value="cash">Cash</option>
                        <option value="cheque">Cheque</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {submitError && (
                <div className="p-3.5 rounded-xl bg-[#F8E9E4] border border-[#B53A26] text-xs text-[#B53A26] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#C8C2B5]/60 bg-[#F5F3EE] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full border border-[#C8C2B5] bg-white font-mono text-xs uppercase tracking-wider font-semibold text-[#5F626A] hover:bg-[#F5F3EE]"
          >
            Cancel
          </button>

          {step === 2 && (
            <button
              type="button"
              disabled={submitting || !isFormValid}
              onClick={handleConfirm}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#16181D] text-[#F5F3EE] font-mono text-xs uppercase tracking-wider font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Confirming...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#1D6B52]" />
                  <span>Confirm Booking</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
