import { WEIGHT_MAX, WEIGHT_MIN, type Criterion } from '@/types/decision'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/inputs'
import { generateId } from '@/lib/utils/generateId'

interface CriteriaEditorProps {
  criteria: Criterion[]
  onChange: (criteria: Criterion[]) => void
}

const QUICK_WEIGHTS = [1, 2, 3, 4, 5]

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

  return (
    <div className="flex flex-col gap-2">
      {criteria.length === 0 && (
        <p className="text-sm text-slate-500">
          No criteria yet — add what matters in this choice (e.g. price,
          portability, battery life).
        </p>
      )}
      {criteria.map((criterion, index) => (
        <div key={criterion.id} className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="w-6 text-center text-xs font-medium text-slate-500">
              {index + 1}
            </span>
            <TextInput
              value={criterion.label}
              placeholder={`Criterion ${index + 1}`}
              aria-label={`Criterion ${index + 1} name`}
              onChange={(event) =>
                updateCriterion(criterion.id, { label: event.target.value })
              }
            />
            <Button
              variant="ghost"
              aria-label={`Remove criterion ${index + 1}`}
              onClick={() => removeCriterion(criterion.id)}
            >
              ✕
            </Button>
          </div>
          <div className="flex items-center gap-2 pl-8">
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
                >
                  {weight}
                </Button>
              ))}
              <Button
                variant="secondary"
                aria-label={`Increase weight for criterion ${index + 1}`}
                disabled={criterion.weight >= WEIGHT_MAX}
                onClick={() => stepWeight(criterion, 1)}
              >
                +
              </Button>
            </div>
          </div>
        </div>
      ))}
      <div>
        <Button variant="secondary" onClick={addCriterion}>
          + Add criterion
        </Button>
      </div>
    </div>
  )
}
