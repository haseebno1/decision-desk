import { useState } from 'react'
import { Button, SectionLabel } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Select, TextInput } from '@/components/ui/inputs'
import { cn } from '@/lib/utils/cn'
import { plural } from '@/lib/utils/plural'
import { loadAiSettings, resolveProvider, saveAiSettings, type AiSettings } from '@/lib/ai/settings'
import { mergeSuggestedCriteria } from '@/lib/ai/applyCriteria'
import { AiProviderError, type AiAssistResult, type AiCapability } from '@/lib/ai/types'
import type { Decision } from '@/types/decision'
import { useDecisions } from './decisionStore'
import { useToast } from './toastStore'

const CAPABILITIES: Array<{
  id: AiCapability
  label: string
  hint: string
}> = [
  {
    id: 'criteria-suggestions',
    label: 'Suggest criteria',
    hint: 'What you may have missed — add them to this decision in one click.',
  },
  {
    id: 'clarifying-questions',
    label: 'Ask better questions',
    hint: 'The questions worth answering before you commit.',
  },
  {
    id: 'summary',
    label: 'Summarize where this stands',
    hint: 'A short, neutral read of the shape of this decision.',
  },
]

interface AssistOutcome {
  capability: AiCapability
  result: AiAssistResult
}

export function AiAssistPanel({ decision }: { decision: Decision }) {
  const { updateDecision } = useDecisions()
  const { showToast } = useToast()
  const [settings, setSettings] = useState<AiSettings>(() => loadAiSettings())
  const [showSettings, setShowSettings] = useState(false)
  const [loading, setLoading] = useState<AiCapability | null>(null)
  const [outcome, setOutcome] = useState<AssistOutcome | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [appliedLabels, setAppliedLabels] = useState<string[] | null>(null)
  const [resultForDecision, setResultForDecision] = useState(decision.id)

  // Reset stale AI output when navigating between decisions (render-time reset,
  // not an effect: an effect would flash the previous decision's output).
  if (resultForDecision !== decision.id) {
    setResultForDecision(decision.id)
    setOutcome(null)
    setError(null)
    setAppliedLabels(null)
  }

  const provider = resolveProvider(settings)
  const usingFallback =
    settings.providerId === 'openai-compatible' && !provider.isConfigured()

  const updateSettings = (patch: Partial<AiSettings>) => {
    const next = { ...settings, ...patch }
    setSettings(next)
    saveAiSettings(next)
  }

  const run = async (capability: AiCapability) => {
    setLoading(capability)
    setError(null)
    setOutcome(null)
    setAppliedLabels(null)
    try {
      const result = await provider.assist({
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
      setOutcome({ capability, result })
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

  /**
   * Turn a suggestion into a change. The dedup and clamping rules live in
   * `mergeSuggestedCriteria` (src/lib/ai/applyCriteria.ts) where they are
   * unit-tested — applying twice can never create duplicates, whatever the
   * provider echoes back.
   */
  const applySuggestedCriteria = () => {
    const { added, skipped } = mergeSuggestedCriteria(
      decision.criteria,
      outcome?.result.suggestedCriteria ?? [],
    )

    if (added.length === 0) {
      showToast({
        message:
          skipped.length > 0
            ? 'Those criteria are already on this decision.'
            : 'Nothing new to add.',
      })
      return
    }

    updateDecision(decision.id, { criteria: [...decision.criteria, ...added] })
    setAppliedLabels(added.map((criterion) => criterion.label))
    showToast({
      message: `Added ${added.length} ${plural(added.length, 'criterion', 'criteria')} — weight them below.`,
    })
  }

  const copyResult = async () => {
    if (!outcome) return
    const text = [outcome.result.heading, ...outcome.result.items]
      .map((line) => `- ${line}`)
      .join('\n')
    try {
      await navigator.clipboard.writeText(text)
      showToast({ message: 'Copied to clipboard.' })
    } catch {
      showToast({ message: 'Could not copy — your browser blocked clipboard access.' })
    }
  }

  const suggested = outcome?.result.suggestedCriteria ?? []
  const canApply = suggested.length > 0 && appliedLabels === null

  return (
    <section
      aria-labelledby="ai-heading"
      className="flex flex-col gap-4 border-t border-hairline pt-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <SectionLabel>Optional assist</SectionLabel>
          <h2 id="ai-heading" className="text-xl font-semibold tracking-tight text-ink">
            AI assist
          </h2>
          <p className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[10px] tracking-wider uppercase',
                usingFallback
                  ? 'border border-hairline bg-surface-high text-ink'
                  : 'bg-accent/15 text-accent-text',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  usingFallback ? 'bg-ink-faint' : 'bg-accent',
                )}
              />
              {usingFallback ? 'Mock fallback' : provider.label}
            </span>
            Everything works without it.
          </p>
        </div>
        <Button variant="ghost" onClick={() => setShowSettings((s) => !s)}>
          {showSettings ? 'Hide settings' : 'Settings'}
        </Button>
      </div>

      {showSettings && (
        <div className="flex flex-col gap-4 rounded-xl border border-hairline bg-surface-low p-4 md:p-5">
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
              <Field
                label="API key"
                htmlFor="ai-api-key"
                hint="Stored in this browser only — never sent anywhere but your endpoint."
              >
                <TextInput
                  id="ai-api-key"
                  type="password"
                  value={settings.apiKey}
                  placeholder="sk-…"
                  onChange={(event) => updateSettings({ apiKey: event.target.value })}
                />
              </Field>
              <Field label="Model" htmlFor="ai-model" hint="Any chat-completions model id.">
                <TextInput
                  id="ai-model"
                  value={settings.model}
                  placeholder="gpt-4o-mini"
                  onChange={(event) => updateSettings({ model: event.target.value })}
                />
              </Field>
              {!provider.isConfigured() && (
                <p className="flex items-start gap-2 rounded-lg border border-hairline bg-surface-high px-3 py-2.5 text-xs font-medium text-ink-soft">
                  <span aria-hidden className="shrink-0 text-ink">
                    ⚠
                  </span>
                  <span>
                    Base URL and key are required — until both are set, requests fall back
                    to the offline mock provider.
                  </span>
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Capability cards — one described action each, rather than buttons that
          differ only by their label. */}
      <div className="grid gap-2.5 sm:grid-cols-3">
        {CAPABILITIES.map((capability) => {
          const busy = loading === capability.id
          return (
            <button
              key={capability.id}
              type="button"
              disabled={loading !== null}
              onClick={() => run(capability.id)}
              className={cn(
                'flex cursor-pointer flex-col gap-1 rounded-xl border border-hairline bg-surface p-3.5 text-left transition-colors duration-150 hover:border-hairline-strong hover:bg-surface-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                loading !== null && !busy && 'opacity-50',
                busy && 'border-accent/50 bg-surface-high',
              )}
            >
              <span className="text-sm font-semibold text-ink">
                {busy ? 'Thinking…' : capability.label}
              </span>
              <span className="text-xs leading-relaxed text-ink-soft">
                {capability.hint}
              </span>
            </button>
          )
        })}
      </div>

      {loading !== null && (
        <p role="status" className="font-mono text-[11px] text-ink-soft">
          {provider.id === 'mock'
            ? 'The mock provider thinks for ~0.5s by design.'
            : `Waiting for ${settings.model || 'the model'}…`}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-danger/40 bg-danger/5 p-3.5 text-sm text-danger"
        >
          <span aria-hidden className="shrink-0">
            !
          </span>
          <span>{error}</span>
        </p>
      )}

      {outcome && (
        <div className="flex flex-col gap-3 rounded-xl border border-hairline bg-surface p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h3 className="text-sm font-semibold text-ink">{outcome.result.heading}</h3>
            <span className="font-mono text-[10px] tracking-wider text-ink-soft uppercase">
              {provider.label}
            </span>
          </div>

          <ul className="flex flex-col gap-1.5">
            {outcome.result.items.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-ink-soft">
                <span aria-hidden className="text-accent-text">
                  ◆
                </span>
                {item}
              </li>
            ))}
          </ul>

          {appliedLabels && (
            <p
              role="status"
              className="rounded-lg border border-hairline bg-surface-high px-3 py-2 text-xs text-ink-soft"
            >
              Added{' '}
              <span className="font-medium text-ink">{appliedLabels.join(', ')}</span> —
              set their weights in Weigh priorities below.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-hairline pt-3">
            {suggested.length > 0 && (
              canApply ? (
                <Button onClick={applySuggestedCriteria}>
                  Add {suggested.length} {plural(suggested.length, 'criterion', 'criteria')} to
                  this decision
                </Button>
              ) : (
                <span className="font-mono text-[11px] tracking-wider text-ink-soft uppercase">
                  Applied ✓
                </span>
              )
            )}
            <Button variant="ghost" onClick={copyResult}>
              Copy
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
