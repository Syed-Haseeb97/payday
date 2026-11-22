import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type CardProps = HTMLAttributes<HTMLElement> & { as?: 'div' | 'section' | 'article' | 'aside' | 'li'; padded?: boolean };

/** The one card style used everywhere. */
export function Card({ as: Tag = 'div', padded = true, className, ...rest }: CardProps) {
  return <Tag className={cn('card', padded && 'p-4 sm:p-5', className)} {...rest} />;
}

export function SectionTitle({ children, action, id }: { children: ReactNode; action?: ReactNode; id?: string }) {
  return (
    <div className="mb-3 flex min-h-11 items-center justify-between gap-3">
      <h2 id={id} className="text-base font-semibold tracking-tight text-ink">
        {children}
      </h2>
      {action}
    </div>
  );
}
