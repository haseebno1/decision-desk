# Data Model

## Decision

```ts
type Decision = {
  id: string
  title: string
  description?: string
  category: DecisionCategory
  stake: DecisionStake
  createdAt: string
  updatedAt: string
  status: "draft" | "completed" | "archived"
  deadline?: string
  reversible?: boolean
  options: DecisionOption[]
  criteria: Criterion[]
  recommendation?: Recommendation
  chosenOptionId?: string
  confidence?: number
  expectedOutcome?: string
  outcome?: Outcome
}
```

## Option

```ts
type DecisionOption = {
  id: string
  name: string
  description?: string
}
```

## Criterion

```ts
type Criterion = {
  id: string
  name: string
  weight: number // 1–5
  scores: Record<string, number> // optionId -> 1–10
}
```

## Recommendation

```ts
type Recommendation = {
  optionId: string
  generatedAt: string
  weightedScores: Record<string, number>
  topReasons: string[]
  tradeOff: string
  confidence: number
  assumptions: string[]
}
```

## Outcome

```ts
type Outcome = {
  recordedAt: string
  satisfaction?: number
  actualOutcome?: string
  wouldChooseAgain?: boolean
  notes?: string
}
```

## Categories

```ts
type DecisionCategory =
  | "personal"
  | "work"
  | "money"
  | "purchase"
  | "food"
  | "relationship"
  | "project"
  | "other"
```

## Stakes

```ts
type DecisionStake =
  | "tiny"
  | "normal"
  | "important"
  | "major"
```

## Persistence

MVP:

- localStorage for simple implementation, or
- IndexedDB if decision volume/features justify it.

Create a repository abstraction so the storage mechanism can change later.
