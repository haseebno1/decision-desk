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

  // Option letters (A, B, C… in the same order the editors and the matrix
  // use) so the evidence columns can be read without repeating long labels.
  const lettersByOption = new Map(
    decision.options.map((option, index) => [
      option.id,
      String.fromCharCode(65 + index),
    ]),
  )

  // Where the winner stands, criterion by criterion. A contribution value is
  // points toward the average, so it stays positive even on a trade-off the
  // winner loses — standing has to be judged against the rival scores, and a
  // shared top score is a tie, not a lead. The full engine sentences live
  // once, in the reasoning list below: the hero used to repeat reasons[0].
  const standings = contributions.map((entry) => {
    const rivalScores = Object.values(entry.scoresByOption).filter(
      (value): value is number => typeof value === 'number',
    )
    const own = entry.scoresByOption[winner.id]
    const best = rivalScores.length > 0 ? Math.max(...rivalScores) : undefined
    const standing: 'leads' | 'ties' | 'behind' | 'unscored' =
      own === undefined || best === undefined
        ? 'unscored'
        : own < best
          ? 'behind'
          : rivalScores.filter((value) => value === best).length > 1
            ? 'ties'
            : 'leads'
    return {
      label: entry.label,
      points: entry.contributions[winner.id] ?? 0,
      standing,
    }
  })

  const describe = (rows: typeof standings) =>
    rows
      .slice(0, 2)
      .map((row) => `${row.label} (+${row.points.toFixed(1)})`)
      .join(' and ')

  const byPointsDesc = (a: { points: number }, b: { points: number }) =>
    b.points - a.points
  const leads = standings
    .filter((row) => row.standing === 'leads')
    .sort(byPointsDesc)
  const ties = standings
    .filter((row) => row.standing === 'ties')
    .sort(byPointsDesc)

  const leadSentence =
    leads.length > 0
      ? `Leads on ${describe(leads)}.`
      : ties.length > 0
        ? `Ties the best score on ${describe(ties)}, winning on aggregate.`
        : 'Wins on aggregate — no criterion swings it decisively.'

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
                  className="dial-glow stroke-accent-text"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 68}
                  strokeDashoffset={2 * Math.PI * 68 * (1 - fitPct / 100)}
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
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10px] font-semibold tracking-[0.12em] uppercase',
                // A close call is unresolved rather than momentum, so it stays
                // neutral: a hairline ring marks it instead of a second accent.
                isCloseCall
                  ? 'border-hairline bg-surface-high text-ink'
                  : 'border-transparent bg-surface-high text-accent-text',
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
                {leadSentence}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {ranked.map((row, index) => (
                <div
                  key={row.optionId}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-lg p-3',
                    row.optionId === winner.id
                      ? 'bg-surface-high shadow-tile'
                      : 'bg-canvas opacity-80',
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      aria-hidden
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded font-mono text-[10px] font-semibold',
                        row.optionId === winner.id
                          ? 'bg-accent/15 text-accent-text'
                          : 'bg-surface-top text-ink-soft',
                      )}
                    >
                      {lettersByOption.get(row.optionId) ?? '?'}
                    </span>
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
          {/* Column legend — the option letters every row below aligns to. */}
          <div
            aria-hidden
            className="flex items-center gap-2 border-b border-hairline pb-2"
          >
            <span className="flex-1 font-mono text-[10px] font-semibold tracking-[0.14em] text-ink-faint uppercase">
              Criterion
            </span>
            {decision.options.map((option) => (
              <span
                key={option.id}
                className="w-10 shrink-0 text-center font-mono text-[10px] font-semibold tracking-wider text-ink-soft uppercase"
              >
                {lettersByOption.get(option.id)}
              </span>
            ))}
          </div>
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
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="font-mono text-[11px] text-ink-faint">
            {String(index).padStart(2, '0')}
          </span>
          <span className="truncate text-sm font-medium text-ink">{label}</span>
          <span className="shrink-0 rounded bg-surface-high px-1.5 py-0.5 font-mono text-[10px] text-ink-soft uppercase">
            {weight}/5
          </span>
        </div>
        {/* One fixed-width column per option, so scores align down the list. */}
        <div className="flex shrink-0 items-center gap-1">
          {options.map((option) => {
            const score = scoresByOption[option.id]
            const leads = leaderOptionId === option.id && score !== undefined
            return (
              <span
                key={option.id}
                className={cn(
                  'w-10 text-center font-mono text-[11px] tabular-nums',
                  score === undefined
                    ? 'text-ink-faint'
                    : leads
                      ? 'font-semibold text-accent-text'
                      : 'text-ink-soft',
                )}
              >
                <span className="sr-only">
                  {`${option.label || 'Untitled option'}: `}
                </span>
                {score ?? '–'}
                {leads && (
                  <span aria-hidden className="ml-0.5">
                    ★
                  </span>
                )}
              </span>
            )
          })}
        </div>
      </div>
      {/* Contribution bar — points this criterion adds to the winner's average. */}
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-high">
          <div
            className={cn(
              'h-full rounded-full',
              isTradeOff ? 'bg-ink-faint' : 'bg-accent',
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
        <p className="flex items-start gap-1.5 text-xs text-ink-soft">
          <span aria-hidden className="shrink-0 text-ink">
            ⚖
          </span>
          <span>Trade-off: the recommendation loses on this criterion.</span>
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
