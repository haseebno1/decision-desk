# UI Improvements & Roadmap

_Companion to `docs/FEATURES.md` (what exists) and `stitch/design-system.md`
(the visual source of truth). Written after the "Calm Intelligence" redesign
landed in commit `2c82ec4`._

Guiding constraint from the redesign brief: **change the interface, not the
product.** Items below are labelled by blast radius so it is always clear
whether a change stays in the presentation layer or deliberately touches
domain/storage code.

**Where to start:** Part I is the approved execution plan — three phases
covering every item in Parts A–H. Read this document top-to-bottom for the
detail, then work Phase 1 → 2 → 3.

| Blast radius | Meaning |
| --- | --- |
| **UI** | Presentation only — no engine, schema, or stored-data changes |
| **UI + reading** | Reads existing domain data differently (derived view, no new stored fields) |
| **Domain** | Adds/changes engine functions, types, or persistence (needs tests + migration thought) |

---

## Part A — Visual refinements

### A1. Load the real typefaces (UI) — highest visual return

`src/index.css` declares `--font-sans: 'Inter', …` and a mono stack, but
`index.html` loads no webfonts, so the app currently renders in system
fallbacks. The Stitch system specifies a deliberate triad: **Geist** (UI),
**Newsreader italic** (editorial quotes), **JetBrains Mono** (labels, kbd
hints, numerals). Self-hosted `woff2` with `font-display: swap` and a
`preload` for the UI weight would make every screen match the reference
instead of approximately matching it.

- Add `--font-editorial` and use it for the italic quote lines (Home hero
  sub-line, Weigh banner, Patterns insights, Outcome Review close).
- Keep mono for eyebrows/labels/score numerals — that contrast is what makes
  the hierarchy read as editorial rather than SaaS.

### A2. Dedicated mobile Compare Options composition (UI) — the biggest gap

The desktop matrix is a `<table>` inside `overflow-x-auto`, so on a phone it
becomes a horizontally scrolling grid. A phone-first user cannot compare two
options without panning. Build the stacked composition the Stitch mobile
screen implies: one card per **option**, listing every criterion with its
1–5 segmented control, the option's running total pinned at the card header,
and the leader marked. Reuse the same `onScoreChange` handler and the same
`ScoreCell` semantics (1–5 buttons, `aria-pressed`, click-to-clear) — purely
an alternative layout behind a breakpoint.

### A3. Mobile compare/weights ergonomics (UI)

- Increase the touch target of score buttons from `h-7 w-7` to ~44 px on
  coarse pointers (`@media (pointer: coarse)`), keeping the desktop density.
- Make the criterion weight chips sticky while scrolling a long criteria list
  so the weight context never leaves the screen.
- Sticky bottom action bar on mobile for "See recommendation" instead of a
  button at the very end of a long page.

### A4. Nav accuracy & state polish (UI)

- The sidebar highlights **New decision** while viewing a decision's details
  or result, because `activeRouteId` maps both `edit-decision` and `result` to
  `new-decision`. Prefer highlighting nothing (or a "Decisions" group state)
  for those routes so navigation never lies.
- Add a subtle active indicator bar (2 px violet) beside the active nav item —
  the Stitch sidebar relies on a filled row; a bar reads better at small
  sizes and survives high-contrast modes.
- Consider moving Settings out of the workspace panel into a real surface so
  the sidebar can carry a Settings entry like the reference (see D7).

### A5. Consistency sweep against the Stitch screenshots (UI)

`stitch/screenshots/*.png` are the acceptance reference. A pass comparing
each implemented screen against its PNG would catch: inconsistent section
rhythm (currently `gap-8`/`gap-12` mixed), two different "score number"
typographic treatments (Home tile vs Result dial), and the `10.0` vs `10`
formatting split (`formatTotal` always shows one decimal — the dial reads
`10.0`, Stitch shows `82/100`). Decide one convention and apply it.

### A6. Density & scanability on long journals (UI)

With 20+ decisions the History spine gets long. Options: sticky month headers,
a compact/comfortable density toggle, and keyboard traversal (see C2). Keep
the "one entry per row card" shape — the journal metaphor is the point.

### A7. Print / share-ready verdict (UI)

A print stylesheet (`@media print`) that renders the Result screen as a clean
one-page verdict — title, winner, fit score, reasoning, trade-offs — with the
canvas inverted to white. Zero functional risk, immediately useful for
"show me why you decided this" conversations.

### A8. Empty/loading state parity (UI)

The AI panel's loading state is text ("Thinking…"). A calm skeleton (two
low-contrast shimmer lines) matches the design language better and preserves
layout height so nothing jumps when the result arrives. Audit remaining empty
states (no criteria, unscored matrix, no patterns, no reviews yet) for the
same tone of voice and illustration treatment.

---

## Part B — Subtle motion

Principles: 120–320 ms, small distances (≤8 px), opacity + transform only, no
bounce, and everything disabled under `prefers-reduced-motion` (already
globally handled in `src/index.css`). If a library is wanted later, Motion is
the natural fit — but every item below is achievable with CSS alone, and the
project currently has zero animation dependencies.

| # | Motion | Where | Notes |
| --- | --- | --- | --- |
| B1 | Score-dial reveal: `stroke-dashoffset` animates from full to the computed value once on mount (600 ms ease-out) plus a short number fade-in | Result fit dial, History clarity ring | Currently the ring is drawn instantly; the sample is what the reference shows |
| B2 | Weight-tick and score-cell selection transition: 120 ms background/border crossfade with a faint violet wash | CriteriaEditor ticks, ScoreMatrix cells, satisfaction scale | Feedback without noise |
| B3 | Step advance: the next flow section enters with the existing `animate-fade-up`, and the progress track width animates | Define → Weigh → Compare | Keep it to one transition per step, not per element |
| B4 | Contribution bars grow from 0 on mount / on data change | Result "Why this decision", Patterns bars | Already animatable via `transition-[width]`; add a mount trigger |
| B5 | Toast exit (fade + 4 px down) | Toast stack | Entry exists; exit is currently instant, so toasts pop out |
| B6 | Hover lift: 1 px translate + hairline colour shift on journal/decision cards | Home rows, History entries | Do **not** combine with shadow growth — halo only |
| B7 | Count-up for stat numbers (≤400 ms, then settle) | Patterns stats, fit score | Must be interruptible and skipped in reduced-motion |
| B8 | Drawer/sheet transition for AI settings on mobile (slide-up, 200 ms) | AiAssistPanel | Turns an inline block into a real sheet on small screens |
| B9 | Nav active indicator crossfade as routes change (150 ms) | Sidebar / bottom nav | Cheap, makes navigation feel intentional |
| B10 | Route transitions via the View Transitions API, progressively enhanced | All hash routes | No dependency, no-op in unsupported browsers; a bold but low-risk upgrade over the current single `animate-fade-up` |

---

## Part C — Interaction model

### C1. Keyboard-first flow (UI)

The reference is explicitly "keyboard-first" (⌘K, ⌘↵). Nothing in the app
currently binds keys. Proposed bindings, all discoverable and documented on
screen:

- `Ctrl/⌘ + Enter` — save the decision, then advance to the recommendation.
- `Esc` — cancel/back one level (with confirm if the form is dirty).
- `C` — add a criterion while on the Weigh step (outside text inputs).
- `1–5` — set the focused matrix cell's score; arrow keys move between cells.
- `?` — open a shortcuts sheet (the reference's shortcut affordance).

Guardrails: never hijack keys while an input/textarea has focus; never remove
the ability to do everything with a mouse.

### C2. Command palette (UI + reading)

The shell has a permanent "New decision" action but no jump-to-anything.
A `⌘K` palette that resolves to existing routes and existing records —
"new decision", screen names, and a fuzzy search over decision titles that
navigates to `#/decisions/:id` — adds the reference's command-surface feel
without new domain logic. Reuse the History search predicate for matching.

### C3. Roving grid navigation in the matrix (UI)

Give the score grid a single tab stop with arrow-key movement and `Home`/`End`
jumps, so scoring five criteria across three options stops being ~15 tab
presses. Keep each button's `aria-label`/`aria-pressed` so nothing is lost.

### C4. Autosave affordance (UI)

The workspace writes on every change but says nothing. A small mono chip
("Saved locally" / "Saving…") near the step eyebrow mirrors the reference's
"READY"/"Autosaving" chips and reduces the fear of losing work.

### C5. Optimistic, explainable commit feedback (UI)

After committing, show the vault-style confirmation the reference implies
("Decision saved to local vault · zero telemetry") with an Undo that reopens
the draft. Today committing is final with no way back except re-scoring.

### C6. Faster destructive actions (UI)

- Swipe-to-delete on mobile journal rows, with the existing Undo toast.
- Keep the two-step confirm for commit (deliberate friction) but not for
  delete, which is already recoverable via undo.

### C7. Filter chips with counts on History (UI + reading)

Replace/augment the category `<select>` with chip tabs showing counts
(All 12 · Career 5 · Purchase 4 …) computed from the already-loaded list.
This is presentation of existing data, not a new analytic. Keep the selects
for status filtering where a chip row would wrap awkwardly.

### C8. Preset prompts on Home (UI)

The reference's "Quick decision / Compare options / Think it through" tray
prefills a template: category, a starter criterion set, and 2–3 option rows.
This turns a blank form into a 20-second start, using existing fields only.

---

## Part D — Theme: dark-mode contrast (applied) + light mode

### D1. Dark-mode contrast — raised and verified (shipped)

Decision: keep the surface tiers, geometry and single-accent system exactly as
redesigned, and raise only the *legibility* tokens — muted text, hairlines and
the interactive violet fill. Applied in `src/index.css` with the button hover
swap in `Button.tsx`, `AppShell.tsx` and `ErrorBoundary.tsx`.

| Token | Before | After | Why |
| --- | --- | --- | --- |
| `ink-soft` | `#8f899b` | `#a8a2b6` | Worst case was **4.43:1** on `surface-top` (failed AA); now **6.06:1** |
| `ink-faint` | `#5b5568` | `#96909f` | Was **2.10–2.80:1** everywhere (failed); now **4.83:1** worst case |
| `accent` (fill) | `#8b5cf6` | `#7c4ee8` | White button labels were **4.23:1** (failed); now **5.11:1**. `#8b5cf6` stays as the hover state and the glow hue |
| `accent-text` | `#b69df8` | `#c4b0fb` | 8.25 → **9.86:1** on surface |
| `accent-soft` wash | `rgba(139,92,246,0.16)` | `rgba(124,78,232,0.18)` | Match the new fill hue, slightly stronger halo |
| `hairline` | `#292532` | `#3a3446` | Structure reads at **1.58:1** vs surface (was 1.28) — visible without wireframing |
| `hairline-strong` | `#3b3548` | `#4a4359` | Hover/active edges stay a clear step above the base hairline |

Deliberately **not** changed: the six surface tiers. Their luminance steps are
what make the Stitch depth model read, and the raw accent against
`surface-top` sits at 2.93:1 — acceptable because that pairing is only used for
decorative dots, while text on those fills uses `accent-text` (7.79:1) or
`ink-soft` (6.49:1).

Verified ratios (worst case across all six surfaces): ink 13.58, ink-soft 6.06,
ink-faint 4.83, accent-text 7.79, danger 5.71, white-on-accent 5.11 — **all
AA-passing**, and the accent fill stays ≥3.25:1 against every surface.

### D2. Light ("white") mode — spec

**Goal.** Daylight legibility, print/PDF export and projector use, without
turning the product into a second design language: same geometry, same single
accent, same editorial typography, inverted cast.

**Why it is not just "invert the colours".** A dark UI leans on luminance for
depth (light text on dark fills). A light UI needs the opposite: white cards on
a faintly tinted canvas, with depth from hairlines rather than glow, and a
*deeper* violet because a light accent hue fails on white.

**Mechanism (recommended).** Keep `@theme` tokens as the single source of
truth and override the custom properties per theme:

```css
:root { color-scheme: dark light; }

/* Dark tokens (current) */
:root { --color-canvas: #09080d; /* … */ }

/* Light tokens */
:root[data-theme='light'] { --color-canvas: #f7f6fa; /* … */ }

/* System preference when the user has not chosen */
@media (prefers-color-scheme: light) {
  :root:not([data-theme]) { --color-canvas: #f7f6fa; /* … */ }
}
```

- Preference is three-state — `system | dark | light` — persisted under
  `decision-desk.theme.v1` (a new key, additive; no schema migration needed).
- A tiny inline script in `index.html` sets `data-theme` before first paint so
there is no flash of the wrong theme.
- `<meta name="theme-color">` must follow the active theme.

**Verified light token set** (ratios computed, not eyeballed):

| Token | Light value | Notes |
| --- | --- | --- |
| canvas | `#f7f6fa` | faint cool tint so white cards read as raised |
| surface | `#ffffff` | tier-1 cards |
| surface-low | `#fbfaff` | floating panels |
| surface-mid | `#f2f1f7` | secondary buttons / raised cells |
| surface-high | `#eceaf2` | hover layer |
| surface-top | `#e4e1ec` | pressed / selected fill |
| ink | `#1a1626` | 13.72:1 worst case |
| ink-soft | `#5f5872` | 5.21:1 worst case |
| ink-faint | `#635c76` | 4.90:1 worst case |
| hairline | `#d3ccdd` | 1.56:1 vs white — parity with dark structure |
| hairline-strong | `#b9b1c6` | hover/active edges |
| accent | `#6d28d9` | deeper violet: white text 7.10:1, ≥5.51:1 against every surface |
| accent-text | `#5b21b6` | 8.35:1 as text on canvas |
| accent-soft | `rgba(109,40,217,0.10)` | quieter halo on light |
| danger | `#b4232f` | 6.73:1 on canvas, 5.05:1 on the darkest tier |

**Audit list — what does not follow automatically.**

1. Violet halo/glow shadows are literal `rgba(139,92,246,…)` values inside
   utility classes; they need theme variables (`--glow-accent`) or light mode
   will glow dark-violet on white.
2. The ambient canvas glow (`bg-accent-soft` blur) should be reduced or
   removed on light — the same wash looks like a stain on white.
3. `::selection`, the `accent-color` of form controls, and the favicon/
   `theme-color` meta all need per-theme values.
4. Score/total fills encode selection; verify the selected cell (white on
   accent) and the unselected cell (ink on `surface-top`) both pass in light —
   they do on paper, but confirm in the browser.
5. Charts (Part E) must switch their grid/axis colours, not just backgrounds.

**Acceptance criteria.** Every screen passes AA in both themes; no hex value
outside `src/index.css` (enforceable with a grep check in CI); no flash on
load; the visual-regression baseline gains a light variant for each route;
`@media print` uses the light cast regardless of the active theme.

---

## Part E — Patterns redesign: modern UI + charts

### E1. What the page is today

Four metric cards, two review cards, three horizontal bar lists (category,
stake, criteria) and a list of quoted insights. Honest limitations: bars only
encode *counts*, there is no time axis, no distribution, and the page reads as
a stack of lists rather than a narrative about how you decide.

### E2. Hard constraints

- **No new metrics.** Everything charted must come from `buildPatternsReport`
  (or a trivially derived grouping of existing timestamps). "Only change
  presentation" still applies.
- **The engine stays the only source of numbers.** Charts read its output;
  a chart component must never recompute scoring, averages or shares.
- **Charts must survive a 390 px screen** and must never require horizontal
  scrolling.
- **Every chart needs a non-visual equivalent** (see E7).

### E3. Library decision

The suggested stack in `docs/README.md` mentions Recharts, but **nothing is
installed** (the project has zero chart dependencies today). Two options:

| Option | Pros | Cons |
| --- | --- | --- |
| **Hand-rolled SVG primitives** (recommended) | ~0 kB added; exact control of the token palette; trivial reducible-motion and `role="img"` handling; matches the "no decorative UI" rule | More code for axes/tooltips (but the six charts below are simple: columns, bars, dots, rings) |
| Recharts / visx / Chart.js | Faster for grouped and stacked series | 100 kB+ payload, its own theming layer to fight, weak a11y defaults, harder to keep the calm aesthetic |

Recommendation: hand-roll a small, shared chart kit — `BarSeries`,
`ColumnSeries`, `DotPlot`, `RingMetric`, `Sparkline` — and only reconsider a
library if interactive cross-filtering becomes a product goal.

### E4. Chart inventory (all from existing data)

1. **Decision volume by month** — `ColumnSeries` from `updatedAt` (the same
   grouping History already does). Shows cadence, streaks and gaps.
2. **Outcome mix** — one `RingMetric` or stacked bar: drafts / decided /
   reviewed (`report.drafts`, `committed`, `reviewedCount`). Replaces two stat
   cards with a single glance.
3. **Category & stake distribution** — keep the bar rows, add count-vs-share
   labels and a proportion bar.
4. **Criteria weight profile** — average weight per frequently-used criterion
   (existing criteria + weights), sorted descending: "what you actually
   optimise for", which today is invisible.
5. **Satisfaction distribution** — 1–5 histogram from `review.satisfaction`
   plus the redo-rate ring (`wouldChooseAgainRate`).
6. **Winner-score spread** — `DotPlot` of each decision's winner total around
   the `averageWinnerScore` mean, with close calls visually distinct (the
   engine already exposes the 0.5 threshold).

### E5. Layout

- **Desktop**: hero row of three ring metrics, then a 2-up chart grid, then a
  full-width "what you value most" panel (criteria weights), then insights as
  editorial pull-quotes with a violet rule.
- **Mobile**: single column; charts become compact rows where the *number* is
  the primary element and the chart is the supporting visual. Never scale down
  the desktop grid.
- Keep the section order stable between breakpoints so muscle memory works.

### E6. Interaction

- Hover/focus tooltips with exact values (and the same text exposed to screen
  readers via the fallback).
- Legend items act as focus filters (tap "Purchase" to highlight its series) —
  view state only, nothing persisted.
- A **table view** toggle on each panel swaps the chart for its numbers.
- Every chart carries its sample size ("n of m") so no figure stands alone.

### E7. Accessibility

- Each chart: `role="img"` with a one-sentence `aria-label` summary, plus a
  visually-hidden data table (or the table-view toggle) as the equivalent.
- Never encode meaning by colour alone — pair every series with a label or
  direct value; the accent fill must stay ≥3:1 against its panel background.
- Reduced motion: bars/rings animate only under
  `prefers-reduced-motion: no-preference`.

### E8. Motion (aligned with Part B)

Bars grow from zero over ~300 ms with a 30 ms stagger; rings draw once on
mount; month columns rise when the section scrolls into view
(`IntersectionObserver`). No re-animation on unrelated state changes, and
nothing animates on hover except tooltips.

### E9. Empty & partial states

One decision is not a pattern. Below each chart's threshold (e.g. category mix
needs 2+), show what is missing in the current tone — "two more decisions and
your category mix appears" — instead of an empty axis. Keep the existing
zero-decision empty state.

**Effort:** ~2–3 sessions. **Risk:** low — the screen is read-only and the
numbers already exist.

---

## Part F — Potential new features

Ordered by value-to-effort, each with an honest note about scope. Items marked
**Domain** touch the engine/schema and need tests; the rest do not.

### Tier 1 — small, high value

1. **Export ledger (UI)** — download a decision (or all decisions) as
   Markdown/JSON. The Stitch result screen has an Export action and
   `docs/PROJECT-CHECKLIST.md` lists "Export considered". Zero schema change:
   serialize what's already stored.
2. **Import / restore backup (UI)** — the counterpart to export; validate with
   the same `isDecision` guard used on load. Makes the local-first promise
   trustworthy ("your data is yours").
3. **Data controls in a Settings surface (UI)** — "delete all decisions" and
   "reset AI settings" behind a typed confirmation, replacing the current
   all-or-nothing browser-storage reliance.
4. **Duplicate / "re-run with new criteria" (UI)** — clone a decision into a
   fresh draft (new id, cleared scores/outcome) so a recurring choice
   (laptop, hire, holiday) keeps its criteria. Explicitly on the reference's
   result screen.
5. **Reuse a criteria set (UI)** — pick a previous decision to copy criteria
   and weights from. Saves the most tedious part of the flow.

### Tier 2 — medium

6. **Sensitivity / "what if" lab (UI + reading)** — drag a weight and watch
   the ranking, gap, and close-call badge recompute live. The engine already
   returns `gap`, `isCloseCall`, `contributions` and `ranked` as pure
   functions, so this is a simulation view and needs **no** stored state.
   `docs/ARCHITECTURE.md` already asks for "sensitivity information where
   possible" — this finally delivers it, and it's the single most
   decision-affecting feature available.
7. **Review reminders (UI + reading, optional Domain)** — the reference has
   "Remind in 60d". A soft version needs no new data: derive "due for review"
   from `outcome.committedAt` + a configurable interval and surface a badge on
   Home and in the journal. A true notification version needs the
   Notifications API and an added preference field.
8. **Calibration score (UI + reading)** — already stored data (satisfaction,
   would-choose-again, close-call, overridden) rendered as a "how good are my
   predictions" readout on Patterns. Presentation of existing records, not a
   new analytic.
9. **Third-option nudge (UI)** — the mock provider already suggests "is there
   a third option you ruled out too quickly?"; surface it as an inline hint on
   the capture form when only two options exist (and when both are similar
   strings, hint at "do nothing" as an option).
10. **Decision templates library (UI)** — ship 6–8 curated templates (job
    offer, big purchase, move city, hire, vendor choice, take the meeting)
    mapping to existing category/stake/criteria fields.

### Tier 3 — bigger bets

11. **Rich journal entries (Domain)** — append dated notes to a committed
    decision over time ("week 3 update") instead of a single review blob.
    Needs a new array on the outcome/review type plus a storage migration
    (current key is versioned `.v1`, so a `.v2` bump with a reader that
    upgrades old records is the clean path).
12. **Multiple scorecards / re-scoring history (Domain)** — keep previous
    scoring snapshots to show how the verdict shifted as new information
    arrived.
13. **Encrypted export / passphrase-protected backup (Domain)** — WebCrypto
    AES-GCM around the JSON payload, keeping the zero-telemetry promise.
14. **PWA / offline install (UI)** — manifest + service worker so the
    local-first app is installable and works with no connection. Fits the
    Phase 9 release checklist.
15. **Accessible light theme (UI)** — specced with verified tokens in
    **Part D2**. Token-level work, no logic risk; the remaining effort is the
    audit list (glows, ambient wash, form-control colours) plus a second
    visual-regression baseline.
16. **Optional sync (explicitly out of MVP scope)** — noted only to keep the
    non-goal visible; revisit after export/import proves the data model.

---

## Part G — Accessibility & performance hardening

- **Contrast — done, see Part D1.** The three failures identified in the audit
  (muted text on `surface-top`, white-on-accent button labels, and the
  `ink-faint` tier) are fixed and re-verified: every text pairing now clears
  4.5:1 on every surface tier, with the audit table recorded in Part D1. Keep
  ratios current when editing tokens — the rule is that no new value ships
  without a computed ratio.
- **Live-region discipline** — one polite region per screen (already used for
  the scored counter); add explicit announcements for "recommendation updated"
  and "review saved" so screen-reader users get the same feedback as sighted
  ones.
- **Focus containment** — when the AI settings panel becomes a mobile sheet,
  trap focus and restore it on close; `Esc` closes.
- **Automated a11y checks** — add axe-core to the Vitest setup and run it over
  the rendered Home/Workspace/Result screens; catches regressions that
  typecheck cannot.
- **Payload discipline** — the bundle is ~306 kB JS / ~59 kB CSS raw. Route
  level `React.lazy` for History/Patterns plus a manual chunk for the engine
  would keep the first paint (Home → capture) fast as features are added.
- **No-layout-shift guarantee** — once webfonts load (A1), reserve metrics or
  use `size-adjust` so the hero does not reflow.

---

## Part H — Quality infrastructure for a UI-heavy project

- **Visual regression tests**: Playwright screenshots of each route at 390 px
  and 1440 px against the committed `stitch/screenshots/` as the reference
  baseline. This is the only way to hold the visual system together across
  future changes.
- **A token garden page** (`#/dev/tokens`, dev-only) rendering every surface
  tier, accent state, typography style and control variant — the fastest way
  to spot drift.
- **Record the implemented tokens in `docs/DESIGN-SYSTEM.md`** — that document
  currently states direction ("restrained neutral base, electric indigo/violet
  accent") but not the concrete values that now live in `src/index.css`. Point
  it at the tokens and the `stitch/` archive so there is one source of truth.
- **Interaction tests** for the two-step commit and the undo-delete window,
  which are the flows most likely to break silently during UI work.

---

## Part I — Execution plan

Parts A–H above are the reference material — the detail behind each item. This
part is only the order things ship in. Three phases, each with a single theme
and an unambiguous "done" test. Nothing is dropped: every item lands in exactly
one phase.

### Phase 1 — Make it look finished

_Theme: presentation only. No new features._

**Work**

- **Typography (A1)** — actually load Geist / Newsreader / JetBrains Mono. Today
the font tokens name them but nothing is loaded, so this is the single biggest
fidelity gain available.
- **Motion (B1–B5, B7)** — dial reveal, selection crossfades, step advance, toast
exit, count-ups; all no-ops under `prefers-reduced-motion`.
- **Consistency (A4, A5, A7, A8)** — the nav active-state stops claiming "New
decision" on detail/result routes; sweep every screen against
`stitch/screenshots/`; print-ready verdict; loading/empty-state parity.
- **Safety net (G, H)** — visual-regression baseline at 390 px and 1440 px,
axe checks in Vitest, dev token garden, live-region announcements.

**Done when:** every route matches the reference at both widths; no animation
runs under reduced motion; the baseline is committed; `npm run check` green.

**Effort** 1–2 sessions · **Risk** low · **Blast radius** UI only.
_(D1 contrast and the "Calm Intelligence" redesign already shipped here.)_

### Phase 2 — Make it fast on phones and keyboards

_Theme: same features, better ergonomics — the two real usability gaps._

**Work**

- **Mobile compare (A2)** — the honest biggest gap: a dedicated stacked
composition (one card per option, criteria inside) instead of a horizontally
scrolling desktop table.
- **Mobile ergonomics (A3, A6)** — 44 px targets on coarse pointers, sticky
weight context, sticky "See recommendation" bar, journal density.
- **Keyboard-first (C1, C3)** — `⌘↵` advance, `Esc` back, `C` add criterion,
`1–5` score, arrow-key roving grid, `?` shortcuts sheet.
- **Speed to start (C2, C8)** — `⌘K` command palette over existing routes and
records, plus Home preset prompts.
- **Feedback (C4, C5, C6, C7)** — autosave chip, commit with undo, swipe-to-
delete, filter chips with counts.

**Done when:** a decision can be captured, scored and committed
keyboard-only; 3 options × 5 criteria score on a 390 px screen with no
horizontal scroll; every destructive action is reversible.

**Effort** 2–3 sessions · **Risk** low–medium · **Blast radius** UI
(+ reading existing records for the palette).

### Phase 3 — Add new value, in three shippable slices

_Theme: better answers, daylight use, data ownership. Ship 3a, 3b and 3c
independently — each is useful on its own._

**3a · Patterns redesign (Part E)** — hand-rolled SVG chart kit (no new dep),
six charts built only from numbers `buildPatternsReport` already computes, a
table-view fallback, partial states.

**3b · Light mode (D2, F15)** — the verified light tokens, the pre-paint theme
script, a three-state (`system | dark | light`) toggle, then the glows / wash /
selection / chart-grid audit so both modes stay one design language.

**3c · Data ownership, capture conveniences + sensitivity lab (Part F)** —
export (F1) → import (F2) → data controls (F3) → duplicate / re-run (F4) →
reuse a criteria set (F5) → the F6 sensitivity lab, which the engine already
supports as a pure simulation.

**Optional tail** (each small, independent of the others): review reminders
(F7), calibration score (F8), third-option nudge (F9), decision templates
(F10), installable PWA shell (F14).

**Done when:** Patterns reads as an analytical screen rather than a stack of
lists; the app is fully usable in light mode with AA contrast recorded per
screen; decisions can leave and re-enter the app as a file.

**Effort** 3–5 sessions · **Risk** medium (3c touches storage) · **Blast
radius** UI + reading, with 3c reaching domain/storage (versioned key + reader
upgrade + migration test).

**Deferred on purpose** — all schema-heavy, revisit once export + import prove
the model: rich journal entries, re-scoring snapshots, encrypted export,
optional sync.

**The ritual for every phase**

- Start with the safety net, so later work cannot silently regress.
- Never fork engine maths in a component.
- Verify with `npm run check` + build + a browser pass at 390 px and 1440 px.
- Recompute contrast ratios whenever a token moves; record them here.
- One commit per item, docs alongside code.

**Guardrails for any of the above**

1. Engines stay pure and tested: `scoring`, `recommendation`, `patterns`,
   `routes`, `storage`, `ai` — UI work must not fork their maths.
2. Never introduce a second scoring formula in a component; if a view needs a
   derived number, add it to a pure module and test it.
3. Preserve the versioned storage key: any schema change ships a reader that
   upgrades older records, and a migration test.
4. Every animation must degrade to "no animation" under
   `prefers-reduced-motion`.
5. Keep the single-accent rule: violet means momentum (action, selection,
   recommendation). A second accent colour is a design regression.
6. Charts are read-only views of the pure engines: no chart may recompute a
   score, average or share, and every chart ships a non-visual equivalent.
7. Theme work ships both directions: any token change must be verified in dark
   **and** light, with computed ratios recorded in this document.
8. No colour values outside `src/index.css` — glows and washes become theme
   variables so light mode can restyle them.
