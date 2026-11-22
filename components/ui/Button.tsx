'use client';

import { Check, LoaderCircle, type LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Link } from '@/lib/router';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'quiet';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonState = 'idle' | 'loading' | 'done';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:brightness-105 active:brightness-95',
  secondary: 'bg-surface-2 text-ink border border-line-strong hover:bg-surface-3',
  ghost: 'text-ink hover:bg-surface-2',
  danger: 'bg-out text-on-out hover:brightness-105',
  success: 'bg-in text-on-in',
  quiet: 'text-ink-2 hover:text-ink hover:bg-surface-2',
};
const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-11 px-4 text-sm gap-2 rounded-xl',
  md: 'min-h-12 px-5 text-[0.95rem] gap-2 rounded-2xl',
  lg: 'min-h-14 px-6 text-base gap-2.5 rounded-2xl',
};

export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', full = false) {
  return cn(
    'inline-flex select-none items-center justify-center font-semibold whitespace-nowrap transition-[background-color,filter,color,transform] duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    sizes[size],
    full && 'w-full',
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  full?: boolean;
  state?: ButtonState;
  /** Label shown in the done state (the button turns green with a check). */
  doneLabel?: ReactNode;
  loadingLabel?: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', icon: Icon, full, state = 'idle', doneLabel, loadingLabel, className, children, disabled, type = 'button', ...rest }: ButtonProps) {
  const done = state === 'done';
  return (
    <button
      type={type}
      className={cn(buttonClass(done ? 'success' : variant, size, full), className)}
      disabled={disabled || state === 'loading'}
      aria-busy={state === 'loading' || undefined}
      {...rest}
    >
      {state === 'loading' ? (
        <LoaderCircle className="size-[1.15em] animate-spin" aria-hidden />
      ) : done ? (
        <Check className="anim-check size-[1.2em]" strokeWidth={3} aria-hidden />
      ) : (
        Icon && <Icon className="size-[1.15em] shrink-0" aria-hidden />
      )}
      <span>{done ? (doneLabel ?? children) : state === 'loading' ? (loadingLabel ?? children) : children}</span>
    </button>
  );
}

interface ButtonLinkProps {
  to: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  full?: boolean;
  className?: string;
  children: ReactNode;
}

export function ButtonLink({ to, variant = 'secondary', size = 'md', icon: Icon, full, className, children }: ButtonLinkProps) {
  return (
    <Link to={to} className={cn(buttonClass(variant, size, full), className)}>
      {Icon && <Icon className="size-[1.15em] shrink-0" aria-hidden />}
      <span>{children}</span>
    </Link>
  );
}

export function IconButton({ label, icon: Icon, className, ...rest }: { label: string; icon: LucideIcon } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" aria-label={label} title={label} className={cn('inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink', className)} {...rest}>
      <Icon className="size-5" aria-hidden />
    </button>
  );
}
