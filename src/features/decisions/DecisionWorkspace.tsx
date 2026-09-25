import { useMemo } from 'react'
import { DecisionForm } from './DecisionForm'
import { CriteriaEditor } from './CriteriaEditor'
import { ScoreMatrix } from './ScoreMatrix'
import { Button } from '@/components/ui/Button'
import { useDecisions } from './decisionStore'
import { pruneScores, summarizeScoring } from '@/lib/scoring'
import type { Criterion, Decision, ScoreMatrix as ScoreMatrixData } from '@/types/decision'

interface DecisionWorkspaceProps {
  decision: Decision
  onSaved: () => void
  onCancel: () => void
}

export function DecisionWorkspace({
  decision,
  onSaved,
  onCancel,
}: DecisionWorkspaceProps) {
  const { updateDecision } = useDecisions()

  const optionIds = useMemo(
    () => new Set(decision.options.map((option) => option.id)),
    [decision.options],
  )
  const summary = useMemo(() => summarizeScoring(decision), [decision])

  const handleCriteriaChange = (criteria: Criterion[]) => {
    const criterionIds = new Set(criteria.map((c) => c.id))
    updateDecision(decision.id, {
      criteria,
      scores: pruneScores(decision.scores, optionIds, criterionIds),
    })
  }

  const handleScoreChange = (
    optionId: string,
    criterionId: string,
    score: number | undefined,
  ) => {
    const cells = { ...decision.scores?.[optionId] }
    if (score === undefined) {
      delete cells[criterionId]
    } else {
      cells[criterionId] = score
    }
    const next: ScoreMatrixData = { ...decision.scores, [optionId]: cells }
    updateDecision(decision.id, { scores: next })
  }

  return (
    <div className="flex flex-col gap-10">
      <DecisionForm decision={decision} onSaved={onSaved} onCancel={onCancel} />

      <section aria-labelledby="criteria-heading" className="flex flex-col gap-4">
        <div>
          <h2 id="criteria-heading" className="text-xl font-semibold text-slate-100">
            Criteria &amp; weights
          </h2>
          <p className="text-sm text-slate-500">
            What matters in this decision, and how much. Weights run 1 (barely) to 5 (heavily).
          </p>
        </div>
        <CriteriaEditor
          criteria={decision.criteria}
          onChange={handleCriteriaChange}
        />
      </section>

      <section aria-labelledby="scores-heading" className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <h2 id="scores-heading" className="text-xl font-semibold text-slate-100">
              Score matrix
            </h2>
            <p className="text-sm text-slate-500">
              Rate each option 1–5 per criterion. Totals are weighted and update live.
            </p>
          </div>
          <p className="shrink-0 text-sm text-slate-500" aria-live="polite">
            {summary.scoredCells}/{summary.totalCells} scored
            {summary.complete && summary.totalCells > 0 && ' ✓'}
          </p>
        </div>
        <ScoreMatrix
          options={decision.options}
          criteria={decision.criteria}
          scores={decision.scores ?? {}}
          summary={summary}
          onScoreChange={handleScoreChange}
        />
      </section>

      <section className="flex justify-end border-t border-slate-800 pt-6">
        <Button onClick={onSaved}>See recommendation →</Button>
      </section>
    </div>
  )
}
