# Contributing to Decision Desk

Thanks for taking the time to contribute. This document covers the practical
details — how to run the project, what the code conventions are, and what a
reviewable pull request looks like.

By participating you agree to the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Ways to contribute

- **Bug reports** — use the bug report template. Include your browser and the
  exact steps; a screenshot of the wrong state helps enormously.
- **Feature ideas** — open a feature request before writing code, so we can
  agree on scope. This project deliberately favours a small, finished surface
  over many half-built ones.
- **Design / UX** — the design intent lives in `docs/DESIGN-SYSTEM.md` and
  `docs/UI-IMPROVEMENTS.md`. Proposals that respect the single-accent rule and
  the token system are much easier to accept.
- **Code and docs** — see below.

## Getting started

Node 20.19+ is required (`.nvmrc` pins 24 for contributors and CI).

```bash
git clone https://github.com/haseebno1/decision-desk.git
cd decision-desk
npm install
npm run dev        # dev server, http://localhost:5173
```

All commands:

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run check` | **Run this before pushing** — lint, typecheck, tests |
| `npm run lint` | ESLint (flat config) |
| `npm run typecheck` | `tsc -b --dry` — types only, no emit |
| `npm test` | Vitest, single run |
| `npm run test:watch` | Vitest in watch mode |
| `npm run build` | Typecheck + production build into `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run seed:demo` | Print a paste-ready snippet that seeds demo decisions |

### Optional: demo data

The app starts empty and has no demo mode of its own — records live in your
browser, so the script can only *produce* the data. Generate the fixtures and
paste the result into your browser console while the app is open:

```bash
npm run dev
npm run seed:demo   # prints a one-line snippet
```

Open the app, open DevTools, paste the snippet. The page reloads with eight demo
decisions: three drafts at different stages (unscored, no criteria, partly
scored), four committed entries — including a deliberately close call and a
review that diverged from the recommendation — and one months-old entry so the
journal spans several months.

The snippet **merges** rather than replaces: demo records are rewritten and any
decisions you made yourself are left untouched. Every demo id is prefixed
`demo-`, so removing them later is one filter:
`decisions.filter((d) => !d.id.startsWith('demo-'))`.

## Project layout

```
src/
  components/      layout shell + UI primitives (Button, Field, inputs)
  features/        one folder per screen: home, decisions, history, patterns
  lib/             pure logic and persistence — no React
  lib/ai/          AI adapter layer (interface + providers + settings)
  types/           shared domain types
docs/              product, architecture, data model, design and screen docs
scripts/           development helpers
stitch/            original design references (inputs, not used at runtime)
```

The rule that keeps this codebase testable: **`src/lib` is framework-free.**
Recommendation, scoring, patterns, storage, routing, theme and AI providers are
plain functions with unit tests. React components stay thin and compose them.

## Conventions

- **TypeScript strict, no `any`.** `npm run typecheck` must pass.
- **Match the surrounding style.** The codebase is a small, consistent
  TypeScript/React (function components, hooks) project; please read the file
  you are editing before changing it.
- **No new runtime dependencies without discussion.** The app ships
  `react` + `react-dom` only. Icons and charts are hand-rolled SVG/CSS on
  purpose. Dev dependencies are fine when justified.
- **Colours come from tokens.** Every colour resolves from a variable in
  `src/index.css`. Do not add hex literals, `rgba()` values or Tailwind palette
  colours (e.g. `amber-300`) inside components — they cannot be re-themed, and
  light mode depends on this rule holding.
- **Accessibility is part of the change.** Interactive elements need accessible
  names and focus styles; decorative SVG is `aria-hidden`; state is not
  communicated by colour alone.
- **Never break the trust contract.** Recommendation, scoring and pattern
  insights must stay transparent and explainable. If you change engine maths,
  update `docs/ARCHITECTURE.md` and the tests together.
- **Keep the docs honest.** If your change alters behaviour, update the relevant
  file in `docs/` (especially `docs/SCREENS.md` and `docs/FEATURES.md`) in the
  same pull request.
- **Tests.** Any logic change in `src/lib` should come with tests. Component
  changes should be verified in the browser; screenshot or describe what you
  saw in the PR description.

## Adding a screen

1. Add the route to `src/lib/routes.ts` (and a test).
2. Build the screen under `src/features/<area>/`, composing existing UI
   primitives.
3. Wire navigation in `src/App.tsx`.
4. Document it in `docs/SCREENS.md`.

## Commits and pull requests

- Keep commits focused; a small commit that does one thing is easier to review
  than a large one that does five.
- Write commit subjects in the imperative mood, e.g. `Add outcome review to the
  result screen` — not `Added` or `Fixes stuff`.
- Before opening a PR: `npm run check` is green and `npm run build` succeeds.
- Fill in the pull request template. In the description, explain the *why*
  first, and include the verification you performed (commands run, screens
  checked, before/after).
- Keep PRs small where you can. If a change is large, say so up front and
  explain how it is best reviewed (commit by commit, or file by file).

## Reporting security issues

Do not open a public issue — see [SECURITY.md](./SECURITY.md).

## License

By contributing, you agree that your contributions are licensed under the
[MIT License](./LICENSE) that covers this project.
