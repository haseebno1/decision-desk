import { useMemo } from 'react'
import { SectionLabel } from '@/components/ui/Button'
import { useDecisions } from '@/features/decisions/decisionStore'
import {
  averageOptionsPerDecision,
  buildPatternsReport,
  type PatternsReport,
} from '@/lib/patterns'
import { formatTotal } from '@/lib/scoring'
import { CATEGORY_LABELS, STAKE_LABELS } from '@/types/decision'
import { EmptyState } from '@/components/ui/inputs'

export function PatternsScreen() {
  const { decisions } = useDecisions()

  const report = useMemo(() => buildPatternsReport(decisions), [decisions])
  const avgOptions = useMemo(
    () => averageOptionsPerDecision(decisions),
    [decisions],
  )

  if (decisions.length === 0) {
    return (
      <EmptyState
        title="No patterns yet"
        icon={
          <svg viewBox="0 0 20 20" fill="none" className="h-6 w-6" aria-hidden>
            <circle cx="5" cy="14.5" r="1.8" stroke="currentColor" strokeWidth="1.4" />
            <circle cx="10" cy="9" r="1.8" stroke="currentColor" strokeWidth="1.4" />
            <circle cx="15" cy="4.5" r="1.8" stroke="currentColor" strokeWidth="1.4" />
            <path
              d="m6.4 13 2.2-2.5m1.9-1 2.6-2.7"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
        }
      >
        Capture a few decisions and this page will surface your habits: the
        categories you revisit, the criteria you lean on, and how long you
        sit on choices.
      </EmptyState>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <SectionLabel>Synthesis module</SectionLabel>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Patterns</h1>
        <p className="text-sm text-ink-soft">
          What {report.total} decision{report.total === 1 ? '' : 's'} say about how you decide.
        </p>
      </header>

      {/* Metric trio — compact surface nodes. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Decisions" value={String(report.total)} />
        <StatCard
          label="Avg winner score"
          value={
            report.averageWinnerScore !== null
              ? `${formatTotal(report.averageWinnerScore)}/10`
              : '—'
          }
          accent
        />
        <StatCard
          label="Avg options compared"
          value={avgOptions !== null ? avgOptions.toFixed(1) : '—'}
        />
        <StatCard
          label="Avg time open"
          value={
            report.averageDecisionSpanDays !== null
              ? `${Math.round(report.averageDecisionSpanDays)}d`
              : '—'
          }
        />
      </div>

      {report.reviewedCount > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Avg satisfaction"
            value={`${report.averageSatisfaction!.toFixed(1)}/5`}
          />
          <StatCard
            label="Would redo same way"
            value={`${Math.round(report.wouldChooseAgainRate! * 100)}%`}
            accent
          />
        </div>
      )}

      <section aria-labelledby="categories-heading" className="flex flex-col gap-3">
        <SectionLabel>By category</SectionLabel>
        <BarList
          rows={report.categories.map((row) => ({
            key: row.category,
            label: CATEGORY_LABELS[row.category],
            count: row.count,
          }))}
          barClass="bg-accent"
        />
      </section>

      <section aria-labelledby="stakes-heading" className="flex flex-col gap-3">
        <SectionLabel>By stake</SectionLabel>
        <BarList
          rows={report.stakes.map((row) => ({
            key: row.stake,
            label: STAKE_LABELS[row.stake],
            count: row.count,
          }))}
          barClass="bg-accent/50"
        />
      </section>

      <section aria-labelledby="criteria-heading" className="flex flex-col gap-3">
        <SectionLabel>Most-used criteria</SectionLabel>
        {report.criteria.length === 0 ? (
          <p className="text-sm text-ink-soft">
            No named criteria yet — they'll appear as you weight decisions.
          </p>
        ) : (
          <BarList
            rows={report.criteria.map((row) => ({
              key: row.label.toLowerCase(),
              label: row.label,
              count: row.count,
            }))}
            barClass="bg-accent/70"
          />
        )}
      </section>

      {report.insights.length > 0 && (
        <section aria-labelledby="insights-heading" className="flex flex-col gap-3">
          <SectionLabel tone="accent">Something interesting</SectionLabel>
          <ul className="flex flex-col gap-2.5">
            {report.insights.map((insight) => (
              <li
                key={insight}
                className="rounded-xl border border-hairline bg-surface p-4"
              >
                <p className="text-[15px] leading-relaxed text-ink italic">“{insight}”</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-hairline bg-surface p-4">
      <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-ink-soft uppercase">
        {label}
      </span>
      <span
        className={
          accent
            ? 'text-2xl font-semibold tabular-nums text-accent-text'
            : 'text-2xl font-semibold tabular-nums text-ink'
        }
      >
        {value}
      </span>
    </div>
  )
}

function BarList({
  rows,
  barClass,
}: {
  rows: Array<{ key: string; label: string; count: number }>
  barClass: string
}) {
  const max = Math.max(...rows.map((r) => r.count), 1)
  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((row) => (
        <li key={row.key} className="flex items-center gap-3 text-sm">
          <span className="w-32 shrink-0 truncate text-ink">{row.label}</span>
          <div
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-high"
            role="img"
            aria-label={`${row.label}: ${row.count} decision${row.count === 1 ? '' : 's'}`}
          >
            <div
              className={`h-full rounded-full transition-[width] duration-500 ${barClass}`}
              style={{ width: `${(row.count / max) * 100}%` }}
            />
          </div>
          <span className="w-8 shrink-0 text-right font-mono text-[11px] tabular-nums text-ink-soft">
            {row.count}
          </span>
        </li>
      ))}
    </ul>
  )
}

// Keep the type import referenced for report shape documentation.
export type { PatternsReport }
