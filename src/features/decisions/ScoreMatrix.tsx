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
      <p className="text-sm text-slate-500">
        Add at least one option and one criterion to start scoring.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max text-sm">
        <caption className="sr-only">
          Score each option from {SCORE_MIN} (poor) to {SCORE_MAX} (excellent)
          for every criterion
        </caption>
        <thead>
          <tr>
            <th scope="col" className="px-2 py-2 text-left font-medium text-slate-400">
              Criterion
            </th>
            {options.map((option) => (
              <th
                key={option.id}
                scope="col"
                className="px-2 py-2 text-center font-medium text-slate-300"
              >
                {option.label.trim() !== '' ? option.label : 'Untitled option'}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {criteria.map((criterion) => (
            <tr key={criterion.id} className="border-t border-slate-800">
              <th scope="row" className="px-2 py-2 text-left font-normal text-slate-200">
                {criterion.label.trim() !== '' ? (
                  criterion.label
                ) : (
                  <span className="text-slate-500">Unnamed criterion</span>
                )}
                <span className="ml-1.5 text-xs text-slate-500">×{criterion.weight}</span>
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
          <tr className="border-t-2 border-slate-700">
            <th scope="row" className="px-2 py-2 text-left font-medium text-slate-200">
              Weighted total
            </th>
            {options.map((option) => (
              <td
                key={option.id}
                className={cn(
                  'px-2 py-2 text-center font-semibold',
                  option.id === bestOptionId
                    ? 'text-emerald-400'
                    : 'text-slate-100',
                )}
              >
                {formatTotal(totalsByOption.get(option.id) ?? 0)}
                {option.id === bestOptionId && ' ★'}
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
              ? 'bg-emerald-500 font-semibold text-emerald-950'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700',
          )}
        >
          {score}
        </button>
      ))}
    </div>
  )
}
