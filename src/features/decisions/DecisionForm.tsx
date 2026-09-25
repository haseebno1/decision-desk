import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Button, SectionLabel } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Select, TextArea, TextInput } from '@/components/ui/inputs'
import { OptionEditor } from './OptionEditor'
import { useDecisions } from './decisionStore'
import {
  CATEGORY_LABELS,
  DECISION_CATEGORIES,
  STAKE_LABELS,
  STAKE_LEVELS,
  type Decision,
  type DecisionCategory,
  type DecisionOption,
  type StakeLevel,
} from '@/types/decision'

interface DecisionFormProps {
  /** Present in edit mode. */
  decision?: Decision
  onSaved: (id: string) => void
  onCancel: () => void
}

interface FormState {
  title: string
  description: string
  category: DecisionCategory | ''
  stake: StakeLevel
  options: DecisionOption[]
}

const MIN_OPTIONS = 2
const MAX_OPTIONS = 6

export function DecisionForm({
  decision,
  onSaved,
  onCancel,
}: DecisionFormProps) {
  const { createDecision, updateDecision } = useDecisions()
  const [state, setState] = useState<FormState>(() => ({
    title: decision?.title ?? '',
    description: decision?.description ?? '',
    category: decision?.category ?? '',
    stake: decision?.stake ?? 'medium',
    options:
      decision?.options.map((o) => ({ ...o })) ??
      [0, 1].map((i) => ({ id: `opt-draft-${decision?.id ?? 'new'}-${i}`, label: '' })),
  }))
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  const title = decision ? 'Edit decision' : 'New decision'
  const submitLabel = decision ? 'Save changes' : 'Save decision'

  useEffect(() => {
    document.title = `${title} — Decision Desk`
    return () => {
      document.title = 'Decision Desk'
    }
  }, [title])

  // Options passed to the store must be non-empty and uniquely identified.
  const cleanedOptions = useMemo(
    () =>
      state.options
        .map((option, index) =>
          option.label.trim() === ''
            ? { ...option, label: `Option ${index + 1}` }
            : option,
        )
        .map((option) => ({ ...option, label: option.label.trim() })),
    [state.options],
  )

  const validate = (): boolean => {
    const next: typeof errors = {}
    if (state.title.trim() === '') next.title = 'Title is required.'
    if (state.category === '') next.category = 'Pick a category.'
    if (state.options.filter((o) => o.label.trim() !== '').length < MIN_OPTIONS) {
      next.options = `Add at least ${MIN_OPTIONS} options.`
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validate()) return
    const base = {
      title: state.title.trim(),
      description: state.description.trim() || undefined,
      category: state.category as DecisionCategory,
      stake: state.stake,
      options: cleanedOptions.slice(0, MAX_OPTIONS),
    }
    if (decision) {
      updateDecision(decision.id, base)
      onSaved(decision.id)
    } else {
      const created = createDecision(base)
      onSaved(created.id)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      {/* Step context — the Stitch flow eyebrow. */}
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.14em] text-accent-text uppercase">
            <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
            Step 01 · Define
          </p>
          <span className="font-mono text-[11px] text-ink-faint">01 / 03</span>
        </div>
        {/* Progress track */}
        <div
          aria-hidden
          className="h-[3px] w-full overflow-hidden rounded-full bg-surface-high"
        >
          <div className="h-full w-1/3 rounded-full bg-accent transition-all duration-500 ease-out" />
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink md:text-4xl">
          What are you deciding?
        </h1>
        <p className="max-w-lg text-[15px] leading-relaxed text-ink-soft">
          Capture what you're deciding before you weigh it up. One question,
          plainly stated — the rest follows.
        </p>
      </header>

      {/* The question itself — focused command surface. */}
      <section className="rounded-xl border border-hairline bg-surface p-4 transition-[border-color,background-color] duration-200 focus-within:border-accent/60 md:p-5">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-accent shadow-[0_0_8px_rgba(139,92,246,0.6)]"
          />
          <div className="w-full">
            <Field
              label="The decision"
              htmlFor="decision-title"
              error={errors.title}
            >
              <TextInput
                id="decision-title"
                value={state.title}
                placeholder="e.g. Which laptop should I buy?"
                className="h-11 bg-transparent border-0 px-0 text-lg font-medium shadow-none focus:border-0 md:text-xl"
                onChange={(event) =>
                  setState((prev) => ({ ...prev, title: event.target.value }))
                }
              />
            </Field>
          </div>
        </div>
      </section>

      {/* Context + classification. */}
      <section className="flex flex-col gap-5 rounded-xl border border-hairline bg-surface p-4 md:p-5">
        <Field
          label="Description"
          htmlFor="decision-description"
          hint="Optional — context you'll want to remember later."
        >
          <TextArea
            id="decision-description"
            value={state.description}
            placeholder="What's the background? What's making this hard?"
            onChange={(event) =>
              setState((prev) => ({ ...prev, description: event.target.value }))
            }
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Category" htmlFor="decision-category" error={errors.category}>
            <Select
              id="decision-category"
              value={state.category}
              onChange={(event) =>
                setState((prev) => ({
                  ...prev,
                  category: event.target.value as DecisionCategory | '',
                }))
              }
            >
              <option value="" disabled>
                Select a category…
              </option>
              {DECISION_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {CATEGORY_LABELS[category]}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Stake"
            htmlFor="decision-stake"
            hint="How much is riding on this?"
          >
            <Select
              id="decision-stake"
              value={state.stake}
              onChange={(event) =>
                setState((prev) => ({ ...prev, stake: event.target.value as StakeLevel }))
              }
            >
              {STAKE_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {STAKE_LABELS[level]}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </section>

      {/* The paths on the table. */}
      <section className="flex flex-col gap-4 rounded-xl border border-hairline bg-surface p-4 md:p-5">
        <div className="flex items-center justify-between">
          <SectionLabel tone="accent">The paths on the table</SectionLabel>
          <span className="font-mono text-[10px] text-ink-faint">
            {MIN_OPTIONS}–{MAX_OPTIONS} options
          </span>
        </div>
        <Field label="Options" htmlFor="option-1" error={errors.options} className="contents">
          <span id="option-1" className="flex flex-col gap-2">
            <OptionEditor
              options={state.options}
              onChange={(options) => setState((prev) => ({ ...prev, options }))}
            />
          </span>
        </Field>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" className="h-11 px-5 sm:w-auto">
          {submitLabel}
        </Button>
        <Button variant="ghost" onClick={onCancel} className="h-11">
          Cancel
        </Button>
      </div>
    </form>
  )
}
