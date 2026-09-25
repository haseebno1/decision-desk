import { useState } from 'react'
import { Button, SectionLabel } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Select, TextArea } from '@/components/ui/inputs'
import { cn } from '@/lib/utils/cn'
import { useDecisions } from './decisionStore'
import {
  SATISFACTION_MAX,
  SATISFACTION_MIN,
  type Decision,
} from '@/types/decision'

interface OutcomeReviewSectionProps {
  decision: Decision
}

const SATISFACTION_LABELS: Record<number, { label: string; note: string }> = {
  1: { label: 'Regret', note: 'Severe misread' },
  2: { label: 'Low', note: 'High drag' },
  3: { label: 'Neutral', note: 'Indifferent' },
  4: { label: 'Satisfied', note: 'Solid fit' },
  5: { label: 'Thriving', note: 'Optimal fit' },
}

export function OutcomeReviewSection({ decision }: OutcomeReviewSectionProps) {
  const { reviewOutcome } = useDecisions()
  const review = decision.outcome?.review

  const expectedOption = decision.options.find(
    (o) => o.id === decision.outcome?.chosenOptionId,
  )
  const actualOption = decision.options.find(
    (o) => o.id === review?.actualOptionId,
  )

  return (
    <section aria-labelledby="review-heading" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 border-t border-hairline pt-8">
        <SectionLabel tone="accent">30-day retrospective</SectionLabel>
        <h2 id="review-heading" className="text-2xl font-semibold tracking-tight text-ink">
          So… how did it go?
        </h2>
        <p className="max-w-lg text-sm text-ink-soft">
          {review
            ? `Reviewed ${new Date(review.reviewedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`
            : 'A quiet moment to inspect reality against anticipation.'}
        </p>
      </div>

      {review ? (
        <div className="flex flex-col gap-3">
          <dl className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div className="rounded-xl border border-hairline bg-surface p-4">
              <dt className="font-mono text-[10px] font-semibold tracking-[0.14em] text-ink-soft uppercase">
                Expected
              </dt>
              <dd className="mt-1 text-sm font-medium text-ink">
                {expectedOption?.label ?? 'Unknown option'}
              </dd>
            </div>
            <div className="rounded-xl border border-hairline bg-surface p-4">
              <dt className="font-mono text-[10px] font-semibold tracking-[0.14em] text-ink-soft uppercase">
                Actual
              </dt>
              <dd
                className={cn(
                  'mt-1 text-sm font-medium',
                  review.actualOptionId &&
                    review.actualOptionId !== decision.outcome?.chosenOptionId
                    ? 'text-amber-300'
                    : 'text-ink',
                )}
              >
                {review.actualOptionId
                  ? (actualOption?.label ?? 'Unknown option')
                  : 'Not recorded'}
              </dd>
            </div>
          </dl>

          {review.actualOptionId &&
            review.actualOptionId !== decision.outcome?.chosenOptionId && (
              <p className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-3.5 text-sm text-amber-200">
                You ended up with a different option than the math suggested —
                worth remembering next time similar criteria show up.
              </p>
            )}

          {/* Recorded calibration summary. */}
          <div className="rounded-xl border border-hairline bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-mono text-[11px] text-ink-soft">
                Satisfaction{' '}
                <span className="font-semibold text-ink">
                  {review.satisfaction}/{SATISFACTION_MAX}
                </span>{' '}
                · {SATISFACTION_LABELS[review.satisfaction]?.label ?? ''}
              </span>
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold tracking-wider uppercase',
                  review.wouldChooseAgain
                    ? 'bg-accent/15 text-accent-text'
                    : 'bg-danger/15 text-danger',
                )}
              >
                {review.wouldChooseAgain ? 'Would choose again' : 'Would not repeat'}
              </span>
            </div>
            {/* Mini scale readout. */}
            <div className="mt-3 grid grid-cols-5 gap-1" aria-hidden>
              {Array.from({ length: SATISFACTION_MAX }, (_, i) => i + 1).map((v) => (
                <div
                  key={v}
                  className={cn(
                    'h-1.5 rounded-full',
                    v <= review.satisfaction ? 'bg-accent' : 'bg-surface-high',
                  )}
                />
              ))}
            </div>
            {review.notes && (
              <p className="mt-3 border-t border-hairline pt-3 text-sm whitespace-pre-line text-ink-soft">
                {review.notes}
              </p>
            )}
          </div>

          <div>
            <Button
              variant="secondary"
              onClick={() => reviewOutcome(decision.id, emptyReview(decision))}
            >
              Redo review
            </Button>
          </div>
        </div>
      ) : (
        <ReviewForm decision={decision} />
      )}
    </section>
  )
}

function emptyReview(decision: Decision) {
  return {
    satisfaction: 3,
    wouldChooseAgain: true,
    actualOptionId: decision.outcome?.chosenOptionId,
  }
}

function ReviewForm({ decision }: { decision: Decision }) {
  const { reviewOutcome } = useDecisions()
  const chosenOption = decision.options.find(
    (o) => o.id === decision.outcome?.chosenOptionId,
  )

  const [satisfaction, setSatisfaction] = useState(3)
  const [wouldChooseAgain, setWouldChooseAgain] = useState(true)
  const [actualOptionId, setActualOptionId] = useState(
    decision.outcome?.chosenOptionId ?? '',
  )
  const [notes, setNotes] = useState('')

  const diverged = actualOptionId !== decision.outcome?.chosenOptionId

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-hairline bg-surface p-4 md:p-5">
      {/* Dimension 01 — segmented satisfaction scale. */}
      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-1 flex w-full items-center justify-between">
          <SectionLabel tone="accent">Dimension 01 · Affective calibration</SectionLabel>
        </legend>
        <p className="text-sm font-medium text-ink">
          How satisfied are you with the outcome?
        </p>
        <div
          id="review-satisfaction"
          role="group"
          aria-label="Satisfaction rating"
          className="grid grid-cols-5 gap-1 rounded-xl bg-canvas p-1"
        >
          {Array.from(
            { length: SATISFACTION_MAX - SATISFACTION_MIN + 1 },
            (_, i) => i + SATISFACTION_MIN,
          ).map((value) => {
            const selected = satisfaction === value
            return (
              <button
                key={value}
                type="button"
                aria-label={`Satisfaction ${value} of ${SATISFACTION_MAX}: ${SATISFACTION_LABELS[value].label}`}
                aria-pressed={selected}
                onClick={() => setSatisfaction(value)}
                className={cn(
                  'flex cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                  selected
                    ? 'bg-surface-top text-accent-text shadow-[0_0_20px_rgba(139,92,246,0.15)]'
                    : 'text-ink-soft hover:bg-surface-high hover:text-ink',
                )}
              >
                <span className="font-mono text-[11px] font-bold">
                  {String(value).padStart(2, '0')}
                </span>
                <span
                  className={cn(
                    'text-xs font-medium',
                    selected ? 'text-ink' : '',
                  )}
                >
                  {SATISFACTION_LABELS[value].label}
                </span>
                <span className="hidden font-mono text-[9px] opacity-70 sm:inline">
                  {SATISFACTION_LABELS[value].note}
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

      {/* Dimension 02 — counterfactual assessment. */}
      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-1 flex w-full items-center justify-between">
          <SectionLabel tone="accent">Dimension 02 · Counterfactual</SectionLabel>
        </legend>
        <p className="text-sm font-medium text-ink">
          Would you choose {chosenOption?.label ?? 'this option'} again?
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            aria-pressed={wouldChooseAgain === true}
            onClick={() => setWouldChooseAgain(true)}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-xl p-3.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
              wouldChooseAgain
                ? 'bg-surface-high shadow-[0_0_24px_rgba(139,92,246,0.12)]'
                : 'bg-canvas hover:bg-surface-high',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                wouldChooseAgain ? 'bg-accent' : 'bg-surface-top',
              )}
            >
              {wouldChooseAgain && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-[15px] font-medium text-ink">Yes</span>
              <span className="font-mono text-[10px] text-accent-text">
                Confirms the model
              </span>
            </span>
          </button>
          <button
            type="button"
            aria-pressed={wouldChooseAgain === false}
            onClick={() => setWouldChooseAgain(false)}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-xl p-3.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
              !wouldChooseAgain
                ? 'bg-surface-high shadow-[0_0_24px_rgba(139,92,246,0.12)]'
                : 'bg-canvas hover:bg-surface-high',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                !wouldChooseAgain ? 'bg-accent' : 'bg-surface-top',
              )}
            >
              {!wouldChooseAgain && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-[15px] font-medium text-ink">No</span>
              <span className="font-mono text-[10px] text-danger">
                Regret signal
              </span>
            </span>
          </button>
        </div>
      </fieldset>

      {/* Dimension 03 — what actually happened. */}
      <div className="flex flex-col gap-2.5">
        <SectionLabel tone="accent">Dimension 03 · What actually happened</SectionLabel>
        <Field
          label="Actual option"
          htmlFor="review-actual"
          hint={
            diverged
              ? "Different from what you committed to — that's worth recording."
              : undefined
          }
        >
          <Select
            id="review-actual"
            value={actualOptionId}
            onChange={(event) => setActualOptionId(event.target.value)}
          >
            {decision.options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label || 'Untitled option'}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Notes" htmlFor="review-notes" hint="Optional — what did you learn?">
          <TextArea
            id="review-notes"
            value={notes}
            placeholder="Document reality as it played out, without self-judgment…"
            onChange={(event) => setNotes(event.target.value)}
          />
        </Field>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-hairline pt-4">
        <span className="hidden items-center gap-1.5 font-mono text-[10px] tracking-wider text-ink-faint uppercase sm:flex">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
          Local vault · zero telemetry
        </span>
        <Button
          onClick={() =>
            reviewOutcome(decision.id, {
              satisfaction,
              wouldChooseAgain,
              actualOptionId,
              notes: notes.trim() || undefined,
            })
          }
        >
          Save reflection &amp; calibrate
        </Button>
      </div>
    </div>
  )
}
