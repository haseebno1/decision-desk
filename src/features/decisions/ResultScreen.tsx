import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'
import {
  buildRecommendation,
  CLOSE_CALL_THRESHOLD,
  type CriterionContribution,
} from '@/lib/recommendation'
import { formatTotal } from '@/lib/scoring'
import { useDecisions } from './decisionStore'
import { OutcomeReviewSection } from './OutcomeReviewSection'
import type { Decision, DecisionOption } from '@/types/decision'

interface ResultScreenProps {
  decision: Decision
  onBack: () => void
}

export function ResultScreen({ decision, onBack }: ResultScreenProps) {
  const [confirming, setConfirming] = useState(false)
  const { commitDecision } = useDecisions()

  const recommendation = buildRecommendation(decision)
  const outcome = decision.outcome
  const chosenOption = outcome
    ? decision.options.find((o) => o.id === outcome.chosenOptionId)
    : undefined

  if (!recommendation) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-50">Nothing to recommend yet</h1>
        <p className="max-w-md text-slate-400">
          Score at least one criterion against two options and a recommendation
          will appear here.
        </p>
        <Button variant="secondary" onClick={onBack}>
          Back to the decision
        </Button>
      </div>
    )
  }

  const { winner, gap, isCloseCall, tradeOffs, contributions, reasons, ranked } =
    recommendation

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium tracking-widest text-slate-400 uppercase">
          Recommendation · {decision.title}
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-50">
          {(chosenOption ?? winner).label}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {isCloseCall ? (
            <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-300">
              Close call · gap {formatTotal(Math.min(gap, 10))} &lt; {CLOSE_CALL_THRESHOLD}
            </span>
          ) : Number.isFinite(gap) ? (
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
              Clear lead · +{formatTotal(gap)} points
            </span>
          ) : (
            <span className="rounded-full bg-slate-700/40 px-3 py-1 text-xs font-medium text-slate-300">
              Only one option scored
            </span>
          )}
          {tradeOffs.length > 0 && (
            <span className="rounded-full bg-rose-500/15 px-3 py-1 text-xs font-medium text-rose-300">
              {tradeOffs.length} trade-off{tradeOffs.length === 1 ? '' : 's'}
            </span>
          )}
          {outcome && (
            <span className="rounded-full bg-slate-700/40 px-3 py-1 text-xs font-medium text-slate-300">
              Committed{' '}
              {new Date(outcome.committedAt).toLocaleDateString(undefined, {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          )}
        </div>
      </header>

      <section aria-labelledby="why-heading" className="flex flex-col gap-2">
        <h2 id="why-heading" className="text-lg font-semibold text-slate-100">
          Why this recommendation
        </h2>
        <ul className="flex flex-col gap-1.5">
          {reasons.map((reason) => (
            <li key={reason} className="flex gap-2 text-sm text-slate-300">
              <span aria-hidden className="text-emerald-400">•</span>
              {reason}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="ranking-heading" className="flex flex-col gap-2">
        <h2 id="ranking-heading" className="text-lg font-semibold text-slate-100">
          Ranking
        </h2>
        <ol className="flex flex-col gap-2">
          {ranked.map((row, index) => (
            <li
              key={row.optionId}
              className={cn(
                'flex items-center justify-between gap-4 rounded-xl border p-3',
                row.optionId === winner.id
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-slate-800 bg-slate-900/60',
              )}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="w-5 text-center text-sm font-medium text-slate-500">
                  {index + 1}
                </span>
                <span className="truncate text-sm font-medium text-slate-100">
                  {row.label || 'Untitled option'}
                </span>
              </span>
              <span
                className={cn(
                  'shrink-0 text-sm font-semibold tabular-nums',
                  row.optionId === winner.id ? 'text-emerald-400' : 'text-slate-300',
                )}
              >
                {formatTotal(row.total)}/10
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="breakdown-heading" className="flex flex-col gap-2">
        <h2 id="breakdown-heading" className="text-lg font-semibold text-slate-100">
          Criteria breakdown
        </h2>
        <ul className="flex flex-col gap-2">
          {contributions.map((contribution) => (
            <CriterionRow
              key={contribution.criterionId}
              contribution={contribution}
              winnerId={winner.id}
              options={decision.options}
            />
          ))}
        </ul>
      </section>

      {outcome ? (
        <>
          <p className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
            This decision is committed to{' '}
            <strong className="text-slate-200">{chosenOption?.label ?? 'an option'}</strong>.
            {outcome.chosenOptionId !== winner.id &&
              ' Note: scores changed after commit — this is no longer the current mathematical leader.'}
          </p>
          <OutcomeReviewSection decision={decision} />
        </>
      ) : confirming ? (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
          <p className="text-sm text-amber-200">
            Committing locks this decision: scores and options become read-only.
          </p>
          <div className="flex items-center gap-2">
            <Button onClick={() => commitDecision(decision.id, winner.id)}>
              Commit to “{winner.label}”
            </Button>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <Button variant="secondary" onClick={() => setConfirming(true)}>
            Commit to this choice…
          </Button>
        </div>
      )}

      <div>
        <Button variant="ghost" onClick={onBack}>
          ← Back to the decision
        </Button>
      </div>
    </div>
  )
}

function CriterionRow({
  contribution,
  winnerId,
  options,
}: {
  contribution: CriterionContribution
  winnerId: string
  options: DecisionOption[]
}) {
  const { label, weight, scoresByOption, leaderOptionId } = contribution
  const isTradeOff = leaderOptionId !== undefined && leaderOptionId !== winnerId

  return (
    <li className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-100">{label}</span>
        <span className="text-xs text-slate-500">weight {weight}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {options.map((option) => {
          const score = scoresByOption[option.id]
          const leads = leaderOptionId === option.id
          return (
            <span key={option.id} className="text-xs text-slate-400">
              {option.label || 'Untitled'}:{' '}
              <span
                className={cn(
                  'font-semibold tabular-nums',
                  leads ? 'text-emerald-400' : 'text-slate-300',
                )}
              >
                {score ?? '—'}
              </span>
              {leads && <span aria-hidden> ★</span>}
            </span>
          )
        })}
      </div>
      {isTradeOff && (
        <p className="mt-2 text-xs font-medium text-rose-300">
          ⚖ Trade-off: the recommendation loses on this criterion.
        </p>
      )}
    </li>
  )
}
