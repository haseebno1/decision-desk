import { generateId } from '@/lib/utils/generateId'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/inputs'
import type { DecisionOption } from '@/types/decision'

interface OptionEditorProps {
  options: DecisionOption[]
  onChange: (options: DecisionOption[]) => void
}

export function OptionEditor({ options, onChange }: OptionEditorProps) {
  const addOption = () => {
    onChange([...options, { id: generateId('opt'), label: '' }])
  }

  const removeOption = (id: string) => {
    onChange(options.filter((option) => option.id !== id))
  }

  const updateOption = (id: string, label: string) => {
    onChange(options.map((o) => (o.id === id ? { ...o, label } : o)))
  }

  return (
    <div className="flex flex-col gap-2">
      {options.map((option, index) => (
        <div key={option.id} className="flex items-center gap-2">
          <span className="w-6 text-center text-xs font-medium text-slate-500">
            {index + 1}
          </span>
          <TextInput
            value={option.label}
            placeholder={`Option ${index + 1}`}
            aria-label={`Option ${index + 1}`}
            onChange={(event) => updateOption(option.id, event.target.value)}
          />
          <Button
            variant="ghost"
            aria-label={`Remove option ${index + 1}`}
            disabled={options.length <= 2}
            onClick={() => removeOption(option.id)}
          >
            ✕
          </Button>
        </div>
      ))}
      <div>
        <Button variant="secondary" onClick={addOption}>
          + Add option
        </Button>
      </div>
    </div>
  )
}
