import React from 'react';
import Link from 'next/link';
import { Camera, ShieldCheck } from 'lucide-react';

export function AppFooter() {
  return (
    <footer className="w-full border-t border-[var(--border-line)] bg-[var(--bg-canvas)] py-8 px-4 sm:px-6 lg:px-8 mt-12 mb-16 md:mb-0">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Brand & Mission */}
        <div className="space-y-1.5 max-w-md">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[var(--text-primary)] text-[var(--bg-canvas)] flex items-center justify-center font-bold text-xs">
              <Camera className="w-3.5 h-3.5 text-[var(--bg-canvas)]" />
            </div>
            <span className="font-serif italic font-bold text-lg text-[var(--text-primary)]">
              Payday
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
              · Back Office for Wedding Creatives
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] font-sans leading-relaxed">
            Organize clients, milestone invoices, 90-day cash forecasting, and Bad Day triage for solo wedding photographers in India.
          </p>
        </div>

        {/* Footer Navigation Links */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs font-mono text-[var(--text-muted)]">
          <Link href="/pricing" className="hover:text-[var(--text-primary)] font-semibold transition-colors">
            Pricing &amp; Business Case
          </Link>
          <Link href="/dashboard" className="hover:text-[var(--text-primary)] transition-colors">
            Dashboard
          </Link>
          <Link href="/bad-day" className="hover:text-[var(--text-primary)] transition-colors">
            Bad Day Mode
          </Link>
          <Link href="/forecast" className="hover:text-[var(--text-primary)] transition-colors">
            90D Forecast
          </Link>
          <Link href="/invoices" className="hover:text-[var(--text-primary)] transition-colors">
            Invoices
          </Link>
          <Link href="/settings" className="hover:text-[var(--text-primary)] transition-colors">
            Settings
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-6 pt-4 border-t border-[var(--border-line-subtle)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] font-mono text-[var(--text-faint)]">
        <span>
          © 2026 Payday. Currency formatted in INR (₹). Uses synthetic demo data.
        </span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--money-in)]" />
          <span>Information &amp; messaging tool · Not financial or legal advice</span>
        </span>
      </div>
    </footer>
  );
}
