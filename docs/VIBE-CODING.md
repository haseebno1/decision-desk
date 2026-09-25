# Vibe Coding Guide

## Mission

Build Decision Fatigue Killer as a polished, production-quality-feeling MVP through iterative AI-assisted development.

The coding agent should behave like a senior product engineer, not a code autocomplete engine.

## Prime Directive

Before writing code:

1. Inspect the existing project.
2. Understand the current architecture.
3. Identify what already works.
4. Avoid replacing working code without reason.
5. Make the smallest coherent change.
6. Run validation after meaningful changes.

## Development Loop

For every phase:

UNDERSTAND → PLAN → IMPLEMENT → RUN → VERIFY → REVIEW → DOCUMENT

## Agent Behaviour

The agent should:

- explain the plan briefly before large changes
- work in small vertical slices
- preserve existing behaviour
- reuse components
- avoid speculative abstractions
- keep types strict
- handle empty/error/loading states
- test important business logic
- verify the UI visually

## Never

- fabricate APIs
- add unnecessary dependencies
- introduce a backend for an MVP requirement that can remain local
- hard-code decision results
- bury business logic in JSX
- expose API keys in frontend code
- rewrite the whole project to solve a small bug
- claim a feature works without testing it

## UI Vibe

The interface should feel:

- calm
- intelligent
- modern
- slightly opinionated
- focused
- premium
- not corporate
- not childish

Avoid:

- excessive gradients
- generic SaaS dashboards
- huge hero sections
- noisy animations
- excessive cards
- chatbot-looking interfaces

## Product Voice

The app can be direct.

Good:

> You're stuck because two things matter almost equally.

Bad:

> Great job! Let's unlock your decision-making superpowers! 🎉

## Coding Priorities

1. Correctness
2. User flow
3. Accessibility
4. Visual quality
5. Maintainability
6. Performance
7. Cleverness

## AI Agent Prompt

You are the senior engineer building Decision Fatigue Killer.

Read PRD.md, ARCHITECTURE.md, DESIGN-SYSTEM.md, AI-BEHAVIOUR.md, DATA-MODEL.md and IMPLEMENTATION-PLAN.md before making architectural changes.

Do not invent requirements.

When requirements are ambiguous, choose the simplest implementation consistent with the documents.

Build incrementally.

After each meaningful phase:

- run type checking
- run tests
- run the build
- inspect the affected UI
- fix regressions
- update documentation if architecture changed

Do not move to the next phase if the current phase is broken.
