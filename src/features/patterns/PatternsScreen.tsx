import { useMemo } from 'react'
import { SectionLabel } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/inputs'
import { useDecisions } from '@/features/decisions/decisionStore'
import {
  averageOptionsPerDecision,
  buildPatternsReport,
  type PatternsReport,
} from '@/lib/patterns'
import { formatTotal } from '@/lib/scoring'
import { CATEGORY_LABELS, STAKE_LABELS } from '@/types/decision'
import {
  ChartCard,
  ColumnChart,
  Donut,
  RankedBars,
  StackedBar,
  type ChartSegment,
} from './charts'

/**
 * Patterns — the retrospective read of everything captured so far.
 *
 * Every figure on this screen comes from `buildPatternsReport` (or the
 * sibling `averageOptionsPerDecision`) or is a direct count of stored records.
 * Nothing here re-derives an engine number: if a new statistic is wanted, it
 * belongs in `src/lib/patterns.ts` with a test.
 */
export function PatternsScreen() {
  const { decisions } = useDecisions()

  const report = useMemo(() => buildPatternsReport(decisions), [decisions])
  const avgOptions = useMemo(
    () => averageOptionsPerDecision(decisions),
    [decisions],
  )

  // Direct tallies of the records themselves — how far each decision got, and
  // how the reviews were rated. Counts only: no averages or scores are
  // recomputed here.
  const stageCounts = useMemo(() => {
    let draft = 0
    let decided = 0
    let reviewed = 0
    for (const decision of decisions) {
      if (decision.status === 'draft') draft += 1
      else if (decision.outcome?.review) reviewed += 1
      else decided += 1
    }
    return { draft, decided, reviewed }
  }, [decisions])

  const satisfactionBins = useMemo(() => {
    const bins = [0, 0, 0, 0, 0]
    for (const decision of decisions) {
      const review = decision.outcome?.review
      if (review) bins[review.satisfaction - 1] += 1
    }
    return bins
  }, [decisions])

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

  const stageSegments: ChartSegment[] = [
    { key: 'reviewed', label: 'Reviewed', value: stageCounts.reviewed, tone: 'accent' },
    { key: 'decided', label: 'Decided, not reviewed', value: stageCounts.decided, tone: 'accent-mid' },
    { key: 'draft', label: 'Still drafts', value: stageCounts.draft, tone: 'muted' },
  ]

  const stakeSegments: ChartSegment[] = report.stakes.map((row, index) => ({
    key: row.stake,
    label: STAKE_LABELS[row.stake],
    value: row.count,
    tone: index === 0 ? 'accent' : index === 1 ? 'accent-mid' : 'accent-soft',
  }))

  // Columns are labelled with the rating itself (1–5), matching the scale on
  // the outcome-review form rather than inventing new wording for it.
  const satisfactionColumns = satisfactionBins.map((count, index) => ({
    key: String(index + 1),
    label: String(index + 1),
    value: count,
  }))

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <SectionLabel>Synthesis module</SectionLabel>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Patterns</h1>
        <p className="text-sm text-ink-soft">
          What {report.total} decision{report.total === 1 ? '' : 's'} say about how you decide.
        </p>
      </header>

      {/* Headline numbers — the same five figures as before, given room. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Where they stand"
          caption="Every decision by how far it got."
        >
          <Donut
            title="Where decisions stand"
            segments={stageSegments}
            total={report.total}
            centerLabel="Total"
          />
        </ChartCard>

        <ChartCard
          title="How it felt afterwards"
          caption={
            report.reviewedCount > 0
              ? `${report.reviewedCount} reviewed decision${report.reviewedCount === 1 ? '' : 's'}.`
              : 'No reviews recorded yet.'
          }
        >
          {report.reviewedCount > 0 ? (
            <ColumnChart
              title="Satisfaction ratings"
              columns={satisfactionColumns}
              unitLabel="reviews"
            />
          ) : (
            <p className="text-sm text-ink-soft">
              Commit a decision, live with it, then record a review — the
              ratings land here.
            </p>
          )}
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="By category" caption="What kinds of choices you face.">
          <RankedBars
            title="Decisions by category"
            rows={report.categories.map((row) => ({
              key: row.category,
              label: CATEGORY_LABELS[row.category],
              value: row.count,
            }))}
          />
        </ChartCard>

        <ChartCard title="By stake" caption="How much is riding on them.">
          <StackedBar
            title="Decisions by stake"
            segments={stakeSegments}
            total={report.total}
          />
          {report.reviewedCount > 0 && (
            <div className="grid grid-cols-2 gap-3 border-t border-hairline pt-4">
              <MiniStat
                label="Avg satisfaction"
                value={`${report.averageSatisfaction!.toFixed(1)}/5`}
              />
              <MiniStat
                label="Would redo same way"
                value={`${Math.round(report.wouldChooseAgainRate! * 100)}%`}
                accent
              />
            </div>
          )}
        </ChartCard>
      </div>

      <ChartCard
        title="Most-used criteria"
        caption="What you keep measuring against, across every decision."
      >
        {report.criteria.length === 0 ? (
          <p className="text-sm text-ink-soft">
            No named criteria yet — they'll appear as you weight decisions.
          </p>
        ) : (
          <RankedBars
            title="Most-used criteria"
            tone="accent-mid"
            rows={report.criteria.map((row) => ({
              key: row.label.toLowerCase(),
              label: row.label,
              value: row.count,
            }))}
          />
        )}
      </ChartCard>

      {report.insights.length > 0 && (
        <section aria-labelledby="insights-heading" className="flex flex-col gap-3">
          <SectionLabel tone="accent">Something interesting</SectionLabel>
          <ul className="grid gap-2.5 md:grid-cols-2">
            {report.insights.map((insight) => (
              <li
                key={insight}
                className="flex gap-3 rounded-xl border border-hairline bg-surface p-4"
              >
                <span aria-hidden className="shrink-0 text-accent-text">
                  ◆
                </span>
                <p className="text-[15px] leading-relaxed text-ink">{insight}</p>
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
            ? 'text-2xl font-semibold tabular-nums text-accent-text md:text-3xl'
            : 'text-2xl font-semibold tabular-nums text-ink md:text-3xl'
        }
      >
        {value}
      </span>
    </div>
  )
}

function MiniStat({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[10px] tracking-[0.12em] text-ink-soft uppercase">
        {label}
      </span>
      <span
        className={
          accent
            ? 'font-mono text-lg font-semibold tabular-nums text-accent-text'
            : 'font-mono text-lg font-semibold tabular-nums text-ink'
        }
      >
        {value}
      </span>
    </div>
  )
}

// Keep the type import referenced for report shape documentation.
export type { PatternsReport }
