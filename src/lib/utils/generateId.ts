/**
 * Generate a reasonably unique id for client-side entities
 * (options, criteria, decisions). Not a security primitive.
 */
export function generateId(prefix = ''): string {
  const core =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  return prefix ? `${prefix}_${core}` : core
}
