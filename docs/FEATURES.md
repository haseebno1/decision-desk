# Features — Current State

_Last updated: Phase 8 complete + DFK "Calm Intelligence" UI redesign (commit `2c82ec4`)._

A precise inventory of what the application does **today**. Everything listed
here is implemented, browser-verified and covered by the test suite unless
explicitly marked otherwise.

- Product: Decision Fatigue Killer / "Decision Desk"
- Tagline: _Stop circling. Start deciding._
- Architecture: local-first, no account, no backend, no network calls unless
  you explicitly configure an external AI provider.
- Engine: pure TypeScript modules, no logic inside React components.

---

## 1. Screens & routes

Hash routing (`src/lib/routes.ts`) keeps the app deployable as static files
while preserving deep links and back/forward buttons.

| Route | Screen | Notes |
| --- | --- | --- |
| `#/` | Home | Command surface, recent decisions |
| `#/new` | New decision | Capture form, step 01 |
| `#/decisions/:id` | Decision workspace (draft) **or** Result (committed) | Behaviour switches on `status` |
| `#/decisions/:id/result` | Result (forced) | Works for drafts too |
| `#/history` | History / decisions journal | Search + filters + month timeline |
| `#/patterns` | Patterns / insights | Cross-decision statistics |

Unknown or malformed hashes fall back to Home. Page `<title>` updates per
route (`TITLES` in `src/App.tsx`) and focus moves to `<main>` on every
navigation after the first render (screen-reader context).

---

## 2. Capture — Home & New Decision

**Home (`src/features/home/HomeScreen.tsx`)**

- Editorial hero with a single primary action: start a new decision.
- Recent decisions list, newest first, each row showing status
  (`Draft` / `Decided` / `Reviewed`), category, stake, option count and
  last-updated date.
- Fit-score tile per row: the leading option's weighted score on the 0–10
  scale, or `—` when nothing is scored yet.
- Per-row actions: open/view and delete.
- Empty state with onboarding copy when there are no decisions.

**New / Edit decision (`src/features/decisions/DecisionForm.tsx`)**

- Fields: title (required), description (optional), category (required,
  6 categories), stake (low / medium / high, default medium).
- Options editor: starts with 2 rows, lettered A/B/C…, add/remove rows.
  Removal is disabled below 2 options; the form trims to a maximum of 6 on
  save, and blank labels are auto-named `Option N` so the store never holds
  empty options.
- Validation on submit: title required, category required, at least 2 named
  options. Errors render inline with `role="alert"`; validation is
  `noValidate` (no native browser bubbles).
- Editing an existing decision loads its current values and saves a patch
  instead of creating a new record.

---

## 3. Weigh priorities (`CriteriaEditor.tsx`)

- Add/remove criteria rows; each has a label and a weight.
- Weights run **1–5** (`WEIGHT_MIN`/`WEIGHT_MAX`), new criteria default to 3.
- Four ways to set a weight: decrement/increment stepper, discrete 1–5
  ticks, or clicking the active weight to read it back; every control carries
  an explicit `aria-label` and `aria-pressed` state.
- Live weight readout with a human label: Minimal / Low / Moderate /
  Important / Critical.
- Removing a criterion prunes its score cells from every option
  (`pruneScores`), so totals never reference deleted data.

---

## 4. Compare options — weighted matrix (`ScoreMatrix.tsx`)

- Rate each option 1–5 per criterion (`SCORE_MIN`/`SCORE_MAX`).
- Clicking the selected score clears it (cells may stay unscored).
- Live weighting: `total = ((Σ score × weight / Σ weight) − 1) / 4 × 10`,
  so totals are comparable on a **0–10** scale across decisions.
- Unscored cells count as neither numerator nor denominator — totals reflect
  entered data and are labelled provisional when incomplete.
- Leader indicator per option column (violet dot), weight chip per criterion,
  weighted-total shelf highlighting the current leader.
- Progress readout `n/m scored` in a polite live region, plus a completion
  flag.
- Empty guard: prompts for at least one option and one criterion.
- Horizontal scroll container keeps wide matrices usable on narrow screens.
- `sr-only` caption describes the 1–5 scoring scale for screen readers.

---

## 5. Recommendation engine (`src/lib/recommendation.ts`)

Pure function `buildRecommendation(decision)`; returns `null` until 2 options
and at least one scored cell exist.

- **Winner**: highest weighted total.
- **Gap**: winner minus runner-up, in 0–10 points (`Infinity` if only one
  option is scored).
- **Close call**: gap under `CLOSE_CALL_THRESHOLD = 0.5` (≈ the swing of one
  weight-1 criterion).
- **Trade-offs**: criteria where the winner loses to another option —
  surfaced explicitly rather than hidden.
- **Contributions**: per criterion, the raw scores per option and the points
  that criterion adds to each option's weighted average.
- **Reasons**: ordered, human-readable sentences — score, gap to runner-up,
  trade-offs accepted, close-call warning, provisional-warning when cells are
  unscored.

---

## 6. Result & commit (`ResultScreen.tsx`)

- Verdict hero: winning option name, fit-score dial (0–10 with a percentage
  ring), close-call vs clear-lead badge.
- Comparative chips for every ranked option, winner highlighted.
- "Why this decision": ranked criteria with contribution bars, then the full
  reasoning list.
- Trade-off section ("what you are consciously giving up").
- **Commit flow**: two-step confirm (no accidental commits). Committing locks
  the decision by storing the chosen option id + timestamp; the decision then
  renders read-only in the Result view.
- Post-commit score drift is detected and surfaced when the current
  mathematically-leading option differs from the committed one.
- Empty guard when there is not enough scored data to recommend anything.

---

## 7. Outcome review (`OutcomeReviewSection.tsx`)

- Available on committed decisions only.
- Records: what actually happened (`actualOptionId`, defaults to the
  committed option), satisfaction **1–5**, would-choose-again (boolean), free
  notes, and a `reviewedAt` timestamp.
- Divergence warning when the actual option differs from the committed one.
- Reviewed state shows an Expected vs Actual ledger, satisfaction readout
  with a scale strip, would-choose-again status, notes, and a "Redo review"
  action that resets the form with neutral defaults (satisfaction 3, would
  choose again yes).
- Reviews feed the Patterns satisfaction statistics.

---

## 8. History / journal (`HistoryScreen.tsx`)

- Full-text search across title, description, option labels and criterion
  labels.
- Filters: status (all / draft / committed) and category, plus a "clear
  filters" affordance that only appears when filters are active.
- Results grouped by month (label from `updatedAt`), newest first, rendered
  as a timeline with month markers and per-entry count.
- Each entry shows category chip, date, status, title, the chosen option (if
  committed) or the current leader with its 0–10 score, and a clarity score
  ring.
- Distinct empty states for "no decisions at all" vs "nothing matches these
  filters".

---

## 9. Patterns / insights (`src/lib/patterns.ts`, `PatternsScreen.tsx`)

Descriptive statistics only — every number is derived from the user's own
records; nothing is fabricated or predicted.

- Totals: all decisions, drafts, committed.
- Average winner score (0–10) across scored decisions.
- Average decision span in days (`updatedAt − createdAt`).
- Average options compared per decision (placeholder labels excluded).
- Review stats (only when reviews exist): average satisfaction (1–5) and
  share of decisions you would redo the same way.
- Breakdowns: by category, by stake, and most-used criteria (normalized
  labels, placeholder names like "Criterion 1" filtered out, top 8).
- Insight sentences, generated only when the sample supports them, e.g.
  dominant category share, dominant stake level, most-used criterion,
  winner-score average, typical decision span, went-against-the-math count,
  close-call count, and review satisfaction/redo summary.
- Empty state before any decisions exist.

---

## 10. AI assist — optional adapter (`src/lib/ai/`)

- Provider-neutral interface (`AiProvider`): `id`, `label`, `requiresSetup`,
  `isConfigured()`, `assist()`. The app never imports a concrete provider
  outside `resolveProvider`.
- Capabilities: **clarifying questions**, **criteria suggestions**, and
  **summary**.
- Providers:
  - `MockAiProvider` — default, deterministic, offline, ~450 ms simulated
    latency to exercise loading states; heuristics keyed on category, option
    count, description and criteria.
  - `OpenAiCompatibleProvider` — optional; used only when both base URL and
    API key are present, otherwise the resolver silently falls back to the
    mock provider (the app never breaks because AI is unconfigured).
- Settings (provider, base URL, API key, model) persist in
  `decision-desk.ai-settings.v1`; the key is browser-local and never sent
  anywhere except the configured endpoint.
- UI: collapsible panel in the draft workspace with capability buttons,
  "thinking" state, error surface (`role="alert"`), and styled results.
  Switching decisions resets stale AI output at render time.
- All other functionality works with AI completely absent.

---

## 11. Data, storage & resilience

- Persistence: `localStorage` under `decision-desk.decisions.v1`
  (`src/lib/storage.ts`).
- Every read is structurally validated (`isDecision`) so outdated or
  corrupted records are dropped instead of crashing the UI; unparsable
  payloads fall back to an empty list and log an error.
- Writes that fail (quota exceeded) dispatch a one-shot
  `decision-desk:storage-error` event; the app shows a toast explaining that
  browser storage is full.
- Undo: deleting a decision shows a toast with an Undo action that restores
  the exact record (6 s window).
- Error boundary wraps the whole app: unexpected crashes show a recovery
  screen, and reloading is always safe because data is local.
- No accounts, no telemetry, no server, no sync.

---

## 12. Navigation shell (`AppShell.tsx`)

- **Desktop (≥768 px)**: fixed sidebar with brand block, primary nav (Home,
  New decision, History, Patterns), hairline separator, and a "Local data"
  status chip; top bar with a persistent New-decision action; content column
  constrained for editorial line lengths.
- **Mobile (<768 px)**: slim top bar with brand and local-vault status, plus a
  bottom navigation bar with an elevated circular "Decide" action.
- Active route is exposed with `aria-current="page"`; a skip link jumps to
  `#main-content`.

---

## 13. Design system (implemented)

DFK "Calm Intelligence", derived from the Google Stitch project
`2842323800619420280` (artifacts and tokens archived under `stitch/`).

| Token | Value |
| --- | --- |
| canvas | `#09080d` |
| surface / low / mid / high / top | `#111018` / `#15131c` / `#191720` / `#211b30` / `#292532` |
| ink / ink-soft / ink-faint | `#f5f3fa` / `#a8a2b6` / `#96909f` |
| hairline / hairline-strong | `#3a3446` / `#4a4359` |
| accent (electric violet) | `#7c4ee8` fill, text variant `#c4b0fb`, wash `rgba(124,78,232,0.18)`, hover/glow hue `#8b5cf6` |
| danger | `#f27c8a` |
| radius | `0.85rem` cards, `0.625rem` controls |

- Defined once in `src/index.css` via Tailwind 4 `@theme`; used as utilities
  (`bg-canvas`, `text-ink-soft`, `border-hairline`, `text-accent-text`, …).
- Contrast: every text pairing clears WCAG AA on every surface tier (ink 13.6:1,
  ink-soft 6.06:1, ink-faint 4.83:1, accent-text 7.79:1, danger 5.71:1 worst
  case) and white on the primary fill is 5.11:1. The measured audit lives in
  `docs/UI-IMPROVEMENTS.md`.
- Depth comes from surface tiers + hairline borders + a single violet halo on
  primary actions — no heavy shadows or gradients.
- Typography: mono micro-labels/eyebrows and numerals, calm sans body,
  italic editorial quotes.
- Accessibility: 2 px violet focus ring with 2 px offset on all interactive
  elements, skip link, `aria-live` for live readouts, `role="alert"` for
  errors, decorative glyphs marked `aria-hidden`, and a global
  `prefers-reduced-motion` override.

---

## 14. Engineering & quality

- Stack: React 19, TypeScript strict (`erasableSyntaxOnly`,
  `verbatimModuleSyntax`), Vite 8, Tailwind CSS 4, ESLint 10 flat config with
  `typescript-eslint`, Vitest 5 (jsdom for AI tests).
- Scripts: `dev`, `build` (`tsc -b && vite build`), `lint`, `typecheck`,
  `test`, `check` (lint + typecheck + test).
- Tests: 47 across 5 files — scoring (9), patterns (13), recommendation (10),
  routes (3), AI adapter (12).
- Preview helper: `scripts/preview-server.mjs` serves the built `dist/`
  as static files.

---

## 15. Non-goals (unchanged from the MVP brief)

User accounts, cloud sync, social features, public sharing, autonomous
decisions, complex ML prediction, and invented analytics. AI remains optional
and never decides for the user.
