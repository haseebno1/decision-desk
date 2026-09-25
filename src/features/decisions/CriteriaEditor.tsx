import { WEIGHT_MAX, WEIGHT_MIN, type Criterion } from '@/types/decision'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/inputs'
import { generateId } from '@/lib/utils/generateId'

interface CriteriaEditorProps {
  criteria: Criterion[]
  onChange: (criteria: Criterion[]) => void
}

const QUICK_WEIGHTS = [1, 2, 3, 4, 5]

/** Weight tick labels, mirroring the Stitch priority calibration rows. */
const WEIGHT_LABELS: Record<number, string> = {
  1: 'Minimal',
  2: 'Low',
  3: 'Moderate',
  4: 'Important',
  5: 'Critical',
}

export function CriteriaEditor({ criteria, onChange }: CriteriaEditorProps) {
  const addCriterion = () => {
    onChange([...criteria, { id: generateId('crit'), label: '', weight: 3 }])
  }

  const removeCriterion = (id: string) => {
    onChange(criteria.filter((criterion) => criterion.id !== id))
  }

  const updateCriterion = (id: string, patch: Partial<Criterion>) => {
    onChange(criteria.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }

  const stepWeight = (criterion: Criterion, delta: number) => {
    const next = Math.min(
      WEIGHT_MAX,
      Math.max(WEIGHT_MIN, criterion.weight + delta),
    )
    updateCriterion(criterion.id, { weight: next })
  }

  if (criteria.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-ink-soft">
          No criteria yet — add what matters in this choice (e.g. price,
          portability, battery life).
        </p>
        <button
          type="button"
          onClick={addCriterion}
          className="group flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-hairline bg-canvas py-3.5 font-mono text-[11px] font-semibold tracking-wider text-ink-soft uppercase transition-colors hover:border-accent/50 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span aria-hidden className="text-accent-text">+</span>
          Add custom criterion
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {criteria.map((criterion, index) => (
        <div
          key={criterion.id}
          className="flex flex-col gap-3 rounded-xl border border-hairline bg-surface p-4 transition-colors duration-200 hover:border-hairline-strong"
        >
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-high font-mono text-[11px] font-semibold text-accent-text"
            >
              {String(index + 1).padStart(2, '0')}
            </span>
            <TextInput
              value={criterion.label}
              placeholder={`Criterion ${index + 1}`}
              aria-label={`Criterion ${index + 1} name`}
              className="border-0 bg-transparent px-0 font-medium shadow-none"
              onChange={(event) =>
                updateCriterion(criterion.id, { label: event.target.value })
              }
            />
            {/* Weight chip — the Stitch "4 / 5 (Important)" badge. */}
            <span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-surface-high px-2 py-1">
              <span aria-hidden className="h-2 w-2 rounded-full bg-accent" />
              <span className="font-mono text-[11px] font-semibold text-ink">
                {criterion.weight} / 5
              </span>
              <span className="hidden font-mono text-[10px] text-ink-soft sm:inline">
                {WEIGHT_LABELS[criterion.weight]}
              </span>
            </span>
            <Button
              variant="ghost"
              aria-label={`Remove criterion ${index + 1}`}
              onClick={() => removeCriterion(criterion.id)}
              className="px-2"
            >
              ✕
            </Button>
          </div>

          {/* Weight controls: stepper + discrete ticks. */}
          <div className="flex flex-wrap items-center gap-2 pl-0 sm:pl-11">
            <div
              role="group"
              aria-label={`Weight for criterion ${index + 1}`}
              className="flex items-center gap-1"
            >
              <Button
                variant="secondary"
                aria-label={`Decrease weight for criterion ${index + 1}`}
                disabled={criterion.weight <= WEIGHT_MIN}
                onClick={() => stepWeight(criterion, -1)}
                className="h-8 w-8 px-0"
              >
                −
              </Button>
              {QUICK_WEIGHTS.map((weight) => (
                <Button
                  key={weight}
                  variant={criterion.weight === weight ? 'primary' : 'ghost'}
                  aria-label={`Set weight ${weight} for criterion ${index + 1}`}
                  aria-pressed={criterion.weight === weight}
                  onClick={() => updateCriterion(criterion.id, { weight })}
                  className={cn(
                    'h-8 w-8 px-0 font-mono text-xs',
                    criterion.weight === weight && 'px-0',
                  )}
                >
                  {weight}
                </Button>
              ))}
              <Button
                variant="secondary"
                aria-label={`Increase weight for criterion ${index + 1}`}
                disabled={criterion.weight >= WEIGHT_MAX}
                onClick={() => stepWeight(criterion, 1)}
                className="h-8 w-8 px-0"
              >
                +
              </Button>
            </div>
            <span
              aria-hidden
              className="hidden flex-1 justify-between px-1 font-mono text-[10px] tracking-wider text-ink-faint uppercase sm:flex"
            >
              <span>Less important</span>
              <span className={cn(criterion.weight === 5 && 'text-accent-text')}>
                Critical
              </span>
            </span>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addCriterion}
        className="group flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-hairline bg-canvas py-3.5 font-mono text-[11px] font-semibold tracking-wider text-ink-soft uppercase transition-colors hover:border-accent/50 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span aria-hidden className="text-accent-text">+</span>
        Add custom criterion
      </button>
    </div>
  )
}
