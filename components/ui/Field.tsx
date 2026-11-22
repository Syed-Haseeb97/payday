'use client';

import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const control =
  'w-full rounded-2xl border border-line-strong bg-surface-2 px-4 text-ink placeholder:text-ink-3 transition-colors focus:border-primary aria-invalid:border-out';

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  prefix?: ReactNode;
  mono?: boolean;
  badge?: ReactNode;
}

export function TextField({ label, hint, error, prefix, mono, badge, id, className, ...rest }: FieldProps) {
  const auto = useId();
  const fid = id ?? auto;
  const hintId = `${fid}-hint`;
  return (
    <div className={className}>
      <div className="mb-1.5 flex min-h-6 items-center justify-between gap-2">
        <label htmlFor={fid} className="text-sm font-medium text-ink-2">
          {label}
        </label>
        {badge}
      </div>
      <div className="relative">
        {prefix && <span className="num pointer-events-none absolute inset-y-0 left-4 flex items-center text-ink-3">{prefix}</span>}
        <input
          id={fid}
          className={cn(control, 'min-h-12', prefix ? 'pl-9' : undefined, mono && 'num')}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? hintId : undefined}
          {...rest}
        />
      </div>
      {(error || hint) && (
        <p id={hintId} className={cn('mt-1.5 text-xs', error ? 'text-out' : 'text-ink-3')}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

export function TextArea({ label, hint, id, className, ...rest }: { label: ReactNode; hint?: ReactNode } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div className={className}>
      <label htmlFor={fid} className="mb-1.5 block text-sm font-medium text-ink-2">
        {label}
      </label>
      <textarea id={fid} className={cn(control, 'min-h-32 resize-y py-3 leading-relaxed')} {...rest} />
      {hint && <p className="mt-1.5 text-xs text-ink-3">{hint}</p>}
    </div>
  );
}

interface SegmentedProps<T extends string> {
  legend: string;
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
  hideLegend?: boolean;
  tone?: 'primary' | 'out';
}

/** Native radio group styled as a segmented control (arrow keys work out of the box). */
export function Segmented<T extends string>({ legend, value, options, onChange, hideLegend, tone = 'primary' }: SegmentedProps<T>) {
  const name = useId();
  return (
    <fieldset>
      <legend className={cn('mb-1.5 text-sm font-medium text-ink-2', hideLegend && 'sr-only')}>{legend}</legend>
      <div className="flex gap-1 rounded-2xl border border-line bg-surface-2 p-1">
        {options.map((o) => {
          const checked = o.value === value;
          return (
            <label
              key={o.value}
              className={cn(
                'flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
                checked ? (tone === 'out' ? 'bg-out text-on-out' : 'bg-surface text-ink shadow-sm ring-1 ring-line-strong') : 'text-ink-2 hover:text-ink',
              )}
            >
              <input type="radio" className="sr-only" name={name} value={o.value} checked={checked} onChange={() => onChange(o.value)} />
              {o.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
