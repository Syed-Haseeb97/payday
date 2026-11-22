'use client';

import React from 'react';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to?: string;
  href?: string;
  children: React.ReactNode;
}

export function Link({ to, href, className, children, ...rest }: LinkProps) {
  const target = to || href || '#';
  return (
    <NextLink href={target} className={className} {...rest}>
      {children}
    </NextLink>
  );
}

export function usePath(): string {
  const pathname = usePathname();
  return pathname || '/';
}

export function navigate(url: string, opts?: { replace?: boolean }) {
  if (typeof window !== 'undefined') {
    if (opts?.replace) {
      window.location.replace(url);
    } else {
      window.location.href = url;
    }
  }
}

export function matchPath(pattern: string, path: string): Record<string, string> | null {
  const patternSegments = pattern.split('/').filter(Boolean);
  const pathSegments = path.split('/').filter(Boolean);

  if (patternSegments.length !== pathSegments.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternSegments.length; i++) {
    const p = patternSegments[i];
    if (p.startsWith(':')) {
      params[p.slice(1)] = decodeURIComponent(pathSegments[i]);
    } else if (p !== pathSegments[i]) {
      return null;
    }
  }
  return params;
}
