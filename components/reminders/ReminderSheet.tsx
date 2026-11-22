'use client';

import { Check, Copy, MessageCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button, buttonClass } from '@/components/ui/Button';
import { Segmented, TextArea } from '@/components/ui/Field';
import { Sheet } from '@/components/ui/Sheet';
import { Skeleton } from '@/components/ui/Misc';
import { copyText } from '@/lib/clipboard';
import { cn } from '@/lib/cn';
import { formatINR } from '@/lib/format';
import type { ReminderDraft, ReminderLanguage, ReminderTone } from '@/lib/types';

export interface ReminderTarget {
  invoiceId: string;
  clientFirstName: string;
  amount: number;
  overdue: boolean;
}

interface ReminderSheetProps {
  target: ReminderTarget | null;
  onClose: () => void;
  onSent?: (invoiceId: string) => void;
}

export function ReminderSheet({ target, onClose, onSent }: ReminderSheetProps) {
  return (
    <Sheet
      open={Boolean(target)}
      onClose={onClose}
      title={target ? `WhatsApp Follow-Up Draft · Remind ${target.clientFirstName}` : 'WhatsApp Follow-Up Draft · Reminder'}
      description={target ? `${formatINR(target.amount)} · WhatsApp Follow-Up Draft with a UPI pay link` : undefined}
      icon={
        <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-in/15 text-in">
          <MessageCircle className="size-5" aria-hidden />
        </span>
      }
    >
      {target && <ReminderBody key={target.invoiceId} target={target} onSent={onSent} onClose={onClose} />}
    </Sheet>
  );
}

function ReminderBody({ target, onSent, onClose }: { target: ReminderTarget; onSent?: (id: string) => void; onClose: () => void }) {
  const [tone, setTone] = useState<ReminderTone>(target.overdue ? 'firm' : 'friendly');
  const [language, setLanguage] = useState<ReminderLanguage>('en');
  const [draft, setDraft] = useState<ReminderDraft | null>(null);
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const req = useRef(0);

  useEffect(() => {
    const id = ++req.current;
    setDraft(null);
    fetch('/api/reminders/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId: target.invoiceId, tone, language }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (id !== req.current) return;
        if (data.success && data.text) {
          const d: ReminderDraft = {
            invoice_id: target.invoiceId,
            client_first_name: target.clientFirstName,
            amount: target.amount,
            pay_link: '',
            whatsapp_url: data.whatsappDeepLink || '',
            tone,
            language,
            text: data.text,
          };
          setDraft(d);
          setText(data.text);
        }
      })
      .catch((err) => {
        console.error('Failed to load draft:', err);
      });
  }, [target.invoiceId, target.clientFirstName, target.amount, tone, language]);

  const waUrl = draft ? `${draft.whatsapp_url.split('?')[0]}?text=${encodeURIComponent(text)}` : '#';

  async function finish() {
    try {
      await fetch('/api/reminders/mark-sent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: target.invoiceId }),
      });
    } catch {
      // ignore
    }
    setSent(true);
    onSent?.(target.invoiceId);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center py-8 text-center" role="status">
        <div className="relative mb-5 flex size-20 items-center justify-center">
          <span className="anim-ring absolute inset-0 rounded-full bg-in/30" aria-hidden />
          <span className="anim-check flex size-20 items-center justify-center rounded-full bg-in text-on-in">
            <Check className="size-10" strokeWidth={3} aria-hidden />
          </span>
        </div>
        <p className="text-xl font-semibold">Reminder sent</p>
        <p className="mt-1 max-w-xs text-ink-2">
          {target.clientFirstName} has the pay link. Payday will flag it again if nothing lands in 3 days.
        </p>
        <Button className="mt-6" variant="secondary" onClick={onClose}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="sr-only">WhatsApp Follow-Up Draft</div>
      <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr]">
        <Segmented
          legend="Tone"
          value={tone}
          onChange={setTone}
          tone={tone === 'final' ? 'out' : 'primary'}
          options={[
            { value: 'friendly', label: 'Friendly' },
            { value: 'firm', label: 'Firm' },
            { value: 'final', label: 'Final' },
          ]}
        />
        <Segmented
          legend="Language"
          value={language}
          onChange={setLanguage}
          options={[
            { value: 'en', label: 'English' },
            { value: 'hinglish', label: 'Hinglish' },
          ]}
        />
      </div>

      {!draft ? (
        <div className="space-y-2 py-2">
          <Skeleton className="h-32" />
        </div>
      ) : (
        <TextArea
          label="Message to send"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          hint={`Personalised with ${target.clientFirstName}'s name and the exact balance due.`}
        />
      )}

      <div className="grid grid-cols-2 gap-3 pt-2">
        <Button
          variant="secondary"
          icon={copied ? Check : Copy}
          disabled={!draft}
          onClick={async () => {
            const ok = await copyText(text);
            if (ok) {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }
          }}
        >
          {copied ? 'Copied!' : 'Copy Text'}
        </Button>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={finish}
          className={cn(buttonClass('primary', 'md', true), !draft && 'pointer-events-none opacity-50')}
        >
          <MessageCircle className="size-4 shrink-0" aria-hidden />
          <span>Send via WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
