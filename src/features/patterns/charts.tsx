import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

/**
 * Chart kit for the Patterns screen — hand-rolled SVG and CSS, no chart
 * dependency. Every component is a *view*: it receives numbers that were
 * already computed elsewhere and never derives or re-aggregates them.
 *
 * Accessibility: each chart is a single `role="img"` with an aria-label that
 * enumerates its data, so the numbers have a full non-visual equivalent
 * rather than depending on the shapes.
 *
 * Deliberately no entrance animation: these elements used to grow from
 * scale 0 via a keyframe, which renders as an empty chart for as long as the
 * animation has not advanced (throttled or non-composited WebViews). Bars
 * carry a width/height transition instead, so a stalled frame can only ever
 * show slightly stale geometry, never nothing.
 */

export type ChartTone = 'accent' | 'accent-mid' | 'accent-soft' | 'muted'

const TONES: Record<ChartTone, { stroke: string; bg: string }> = {
  accent: { stroke: 'stroke-accent', bg: 'bg-accent' },
  'accent-mid': { stroke: 'stroke-accent/60', bg: 'bg-accent/60' },
  'accent-soft': { stroke: 'stroke-accent/30', bg: 'bg-accent/30' },
  muted: { stroke: 'stroke-hairline-strong', bg: 'bg-hairline-strong' },
}

export interface ChartSegment {
  key: string
  label: string
  value: number
  tone: ChartTone
}

const describe = (segments: { label: string; value: number; unit?: string }[]) =>
  segments.map((s) => `${s.label}: ${s.value}${s.unit ?? ''}`).join(', ')

/** Units arrive plural ("decisions", "reviews"); singular reads better at 1. */
const countLabel = (value: number, unit: string) =>
  `${value} ${value === 1 ? unit.replace(/ies$/, 'y').replace(/s$/, '') : unit}`

export function ChartCard({
  title,
  caption,
  children,
  className,
}: {
  title: string
  caption?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'flex flex-col gap-4 rounded-xl border border-hairline bg-surface p-4 md:p-5',
        className,
      )}
    >
      <header className="flex flex-col gap-0.5">
        <h2 className="font-mono text-[10px] font-semibold tracking-[0.14em] text-ink-soft uppercase">
          {title}
        </h2>
        {caption && <p className="text-sm text-ink-soft">{caption}</p>}
      </header>
      {children}
    </section>
  )
}

/** Ring chart with a centred total and a legend. */
export function Donut({
  segments,
  total,
  centerLabel,
  title,
}: {
  segments: ChartSegment[]
  total: number
  centerLabel: string
  title: string
}) {
  const size = 168
  const radius = 58
  const stroke = 15
  const circumference = 2 * Math.PI * radius
  const safeTotal = total > 0 ? total : 1

  // Arc lengths and their cumulative offsets, computed without mutating an
  // accumulator during render (at most a handful of segments, so the extra
  // pass is free).
  const arcLengths = segments.map((segment) => (segment.value / safeTotal) * circumference)
  const arcs = segments.map((segment, index) => ({
    segment,
    length: arcLengths[index],
    offset: arcLengths.slice(0, index).reduce((sum, length) => sum + length, 0),
  }))

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
      <div
        role="img"
        aria-label={`${title} — ${describe(segments)}`}
        className="relative h-[124px] w-[124px] shrink-0"
      >
        <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            className="stroke-surface-high"
          />
          {arcs.map(({ segment, length, offset }) => {
            if (segment.value === 0) return null
            const dash = Math.max(length - 4, 1) // hairline gap between arcs
            return (
              <circle
                key={segment.key}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                className={TONES[segment.tone].stroke}
              />
            )
          })}
        </svg>
        <div
          aria-hidden
          className="absolute inset-0 flex flex-col items-center justify-center"
        >
          <span className="font-mono text-2xl font-semibold tabular-nums text-ink">
            {total}
          </span>
          <span className="font-mono text-[9px] tracking-[0.14em] text-ink-soft uppercase">
            {centerLabel}
          </span>
        </div>
      </div>

      <ul className="flex w-full min-w-0 flex-col gap-2.5">
        {segments.map((segment) => (
          <li key={segment.key} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden
                className={cn('h-2.5 w-2.5 shrink-0 rounded-full', TONES[segment.tone].bg)}
              />
              <span className="truncate text-ink-soft">{segment.label}</span>
            </span>
            <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-ink">
              {segment.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Horizontal ranked bars — label, proportional track, count. */
export function RankedBars({
  rows,
  tone = 'accent',
  title,
  unitLabel = 'decisions',
}: {
  rows: { key: string; label: string; value: number }[]
  tone?: ChartTone
  title: string
  unitLabel?: string
}) {
  const max = Math.max(...rows.map((row) => row.value), 1)

  return (
    <ul
      role="img"
      aria-label={`${title} — ${rows
        .map((row) => `${row.label}: ${countLabel(row.value, unitLabel)}`)
        .join(', ')}`}
      className="flex flex-col gap-3"
    >
      {rows.map((row) => (
        <li key={row.key} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-sm text-ink sm:w-32" title={row.label}>
            {row.label}
          </span>
          <span
            aria-hidden
            className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-high"
          >
            <span
              className={cn(
                'block h-full rounded-full transition-[width] duration-500 ease-out',
                TONES[tone].bg,
              )}
              style={{ width: `${(row.value / max) * 100}%` }}
            />
          </span>
          <span className="w-6 shrink-0 text-right font-mono text-[11px] tabular-nums text-ink-soft">
            {row.value}
          </span>
        </li>
      ))}
    </ul>
  )
}

/** One horizontal bar split by share, with a legend. */
export function StackedBar({
  segments,
  total,
  title,
}: {
  segments: ChartSegment[]
  total: number
  title: string
}) {
  const safeTotal = total > 0 ? total : 1

  return (
    <div className="flex flex-col gap-4">
      <div
        role="img"
        aria-label={`${title} — ${describe(segments)}`}
        className="flex h-3 w-full gap-1 overflow-hidden rounded-full"
      >
        {segments.map((segment) =>
          segment.value === 0 ? null : (
            <span
              key={segment.key}
              className={cn(
                'h-full rounded-full transition-[width] duration-500 ease-out',
                TONES[segment.tone].bg,
              )}
              style={{ width: `${(segment.value / safeTotal) * 100}%` }}
            />
          ),
        )}
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        {segments.map((segment) => (
          <li key={segment.key} className="flex items-center gap-2 text-sm">
            <span
              aria-hidden
              className={cn('h-2.5 w-2.5 rounded-full', TONES[segment.tone].bg)}
            />
            <span className="text-ink-soft">{segment.label}</span>
            <span className="font-mono text-sm font-semibold tabular-nums text-ink">
              {segment.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Vertical columns, scaled to the largest value. */
export function ColumnChart({
  columns,
  title,
  unitLabel,
  tone = 'accent',
}: {
  columns: { key: string; label: string; value: number }[]
  title: string
  unitLabel: string
  tone?: ChartTone
}) {
  const max = Math.max(...columns.map((column) => column.value), 1)

  return (
    <div
      role="img"
      aria-label={`${title} — ${columns
        .map((column) => `${column.label}: ${countLabel(column.value, unitLabel)}`)
        .join(', ')}`}
      className="flex flex-col gap-3"
    >
      {/* items-stretch (the default) is load-bearing: with items-end the
          columns size to their content and the flex-1 track collapses to zero,
          so the bars render nothing. */}
      <div className="flex h-32 items-stretch gap-2">
        {columns.map((column) => (
          <div
            key={column.key}
            className="flex h-full min-w-0 flex-1 flex-col items-center gap-1.5"
          >
            <span className="font-mono text-[11px] font-semibold tabular-nums text-ink">
              {column.value}
            </span>
            <div className="flex w-full min-h-0 flex-1 items-end overflow-hidden rounded-md bg-surface-high">
              <span
                className={cn(
                  'w-full rounded-md transition-[height] duration-500 ease-out',
                  TONES[tone].bg,
                )}
                style={{ height: `${Math.max((column.value / max) * 100, 4)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {columns.map((column) => (
          <span
            key={column.key}
            className="flex-1 text-center font-mono text-[10px] tracking-wider text-ink-soft uppercase"
          >
            {column.label}
          </span>
        ))}
      </div>
    </div>
  )
}
