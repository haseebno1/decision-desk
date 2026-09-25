import { useMemo } from 'react'
import { useDecisions } from '@/features/decisions/decisionStore'
import {
  averageOptionsPerDecision,
  buildPatternsReport,
  type PatternsReport,
} from '@/lib/patterns'
import { formatTotal } from '@/lib/scoring'
import { CATEGORY_LABELS, STAKE_LABELS } from '@/types/decision'

export function PatternsScreen() {
  const { decisions } = useDecisions()

  const report = useMemo(() => buildPatternsReport(decisions), [decisions])
  const avgOptions = useMemo(
    () => averageOptionsPerDecision(decisions),
    [decisions],
  )

  if (decisions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-700 py-16 text-center">
        <h1 className="text-xl font-semibold text-slate-100">No patterns yet</h1>
        <p className="max-w-sm text-sm text-slate-500">
          Capture a few decisions and this page will surface your habits: the
          categories you revisit, the criteria you lean on, and how long you
          sit on choices.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-50">Patterns</h1>
        <p className="text-sm text-slate-400">
          What {report.total} decision{report.total === 1 ? '' : 's'} say about how you decide.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Decisions" value={String(report.total)} />
        <StatCard
          label="Avg winner score"
          value={
            report.averageWinnerScore !== null
              ? `${formatTotal(report.averageWinnerScore)}/10`
              : '—'
          }
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
          />
        </div>
      )}

      <section aria-labelledby="categories-heading" className="flex flex-col gap-3">
        <h2 id="categories-heading" className="text-lg font-semibold text-slate-100">
          By category
        </h2>
        <BarList
          rows={report.categories.map((row) => ({
            key: row.category,
            label: CATEGORY_LABELS[row.category],
            count: row.count,
          }))}
          barClass="bg-emerald-500/70"
        />
      </section>

      <section aria-labelledby="stakes-heading" className="flex flex-col gap-3">
        <h2 id="stakes-heading" className="text-lg font-semibold text-slate-100">
          By stake
        </h2>
        <BarList
          rows={report.stakes.map((row) => ({
            key: row.stake,
            label: STAKE_LABELS[row.stake],
            count: row.count,
          }))}
          barClass="bg-sky-500/70"
        />
      </section>

      <section aria-labelledby="criteria-heading" className="flex flex-col gap-3">
        <h2 id="criteria-heading" className="text-lg font-semibold text-slate-100">
          Most-used criteria
        </h2>
        {report.criteria.length === 0 ? (
          <p className="text-sm text-slate-500">
            No named criteria yet — they'll appear as you weight decisions.
          </p>
        ) : (
          <BarList
            rows={report.criteria.map((row) => ({
              key: row.label.toLowerCase(),
              label: row.label,
              count: row.count,
            }))}
            barClass="bg-violet-500/70"
          />
        )}
      </section>

      {report.insights.length > 0 && (
        <section aria-labelledby="insights-heading" className="flex flex-col gap-3">
          <h2 id="insights-heading" className="text-lg font-semibold text-slate-100">
            Insights
          </h2>
          <ul className="flex flex-col gap-2">
            {report.insights.map((insight) => (
              <li
                key={insight}
                className="flex gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-300"
              >
                <span aria-hidden className="text-emerald-400">◆</span>
                {insight}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">
        {label}
      </span>
      <span className="text-2xl font-bold tabular-nums text-slate-50">{value}</span>
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
    <ul className="flex flex-col gap-2">
      {rows.map((row) => (
        <li key={row.key} className="flex items-center gap-3 text-sm">
          <span className="w-32 shrink-0 truncate text-slate-300">{row.label}</span>
          <div
            className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-800"
            role="img"
            aria-label={`${row.label}: ${row.count} decision${row.count === 1 ? '' : 's'}`}
          >
            <div
              className={`h-full rounded-full ${barClass}`}
              style={{ width: `${(row.count / max) * 100}%` }}
            />
          </div>
          <span className="w-8 shrink-0 text-right tabular-nums text-slate-400">
            {row.count}
          </span>
        </li>
      ))}
    </ul>
  )
}

// Keep the type import referenced for report shape documentation.
export type { PatternsReport }
