import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { generateId } from '@/lib/utils/generateId'
import { loadDecisions, saveDecisions } from '@/lib/storage'
import type { Decision } from '@/types/decision'
import { DecisionStoreContext, type DecisionStore } from './decisionStore'

export function DecisionStoreProvider({ children }: { children: ReactNode }) {
  const [decisions, setDecisions] = useState<Decision[]>(() => loadDecisions())

  useEffect(() => {
    saveDecisions(decisions)
  }, [decisions])

  const createDecision = useCallback<DecisionStore['createDecision']>((input) => {
    const now = new Date().toISOString()
    const decision: Decision = {
      id: generateId('dec'),
      status: 'draft',
      criteria: [],
      ...input,
      createdAt: now,
      updatedAt: now,
    }
    setDecisions((prev) => [decision, ...prev])
    return decision
  }, [])

  const updateDecision = useCallback<DecisionStore['updateDecision']>((id, patch) => {
    setDecisions((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d,
      ),
    )
  }, [])

  const deleteDecision = useCallback<DecisionStore['deleteDecision']>((id) => {
    setDecisions((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const restoreDecision = useCallback<DecisionStore['restoreDecision']>(
    (decision, atFront = true) => {
      setDecisions((prev) =>
        prev.some((d) => d.id === decision.id)
          ? prev
          : atFront
            ? [decision, ...prev]
            : [...prev, decision],
      )
    },
    [],
  )

  const commitDecision = useCallback<DecisionStore['commitDecision']>(
    (id, chosenOptionId) => {
      const now = new Date().toISOString()
      setDecisions((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                status: 'committed' as const,
                outcome: { chosenOptionId, committedAt: now },
                updatedAt: now,
              }
            : d,
        ),
      )
    },
    [],
  )

  const reviewOutcome = useCallback<DecisionStore['reviewOutcome']>(
    (id, review) => {
      const now = new Date().toISOString()
      setDecisions((prev) =>
        prev.map((d) =>
          d.id === id && d.outcome
            ? {
                ...d,
                outcome: { ...d.outcome, review: { ...review, reviewedAt: now } },
                updatedAt: now,
              }
            : d,
        ),
      )
    },
    [],
  )

  const value = useMemo(
    () => ({
      decisions,
      createDecision,
      updateDecision,
      deleteDecision,
      restoreDecision,
      commitDecision,
      reviewOutcome,
    }),
    [decisions, createDecision, updateDecision, deleteDecision, restoreDecision, commitDecision, reviewOutcome],
  )

  return (
    <DecisionStoreContext.Provider value={value}>
      {children}
    </DecisionStoreContext.Provider>
  )
}
