# Decision Desk — Documentation

This folder is the source of truth for *why* the app is built the way it is.
Code is the source of truth for *what* it does; where the two disagree, the code
wins and the doc should be corrected in the same change.

New here? Read `ARCHITECTURE.md` and `SCREENS.md`, then the section of
`FEATURES.md` you are about to touch.

## Index

| Doc | What it covers |
| --- | --- |
| [`PRD.md`](./PRD.md) | Product requirements: goals, users, scope, non-goals |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Module boundaries, data flow, where logic lives |
| [`DATA-MODEL.md`](./DATA-MODEL.md) | Domain types, storage schema, validation and migrations |
| [`FEATURES.md`](./FEATURES.md) | The feature inventory as actually shipped, plus storage keys |
| [`SCREENS.md`](./SCREENS.md) | Every screen: composition, states, data dependencies, gaps |
| [`DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md) | Tokens, type scale, spacing, motion, accent rules |
| [`UI-IMPROVEMENTS.md`](./UI-IMPROVEMENTS.md) | Improvement plan: parts A–H, phases, and what has shipped |
| [`AI-BEHAVIOUR.md`](./AI-BEHAVIOUR.md) | What the assistant is asked to do, and its guardrails |
| [`ACCEPTANCE-CRITERIA.md`](./ACCEPTANCE-CRITERIA.md) | Definition of done per feature area |
| [`IMPLEMENTATION-PLAN.md`](./IMPLEMENTATION-PLAN.md) | Phased build order used to get here |
| [`PROJECT-CHECKLIST.md`](./PROJECT-CHECKLIST.md) | Shipped-vs-outstanding checklist |
| [`VIBE-CODING.md`](./VIBE-CODING.md) | Working agreements for AI-assisted changes |
| [`AGENTS.md`](./AGENTS.md) | Instructions for coding agents working in this repo |

Contributor-facing docs live at the repository root: [`CONTRIBUTING.md`](../CONTRIBUTING.md),
[`CODE_OF_CONDUCT.md`](../CODE_OF_CONDUCT.md), [`SECURITY.md`](../SECURITY.md).

## How to keep these docs useful

- **Document shipped behaviour, not intent.** If a doc describes a screen or
  option that does not exist, that is a bug — either build it or remove the
  claim. `SCREENS.md` §10 and `UI-IMPROVEMENTS.md` Part I track the open gaps
  honestly rather than implying they are done.
- **Quantities go stale.** Prefer "the AI adapter suite" over "12 tests", or
  update the number in the same commit that changes it.
- **One sequencing story.** `UI-IMPROVEMENTS.md` Part I is the plan of record;
  Parts A–H are the item catalogue it schedules. When they disagree, Part I is
  right.
- **No second design system.** `DESIGN-SYSTEM.md` and the tokens in
  `src/index.css` are the only source of colour, type and spacing values.

---

## Appendix — original project brief

The brief below is the starting document, preserved for context. It is a
proposal, not a description of the current build; the divergences are recorded
in [`SCREENS.md`](./SCREENS.md) (§10 maps the ten concepts to what actually
shipped — Clarifying Questions is an AI capability rather than a screen, and
Settings is a drawer inside the workspace).

# Decision Fatigue Killer

**Tagline:** Stop circling. Start deciding.

Decision Fatigue Killer (DFK) is a local-first decision-support app that helps people move from uncertainty to a clear, explainable decision through a short structured process.

## Product Loop

Dump decision → Clarify → Weigh → Compare → Decide → Explain → Track → Learn

## MVP Principles

- Local-first
- No account required
- No backend required
- Fast to use
- Transparent reasoning
- User remains in control
- Useful for both trivial and meaningful decisions
- AI is optional, not a hard dependency

## Core Screens

1. Home / Dashboard
2. New Decision
3. Clarifying Questions
4. Criteria & Weights
5. Options
6. Decision Result
7. Decision History
8. Decision Detail
9. Patterns / Insights
10. Settings

## Suggested Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui or a similarly accessible component system
- Recharts for lightweight visualisations
- localStorage or IndexedDB for MVP persistence
- Optional provider-agnostic AI adapter

**As built:** React, TypeScript, Vite and Tailwind are as suggested, with
localStorage persistence and a provider-agnostic AI adapter. Two deliberate
departures: UI primitives are hand-rolled rather than shadcn/ui, and charts are
hand-rolled SVG/CSS rather than Recharts — which keeps runtime dependencies at
`react` + `react-dom` and lets every colour resolve from a theme token.

## Non-goals for MVP

- User accounts
- Cloud sync
- Social features
- Public decision sharing
- Autonomous decisions
- Complex ML prediction
