import {
  SCORE_MAX,
  SCORE_MIN,
  type Criterion,
  type DecisionOption,
  type ScoreMatrix,
} from '@/types/decision'
import { cn } from '@/lib/utils/cn'
import { formatTotal, type ScoringSummary } from '@/lib/scoring'

interface ScoreMatrixProps {
  options: DecisionOption[]
  criteria: Criterion[]
  scores: ScoreMatrix
  summary: ScoringSummary
  onScoreChange: (
    optionId: string,
    criterionId: string,
    score: number | undefined,
  ) => void
}

export function ScoreMatrix({
  options,
  criteria,
  scores,
  summary,
  onScoreChange,
}: ScoreMatrixProps) {
  const totalsByOption = new Map(
    summary.ranked.map((row) => [row.optionId, row.total]),
  )
  const bestOptionId = summary.ranked[0]?.optionId

  if (options.length === 0 || criteria.length === 0) {
    return (
      <p className="text-sm text-ink-soft">
        Add at least one option and one criterion to start scoring.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto pb-1">
      <table className="w-full min-w-max text-sm">
        <caption className="sr-only">
          Score each option from {SCORE_MIN} (poor) to {SCORE_MAX} (excellent)
          for every criterion
        </caption>
        <thead>
          <tr>
            <th scope="col" className="px-2 py-2 text-left font-mono text-[11px] font-semibold tracking-wider text-ink-soft uppercase">
              Criterion
            </th>
            {options.map((option) => (
              <th
                key={option.id}
                scope="col"
                className="px-2 py-2 text-center"
              >
                <span className="flex items-center justify-center gap-1.5 font-medium text-ink">
                  <span
                    aria-hidden
                    className={cn(
                      'h-2 w-2 rounded-full',
                      option.id === bestOptionId
                        ? 'bg-accent shadow-marker'
                        : 'bg-ink-faint',
                    )}
                  />
                  <span className="max-w-[140px] truncate">
                    {option.label.trim() !== '' ? option.label : 'Untitled option'}
                  </span>
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {criteria.map((criterion) => (
            <tr key={criterion.id} className="border-t border-hairline">
              <th scope="row" className="px-2 py-2.5 text-left align-middle">
                <span className="block text-sm font-medium text-ink">
                  {criterion.label.trim() !== '' ? (
                    criterion.label
                  ) : (
                    <span className="text-ink-soft">Unnamed criterion</span>
                  )}
                </span>
                <span className="mt-0.5 inline-flex items-center gap-1 rounded bg-surface-high px-1.5 py-0.5 font-mono text-[10px] text-ink-soft">
                  {criterion.weight}× weight
                </span>
              </th>
              {options.map((option) => {
                const value = scores[option.id]?.[criterion.id]
                return (
                  <td key={option.id} className="px-2 py-1.5 text-center">
                    <ScoreCell
                      value={value}
                      ariaLabel={`Score for ${option.label || 'untitled option'} on ${criterion.label || 'unnamed criterion'}`}
                      onChange={(score) => onScoreChange(option.id, criterion.id, score)}
                    />
                  </td>
                )
              })}
            </tr>
          ))}
          {/* Synthesis shelf — the Stitch total summary bar. */}
          <tr className="border-t-2 border-hairline-strong">
            <th
              scope="row"
              className="px-2 py-3 text-left font-mono text-[11px] font-semibold tracking-wider text-ink-soft uppercase"
            >
              Weighted total
            </th>
            {options.map((option) => (
              <td key={option.id} className="px-2 py-3 text-center">
                <span
                  className={cn(
                    'inline-flex items-baseline gap-0.5 rounded-lg px-3 py-1.5 font-mono text-base font-semibold tabular-nums',
                    option.id === bestOptionId
                      ? 'bg-accent/15 text-accent-text'
                      : 'bg-surface-high text-ink',
                  )}
                >
                  {formatTotal(totalsByOption.get(option.id) ?? 0)}
                  {option.id === bestOptionId && (
                    <span aria-hidden className="text-xs">★</span>
                  )}
                </span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function ScoreCell({
  value,
  ariaLabel,
  onChange,
}: {
  value: number | undefined
  ariaLabel: string
  onChange: (score: number | undefined) => void
}) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex justify-center gap-0.5">
      {[SCORE_MIN, 2, 3, 4, SCORE_MAX].map((score) => (
        <button
          key={score}
          type="button"
          aria-pressed={value === score}
          aria-label={`${score} of ${SCORE_MAX}`}
          onClick={() => onChange(value === score ? undefined : score)}
          className={cn(
            'h-7 w-7 cursor-pointer rounded-md text-xs transition-colors',
            value === score
              ? 'bg-accent font-semibold text-white shadow-cell'
              : 'bg-surface-high text-ink-soft hover:bg-surface-top hover:text-ink',
          )}
        >
          {score}
        </button>
      ))}
    </div>
  )
}
