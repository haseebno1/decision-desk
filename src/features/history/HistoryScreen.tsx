import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Select, TextInput } from '@/components/ui/inputs'
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
        <h1 className="text-2xl font-bold tracking-tight text-slate-50">History</h1>
        <p className="text-sm text-slate-400">
          Every decision you've captured, most recent first.
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <TextInput
          type="search"
          value={query}
          placeholder="Search titles, options, criteria…"
          aria-label="Search decisions"
          onChange={(event) => setQuery(event.target.value)}
          className="sm:max-w-xs"
        />
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
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-700 py-12 text-center">
          <p className="font-medium text-slate-300">
            {decisions.length === 0
              ? 'No decisions yet'
              : hasFilters
                ? 'Nothing matches those filters'
                : 'Nothing here'}
          </p>
          <p className="max-w-sm text-sm text-slate-500">
            {decisions.length === 0
              ? 'Decisions you capture will appear here as a timeline.'
              : 'Try a different search or clear the filters.'}
          </p>
        </div>
      ) : (
        groups.map((group) => (
          <section
            key={group.label}
            aria-labelledby={`month-${group.label}`}
            className="flex flex-col gap-3"
          >
            <h2
              id={`month-${group.label}`}
              className="text-sm font-semibold tracking-widest text-slate-400 uppercase"
            >
              {group.label}
            </h2>
            <ol className="relative flex flex-col gap-3 border-l border-slate-800 pl-5">
              {group.decisions.map((decision) => (
                <li key={decision.id} className="relative">
                  <span
                    aria-hidden
                    className={
                      decision.status === 'committed'
                        ? 'absolute top-4 -left-[26px] h-2.5 w-2.5 rounded-full bg-emerald-400 ring-4 ring-slate-950'
                        : 'absolute top-4 -left-[26px] h-2.5 w-2.5 rounded-full bg-slate-600 ring-4 ring-slate-950'
                    }
                  />
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
  const leader =
    summary.scoredCells > 0
      ? decision.options.find((o) => o.id === summary.ranked[0]?.optionId)?.label
      : null

  return (
    <article className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="min-w-0">
        <h3 className="truncate font-medium text-slate-100">{decision.title}</h3>
        <p className="mt-0.5 text-sm text-slate-500">
          {decision.status === 'committed' ? 'Decided' : 'Draft'} ·{' '}
          {CATEGORY_LABELS[decision.category]}
          {committedLabel !== null ? ` · chose “${committedLabel}”` : null}
          {committedLabel === null && leader !== null
            ? ` · leading: ${leader} (${formatTotal(summary.ranked[0].total)}/10)`
            : null}
        </p>
      </div>
      <Button variant="secondary" onClick={onOpen}>
        View
      </Button>
    </article>
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
