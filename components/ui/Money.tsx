import type { CSSProperties } from 'react';
import { cn } from '@/lib/cn';
import { formatINR } from '@/lib/format';

interface MoneyProps {
  value: number;
  signed?: boolean;
  /** Roll digits into place (CSS-only; disabled by prefers-reduced-motion). */
  roll?: boolean;
  className?: string;
}

/** Renders a rupee amount with Indian grouping in tabular mono. Text content is always the exact formatted value. */
export function Money({ value, signed, roll, className }: MoneyProps) {
  const text = formatINR(value, { signed });
  if (!roll) return <span className={cn('num', className)}>{text}</span>;
  const chars = [...text];
  let digit = 0;
  return (
    <span className={cn('num odo-wrap', className)}>
      {chars.map((ch, idx) => {
        const fromRight = chars.length - idx;
        if (/\d/.test(ch)) {
          const style = { '--d': ch, '--i': digit++ } as CSSProperties;
          return (
            <span key={`d${fromRight}`} className="odo" style={style}>
              {ch}
            </span>
          );
        }
        return <span key={`s${fromRight}`}>{ch}</span>;
      })}
    </span>
  );
}
