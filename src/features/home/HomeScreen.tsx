import { Button, SectionLabel } from '@/components/ui/Button'
import { CATEGORY_LABELS, STAKE_LABELS, type Decision } from '@/types/decision'
import { useDecisions } from '@/features/decisions/decisionStore'
import { useToast } from '@/features/decisions/toastStore'
import { EmptyState } from '@/components/ui/inputs'
import { summarizeScoring, formatTotal } from '@/lib/scoring'

interface HomeScreenProps {
  onStart: () => void
  onEdit: (id: string) => void
}

export function HomeScreen({ onStart, onEdit }: HomeScreenProps) {
  const { decisions, deleteDecision, restoreDecision } = useDecisions()
  const { showToast } = useToast()

  const handleDelete = (decision: Decision) => {
    deleteDecision(decision.id)
    showToast({
      message: `Deleted “${decision.title}”.`,
      actionLabel: 'Undo',
      onAction: () => restoreDecision(decision),
    })
  }
  // "Recent decisions" has to mean recent: the store holds insertion order,
  // which never changes when an older decision is edited (History already
  // sorts by updatedAt, so the two screens disagreed).
  const recent = [...decisions].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )

  const draftCount = decisions.filter((d) => d.status === 'draft').length
  const committedCount = decisions.length - draftCount
  const summary = [
    draftCount > 0 ? `${draftCount} draft${draftCount === 1 ? '' : 's'}` : null,
    committedCount > 0
      ? `${committedCount} decided`
      : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <section className="flex flex-col gap-10">
      {/* Hero — editorial command surface */}
      <header className="flex flex-col items-center gap-5 py-10 text-center md:py-14">
        <p className="inline-flex items-center gap-2 rounded-full bg-surface-high px-3 py-1 font-mono text-[10px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          Decision fatigue relief
        </p>
        <h1 className="max-w-xl text-4xl font-semibold tracking-[-0.03em] text-ink md:text-[32px] md:leading-[1.2]">
          Good morning. <span className="font-normal text-ink-soft">What are you stuck on?</span>
        </h1>
        <p className="max-w-lg text-[15px] leading-relaxed text-ink-soft">
          Capture the decision, weigh your criteria, and compare your options —
          one transparent step at a time.
        </p>
        <Button onClick={onStart} className="mt-1 px-5 py-2.5">
          Start a new decision
        </Button>
      </header>

      <section aria-labelledby="drafts-heading" className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <SectionLabel tone="accent">Recent decisions</SectionLabel>
            {decisions.length > 0 && (
              <span className="rounded-md bg-surface-high px-1.5 py-0.5 font-mono text-[10px] text-ink-soft">
                {summary || '0 recorded'}
              </span>
            )}
          </div>
        </div>

        {decisions.length === 0 ? (
          <EmptyState
            title="No decisions yet"
            icon={
              <svg viewBox="0 0 20 20" fill="none" className="h-6 w-6" aria-hidden>
                <path
                  d="M3.5 8.5 10 3l6.5 5.5V16a1 1 0 0 1-1 1h-4v-4.5h-3V17h-4a1 1 0 0 1-1-1V8.5Z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          >
            Start your first one — capture the choice, list your options, and
            let the weights do the arguing for you.
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {recent.map((decision) => (
              <li key={decision.id}>
                <DecisionCard
                  decision={decision}
                  onEdit={() => onEdit(decision.id)}
                  onDelete={() => handleDelete(decision)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  )
}

function DecisionCard({
  decision,
  onEdit,
  onDelete,
}: {
  decision: Decision
  onEdit: () => void
  onDelete: () => void
}) {
  const updated = new Date(decision.updatedAt).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  })

  const summary = summarizeScoring(decision)
  const hasScores = summary.scoredCells > 0
  const leaderTotal = hasScores ? summary.ranked[0]?.total : undefined

  return (
    <article className="group flex flex-col gap-3 rounded-xl border border-hairline bg-surface p-4 transition-colors duration-150 hover:border-hairline-strong hover:bg-surface-high sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex min-w-0 items-center gap-3.5">
        {/* Fit-score tile — the Stitch journal marker. */}
        <div
          aria-hidden
          className={
            hasScores
              ? 'flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-accent/15 font-mono text-sm font-semibold text-accent-text'
              : 'flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-surface-high font-mono text-sm font-semibold text-ink-soft'
          }
        >
          {hasScores ? formatTotal(leaderTotal ?? 0) : '—'}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-base font-medium text-ink transition-colors group-hover:text-accent-text">
            <button type="button" onClick={onEdit} className="cursor-pointer text-left">
              {decision.title}
            </button>
          </h3>
          <p className="mt-0.5 truncate font-mono text-[11px] text-ink-soft">
            <span
              className={
                decision.status === 'committed' ? 'mr-1.5 text-accent-text' : 'mr-1.5'
              }
            >
              {decision.status === 'committed'
                ? decision.outcome?.review
                  ? 'Reviewed'
                  : 'Decided'
                : 'Draft'}
            </span>
            · {CATEGORY_LABELS[decision.category]} ·{' '}
            {STAKE_LABELS[decision.stake].toLowerCase()} stake ·{' '}
            {decision.options.length} options · {updated}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 pl-[54px] sm:pl-0">
        <Button variant="secondary" onClick={onEdit}>
          {decision.status === 'committed' ? 'View' : 'Open'}
        </Button>
        <Button
          variant="ghost"
          aria-label={`Delete ${decision.title}`}
          onClick={onDelete}
          className="px-2.5"
        >
          ✕
        </Button>
      </div>
    </article>
  )
}
