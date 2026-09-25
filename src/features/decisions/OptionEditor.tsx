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
    <div className="flex flex-col gap-2.5">
      {options.map((option, index) => (
        <div key={option.id} className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-high font-mono text-[11px] font-semibold text-accent-text"
          >
            {String.fromCharCode(65 + index)}
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
            className="px-2.5"
          >
            ✕
          </Button>
        </div>
      ))}
      <div className="pt-1">
        <Button
          variant="secondary"
          onClick={addOption}
          className="w-full border-dashed py-2.5 sm:w-auto"
        >
          <span aria-hidden className="text-accent-text">+</span> Add option
        </Button>
      </div>
    </div>
  )
}
