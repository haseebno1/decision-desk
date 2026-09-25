import { Button } from '@/components/ui/Button'
import { CATEGORY_LABELS, STAKE_LABELS, type Decision } from '@/types/decision'
import { useDecisions } from '@/features/decisions/decisionStore'

interface HomeScreenProps {
  onStart: () => void
  onEdit: (id: string) => void
}

export function HomeScreen({ onStart, onEdit }: HomeScreenProps) {
  const { decisions, deleteDecision } = useDecisions()
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
      <div className="flex flex-col items-center gap-6 py-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-50">
          Decide with clarity.
        </h1>
        <p className="max-w-xl text-balance text-lg text-slate-400">
          Capture the decision, weigh your criteria, and compare your options —
          one transparent step at a time.
        </p>
        <Button onClick={onStart}>Start a new decision</Button>
      </div>

      <section aria-labelledby="drafts-heading" className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 id="drafts-heading" className="text-xl font-semibold text-slate-100">
            Your decisions
          </h2>
          <p className="text-sm text-slate-500">
            {decisions.length === 0 ? 'Nothing here yet' : summary}
          </p>
        </div>

        {decisions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-700 py-12 text-center">
            <p className="font-medium text-slate-300">No decisions yet</p>
            <p className="max-w-sm text-sm text-slate-500">
              Start your first one — capture the choice, list your options, and
              let the weights do the arguing for you.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {decisions.map((decision) => (
              <li key={decision.id}>
                <DecisionCard
                  decision={decision}
                  onEdit={() => onEdit(decision.id)}
                  onDelete={() => deleteDecision(decision.id)}
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

  return (
    <article className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="min-w-0">
        <h3 className="truncate font-medium text-slate-100">{decision.title}</h3>
        <p className="mt-0.5 text-sm text-slate-500">
          <span
            className={
              decision.status === 'committed'
                ? 'mr-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300'
                : 'mr-1.5 rounded-full bg-slate-700/50 px-2 py-0.5 text-xs font-medium text-slate-400'
            }
          >
            {decision.status === 'committed' ? 'Decided' : 'Draft'}
          </span>
          {CATEGORY_LABELS[decision.category]} · Stake:{' '}
          {STAKE_LABELS[decision.stake].toLowerCase()} · {decision.options.length}{' '}
          options · updated {updated}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="secondary" onClick={onEdit}>
          {decision.status === 'committed' ? 'View' : 'Open'}
        </Button>
        <Button variant="ghost" aria-label={`Delete ${decision.title}`} onClick={onDelete}>
          Delete
        </Button>
      </div>
    </article>
  )
}
