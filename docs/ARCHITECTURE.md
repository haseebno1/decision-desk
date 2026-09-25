# Technical Architecture

## Architecture Principle

Keep the application boring underneath and delightful on top.

## Layers

### UI

React components and page-level flows.

### Application

Decision workflow state and use cases.

### Domain

Pure decision logic:

- Decision
- Option
- Criterion
- Weight
- Score
- Recommendation
- Outcome

### Persistence

Repository abstraction backed initially by localStorage or IndexedDB.

### AI Adapter

Provider-neutral interface.

## Suggested Structure

src/
  app/
  components/
  pages/
  features/
    decisions/
    history/
    patterns/
    settings/
  domain/
    decision/
  services/
    ai/
    storage/
  lib/
  types/

## Important Rule

Business logic must not be embedded directly inside React components.

## State

Use local component state for temporary form state.

Use a lightweight global store only when genuinely necessary.

Persist completed decisions through a repository abstraction.

## Storage Interface

The UI should interact with:

- createDecision()
- updateDecision()
- getDecision()
- listDecisions()
- deleteDecision()
- recordOutcome()

The UI should not directly call localStorage.

## Decision Calculation

For every option:

weightedScore = sum(weight × score)

Normalise only for display if necessary.

Preserve raw scores for auditability.

## Recommendation

The recommendation engine should return:

- winner option ID
- option scores
- score differences
- strongest criteria
- weakest criteria
- major trade-off
- sensitivity information where possible

## Sensitivity

If the top two options are very close, do not pretend the decision is obvious.

Example:

> This is a close call. A small change in how you value flexibility could change the result.

## AI

Use an adapter:

interface AIProvider {
  clarifyDecision(input)
  suggestCriteria(input)
  summariseDecision(input)
}

AI responses must be validated before entering domain state.

Never allow raw AI output to directly mutate application data.
