import { useState } from 'react'
import { Button, SectionLabel } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'
import {
  buildRecommendation,
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
        <h1 className="text-2xl font-bold text-ink">Nothing to recommend yet</h1>
        <p className="max-w-md text-ink-soft">
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
  const winnerTotal = ranked.find((r) => r.optionId === winner.id)?.total ?? 0
  const fitPct = Math.max(0, Math.min(100, (winnerTotal / 10) * 100))

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <SectionLabel tone="accent">Recommendation · {decision.title}</SectionLabel>
        <h1 className="text-4xl font-semibold tracking-[-0.03em] text-ink md:text-5xl">
          {(chosenOption ?? winner).label}
        </h1>
      </header>

      {/* Verdict hero — fit-score ring + comparative chips. */}
      <section className="relative overflow-hidden rounded-xl border border-hairline bg-surface p-5 md:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-accent/10 blur-3xl"
        />
        <div className="relative flex flex-col items-center gap-8 md:grid md:grid-cols-12">
          {/* Score dial */}
          <div className="flex flex-col items-center gap-2 md:col-span-5">
            <div className="relative h-44 w-44 md:h-48 md:w-48">
              <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  fill="none"
                  className="stroke-surface-high"
                  strokeWidth="7"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  fill="none"
                  className="stroke-accent-text"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 68}
                  strokeDashoffset={2 * Math.PI * 68 * (1 - fitPct / 100)}
                  style={{ filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.45))' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-mono text-4xl font-semibold tracking-tighter text-ink md:text-5xl">
                  {formatTotal(winnerTotal)}
                </span>
                <span className="mt-0.5 font-mono text-[10px] tracking-[0.14em] text-ink-soft uppercase">
                  /10 · Fit score
                </span>
              </div>
            </div>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[10px] font-semibold tracking-[0.12em] uppercase',
                isCloseCall
                  ? 'bg-surface-high text-amber-300'
                  : 'bg-surface-high text-accent-text',
              )}
            >
              {isCloseCall
                ? `Close call · gap ${formatTotal(Math.min(gap, 10))}`
                : Number.isFinite(gap)
                  ? `Clear lead · +${formatTotal(gap)}`
                  : 'Only one option scored'}
            </span>
          </div>

          {/* Comparative chips + status */}
          <div className="flex flex-col gap-4 md:col-span-7">
            <div>
              <SectionLabel>Comparative resonance</SectionLabel>
              <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">
                {reasons[0]}{' '}
                {Number.isFinite(gap) && `That's a ${formatTotal(gap)}-point gap on the 0–10 scale.`}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {ranked.map((row, index) => (
                <div
                  key={row.optionId}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-lg p-3',
                    row.optionId === winner.id
                      ? 'bg-surface-high shadow-[0_0_20px_rgba(139,92,246,0.12)]'
                      : 'bg-canvas opacity-80',
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      aria-hidden
                      className={cn(
                        'h-2.5 w-2.5 shrink-0 rounded-full',
                        row.optionId === winner.id
                          ? 'bg-accent shadow-[0_0_8px_rgba(139,92,246,0.8)]'
                          : 'bg-ink-faint',
                      )}
                    />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-ink">
                        {row.label || 'Untitled option'}
                      </div>
                      <div
                        className={cn(
                          'font-mono text-[10px] tracking-wider uppercase',
                          row.optionId === winner.id ? 'text-accent-text' : 'text-ink-soft',
                        )}
                      >
                        {row.optionId === winner.id ? 'Recommended' : `Option ${index + 1}`}
                      </div>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 font-mono text-xl font-semibold tabular-nums',
                      row.optionId === winner.id ? 'text-accent-text' : 'text-ink-soft',
                    )}
                  >
                    {formatTotal(row.total)}
                  </span>
                </div>
              ))}
            </div>
            {outcome && (
              <p className="font-mono text-[11px] text-ink-soft">
                Committed{' '}
                {new Date(outcome.committedAt).toLocaleDateString(undefined, {
                  day: 'numeric',
                  month: 'short',
                })}
                {outcome.chosenOptionId !== winner.id &&
                  ' · scores changed after commit — the current leader differs'}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Why this decision — ranked criteria bars. */}
      <section aria-labelledby="why-heading" className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-4">
          <SectionLabel tone="accent">01 / Logic &amp; vectors</SectionLabel>
          <h2 id="why-heading" className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            Why this decision.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Deterministic synthesis comparing raw impact scores against your
            declared priority weights.
          </p>
        </div>
        <div className="flex flex-col gap-4 rounded-xl border border-hairline bg-surface p-4 md:col-span-8 md:p-5">
          <ol className="flex flex-col gap-3">
            {contributions.map((contribution, index) => (
              <CriterionRow
                key={contribution.criterionId}
                contribution={contribution}
                index={index + 1}
                winnerId={winner.id}
                options={decision.options}
              />
            ))}
          </ol>
          <div className="border-t border-hairline pt-4">
            <SectionLabel>Reasoning</SectionLabel>
            <ul className="mt-2 flex flex-col gap-1.5">
              {reasons.map((reason) => (
                <li key={reason} className="flex gap-2 text-sm text-ink-soft">
                  <span aria-hidden className="text-accent-text">·</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Trade-offs — the conscious price of choice. */}
      {tradeOffs.length > 0 && (
        <section aria-labelledby="tradeoffs-heading" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <SectionLabel tone="accent">02 / Price of choice</SectionLabel>
            <span className="font-mono text-[10px] tracking-wider text-ink-soft uppercase">
              {tradeOffs.length} trade-off{tradeOffs.length === 1 ? '' : 's'}
            </span>
          </div>
          <h2 id="tradeoffs-heading" className="text-xl font-semibold tracking-tight text-ink">
            What you are consciously giving up
          </h2>
          <ul className="flex flex-col gap-2">
            {tradeOffs.map((t) => (
              <TradeoffCard key={t.criterionId} contribution={t} options={decision.options} />
            ))}
          </ul>
        </section>
      )}

      {/* Commit / committed state. */}
      {outcome ? (
        <OutcomeReviewSection decision={decision} />
      ) : confirming ? (
        <section className="flex flex-col gap-3 rounded-xl border border-accent/50 bg-accent-soft p-5">
          <p className="text-sm text-ink">
            Committing locks this decision: scores and options become read-only.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => commitDecision(decision.id, winner.id)}>
              Commit to “{winner.label}”
            </Button>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </div>
        </section>
      ) : (
        <section className="flex flex-col items-stretch gap-3 rounded-xl border border-hairline bg-surface p-4 sm:flex-row sm:items-center sm:justify-between md:p-5">
          <p className="text-sm text-ink-soft">
            Settled on{' '}
            <strong className="font-semibold text-ink">{winner.label}</strong>?
            Committing saves the verdict and unlocks the outcome review.
          </p>
          <div className="flex shrink-0 gap-2">
            <Button variant="secondary" onClick={() => setConfirming(true)}>
              Commit to this choice…
            </Button>
          </div>
        </section>
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
  index,
  winnerId,
  options,
}: {
  contribution: CriterionContribution
  index: number
  winnerId: string
  options: DecisionOption[]
}) {
  const { label, weight, scoresByOption, leaderOptionId, contributions } = contribution
  const isTradeOff = leaderOptionId !== undefined && leaderOptionId !== winnerId

  return (
    <li className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-ink-faint">
            {String(index).padStart(2, '0')}
          </span>
          <span className="text-sm font-medium text-ink">{label}</span>
          <span className="rounded bg-surface-high px-1.5 py-0.5 font-mono text-[10px] text-ink-soft uppercase">
            {weight}/5
          </span>
        </div>
        {leaderOptionId !== undefined && (
          <span className="font-mono text-[11px] text-ink-soft">
            {options.map((option) => {
              const score = scoresByOption[option.id]
              if (score === undefined) return null
              const leads = leaderOptionId === option.id
              return (
                <span
                  key={option.id}
                  className={cn('ml-2', leads ? 'text-accent-text font-semibold' : '')}
                >
                  {option.label || 'Untitled'} {score}
                  {leads && ' ★'}
                </span>
              )
            })}
          </span>
        )}
      </div>
      {/* Contribution bar — points this criterion adds to the winner's average. */}
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-high">
          <div
            className={cn(
              'h-full rounded-full',
              isTradeOff ? 'bg-danger/70' : 'bg-accent',
            )}
            style={{
              width: `${Math.min(100, ((contributions[winnerId] ?? 0) / 5) * 100)}%`,
            }}
          />
        </div>
        <span className="w-12 shrink-0 text-right font-mono text-[11px] tabular-nums text-ink-soft">
          +{(contributions[winnerId] ?? 0).toFixed(1)}
        </span>
      </div>
      {isTradeOff && (
        <p className="text-xs font-medium text-danger">
          ⚖ Trade-off: the recommendation loses on this criterion.
        </p>
      )}
    </li>
  )
}

function TradeoffCard({
  contribution,
  options,
}: {
  contribution: CriterionContribution
  options: DecisionOption[]
}) {
  const { label, weight, scoresByOption, leaderOptionId } = contribution
  const leaderLabel =
    options.find((o) => o.id === leaderOptionId)?.label ?? 'another option'

  return (
    <li className="flex items-start gap-3 rounded-lg bg-surface-high/60 p-3.5">
      <span
        aria-hidden
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-top font-mono text-[11px] text-ink-soft"
      >
        ⚖
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-ink">{label}</h3>
        <p className="mt-0.5 text-sm text-ink-soft">
          “{leaderLabel}” scores higher here ({scoresByOption[leaderOptionId ?? ''] ?? '—'}/5
          vs {scoresByOption[Object.keys(scoresByOption).find((k) => k !== leaderOptionId) ?? ''] ?? '—'}/5).
          You're accepting that trade-off at weight {weight}/5.
        </p>
      </div>
      <span className="shrink-0 rounded-md bg-surface px-2 py-1 font-mono text-[10px] tracking-wider text-ink-soft uppercase">
        Surrendered
      </span>
    </li>
  )
}
