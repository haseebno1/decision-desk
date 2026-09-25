import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
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
    <form onSubmit={handleSubmit} noValidate className="flex max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-50">{title}</h1>
        <p className="text-sm text-slate-400">
          Capture what you're deciding before you weigh it up.
        </p>
      </header>

      <Field label="Title" htmlFor="decision-title" error={errors.title}>
        <TextInput
          id="decision-title"
          value={state.title}
          placeholder="e.g. Which laptop should I buy?"
          onChange={(event) =>
            setState((prev) => ({ ...prev, title: event.target.value }))
          }
        />
      </Field>

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

      <div className="grid gap-6 sm:grid-cols-2">
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

      <Field label="Options" htmlFor="option-1" error={errors.options}>
        <div id="option-1" className="flex flex-col gap-2">
          <OptionEditor
            options={state.options}
            onChange={(options) => setState((prev) => ({ ...prev, options }))}
          />
        </div>
      </Field>

      <div className="flex items-center gap-3">
        <Button type="submit">{submitLabel}</Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
