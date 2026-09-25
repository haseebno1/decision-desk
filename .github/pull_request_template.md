<!--
Thanks for contributing! Lead with the *why* — a reviewer who understands the
problem can judge the solution. Keep the descriptions short and concrete.
-->

## What and why

<!-- What does this change, and what problem does it solve? -->

Closes #

## How

<!--
Brief notes on the approach, and anything a reviewer should know to review it
well (a design decision, a trade-off you accepted, an alternative you rejected).
If this touches the recommendation or scoring engine, say so explicitly.
-->

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Refactor or cleanup (no behaviour change)
- [ ] Documentation
- [ ] Design / UX

## Screens or modules affected

<!-- e.g. Result screen, Patterns, shell / theme, src/lib/scoring.ts, docs -->

## Verification

- [ ] `npm run check` passes (lint, typecheck, tests)
- [ ] `npm run build` succeeds
- [ ] Checked in the browser at a desktop width
- [ ] Checked in the browser at a mobile width (~390 px)
- [ ] Checked in both dark and light themes
- [ ] Added or updated tests for any logic change in `src/lib`
- [ ] Updated the relevant docs (`docs/SCREENS.md`, `docs/FEATURES.md`, …)

<!--
Paste the commands you ran and what you saw. Before/after screenshots are
ideal for visual changes.
-->

## Checklist

- [ ] No new runtime dependencies (or: justified in the description above)
- [ ] All colours come from tokens in `src/index.css` — no hex, `rgba()` or
      Tailwind palette colours in components
- [ ] No API keys, tokens or private decision content in the diff or the
      description
