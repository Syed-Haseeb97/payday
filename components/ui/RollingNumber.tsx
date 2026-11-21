'use client';

import React, { useEffect, useRef, useState } from 'react';
import { formatINR } from '@/lib/money';

export interface RollingNumberProps {
  value: number;
  formatter?: (val: number) => string;
  className?: string;
  duration?: number;
}

/**
 * RollingNumber displays numeric metrics with a smooth 450ms exponential ease-out.
 *
 * Rules:
 * 1. The FIRST render immediately displays the real value (no zero flash or blank flicker).
 * 2. Subsequent value changes smoothly count up or down from the previous value.
 * 3. Tabular numerals (tabular-nums) ensure fixed-width digits so numbers don't shift.
 * 4. Respects `prefers-reduced-motion`.
 */
export function RollingNumber({
  value,
  formatter = formatINR,
  className = '',
  duration = 450,
}: RollingNumberProps) {
  // First render shows the actual target value immediately
  const [display, setDisplay] = useState(() => formatter(value));
  const currentValRef = useRef(value);
  const animFrameRef = useRef<number | null>(null);
  const isFirstMountRef = useRef(true);

  useEffect(() => {
    // If user prefers reduced motion, render target immediately
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      currentValRef.current = value;
      setDisplay(formatter(value));
      return;
    }

    // Skip animation on initial mount since first render already displays the real value
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      currentValRef.current = value;
      setDisplay(formatter(value));
      return;
    }

    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
    }

    const startVal = currentValRef.current;
    const targetVal = value;

    if (startVal === targetVal) {
      setDisplay(formatter(targetVal));
      return;
    }

    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Exponential ease-out: 1 - 2^(-10 * progress)
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(startVal + (targetVal - startVal) * ease);

      currentValRef.current = current;
      setDisplay(formatter(current));

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        currentValRef.current = targetVal;
        setDisplay(formatter(targetVal));
        animFrameRef.current = null;
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [value, duration, formatter]);

  return <span className={`tabular-nums ${className}`}>{display}</span>;
}
