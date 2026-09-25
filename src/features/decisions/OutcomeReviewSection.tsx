import { useState } from 'react'
import { Button } from '@/components/ui/Button'
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
      <div>
        <h2 id="review-heading" className="text-lg font-semibold text-slate-100">
          Outcome review
        </h2>
        <p className="text-sm text-slate-500">
          {review
            ? `Reviewed ${new Date(review.reviewedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`
            : 'How did it actually go? Your answer becomes the record you learn from.'}
        </p>
      </div>

      {review ? (
        <div className="flex flex-col gap-3">
          <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                Expected
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-200">
                {expectedOption?.label ?? 'Unknown option'}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                Actual
              </dt>
              <dd
                className={cn(
                  'mt-1 text-sm font-medium',
                  review.actualOptionId &&
                    review.actualOptionId !== decision.outcome?.chosenOptionId
                    ? 'text-amber-300'
                    : 'text-slate-200',
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
              <p className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 text-sm text-amber-200">
                You ended up with a different option than the math suggested —
                worth remembering next time similar criteria show up.
              </p>
            )}

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span className="text-slate-400">
              Satisfaction:{' '}
              <span className="font-semibold text-slate-100">
                {review.satisfaction}/{SATISFACTION_MAX}
              </span>
            </span>
            <span className="text-slate-400">
              Would choose again:{' '}
              <span
                className={cn(
                  'font-semibold',
                  review.wouldChooseAgain ? 'text-emerald-400' : 'text-rose-400',
                )}
              >
                {review.wouldChooseAgain ? 'Yes' : 'No'}
              </span>
            </span>
          </div>

          {review.notes && (
            <p className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-sm whitespace-pre-line text-slate-300">
              {review.notes}
            </p>
          )}

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
    <div className="flex max-w-xl flex-col gap-5 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <Field
        label="What actually happened?"
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

      <Field label={`Satisfaction (1–${SATISFACTION_MAX})`} htmlFor="review-satisfaction">
        <div
          id="review-satisfaction"
          role="group"
          aria-label="Satisfaction rating"
          className="flex items-center gap-1"
        >
          {Array.from(
            { length: SATISFACTION_MAX - SATISFACTION_MIN + 1 },
            (_, i) => i + SATISFACTION_MIN,
          ).map((value) => (
            <Button
              key={value}
              variant={satisfaction === value ? 'primary' : 'secondary'}
              aria-label={`Satisfaction ${value} of ${SATISFACTION_MAX}`}
              aria-pressed={satisfaction === value}
              onClick={() => setSatisfaction(value)}
            >
              {value}
            </Button>
          ))}
        </div>
      </Field>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-slate-200">
          Would you choose {chosenOption?.label ?? 'this option'} again?
        </legend>
        <div className="flex items-center gap-2">
          <Button
            variant={wouldChooseAgain ? 'primary' : 'secondary'}
            aria-pressed={wouldChooseAgain === true}
            onClick={() => setWouldChooseAgain(true)}
          >
            Yes
          </Button>
          <Button
            variant={wouldChooseAgain ? 'secondary' : 'primary'}
            aria-pressed={wouldChooseAgain === false}
            onClick={() => setWouldChooseAgain(false)}
          >
            No
          </Button>
        </div>
      </fieldset>

      <Field
        label="Notes"
        htmlFor="review-notes"
        hint="Optional — what did you learn?"
      >
        <TextArea
          id="review-notes"
          value={notes}
          placeholder="e.g. Battery life exceeded expectations; missed the numpad more than I thought."
          onChange={(event) => setNotes(event.target.value)}
        />
      </Field>

      <div>
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
          Save review
        </Button>
      </div>
    </div>
  )
}
