'use client';

import { CalendarDays, ChartSpline, ChevronRight, Settings, Tags, Users, Wallet, type LucideIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/Misc';
import { Link } from '@/lib/router';

const items: { to: string; label: string; desc: string; icon: LucideIcon }[] = [
  { to: '/forecast', label: 'Forecast', desc: '90-day runway and what-ifs', icon: ChartSpline },
  { to: '/invoices', label: 'Invoices', desc: 'Every milestone and receipt', icon: Wallet },
  { to: '/clients', label: 'Clients', desc: 'Who pays on time, who doesn’t', icon: Users },
  { to: '/bookings', label: 'Bookings', desc: 'Weddings ahead', icon: CalendarDays },
  { to: '/pricing', label: 'Pricing', desc: 'Cost of delay and your numbers', icon: Tags },
  { to: '/settings', label: 'Settings', desc: 'AI status, theme, studio', icon: Settings },
];

export function MoreScreen() {
  return (
    <div className="space-y-5">
      <PageHeader title="More" />
      <ul className="card divide-y divide-line overflow-hidden p-0">
        {items.map(({ to, label, desc, icon: Icon }) => (
          <li key={to}>
            <Link to={to} className="flex min-h-16 items-center gap-4 px-4 py-3 hover:bg-surface-2 sm:px-5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary-text">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{label}</span>
                <span className="block text-sm text-ink-3">{desc}</span>
              </span>
              <ChevronRight className="size-5 text-ink-3" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
