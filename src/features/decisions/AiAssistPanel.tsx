import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Select, TextInput } from '@/components/ui/inputs'
import {
  loadAiSettings,
  resolveProvider,
  saveAiSettings,
  type AiSettings,
} from '@/lib/ai/settings'
import { AiProviderError, type AiAssistResult, type AiCapability } from '@/lib/ai/types'
import type { Decision } from '@/types/decision'

const CAPABILITIES: Array<{ id: AiCapability; label: string }> = [
  { id: 'criteria-suggestions', label: 'Suggest criteria' },
  { id: 'clarifying-questions', label: 'Clarifying questions' },
  { id: 'summary', label: 'Summarize' },
]

export function AiAssistPanel({ decision }: { decision: Decision }) {
  const [settings, setSettings] = useState<AiSettings>(() => loadAiSettings())
  const [showSettings, setShowSettings] = useState(false)
  const [loading, setLoading] = useState<AiCapability | null>(null)
  const [result, setResult] = useState<AiAssistResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resultForDecision, setResultForDecision] = useState(decision.id)

  // Reset stale AI output when navigating between decisions (render-time reset).
  if (resultForDecision !== decision.id) {
    setResultForDecision(decision.id)
    setResult(null)
    setError(null)
  }

  const provider = resolveProvider(settings)

  const updateSettings = (patch: Partial<AiSettings>) => {
    const next = { ...settings, ...patch }
    setSettings(next)
    saveAiSettings(next)
  }

  const run = async (capability: AiCapability) => {
    setLoading(capability)
    setError(null)
    setResult(null)
    try {
      const assistResult = await provider.assist({
        capability,
        context: {
          title: decision.title,
          description: decision.description,
          category: decision.category,
          stake: decision.stake,
          optionLabels: decision.options.map((o) => o.label),
          criterionLabels: decision.criteria
            .filter((c) => c.label.trim() !== '')
            .map((c) => ({ label: c.label.trim(), weight: c.weight })),
        },
      })
      setResult(assistResult)
    } catch (err) {
      setError(
        err instanceof AiProviderError
          ? err.message
          : 'Something went wrong. AI assist is optional — everything else keeps working.',
      )
    } finally {
      setLoading(null)
    }
  }

  return (
    <section aria-labelledby="ai-heading" className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h2 id="ai-heading" className="text-lg font-semibold text-slate-100">
            AI assist
          </h2>
          <p className="text-sm text-slate-500">
            Optional. Currently using {provider.label}.
          </p>
        </div>
        <Button variant="ghost" onClick={() => setShowSettings((s) => !s)}>
          {showSettings ? 'Hide settings' : 'Settings'}
        </Button>
      </div>

      {showSettings && (
        <div className="flex max-w-xl flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <Field label="Provider" htmlFor="ai-provider">
            <Select
              id="ai-provider"
              value={settings.providerId}
              onChange={(event) =>
                updateSettings({
                  providerId: event.target.value as AiSettings['providerId'],
                })
              }
            >
              <option value="mock">Mock (offline, no setup)</option>
              <option value="openai-compatible">OpenAI-compatible API</option>
            </Select>
          </Field>

          {settings.providerId === 'openai-compatible' && (
            <>
              <Field label="API base URL" htmlFor="ai-base-url">
                <TextInput
                  id="ai-base-url"
                  value={settings.baseUrl}
                  placeholder="https://api.openai.com/v1"
                  onChange={(event) => updateSettings({ baseUrl: event.target.value })}
                />
              </Field>
              <Field label="API key" htmlFor="ai-api-key" hint="Stored in this browser only.">
                <TextInput
                  id="ai-api-key"
                  type="password"
                  value={settings.apiKey}
                  placeholder="sk-…"
                  onChange={(event) => updateSettings({ apiKey: event.target.value })}
                />
              </Field>
              <Field label="Model" htmlFor="ai-model">
                <TextInput
                  id="ai-model"
                  value={settings.model}
                  placeholder="gpt-4o-mini"
                  onChange={(event) => updateSettings({ model: event.target.value })}
                />
              </Field>
              {!provider.isConfigured() && (
                <p className="text-xs font-medium text-amber-300">
                  Base URL and key are required — falling back to the mock provider until
                  they're set.
                </p>
              )}
            </>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {CAPABILITIES.map((capability) => (
          <Button
            key={capability.id}
            variant="secondary"
            disabled={loading !== null}
            onClick={() => run(capability.id)}
          >
            {loading === capability.id ? 'Thinking…' : capability.label}
          </Button>
        ))}
        {loading !== null && (
          <span role="status" className="text-xs text-slate-500">
            The mock provider thinks for ~0.5s by design.
          </span>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-500/40 bg-rose-500/5 p-3 text-sm text-rose-300">
          {error}
        </p>
      )}

      {result && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h3 className="text-sm font-semibold text-slate-100">{result.heading}</h3>
          <ul className="mt-2 flex flex-col gap-1.5">
            {result.items.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-slate-300">
                <span aria-hidden className="text-violet-400">◆</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
