# Decision Desk

[![CI](https://github.com/haseebno1/decision-desk/actions/workflows/ci.yml/badge.svg)](https://github.com/haseebno1/decision-desk/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-7c4ee8.svg)](./LICENSE)

**Think decisions through, step by step.** Capture a decision, weigh what
actually matters against your options, get a recommendation that explains
itself — then record how it turned out and learn from the pattern.

Local-first: there is no account, no server and no telemetry. Your decisions
live in your browser, and the app works completely offline.

---

## Why another decision tool

Most tools either give you a spreadsheet or give you an answer. Decision Desk
tries to be honest about both halves:

- **The maths is transparent.** Every recommendation is a weighted average you
  can audit — you see each criterion's weight, each score, and exactly how much
  it moved the result. No black box, no unexplained confidence score.
- **It tells you when it doesn't know.** A near-tie is called a close call
  rather than dressed up as a verdict, and when you commit to something the
  maths didn't favour, the app says so instead of quietly agreeing with you.
- **It closes the loop.** After the fact you record what you chose and how it
  felt, so Patterns can tell you whether your weighted scoring is actually
  predicting your satisfaction — including the cases where it isn't.
- **AI is optional and additive.** With no configuration at all the app is
  fully functional. The assistant is an adapter you can point at any
  OpenAI-compatible endpoint, and it never becomes a dependency of the core.

## Features

**Capture** — title, description, category and stake level (low / medium /
high), with three worked examples to start from.

**Weigh** — as many criteria as you need, scored 1–5 on importance, and options
scored 1–5 against each. Partial scoring is a first-class state: drafts report
`8/12 scored` rather than pretending to be finished.

**Compare** — a score matrix with per-cell editing, inline option and criterion
editing, and a synthesis shelf showing where the recommendation currently
stands and how it moves as you change weights.

**Decide** — a result screen with a fit dial, the gap to the runner-up, a
close-call badge, criterion-by-criterion evidence, the trade-offs you are
accepting, and a two-step commit that records what you chose and when.

**Review** — expected vs actual choice, satisfaction (1–5), would-you-choose-
again, and free-text notes, so the record captures what the maths could not.

**Learn** — a chart-led Patterns screen: where decisions stand, how they felt
afterwards, which categories and criteria you weight heaviest and score
highest, plus plain-language insights derived from your own history.

**Assistant (optional)** — criteria suggestions you can **apply in one click**,
clarifying questions, and a neutral summary of where a decision stands. Also
copyable as Markdown. See [AI assist](#ai-assist-optional).

**Workspace** — dark and light themes applied before first paint (no flash),
a collapsible desktop sidebar, keyboard-reachable controls throughout, and
mobile layouts designed rather than squeezed.

## Quick start

Node 20.19+ is required (`.nvmrc` pins 24).

```bash
git clone https://github.com/haseebno1/decision-desk.git
cd decision-desk
npm install
npm run dev        # http://localhost:5173
```

The app opens empty. Create a decision, or seed some realistic demo data to
explore the screens first:

```bash
npm run seed:demo        # prints a one-line snippet
```

Paste that snippet into your browser's DevTools console with the app open. It
merges eight demo decisions on top of your own data (your records are never
touched) and reloads. Demo ids are prefixed `demo-`, so removing them later is
one filter: `decisions.filter((d) => !d.id.startsWith('demo-'))`.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run check` | Lint, typecheck and test — run before pushing |
| `npm test` | Vitest, single run (`test:watch` for watch mode) |
| `npm run build` | Typecheck + production build into `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run lint` / `npm run typecheck` | ESLint / `tsc -b --dry` |
| `npm run seed:demo` | Print a paste-ready demo-data snippet |

## AI assist (optional)

The assistant is an adapter, not an integration. Two providers ship:

- **Built-in (default)** — deterministic, offline, no key required. It runs
  local heuristics over your decision (category, option count, criteria,
  description) so you can see the whole flow without configuring anything.
- **OpenAI-compatible** — any endpoint that speaks the `/chat/completions`
  shape: OpenAI, Azure OpenAI, OpenRouter, Groq, Ollama, LM Studio, vLLM and
  friends. Set the **base URL**, **model** and **API key** in the assistant's
  settings drawer.

If the endpoint is unconfigured, the app silently falls back to the built-in
provider — AI being unavailable never breaks the app.

**Criteria suggestions are actionable.** Providers are asked for structured
output, and the panel offers an **Apply** button that adds the suggested
criteria to your decision with clamped weights and case-insensitive
de-duplication — so applying twice, or applying after hand-editing, can never
create duplicates. Prose-only responses still render, so a provider that
ignores the structure request degrades gracefully.

### Where your key goes

The API key is stored in your browser's `localStorage`
(`decision-desk.ai-settings.v1`) and is sent only to the base URL you configure,
as a bearer token on your own requests. There is no proxy and no analytics.
Anyone with access to your browser profile can read it, so prefer a scoped or
disposable key over a production one. See [SECURITY.md](./SECURITY.md).

## Data and privacy

Everything is local. Four `localStorage` keys, all namespaced:

| Key | Contents |
| --- | --- |
| `decision-desk.decisions.v1` | Your decisions, options, criteria, scores and reviews |
| `decision-desk.ai-settings.v1` | Provider, base URL, model and API key |
| `decision-desk.theme.v1` | `dark` or `light` (absent = follow the OS) |
| `decision-desk.sidebar.v1` | `expanded` or `collapsed` on desktop |

Every read is validated and defensive: corrupt or hand-edited storage degrades
to a safe default rather than a crash. Clearing your browser data for the site
removes everything, and there is nothing anywhere else to remove.

## Tech stack

React 19 · TypeScript (strict) · Vite 8 · Tailwind CSS 4 · Vitest 5 ·
ESLint 10 (flat config). Runtime dependencies: `react` and `react-dom`, and
that is the whole list — icons and charts are hand-rolled SVG and CSS.

## Project structure

```
src/
  components/     layout shell and UI primitives (Button, Field, inputs)
  features/       one folder per area: home, decisions, history, patterns
  lib/            pure, framework-free logic
    ai/           provider interface + built-in and OpenAI-compatible adapters
    scoring.ts    weighted scoring and 1–5 → 0–10 rescaling
    recommendation.ts   winner, gap, close call, trade-offs
    patterns.ts   insights and aggregates over your history
    storage.ts    validated localStorage persistence
  types/          shared domain types
docs/             product, architecture, data model, design, screens, plan
scripts/          development helpers
stitch/           original design references (inputs, not shipped code)
```

The architectural rule that keeps this testable: **`src/lib` never imports
React.** Recommendation, scoring, patterns, storage, routing, theme and the AI
adapters are plain functions with unit tests. Components stay thin and compose
them, which is also why the engine can be reasoned about — and trusted — on its
own.

## Documentation

Start at [`docs/README.md`](./docs/README.md) for the full map. Highlights:

- [`docs/PRD.md`](./docs/PRD.md) — product requirements and non-goals
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — module boundaries and data flow
- [`docs/DATA-MODEL.md`](./docs/DATA-MODEL.md) — types, storage schema, migrations
- [`docs/SCREENS.md`](./docs/SCREENS.md) — every screen: composition, states, persistence
- [`docs/FEATURES.md`](./docs/FEATURES.md) — the feature inventory as shipped
- [`docs/DESIGN-SYSTEM.md`](./docs/DESIGN-SYSTEM.md) — tokens, type scale, motion
- [`docs/UI-IMPROVEMENTS.md`](./docs/UI-IMPROVEMENTS.md) — the improvement plan and what's done

## Deployment

The app is static — any host works: `npm run build` and serve `dist/`. The
build uses relative asset URLs, so it runs at a domain root, in a subdirectory,
or on GitHub Pages without changes.

GitHub Pages is wired up already: enable **Settings → Pages → Source: GitHub
Actions**, then every push to `main` runs `.github/workflows/deploy-pages.yml`
(tests, typecheck, build, deploy). Routing is hash-based, so every route is
served by the same `index.html` and no SPA-fallback config is needed.

## Contributing

Contributions are welcome — bugs, features, docs and design. Please read
[CONTRIBUTING.md](./CONTRIBUTING.md) first: it covers the commands, the
conventions (notably "all colours come from tokens", "no new runtime
dependencies without discussion" and "the engine must stay explainable"), and
what a reviewable pull request looks like.

- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Security policy](./SECURITY.md) — please report vulnerabilities privately
- [Open an issue](https://github.com/haseebno1/decision-desk/issues)

## License

[MIT](./LICENSE) © [Abdul Haseeb](https://github.com/haseebno1)
