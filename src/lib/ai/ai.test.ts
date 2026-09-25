// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { MockAiProvider } from './mockProvider'
import {
  DEFAULT_AI_SETTINGS,
  loadAiSettings,
  resolveProvider,
  saveAiSettings,
  type AiSettings,
} from './settings'
import {
  OpenAiCompatibleProvider,
  parseCriteria,
  parseItems,
} from './openAiProvider'
import { AI_SUGGESTED_WEIGHT, AiProviderError, type AiDecisionContext } from './types'

const context: AiDecisionContext = {
  title: 'Which laptop should I buy?',
  description: 'Daily dev work.',
  category: 'purchase',
  stake: 'high',
  optionLabels: ['MacBook Air M4', 'ThinkPad X1 Carbon'],
  criterionLabels: [
    { label: 'Price', weight: 5 },
    { label: 'Portability', weight: 3 },
  ],
}

describe('MockAiProvider', () => {
  it('is always configured', () => {
    expect(new MockAiProvider().isConfigured()).toBe(true)
  })

  it('suggests category-appropriate criteria, skipping existing ones', async () => {
    const result = await new MockAiProvider().assist({
      capability: 'criteria-suggestions',
      context,
    })

    expect(result.heading).toBeTruthy()
    expect(result.items.length).toBeGreaterThan(0)
    const labels = result.items.map((item) => item.split('—')[0].trim().toLowerCase())
    expect(labels).not.toContain('price')
    expect(labels).not.toContain('portability')
  })

  it('returns applicable criteria, not just prose, for criteria suggestions', async () => {
    const result = await new MockAiProvider().assist({
      capability: 'criteria-suggestions',
      context,
    })

    const suggested = result.suggestedCriteria ?? []
    expect(suggested.length).toBeGreaterThan(0)
    // Every suggestion carries an in-range weight and an usable label.
    for (const criterion of suggested) {
      expect(criterion.label.trim()).not.toBe('')
      expect(criterion.weight).toBeGreaterThanOrEqual(1)
      expect(criterion.weight).toBeLessThanOrEqual(5)
    }
    // ...and never re-suggests something the decision already has.
    const labels = suggested.map((c) => c.label.toLowerCase())
    expect(labels).not.toContain('price')
    expect(labels).not.toContain('portability')
    // The list is also rendered as prose, so both stay in step.
    expect(result.items.length).toBeGreaterThan(0)
  })

  it('omits structured criteria for capabilities that cannot produce them', async () => {
    const questions = await new MockAiProvider().assist({
      capability: 'clarifying-questions',
      context,
    })
    const summary = await new MockAiProvider().assist({ capability: 'summary', context })
    expect(questions.suggestedCriteria).toBeUndefined()
    expect(summary.suggestedCriteria).toBeUndefined()
  })

  it('produces clarifying questions including a third-option nudge', async () => {
    const result = await new MockAiProvider().assist({
      capability: 'clarifying-questions',
      context,
    })

    expect(result.items.length).toBeGreaterThan(0)
    expect(result.items.some((item) => /third option/i.test(item))).toBe(true)
  })

  it('summarizes option/criterion counts and top criterion', async () => {
    const result = await new MockAiProvider().assist({
      capability: 'summary',
      context,
    })

    expect(result.items.join(' ')).toMatch(/2 options/i)
    expect(result.items.join(' ')).toMatch(/“Price”/)
  })

  it('handles an empty decision gracefully', async () => {
    const result = await new MockAiProvider().assist({
      capability: 'summary',
      context: { ...context, optionLabels: [], criterionLabels: [] },
    })

    expect(result.items.length).toBeGreaterThan(0)
  })
})

describe('AI settings', () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  it('falls back to defaults for missing or corrupt data', () => {
    window.localStorage.setItem('decision-desk.ai-settings.v1', '{not json')
    expect(loadAiSettings()).toEqual(DEFAULT_AI_SETTINGS)

    window.localStorage.removeItem('decision-desk.ai-settings.v1')
    expect(loadAiSettings()).toEqual(DEFAULT_AI_SETTINGS)
  })

  it('round-trips settings', () => {
    const settings: AiSettings = {
      providerId: 'openai-compatible',
      baseUrl: 'http://localhost:1234/v1',
      apiKey: 'sk-test',
      model: 'llama-3',
    }
    saveAiSettings(settings)
    expect(loadAiSettings()).toEqual(settings)
  })

  it('resolves the external provider only when fully configured', () => {
    const partial: AiSettings = { ...DEFAULT_AI_SETTINGS, apiKey: '' }
    expect(resolveProvider(partial).id).toBe('mock')

    const full: AiSettings = {
      providerId: 'openai-compatible',
      baseUrl: 'http://localhost:1234/v1',
      apiKey: 'sk-test',
      model: 'llama-3',
    }
    expect(resolveProvider(full).id).toBe('openai-compatible')
  })
})

describe('OpenAiCompatibleProvider', () => {
  it('rejects unconfigured use', async () => {
    const provider = new OpenAiCompatibleProvider('', '', 'm')
    await expect(provider.assist({ capability: 'summary', context })).rejects.toMatchObject({
      name: 'AiProviderError',
    })
  })

  it('parses strict JSON content', () => {
    expect(parseItems('{"items":["a","b"]}')).toEqual(['a', 'b'])
  })

  it('parses fenced JSON and numbered lists', () => {
    expect(parseItems('```json\n{"items":["x"]}\n```')).toEqual(['x'])
    expect(parseItems('1. First\n2) Second\n- Third')).toEqual([
      'First',
      'Second',
      'Third',
    ])
  })

  it('parses structured criteria with weights clamped to 1–5', () => {
    const parsed = parseCriteria(
      JSON.stringify({
        items: ['Cost'],
        criteria: [
          { label: 'Cost', weight: 9 },
          { label: 'Longevity', weight: 0 },
          { label: 'Resale value', weight: 4 },
          { label: '  ', weight: 3 },
          { label: 'cost', weight: 2 },
        ],
      }),
    )

    expect(parsed).toEqual([
      { label: 'Cost', weight: 5 },
      { label: 'Longevity', weight: 1 },
      { label: 'Resale value', weight: 4 },
    ])
  })

  it('accepts a bare array, plain strings and the `name` field', () => {
    expect(parseCriteria('["Cost", {"name": "Quality"}]')).toEqual([
      { label: 'Cost', weight: AI_SUGGESTED_WEIGHT },
      { label: 'Quality', weight: AI_SUGGESTED_WEIGHT },
    ])
  })

  it('degrades to nothing when the model replies with prose', () => {
    expect(parseCriteria('Cost matters more here.')).toEqual([])
    expect(parseCriteria('{"items":["a"]}')).toEqual([])
  })

  it('maps failed HTTP responses to AiProviderError', async () => {
    const provider = new OpenAiCompatibleProvider('http://127.0.0.1:9/v1', 'k', 'm')
    await expect(provider.assist({ capability: 'summary', context })).rejects.toBeInstanceOf(
      AiProviderError,
    )
  }, 30_000)
})
