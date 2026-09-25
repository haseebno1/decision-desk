import type { AiProvider } from './types'
import { MockAiProvider } from './mockProvider'
import { OpenAiCompatibleProvider } from './openAiProvider'

const SETTINGS_KEY = 'decision-desk.ai-settings.v1'

export interface AiSettings {
  providerId: 'mock' | 'openai-compatible'
  baseUrl: string
  apiKey: string
  model: string
}

export const DEFAULT_AI_SETTINGS: AiSettings = {
  providerId: 'mock',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o-mini',
}

export function loadAiSettings(): AiSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_AI_SETTINGS }
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) {
      return { ...DEFAULT_AI_SETTINGS }
    }
    const record = parsed as Record<string, unknown>
    return {
      providerId:
        record.providerId === 'openai-compatible' ? 'openai-compatible' : 'mock',
      baseUrl: typeof record.baseUrl === 'string' ? record.baseUrl : DEFAULT_AI_SETTINGS.baseUrl,
      apiKey: typeof record.apiKey === 'string' ? record.apiKey : '',
      model: typeof record.model === 'string' ? record.model : DEFAULT_AI_SETTINGS.model,
    }
  } catch {
    return { ...DEFAULT_AI_SETTINGS }
  }
}

export function saveAiSettings(settings: AiSettings): void {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch (err) {
    console.error('Failed to save AI settings', err)
  }
}

/**
 * Build the active provider from settings. The mock provider is always
 * available; external providers only when their setup is complete.
 * This is the single point where the app touches a concrete provider.
 */
export function resolveProvider(settings: AiSettings): AiProvider {
  if (settings.providerId === 'openai-compatible') {
    const provider = new OpenAiCompatibleProvider(
      settings.baseUrl,
      settings.apiKey,
      settings.model,
    )
    if (provider.isConfigured()) return provider
  }
  return new MockAiProvider()
}
