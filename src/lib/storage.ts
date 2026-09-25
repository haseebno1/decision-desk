import type { Decision } from '@/types/decision'

const STORAGE_KEY = 'decision-desk.decisions.v1'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** Minimal structural guard so bad or outdated persisted data can't crash the app. */
function isDecision(value: unknown): value is Decision {
  if (!isRecord(value)) return false
  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.category === 'string' &&
    typeof value.stake === 'string' &&
    Array.isArray(value.options) &&
    Array.isArray(value.criteria) &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  )
}

export function loadDecisions(): Decision[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isDecision)
  } catch (err) {
    console.error('Failed to load decisions from storage', err)
    return []
  }
}

let quotaWarned = false

export function saveDecisions(decisions: Decision[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(decisions))
  } catch (err) {
    console.error('Failed to save decisions to storage', err)
    if (!quotaWarned) {
      quotaWarned = true
      window.dispatchEvent(
        new CustomEvent('decision-desk:storage-error', {
          detail: 'Changes could not be saved — browser storage is full.',
        }),
      )
    }
  }
}
