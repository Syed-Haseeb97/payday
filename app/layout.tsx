import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Geist, Geist_Mono } from 'next/font/google';
import '@/lib/zod';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';
import { AddToHomeScreen } from '@/components/shell/AddToHomeScreen';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Payday — One-Person Back Office for Wedding Photographers',
    template: '%s | Payday',
  },
  description: 'Payday: the one-person back office for wedding photographers. Track who owes you, milestone invoices, 90-day cash forecasting, and Bad Day triage for solo Indian creatives.',
  openGraph: {
    title: 'Payday: the one-person back office for wedding photographers',
    description: 'Know who owes you, and whether you can pay studio rent next month. Cash forecasting and milestone collections for solo Indian wedding creatives.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'Payday',
  },
  twitter: {
    card: 'summary',
    title: 'Payday: the one-person back office for wedding photographers',
    description: 'Milestone invoicing, 90-day cash runway forecast, and Bad Day debt recovery for freelance wedding photographers in India.',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Payday',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-bg text-ink">
        <Suspense fallback={null}>
          <AppShell>
            {children}
          </AppShell>
        </Suspense>
        <Suspense fallback={null}>
          <AddToHomeScreen />
        </Suspense>
      </body>
    </html>
  );
}
