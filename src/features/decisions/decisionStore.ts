import { createContext, useContext } from 'react'
import type { Decision } from '@/types/decision'

export interface DecisionStore {
  decisions: Decision[]
  createDecision: (
    input: Pick<
      Decision,
      'title' | 'description' | 'category' | 'stake' | 'options'
    >,
  ) => Decision
  updateDecision: (
    id: string,
    patch: Partial<Omit<Decision, 'id' | 'createdAt'>>,
  ) => void
  deleteDecision: (id: string) => void
  /** Lock a decision at its current recommendation. */
  commitDecision: (id: string, chosenOptionId: string) => void
}

export const DecisionStoreContext = createContext<DecisionStore | null>(null)

export function useDecisions(): DecisionStore {
  const ctx = useContext(DecisionStoreContext)
  if (!ctx) {
    throw new Error('useDecisions must be used within a DecisionStoreProvider')
  }
  return ctx
}
