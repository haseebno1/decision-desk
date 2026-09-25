import { useMemo } from 'react'
import { DecisionForm } from './DecisionForm'
import { CriteriaEditor } from './CriteriaEditor'
import { ScoreMatrix } from './ScoreMatrix'
import { Button, SectionLabel } from '@/components/ui/Button'
import { AiAssistPanel } from './AiAssistPanel'
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
    <div className="flex flex-col gap-12">
      <DecisionForm decision={decision} onSaved={onSaved} onCancel={onCancel} />

      {/* Step 02 — Priority calibration */}
      <section aria-labelledby="criteria-heading" className="flex flex-col gap-5">
        <div className="flex flex-col gap-1 border-t border-hairline pt-8">
          <div className="flex items-center justify-between">
            <SectionLabel tone="accent">Step 02 · Weigh priorities</SectionLabel>
            <span className="font-mono text-[11px] text-ink-faint">02 / 03</span>
          </div>
          <h2 id="criteria-heading" className="text-2xl font-semibold tracking-tight text-ink">
            What matters most?
          </h2>
          <p className="max-w-lg text-sm text-ink-soft">
            Not everything deserves equal weight. Weights run 1 (barely) to 5
            (heavily) and drive the final recommendation.
          </p>
        </div>
        <CriteriaEditor
          criteria={decision.criteria}
          onChange={handleCriteriaChange}
        />
      </section>

      <AiAssistPanel decision={decision} />

      {/* Step 03 — Weighted scoring matrix */}
      <section aria-labelledby="scores-heading" className="flex flex-col gap-5">
        <div className="flex flex-col gap-1 border-t border-hairline pt-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SectionLabel tone="accent">Step 03 · Compare options</SectionLabel>
            <span className="font-mono text-[11px] text-ink-faint">03 / 03</span>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="scores-heading" className="text-2xl font-semibold tracking-tight text-ink">
              The weighted matrix
            </h2>
            <p
              className="font-mono text-[11px] text-ink-soft"
              aria-live="polite"
            >
              {summary.scoredCells}/{summary.totalCells} scored
              {summary.complete && summary.totalCells > 0 && (
                <span className="ml-1 text-accent-text">✓ complete</span>
              )}
            </p>
          </div>
          <p className="max-w-lg text-sm text-ink-soft">
            Rate each option 1–5 per criterion. Totals are weighted and update live.
          </p>
        </div>
        <div className="rounded-xl border border-hairline bg-surface p-3 md:p-4">
          <ScoreMatrix
            options={decision.options}
            criteria={decision.criteria}
            scores={decision.scores ?? {}}
            summary={summary}
            onScoreChange={handleScoreChange}
          />
        </div>
      </section>

      {/* Flow navigation deck */}
      <section className="flex justify-end border-t border-hairline pt-6">
        <Button onClick={onSaved} className="h-11 px-5">
          See recommendation →
        </Button>
      </section>
    </div>
  )
}
