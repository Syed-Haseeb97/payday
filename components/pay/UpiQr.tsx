'use client';

import { useMemo } from 'react';

/**
 * Inline SVG QR artwork derived from the UPI URI. It is a deterministic visual
 * placeholder; role="img" aria-label="UPI QR Code".
 */
export function UpiQr({ value, size = 232 }: { value: string; size?: number }) {
  const N = 29;
  const path = useMemo(() => {
    let h = 2166136261;
    for (let i = 0; i < value.length; i++) h = Math.imul(h ^ value.charCodeAt(i), 16777619);
    const rand = () => {
      h ^= h << 13;
      h ^= h >>> 17;
      h ^= h << 5;
      return ((h >>> 0) % 1000) / 1000;
    };
    const inFinder = (x: number, y: number) => (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9);
    let d = '';
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        if (inFinder(x, y)) continue;
        if (x > 11 && x < 17 && y > 11 && y < 17) continue;
        if ((y === 6 && x % 2 === 0) || (x === 6 && y % 2 === 0) || rand() > 0.52) d += `M${x} ${y}h1v1h-1z`;
      }
    }
    return d;
  }, [value]);

  const finder = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={7} height={7} rx={1.6} fill="currentColor" />
      <rect x={x + 1} y={y + 1} width={5} height={5} rx={1} fill="#fff" />
      <rect x={x + 2} y={y + 2} width={3} height={3} rx={0.7} fill="currentColor" />
    </g>
  );

  return (
    <svg role="img" aria-label="UPI QR Code" viewBox={`-2 -2 ${N + 4} ${N + 4}`} width={size} height={size} className="text-[#0b1f44]">
      <rect x={-2} y={-2} width={N + 4} height={N + 4} rx={3} fill="#fff" />
      <path d={path} fill="currentColor" />
      {finder(0, 0)}
      {finder(N - 7, 0)}
      {finder(0, N - 7)}
      <rect x={12.2} y={12.2} width={4.6} height={4.6} rx={1.2} fill="#1d4ed8" />
      <path d="M13.3 15.6l1.2-2.6 1.2 2.6" fill="none" stroke="#fff" strokeWidth={0.55} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
