'use client';

import { ArrowLeft } from 'lucide-react';
import { BrandMark } from '@/components/layout/BrandMark';
import { ButtonLink } from '@/components/ui/Button';

export function NotFoundScreen({ homeHref = '/dashboard', homeLabel = 'Back to Payday' }: { homeHref?: string; homeLabel?: string }) {
  return (
    <main className="glow-primary flex min-h-[70vh] items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <BrandMark className="mx-auto size-12" />
        <p className="num mt-6 text-sm font-semibold tracking-widest text-primary-text uppercase">404 Not Found</p>
        <h1 tabIndex={-1} data-page-title className="mt-2 text-3xl font-semibold tracking-tight focus:outline-none">
          Page Not Found
        </h1>
        <p className="mt-2 text-ink-2">This link may have expired or been typed incorrectly.</p>
        <ButtonLink to={homeHref} variant="secondary" icon={ArrowLeft} className="mt-6">
          {homeLabel}
        </ButtonLink>
      </div>
    </main>
  );
}
