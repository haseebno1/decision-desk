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
import { OpenAiCompatibleProvider, parseItems } from './openAiProvider'
import { AiProviderError, type AiDecisionContext } from './types'

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

  it('maps failed HTTP responses to AiProviderError', async () => {
    const provider = new OpenAiCompatibleProvider('http://127.0.0.1:9/v1', 'k', 'm')
    await expect(provider.assist({ capability: 'summary', context })).rejects.toBeInstanceOf(
      AiProviderError,
    )
  }, 30_000)
})
