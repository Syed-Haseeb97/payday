'use client';

import { Check, LoaderCircle, type LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Link } from '@/lib/router';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'quiet' | 'whatsapp';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonState = 'idle' | 'loading' | 'done';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:brightness-105 active:brightness-95',
  secondary: 'bg-surface-2 text-ink border border-line-strong hover:bg-surface-3',
  ghost: 'text-ink hover:bg-surface-2',
  danger: 'bg-out text-on-out hover:brightness-105',
  success: 'bg-in text-on-in',
  quiet: 'text-ink-2 hover:text-ink hover:bg-surface-2',
  whatsapp: 'bg-[#25D366] text-[#072e18] hover:bg-[#1EBE5D] active:bg-[#128C7E] shadow-sm',
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

export function WhatsAppIcon({ className = 'size-4 shrink-0', ariaHidden = true }: { className?: string; ariaHidden?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden={ariaHidden ? 'true' : undefined}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon | ((props: { className?: string }) => ReactNode);
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
