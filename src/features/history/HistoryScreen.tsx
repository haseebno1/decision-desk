import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/Button'
import { Select, TextInput, EmptyState } from '@/components/ui/inputs'
import { useDecisions } from '@/features/decisions/decisionStore'
import { summarizeScoring, formatTotal } from '@/lib/scoring'
import {
  CATEGORY_LABELS,
  DECISION_CATEGORIES,
  type Decision,
  type DecisionCategory,
} from '@/types/decision'

type StatusFilter = 'all' | 'draft' | 'committed'

interface HistoryScreenProps {
  onOpen: (id: string) => void
}

export function HistoryScreen({ onOpen }: HistoryScreenProps) {
  const { decisions } = useDecisions()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [category, setCategory] = useState<DecisionCategory | 'all'>('all')

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return decisions
      .filter((d) => (status === 'all' ? true : d.status === status))
      .filter((d) => (category === 'all' ? true : d.category === category))
      .filter((d) => {
        if (needle === '') return true
        const haystack = [
          d.title,
          d.description ?? '',
          ...d.options.map((o) => o.label),
          ...d.criteria.map((c) => c.label),
        ]
          .join(' ')
          .toLowerCase()
        return haystack.includes(needle)
      })
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
  }, [decisions, query, status, category])

  const groups = useMemo(() => groupByMonth(filtered), [filtered])

  const hasFilters = query.trim() !== '' || status !== 'all' || category !== 'all'

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <p className="flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.14em] text-ink-soft uppercase">
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_rgba(139,92,246,0.8)]"
          />
          Cognitive log
        </p>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Decisions journal</h1>
          <span className="font-mono text-[11px] text-ink-soft">{decisions.length} recorded</span>
        </div>
        <p className="text-sm text-ink-soft">
          Every decision you've captured, most recent first.
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs sm:flex-1">
          <svg
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
            className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-faint"
          >
            <circle cx="7" cy="7" r="4.2" stroke="currentColor" strokeWidth="1.4" />
            <path d="m10.4 10.4 2.6 2.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <TextInput
            type="search"
            value={query}
            placeholder="Search titles, options, criteria…"
            aria-label="Search decisions"
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          aria-label="Filter by status"
          onChange={(event) => setStatus(event.target.value as StatusFilter)}
          className="sm:w-36"
        >
          <option value="all">All statuses</option>
          <option value="draft">Drafts</option>
          <option value="committed">Decided</option>
        </Select>
        <Select
          value={category}
          aria-label="Filter by category"
          onChange={(event) =>
            setCategory(event.target.value as DecisionCategory | 'all')
          }
          className="sm:w-40"
        >
          <option value="all">All categories</option>
          {DECISION_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </Select>
        {hasFilters && (
          <Button
            variant="ghost"
            onClick={() => {
              setQuery('')
              setStatus('all')
              setCategory('all')
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={
            decisions.length === 0
              ? 'No decisions yet'
              : hasFilters
                ? 'Nothing matches those filters'
                : 'Nothing here'
          }
          icon={
            <svg viewBox="0 0 20 20" fill="none" className="h-6 w-6" aria-hidden>
              <path
                d="M5 3.5h8.5A1.5 1.5 0 0 1 15 5v10a1.5 1.5 0 0 1-1.5 1.5H5a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1Z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              <path d="M7 7h5M7 10h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          }
        >
          {decisions.length === 0
            ? 'Decisions you capture will appear here as a journal.'
            : 'Try a different search or clear the filters.'}
        </EmptyState>
      ) : (
        groups.map((group) => (
          <section
            key={group.label}
            aria-labelledby={`month-${group.label}`}
            className="relative pl-6 sm:pl-8"
          >
            {/* Timeline spine + month marker */}
            <div
              aria-hidden
              className="absolute top-2 bottom-2 left-[7px] w-px bg-hairline sm:left-[11px]"
            />
            <span
              aria-hidden
              className="absolute top-[3px] left-[3px] h-2 w-2 rounded-full bg-accent shadow-[0_0_12px_rgba(139,92,246,0.8)] sm:left-[7px]"
            />
            <div className="mb-4 flex items-center gap-2">
              <h2
                id={`month-${group.label}`}
                className="font-mono text-[11px] font-semibold tracking-[0.14em] text-accent-text uppercase"
              >
                {group.label}
              </h2>
              <span aria-hidden className="h-px flex-1 bg-hairline" />
              <span className="font-mono text-[10px] tracking-wider text-ink-soft uppercase">
                {group.decisions.length}{' '}
                {group.decisions.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>
            <ol className="flex flex-col gap-3">
              {group.decisions.map((decision) => (
                <li key={decision.id}>
                  <TimelineCard decision={decision} onOpen={() => onOpen(decision.id)} />
                </li>
              ))}
            </ol>
          </section>
        ))
      )}
    </div>
  )
}

function TimelineCard({
  decision,
  onOpen,
}: {
  decision: Decision
  onOpen: () => void
}) {
  const committedLabel =
    decision.status === 'committed'
      ? (decision.options.find((o) => o.id === decision.outcome?.chosenOptionId)
          ?.label ?? null)
      : null

  const summary = summarizeScoring(decision)
  const hasScores = summary.scoredCells > 0
  const leaderTotal = hasScores ? summary.ranked[0]?.total : undefined
  const leader =
    hasScores
      ? decision.options.find((o) => o.id === summary.ranked[0]?.optionId)?.label
      : null
  const reviewed = decision.outcome?.review !== undefined

  const statusLabel =
    decision.status === 'committed' ? (reviewed ? 'Reviewed' : 'Decided') : 'Draft'

  const detail =
    decision.status === 'committed' && committedLabel !== null
      ? `Chose “${committedLabel}”`
      : leader !== null
        ? `Leading: ${leader} · ${formatTotal(leaderTotal ?? 0)}/10`
        : 'Not scored yet'

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${decision.title}`}
      className="group w-full cursor-pointer rounded-xl border border-hairline bg-surface p-4 text-left transition-[background-color,border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-hairline-strong hover:bg-surface-high hover:shadow-[0_8px_24px_rgba(0,0,0,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-surface-high px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-ink-soft uppercase">
              {CATEGORY_LABELS[decision.category]}
            </span>
            <span className="font-mono text-[11px] text-ink-faint">
              {new Date(decision.updatedAt).toLocaleDateString(undefined, {
                day: 'numeric',
                month: 'short',
              })}
            </span>
            <span
              className={cn(
                'font-mono text-[11px]',
                decision.status === 'committed' ? 'text-accent-text' : 'text-ink-soft',
              )}
            >
              · {statusLabel}
            </span>
          </div>
          <h3 className="mt-1.5 truncate text-base font-medium text-ink transition-colors group-hover:text-accent-text">
            {decision.title}
          </h3>
          <p className="mt-1 font-mono text-[11px] leading-relaxed text-ink-soft">{detail}</p>
        </div>

        {/* Clarity score ring — mirrors the Stitch ledger card. */}
        <div className="flex items-center gap-3 self-start rounded-lg bg-canvas px-3 py-2 sm:self-center">
          <div className="text-right">
            <span className="block font-mono text-[9px] leading-none tracking-[0.14em] text-ink-soft uppercase">
              Clarity
            </span>
            <span
              className={cn(
                'font-mono text-sm font-semibold',
                hasScores ? 'text-ink' : 'text-ink-faint',
              )}
            >
              {hasScores ? formatTotal(leaderTotal ?? 0) : '—'}
            </span>
          </div>
          <ScoreRing value={hasScores ? (leaderTotal ?? 0) : 0} />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end border-t border-hairline pt-2.5">
        <span className="font-mono text-[11px] font-semibold tracking-wider text-ink-soft uppercase transition-colors group-hover:text-accent-text">
          View ledger →
        </span>
      </div>
    </button>
  )
}

function ScoreRing({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, (value / 10) * 100))
  return (
    <svg viewBox="0 0 36 36" className="h-6 w-6 -rotate-90 text-accent-text" aria-hidden>
      <path
        className="stroke-hairline"
        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        fill="none"
        strokeWidth="4"
      />
      <path
        className="stroke-current transition-all duration-500"
        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        fill="none"
        strokeDasharray={`${pct}, 100`}
        strokeLinecap="round"
        strokeWidth="4"
      />
    </svg>
  )
}

function groupByMonth(decisions: Decision[]) {
  const groups = new Map<string, Decision[]>()
  for (const decision of decisions) {
    const label = new Date(decision.updatedAt).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    })
    const bucket = groups.get(label)
    if (bucket) bucket.push(decision)
    else groups.set(label, [decision])
  }
  return [...groups.entries()].map(([label, groupDecisions]) => ({
    label,
    decisions: groupDecisions,
  }))
}
