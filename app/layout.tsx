import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '@/lib/zod';
import './globals.css';
import { AppHeader } from '@/components/shell/AppHeader';
import { AppNav } from '@/components/shell/AppNav';
import { AppFooter } from '@/components/shell/AppFooter';
import { MobileNav } from '@/components/shell/MobileNav';

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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)]">
        <AppHeader />
        <AppNav />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-8">
          {children}
        </main>
        <AppFooter />
        <MobileNav />
      </body>
    </html>
  );
}
