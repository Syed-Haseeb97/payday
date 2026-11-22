import { cn } from '@/lib/cn';

/** Payday mark: a runway line rising out of a dip, inside a marigold tile. Inline SVG, no assets. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-9', className)} aria-hidden>
      <rect width="32" height="32" rx="10" fill="var(--primary)" />
      <path d="M6 12c4 0 5 9 9 9s4-11 11-11" fill="none" stroke="var(--on-primary)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="15" cy="21" r="2.6" fill="var(--on-primary)" />
    </svg>
  );
}
