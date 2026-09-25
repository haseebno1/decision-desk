# Decision Desk

A decision-making tool: capture a decision, weigh criteria against options,
and get a transparent recommendation — with history and pattern insights.

## Tech stack

- React 19 + TypeScript (strict)
- Vite 8
- Tailwind CSS 4
- ESLint 10 (flat config) + `typescript-eslint`

## Getting started

```bash
npm install
npm run dev       # start dev server
npm run lint      # ESLint
npm run typecheck # tsc -b --dry
npm run build     # typecheck + production build
```

## Roadmap

Implementation follows `docs/IMPLEMENTATION-PLAN.md`:

- [x] Phase 0 — Foundation
- [x] Phase 1 — Decision Capture
- [x] Phase 2 — Criteria & Scoring
- [x] Phase 3 — Recommendation
- [x] Phase 4 — History
- [x] Phase 5 — Patterns
- [x] Phase 6 — Outcome Review
- [ ] Phase 7 — AI Adapter
- [ ] Phase 8 — Polish
- [ ] Phase 9 — Release
