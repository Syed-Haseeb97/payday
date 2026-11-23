'use client';

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { cn } from '@/lib/cn';
import { formatDate, formatINR, formatINRCompact, formatMonth } from '@/lib/format';
import type { ForecastPoint } from '@/lib/types';

interface RunwayChartProps {
  baseline: ForecastPoint[];
  scenario?: ForecastPoint[];
  safeBuffer: number;
  height?: number;
  /** Smaller axis treatment for the Home hero. */
  compact?: boolean;
  className?: string;
}

const PAD = { top: 56, bottom: 30 };

/** Monotone cubic (Fritsch–Carlson): smooth, never overshoots, so the drawn low is the real low. */
function monotonePath(xs: number[], ys: number[]): string {
  const n = xs.length;
  if (n < 2) return '';
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = xs[i + 1] - xs[i];
    m[i] = (ys[i + 1] - ys[i]) / dx[i];
  }
  const t: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) t[i] = 0;
    else t[i] = (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]);
  }
  t[n - 1] = m[n - 2];
  const f = (v: number) => v.toFixed(1);
  let d = `M${f(xs[0])},${f(ys[0])}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += `C${f(xs[i] + h)},${f(ys[i] + t[i] * h)},${f(xs[i + 1] - h)},${f(ys[i + 1] - t[i + 1] * h)},${f(xs[i + 1])},${f(ys[i + 1])}`;
  }
  return d;
}

function lowIndex(points: ForecastPoint[]) {
  if (!points || points.length === 0) return 0;
  let idx = 0;
  points.forEach((p, i) => {
    if (p && points[idx] && p.balance < points[idx].balance) idx = i;
  });
  return idx;
}

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.clientWidth);
    const ro = new ResizeObserver(([entry]) => setW(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

const morph = (d: string): CSSProperties => (d ? ({ d: `path('${d}')` } as CSSProperties) : {});

export function RunwayChart({ baseline, scenario, safeBuffer, height = 240, compact, className }: RunwayChartProps) {
  const [ref, width] = useWidth();
  const rawId = useId();
  const gid = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
  const [hover, setHover] = useState<number | null>(null);
  const [announce, setAnnounce] = useState('');

  const primary = scenario ?? baseline ?? [];
  const n = primary.length;
  const lowIdx = lowIndex(primary);
  const low = primary[lowIdx] || (primary.length > 0 ? primary[0] : { date: '2026-12-14', balance: 26500 });

  const geom = useMemo(() => {
    const all = [...baseline, ...(scenario ?? [])].map((p) => p.balance);
    const maxV = Math.max(...all, safeBuffer);
    const minV = Math.min(...all, 0);
    const range = maxV - minV || 1;
    const yMax = maxV + range * 0.06;
    const yMin = minV < 0 ? minV - range * 0.08 : 0;
    const plotH = height - PAD.top - PAD.bottom;
    const x = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * Math.max(1, width));
    const y = (v: number) => PAD.top + ((yMax - v) / (yMax - yMin)) * plotH;
    const xs = primary.map((_, i) => x(i));
    const line = monotonePath(xs, primary.map((p) => y(p.balance)));
    const ghost = scenario ? monotonePath(xs, baseline.map((p) => y(p.balance))) : '';
    const bottom = height - PAD.bottom;
    const area = line ? `${line}L${width.toFixed(1)},${bottom}L0,${bottom}Z` : '';
    const step = yMax > 4_00_000 ? 2_00_000 : yMax > 2_00_000 ? 1_00_000 : 50_000;
    const ticks: number[] = [];
    for (let v = step; v < yMax; v += step) ticks.push(v);
    const months = primary.map((p, i) => ({ i, p })).filter(({ p, i }) => p.date.endsWith('-01') && i > 3);
    return { x, y, line, ghost, area, bottom, ticks, months, yMin };
  }, [baseline, scenario, primary, safeBuffer, width, height, n]);

  const lowX = geom.x(lowIdx);
  const lowY = geom.y(low.balance);
  const below = low.balance < safeBuffer;
  const negative = low.balance < 0;
  const labelX = Math.min(Math.max(lowX, 84), Math.max(84, width - 84));

  const bandTop = geom.y(safeBuffer);
  const zeroY = geom.y(0);

  function indexFromPointer(e: PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(n - 1, Math.round(ratio * (n - 1))));
  }

  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    const cur = hover ?? lowIdx;
    let next = cur;
    if (e.key === 'ArrowRight') next = Math.min(n - 1, cur + 1);
    else if (e.key === 'ArrowLeft') next = Math.max(0, cur - 1);
    else if (e.key === 'PageDown') next = Math.min(n - 1, cur + 7);
    else if (e.key === 'PageUp') next = Math.max(0, cur - 7);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    else if (e.key === 'Escape') {
      setHover(null);
      return;
    } else return;
    e.preventDefault();
    setHover(next);
    const p = primary[next];
    const baseP = baseline?.[next];
    if (p) {
      setAnnounce(`${formatDate(p.date)}: ${formatINR(p.balance)}${scenario && baseP ? `, baseline ${formatINR(baseP.balance)}` : ''}`);
    }
  }

  const hp = hover !== null ? primary[hover] : null;
  const baseLowPoint = baseline?.[lowIndex(baseline)];
  const baseLowStr = scenario && baseLowPoint ? ` Baseline lowest ${formatINR(baseLowPoint.balance)}.` : '';
  const summary = `Cash runway, next ${n} days. Lowest balance ${formatINR(low.balance)} on ${formatDate(low.date)}. Safe buffer ${formatINR(safeBuffer)}.${baseLowStr}`;

  return (
    <div
      ref={ref}
      className={cn('relative w-full rounded-2xl select-none', className)}
      style={{ height }}
      tabIndex={0}
      role="group"
      aria-label={`${summary} Use arrow keys to read daily balances.`}
      onKeyDown={onKey}
      onBlur={() => setHover(null)}
    >
      <span className="sr-only" aria-live="polite">
        {announce}
      </span>
      {width > 0 && (
        <>
          <svg width={width} height={height} className="block touch-pan-y overflow-visible" aria-hidden onPointerMove={(e) => setHover(indexFromPointer(e))} onPointerDown={(e) => setHover(indexFromPointer(e))} onPointerLeave={() => setHover(null)}>
            <defs>
              <linearGradient id={`area-${gid}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
              </linearGradient>
              <pattern id={`hatch-${gid}`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="7" stroke="var(--warn)" strokeOpacity="0.22" strokeWidth="2" />
              </pattern>
            </defs>

            {/* grid */}
            {geom.ticks.map((v) => (
              <g key={v}>
                <line x1={0} x2={width} y1={geom.y(v)} y2={geom.y(v)} className="stroke-line" strokeDasharray="2 6" />
                {!compact && (
                  <text x={width} y={geom.y(v) - 6} textAnchor="end" className="num fill-ink-3 text-[11px]">
                    {formatINRCompact(v)}
                  </text>
                )}
              </g>
            ))}

            {/* safe buffer band: 0 → buffer */}
            <rect x={0} width={width} className="runway-band" style={{ y: bandTop, height: Math.max(0, zeroY - bandTop) } as CSSProperties} fill={`url(#hatch-${gid})`} />
            <rect x={0} width={width} className="runway-band" style={{ y: bandTop, height: Math.max(0, zeroY - bandTop) } as CSSProperties} fill="var(--warn)" fillOpacity="0.06" />
            <line x1={0} x2={width} y1={bandTop} y2={bandTop} stroke="var(--warn)" strokeOpacity="0.55" strokeDasharray="4 4" className="runway-band" />
            {geom.yMin < 0 && (
              <>
                <rect x={0} width={width} className="runway-band" style={{ y: zeroY, height: Math.max(0, geom.bottom - zeroY) } as CSSProperties} fill="var(--out)" fillOpacity="0.1" />
                <line x1={0} x2={width} y1={zeroY} y2={zeroY} stroke="var(--out)" strokeOpacity="0.6" />
              </>
            )}

            {/* month ticks */}
            {geom.months.map(({ i, p }) => (
              <g key={p.date}>
                <line x1={geom.x(i)} x2={geom.x(i)} y1={PAD.top - 8} y2={geom.bottom} className="stroke-line" />
                <text x={geom.x(i) + 6} y={height - 10} className="fill-ink-3 text-[11px] font-medium">
                  {formatMonth(p.date)}
                </text>
              </g>
            ))}
            <text x={0} y={height - 10} className="fill-ink-3 text-[11px] font-medium">
              Today
            </text>

            {/* lines */}
            {geom.area && <path className="runway-area" d={geom.area} style={morph(geom.area)} fill={`url(#area-${gid})`} />}
            {geom.ghost && <path className="runway-morph" d={geom.ghost} style={{ ...morph(geom.ghost), opacity: scenario ? 1 : 0 }} fill="none" stroke="var(--ink-3)" strokeWidth={2} strokeDasharray="5 6" strokeLinecap="round" />}
            {geom.line && <path className="runway-line" pathLength={1} d={geom.line} style={morph(geom.line)} fill="none" stroke="var(--primary)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />}

            {/* dip marker */}
            <g className="runway-pin" style={{ transform: `translate(${lowX}px, ${lowY}px)` }}>
              <g className="runway-pin-pop">
                <line x1={0} x2={0} y1={-34} y2={-8} stroke={negative ? 'var(--out)' : below ? 'var(--warn)' : 'var(--in)'} strokeWidth={1.5} />
                <circle r={11} fill={negative ? 'var(--out)' : below ? 'var(--warn)' : 'var(--in)'} fillOpacity={0.18} />
                <circle r={5.5} fill="var(--surface)" stroke={negative ? 'var(--out)' : below ? 'var(--warn)' : 'var(--in)'} strokeWidth={3} />
              </g>
            </g>

            {/* scrubber */}
            {hp && hover !== null && (
              <g>
                <line x1={geom.x(hover)} x2={geom.x(hover)} y1={PAD.top - 8} y2={geom.bottom} stroke="var(--ink-2)" strokeOpacity={0.5} />
                {scenario && baseline?.[hover] && <circle cx={geom.x(hover)} cy={geom.y(baseline[hover].balance)} r={4} fill="var(--ink-3)" />}
                <circle cx={geom.x(hover)} cy={geom.y(hp.balance)} r={5} fill="var(--primary)" stroke="var(--surface)" strokeWidth={2} />
              </g>
            )}
          </svg>

          {/* dip label */}
          <div className="runway-pin pointer-events-none absolute top-0 left-0" style={{ transform: `translate(${labelX}px, ${Math.max(4, lowY - 78)}px)` }} aria-hidden>
            <div className={cn('runway-pin-pop -translate-x-1/2 rounded-xl border px-2.5 py-1.5 text-center whitespace-nowrap shadow-lg backdrop-blur', negative ? 'border-out/40 bg-surface/95' : below ? 'border-warn/40 bg-surface/95' : 'border-in/40 bg-surface/95')}>
              <div className={cn('text-[10px] font-semibold tracking-wider uppercase', negative ? 'text-out' : below ? 'text-warn' : 'text-in')}>Lowest · {formatDate(low.date)}</div>
              <div className="num text-sm font-semibold text-ink">{formatINR(low.balance)}</div>
            </div>
          </div>

          <div className="pointer-events-none absolute right-0 text-[11px] font-semibold text-warn" style={{ top: Math.max(PAD.top, bandTop - 18) }} aria-hidden>
            Safe buffer {formatINR(safeBuffer)}
          </div>

          {hp && hover !== null && (
            <div className="pointer-events-none absolute top-0 rounded-xl border border-line-strong bg-surface px-3 py-2 text-xs shadow-xl" style={{ left: Math.min(Math.max(geom.x(hover) - 70, 0), width - 140), width: 140 }} aria-hidden>
              <div className="font-medium text-ink-2">{formatDate(hp.date)}</div>
              <div className={cn('num text-sm font-semibold', hp.balance < 0 ? 'text-out' : 'text-ink')}>{formatINR(hp.balance)}</div>
              {scenario && baseline?.[hover] && <div className="num text-ink-3">base {formatINR(baseline[hover].balance)}</div>}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function RunwayLegend({ scenario }: { scenario?: boolean }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
      <li className="flex items-center gap-1.5">
        <span className="h-[3px] w-4 rounded-full bg-primary" aria-hidden />
        {scenario ? 'With scenario' : 'Expected balance'}
      </li>
      {scenario && (
        <li className="flex items-center gap-1.5">
          <span className="w-4 border-t-2 border-dashed border-ink-3" aria-hidden />
          Baseline
        </li>
      )}
      <li className="flex items-center gap-1.5">
        <span className="h-2.5 w-4 rounded-sm border border-dashed border-warn/70 bg-warn/15" aria-hidden />
        Safe buffer zone
      </li>
    </ul>
  );
}
