'use client';

import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { IconButton } from './Button';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  icon?: ReactNode;
}

/** Bottom sheet on mobile, centred modal from `sm`. Native <dialog> gives focus trapping and Esc for free. */
export function Sheet({ open, onClose, title, description, children, footer, icon }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {open && (
        <div className="sheet-panel flex max-h-[94dvh] flex-col rounded-t-3xl border border-line bg-surface shadow-[var(--shadow-pop)] sm:rounded-3xl">
          <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-line-strong sm:hidden" aria-hidden />
          <header className="flex items-start gap-3 px-5 pt-3 pb-3 sm:pt-5">
            {icon}
            <div className="min-w-0 flex-1 pt-1.5">
              <h2 id={titleId} className="text-lg leading-tight font-semibold">
                {title}
              </h2>
              {description && (
                <p id={descId} className="mt-1 text-sm text-ink-2">
                  {description}
                </p>
              )}
            </div>
            <IconButton label="Close" icon={X} onClick={onClose} className="-mr-2" />
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">{children}</div>
          {footer && <div className="pb-safe border-t border-line px-5 pt-4 pb-4">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}
