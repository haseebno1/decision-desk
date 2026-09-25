# Screens & Surfaces

_Companion to `docs/FEATURES.md` (what the product does) and
`docs/UI-IMPROVEMENTS.md` (what's next). This document is the map of the
**presentation layer**: every route, the component that renders it, its
desktop and mobile composition, the states it can be in, and the pure engines
it reads._

Written against the code after the "Calm Intelligence" Stitch redesign
(commit `2c82ec4`) and the contrast pass (`a8a4e79`). Where this doc and the
code disagree, the code wins — the route table in `src/lib/routes.ts` and the
switch in `src/App.tsx` are the authority.

---

## File map

| Concern | File |
| --- | --- |
| Route ↔ hash parsing | `src/lib/routes.ts` |
| Route → screen switch, titles, focus | `src/App.tsx` |
| Frame, nav, top bars | `src/components/layout/AppShell.tsx` |
| Design tokens (dark + light) | `src/index.css` |
| Theme preference rules | `src/lib/theme.ts` (+ pre-paint script in `index.html`) |
| Screens | `src/features/{home,decisions,history,patterns}/` |
| Primitives | `src/components/ui/{Button,inputs,Field}.tsx` |

---

## 1. The shell

`AppShell` wraps every route. It owns navigation and the page frame; screens
only render their own content into `<main>`.

### Desktop (≥ 768 px)

- **Fixed sidebar** (`.sidebar-rail`), 240 px (`w-60`), full height, `border-r`
  hairline, pinned left. Contains the brand block (journal glyph in an
  accent-tinted tile + "Decision Desk" + `CALM INTELLIGENCE` in mono caps), the
  primary nav list, an optional secondary nav group separated by a hairline,
  and a pinned-bottom "Local data" chip with a lock glyph and a pulsing accent
  dot. **Collapsible** — see "Sidebar collapse" below.
- **Sticky top bar**, 64 px (`h-16`), translucent canvas with `backdrop-blur`.
  Left: the `DECIDE WITH CLARITY` mono eyebrow. Right: the **sidebar toggle**,
  the **theme toggle** (both 36 px) and the violet **New decision** button,
  which carries a glow that intensifies on hover.
- **Content column** offset by the sidebar (`md:pl-60`) and centred:
  `max-w-3xl` on mobile widths, `md:max-w-4xl` from 768 px.
- **Footer** with the tagline `Decision Desk — think decisions through, step
  by step.`, followed by the developer credit: `Built by Abdul Haseeb` — a
  link to `https://github.com/haseebno1` (`text-ink-soft`, hairline underline
  that turns accent on hover, opens in a new tab). Rendered at every width; the
  mobile clearance is noted below.

### Mobile (< 768 px)

- **Sticky top bar**, 56 px (`h-14`): a compact brand lockup (`DFK` +
  `CALM INTELLIGENCE`), a "Local vault" pill with an accent dot, and the
  **theme toggle** (40 px — a touch target). Opaque rather than translucent on
  purpose: a sticky bar plus `backdrop-filter` can stop repainting mid-scroll
  in embedded WebViews, which leaves the bar invisible while scrolling.
- **Bottom navigation**, 56 px (`h-16`), translucent with `backdrop-blur` and
  `env(safe-area-inset-bottom)` padding. Four targets, evenly spaced:
  Home · **Decide** · History · Patterns. The middle target is *not* a flat
  tab — it is an elevated circular accent button lifted out of the bar
  (`-mt-6`) with a glow and a press-scale micro-interaction, labelled
  `DECIDE`.
- No sidebar. Content keeps `pb-28` so the last element never hides under the
  bar, and the footer (tagline + developer credit) keeps `pb-24` so the credit
  clears the bottom nav — measured at 746 px against a nav top of 779 px at the
  end of the page, so the link is never covered.

### Overlays present on every screen

| Overlay | Behaviour |
| --- | --- |
| Skip link | "Skip to content" → `#main-content`; hidden until keyboard-focused |
| Ambient glow | One fixed blurred ellipse behind the canvas, `aria-hidden`, decorative only |
| Toast region | Fixed bottom-centre, `aria-live="polite"`, blank until a toast fires |
| Error boundary | Wraps the entire app, so any crash replaces the shell with the recovery screen |
| Theme | `data-theme` on `<html>`; applied pre-paint by a script in `index.html`, flipped by the toggle. See "Theme" below |
| Sidebar | `data-sidebar` on `<html>` (`expanded` / `collapsed`); desktop-only. See "Sidebar collapse" below |

### Theme

Dark is the default. A light token set lives in a single `html[data-theme='light']`
block in `src/index.css`, and every utility resolves through `var(--color-*)`, so
nothing in a component branches on the theme.

- **Resolution:** a stored choice wins, otherwise the OS preference, otherwise
dark. `src/lib/theme.ts` owns the rules (`readStoredTheme`, `resolveInitialTheme`,
`currentTheme`, `applyTheme`, `setTheme`, `toggleTheme`).
- **Persistence:** `decision-desk.theme.v1` — additive, so no existing stored
shape is touched.
- **No flash:** the inline script in `index.html` sets the attribute before the
bundle runs; it duplicates the resolution rules deliberately and must stay in
sync with `src/lib/theme.ts`.
- **Toggle:** in the desktop top bar (36 px) and the mobile top bar (40 px), a
sun/moon button with `aria-pressed` and an action-labelled `aria-label`.
- Light mode also sets `color-scheme: light`, `accent-color`, `::selection` and
the `theme-color` meta.

### Sidebar collapse (desktop only)

A toggle in the desktop top bar hides the navigation rail so the content area
can use the full width. The mobile shell has no sidebar, so the button is
hidden below 768 px.

- **Mechanism:** an attribute on `<html>` (`data-sidebar`), not React state.
Two rules in `src/index.css` scope it to ≥ 48rem:
`html[data-sidebar='collapsed'] .sidebar-rail { display: none }` and
`html[data-sidebar='collapsed'] .sidebar-offset { padding-left: 0 }`. The
attribute selectors outrank Tailwind's `md:flex` / `md:pl-60`, so no
`!important` is involved.
- **Why an attribute:** the pre-paint script sets it, so a collapsed rail never
flashes open on load.
- **Persistence:** `decision-desk.sidebar.v1` (`expanded` | `collapsed`),
additive. `src/lib/sidebar.ts` owns the rules; expanded is the default.
- **Toggle:** `aria-pressed` reflects the collapsed state and the label states
the action (*Hide sidebar* / *Show sidebar*); the icon adds an expand chevron
while collapsed. Verified reflow: the rail goes to `display: none` and the
content column loses exactly its 240 px offset.

### Navigation mapping

`activeRouteId` is derived in `App.tsx`:

```
route.name === 'edit-decision' ? 'new-decision' : route.name
```

So the workspace and the result both highlight **New decision** in the nav.
That is deliberate (the decision is "in progress"), but it is also why the
active state can feel wrong on a committed decision — tracked as item A4 in
`docs/UI-IMPROVEMENTS.md`.

`navigate()` only accepts `home`, `new-decision`, `history`, `patterns`. The
shell supports a secondary nav group and a `settings` icon, but no settings
nav item is currently passed in — settings live inside the workspace AI panel
(§3.3b).

### Focus and titles

- `document.title` is set per route from `TITLES`; `DecisionForm` overrides it
  while mounted and restores `Decision Desk` on unmount.
- On navigation (but **not** on first paint) focus moves to `<main>`
  (`tabIndex={-1}`), so keyboard and screen-reader users land in the new
  screen.

---

## 2. Route map

| Route | Hash | Renders | Nav highlight | Title |
| --- | --- | --- | --- | --- |
| `home` | `#/` | `HomeScreen` | Home | Decision Desk |
| `new-decision` | `#/new` | `DecisionForm` | New decision | New decision — Decision Desk |
| `edit-decision` | `#/decisions/:id` | `DecisionWorkspace` (draft) **or** `ResultScreen` (committed) | New decision | Decision — Decision Desk |
| `result` | `#/decisions/:id/result` | `ResultScreen` (always) | New decision | Recommendation — Decision Desk |
| `history` | `#/history` | `HistoryScreen` | History | History — Decision Desk |
| `patterns` | `#/patterns` | `PatternsScreen` | Patterns | Patterns — Decision Desk |

Two details worth knowing:

- **`#/decisions/:id` is status-dependent.** A draft opens the workspace; a
  committed decision opens the result. `#/decisions/:id/result` forces the
  result either way.
- **Unknown ids** (deleted or mistyped) render the inline `NotFound` state, not
  a redirect — the hash stays where it is so back/forward behaves.
- An empty or unrecognised hash falls back to `home`.

---

## 3. Screens

### 3.1 Home — the command surface (`#/`)

`src/features/home/HomeScreen.tsx`

**Composition, top to bottom**

1. **Hero**, centred, `py-10` / `md:py-14`:
   - Pulse badge — accent dot (with `animate-pulse`) + `DECISION FATIGUE
     RELIEF` in mono caps.
   - H1 — `Good morning.` in full ink, then `What are you stuck on?` in
     secondary ink. The greeting is a **static string**, not clock-derived.
   - One clarifying sentence, then the primary **Start a new decision** button.
2. **Recent decisions** — a `SectionLabel` with a count chip (`2 drafts ·
   1 decided`, or `0 recorded`).
3. Either the empty state or a list of `DecisionCard`s.

**`DecisionCard`** is one pressable row: a fit-score tile on the left (the
leader's weighted total, or `—` when unscored, accent-tinted only when a score
exists), the title (truncating), and a mono meta line —
`Draft | Decided | Reviewed · Category · stake · N options · date`. On the
right, `Open` (draft) or `View` (committed) plus an `✕` delete button with an
`aria-label` naming the decision. Deleting raises a toast with an **Undo**
action that restores the record.

**States**

| State | Rendering |
| --- | --- |
| No decisions | `EmptyState` — "No decisions yet" + guidance copy |
| Drafts only | Cards with `—` tiles and `Open` |
| Committed | `View`; the row reads `Decided`, or `Reviewed` once a review exists |

**Reads** `useDecisions`, `summarizeScoring`, `formatTotal`. Deleting and
restoring go through the store, so undo is real, not cosmetic.

---

### 3.2 New decision — step 01, Define (`#/new`)

`src/features/decisions/DecisionForm.tsx`

A single-column form with an editorial step header: a pulsing accent dot +
`STEP 01 · DEFINE`, `01 / 03` on the right, and a three-segment progress track
(one third filled in violet, `transition-all duration-500`). Then the H1
`What are you deciding?` and a one-line instruction.

**Sections**

| Section | Contents |
| --- | --- |
| The question | A card whose border lifts to accent on `focus-within`. Inside, an accent bullet and a borderless, oversized input (`text-lg md:text-xl`) that asks for the decision itself. |
| Context | Optional description textarea, then a 2-up grid: **Category** select (required, placeholder disabled) and **Stake** select (defaults to medium). |
| The paths on the table | `SectionLabel` + a `2–6 options` hint, then `OptionEditor`. |
| Actions | `Save decision` / `Save changes` (primary) and `Cancel` (ghost) — stacked full width on mobile, inline from `sm`. |

**`OptionEditor`** renders each option as a lettered row (A, B, C… in a mono
tile) with a text input and a remove button that is disabled at the two-option
floor. Below, a dashed full-width `+ Add option` button.

**Validation** (`noValidate`; errors render through `Field` with `role="alert"`):

- Title required.
- Category required.
- At least 2 non-blank options.
- Blank labels are auto-named `Option 1…N` before saving, so the store never
  holds an empty label; the saved array is sliced to a maximum of 6.

**Exit paths**

- New decision → `createDecision`, then straight to the workspace.
- Cancel → Home.

---

### 3.3 Decision workspace — steps 02–03 (`#/decisions/:id`, draft)

`src/features/decisions/DecisionWorkspace.tsx`

One long scroll holding four stacked sections separated by hairline rules,
each introduced with a `STEP 0N · …` eyebrow and an `NN / 03` counter.

#### 3.3a Step 01, repeated — the definition

`DecisionForm` renders in edit mode at the top, so the definition is always
editable alongside the scoring. **Saving changes here navigates to the result
view** — the same `onSaved` handler the workspace's own footer button uses.

#### 3.3b Step 02 · Weigh priorities

`STEP 02 · WEIGH PRIORITIES` + `What matters most?` + a note that weights run
1–5 and drive the recommendation, then `CriteriaEditor`.

Each criterion is a card:

- An ordinal tile (`01`, `02`…), an inline borderless name input, a **weight
  chip** (`4 / 5` + `Important` from `sm`), and a remove button.
- A control row: `−` stepper, five discrete weight buttons (`1`–`5`) where the
  selected one is filled violet with `aria-pressed`, `+` stepper, and the
  desktop-only axis caption `LESS IMPORTANT … CRITICAL` (the word lights up in
  accent at weight 5).
- Weight names: 1 Minimal, 2 Low, 3 Moderate, 4 Important, 5 Critical.
- A dashed `+ Add custom criterion` button, which is also the entire
  zero-criteria state (plus a short prompt).

Changing criteria prunes orphaned scores via `pruneScores` so the matrix can
never hold a cell for a deleted option or criterion.

#### 3.3c Optional assist — AI panel + settings

`src/features/decisions/AiAssistPanel.tsx`

An `OPTIONAL ASSIST` / `AI assist` section stating which provider is live
("Everything works without it"), with a `Settings` / `Hide settings` toggle.

- **Settings drawer** — provider select (`Mock (offline, no setup)` /
  `OpenAI-compatible API`); choosing the latter reveals base URL, API key
  (password field, "Stored in this browser only.") and model. Persists on
  every change. An amber warning appears while the external provider is
  incomplete, explaining the silent fallback to mock.
- **Capabilities** — three buttons: *Suggest criteria*, *Clarifying
  questions*, *Summarize*. While running: `Thinking…` and a `role="status"`
  note ("The mock provider thinks for ~0.5s by design."). Errors surface in a
  `role="alert"` panel and never block the rest of the app.
- **Result** — a heading and a bulleted list, plus a footer row with a **Copy**
  button (copies the heading and bullets as Markdown, with a toast). When the
  capability is *Suggest criteria* and the provider returned structured
  suggestions, that row also carries **Add N criteria to this decision**: it
  appends them (fresh ids, weights clamped to 1–5, labels matched
  case-insensitively against what the decision already has), confirms with a
  toast and an inline `Added <names> — set their weights in Weigh priorities
  below.` note, then swaps the button for **Applied ✓**. The merge rules live in
  `src/lib/ai/applyCriteria.ts` with their own tests; a provider returning only
  prose simply doesn't render the apply button.
- Switching to a different decision clears stale AI output using a render-time
  reset (not an effect), which is why the reset looks unusual in source.

#### 3.3d Step 03 · Compare options

`STEP 03 · COMPARE OPTIONS` + `The weighted matrix` + a live
`n / m scored ✓ complete` counter in an `aria-live="polite"` region, then the
matrix in a bordered card.

`ScoreMatrix` is a real `<table>` (screen-reader captioned) with:

- A header row of options, each with a leader dot (accent + glow for the
  current leader, faint otherwise) and a `max-w-[140px]` truncating label.
- One row per criterion: the name as a row header, a `N× weight` chip, then
  one `1`–`5` cell group per option. Cells are `aria-pressed` buttons; clicking
  the selected value again **clears** the score.
- A **synthesis shelf** — a heavier top border, then a `Weighted total` row
  showing each option's total in mono tabular figures, with the leader on an
  accent tint and a `★`.

Empty guard: with no options or no criteria the table is replaced by a plain
sentence telling you what to add. On narrow screens the table scrolls
horizontally (see §7 and item A2).

#### 3.3e Flow navigation deck

A right-aligned footer above a hairline: **`See recommendation →`**, which
commits the draft's data and routes to the result view.

---

### 3.4 Result — the verdict (`#/decisions/:id` when committed, or `#/decisions/:id/result`)

`src/features/decisions/ResultScreen.tsx`

**Guard state.** If `buildRecommendation` returns nothing (needs at least one
scored criterion across two options), the screen shows "Nothing to recommend
yet" and a `Back to the decision` button instead of a broken verdict.

**Header** — `RECOMMENDATION · <decision title>` eyebrow, then the headline.
The headline is the **committed option** when the decision is committed,
otherwise the computed winner.

**Verdict hero** — one bordered card with a soft accent bloom bleeding off its
top-right corner:

- **Fit dial** (176/192 px): a 68-radius ring on a grey track, violet arc,
  `strokeDasharray`/`strokeDashoffset` set from `winnerTotal / 10`, with a
  drop-shadow glow. Centre reads the total in mono, over `/10 · FIT SCORE`.
- **Gap badge** under the dial — `Close call · gap 0.3` (amber text),
  `Clear lead · +2.4` (accent text), or `Only one option scored`.
- **Right column** — `COMPARATIVE RESONANCE` with the first reason plus the
  gap as a sentence, then a **ranked chip grid**: one tile per option, winner
  first-class (raised surface + glow, `Recommended`) and the rest dimmed
  (`Option 2`, `Option 3`…), each with its total. Under it, the commit date,
  and — when the stored scores no longer agree with what was committed — the
  note *"scores changed after commit — the current leader differs"*.

**Why this decision** — a 12-column split: left (`md:col-span-4`) the
`01 / LOGIC & VECTORS` eyebrow, `Why this decision.` and a one-sentence method
note; right (`md:col-span-8`) a card containing:

- One **criterion row** per criterion: ordinal, name, `N/5` weight chip; the
  per-option scores in mono where the leader is accent + `★`; a contribution
  bar (the points this criterion adds to the winner's average, `+3.0`); and,
  when the winner loses this criterion, a trade-off line with a `⚖` marker.
- A `Reasoning` block listing every engine-produced reason string.

**Trade-offs** — only when the engine reports them: `02 / PRICE OF CHOICE`, a
count, `What you are consciously giving up`, and a `TradeoffCard` per
trade-off naming which option scored higher and the weight you're accepting.

**Commit flow (two-step, by design)**

1. A bordered prompt: *"Settled on **X**? Committing saves the verdict and
   unlocks the outcome review."* → `Commit to this choice…` (secondary).
2. A confirmation panel tinted with `accent-soft`: *"Committing locks this
   decision: scores and options become read-only."* → primary
   `Commit to "X"`, or `Cancel` to back out.

Once committed, the whole area is replaced by the outcome review (§3.5).

**Footer** — a ghost `← Back to the decision` button (returns Home).

---

### 3.5 Outcome review — the retrospective (section of Result)

`src/features/decisions/OutcomeReviewSection.tsx`

Header: `30-DAY RETROSPECTIVE`, `So… how did it go?`, and either the review
date or *"A quiet moment to inspect reality against anticipation."*

**Before a review — the form**, in a bordered card with three labelled
dimensions:

1. **Dimension 01 · Affective calibration** — "How satisfied are you with the
   outcome?" A segmented 5-up scale in a recessed tray. Each segment shows the
   padded number (`01`), a word (Regret, Low, Neutral, Satisfied, Thriving)
   and, from `sm`, a mono gloss (Severe misread → Optimal fit). Selected
   segment takes the strongest surface with an accent glow; each is
   `aria-pressed` with a descriptive `aria-label`.
2. **Dimension 02 · Counterfactual** — "Would you choose X again?" as two
   radio-style cards: **Yes** ("Confirms the model") and **No** ("Regret
   signal", in danger ink), each with a dot indicator and `aria-pressed`.
3. **Dimension 03 · What actually happened** — an *Actual option* select
   (defaults to the committed choice; a hint appears when it diverges) and an
   optional *Notes* textarea.

Footer: the `Local vault · zero telemetry` reassurance (desktop only) and
**`Save reflection & calibrate`**.

**After a review — the readout**: an Expected/Actual pair of cards (Actual
turns amber when reality diverged, with an explanatory note), then a
calibration summary card — satisfaction `4/5 · Satisfied`, a
`Would choose again` / `Would not repeat` chip, a 5-segment mini scale, and
the notes when present. **`Redo review`** reopens the form pre-filled with
neutral defaults (satisfaction 3, would choose again, committed option).

---

### 3.6 History — the decisions journal (`#/history`)

`src/features/history/HistoryScreen.tsx`

A timeline, not a table.

- **Header** — an accent dot + `COGNITIVE LOG` eyebrow, `Decisions journal`
  with a `<n> recorded` count, and one line of orientation.
- **Filter bar** — a search input with a leading magnifier icon (matches
  titles, descriptions, option labels **and** criterion labels,
  case-insensitive), a *status* select (All / Drafts / Decided) and a
  *category* select. A `Clear filters` ghost button appears only while a
  filter is active.
- **Timeline** — results group by `updatedAt` month, newest first. Each month
  renders a vertical spine, an accent node marker, a mono month heading, a
  hairline rule, and an entry count.

**`TimelineCard`** is a single `<button>` (whole card is the target) with a
hover lift (`-translate-y-0.5` + stronger border + shadow), showing a category
chip, the date, the status word (`Draft` / `Decided` / `Reviewed`), the
truncating title, a mono detail line — `Chose "X"`, or
`Leading: X · 5.9/10`, or `Not scored yet` — and a **Clarity** block: a label,
the score, and a 36 px SVG progress ring. A faint `View ledger →` sits on a
hairline footer rule.

**States:** no decisions at all → "No decisions yet"; filters that match
nothing → "Nothing matches those filters"; otherwise the grouped timeline.

---

### 3.7 Patterns (`#/patterns`)

`src/features/patterns/PatternsScreen.tsx` + `src/features/patterns/charts.tsx`

A chart-led analytics view. Every figure comes from `buildPatternsReport` (or
`averageOptionsPerDecision`) or is a **direct count of stored records** — the
screen never derives an engine number, and if a new statistic is wanted it
belongs in `src/lib/patterns.ts` with a test.

- **Header** — `SYNTHESIS MODULE` eyebrow, `Patterns`, and
  "What N decisions say about how you decide."
- **KPI row (2-up on mobile, 4-up from `lg`)** — Decisions, **Avg winner
  score** (accent), Avg options compared, Avg time open (in days).
- **Where they stand** — donut of decision *stage*: Reviewed / Decided, not
  reviewed / Still drafts, with the record count in the centre and a legend.
- **How it felt afterwards** — column chart of the satisfaction ratings (1–5)
with the review count in the caption; replaced by an explanatory sentence when
nothing has been reviewed yet.
- **By category** — ranked horizontal bars with counts.
- **By stake** — a single proportional stacked bar plus a legend, and below a
  hairline the Avg satisfaction / Would-redo-same-way pair (only once at least
  one review exists).
- **Most-used criteria** — ranked bars; an empty criteria list gets its own
  sentence instead of an empty chart.
- **Something interesting** — engine insights in a two-column card grid.

**Charts:** hand-rolled SVG/CSS in `charts.tsx` (`Donut`, `RankedBars`,
`StackedBar`, `ColumnChart`) — no charting dependency, and no second accent:
tones are accent at three opacities plus a neutral. Each chart is one
`role="img"` whose `aria-label` **enumerates its data** ("Reviewed: 5, Decided,
not reviewed: 1, Still drafts: 3"), so every figure has a non-visual equivalent
rather than depending on the shapes.

**Motion:** bars carry width/height *transitions*, deliberately **not** a
grow-from-zero keyframe — an entrance animation whose first frame is
`scale(0)` renders an empty chart whenever the animation has not advanced
(throttled or non-composited WebViews). The resting state is always the real
value.

**Empty state:** with zero decisions the entire screen becomes the "No
patterns yet" empty state explaining what will appear.

---

### 3.8 Not found (no route of its own)

Rendered inline by `App.tsx` when `#/decisions/:id` points at an id that isn't
in the store: a `NOT FOUND` eyebrow, "That decision doesn't exist (it may have
been deleted).", and `Back home`.

---

### 3.9 Crash screen (ErrorBoundary)

`src/components/ErrorBoundary.tsx`

Replaces the entire app (so it appears without the shell — sidebar, nav and
footer are all gone). "Something went wrong", the reassurance that decisions
are saved locally and reloading is safe, the error message in a scrollable
`<pre>`, and a **Reload the app** button that returns to `#/` and reloads.

---

### 3.10 Toasts

`src/features/decisions/ToastContext.tsx`

Fixed bottom-centre, `aria-live="polite"`, max **3** stacked (older ones are
dropped when a fourth arrives), each auto-dismissing after **6 s**. A toast may
carry one action — used by Home's delete as **Undo**, which restores the
decision and then dismisses. Also fired by the storage-failure listener in
`App.tsx`, so a full or blocked `localStorage` surfaces as a message rather
than silent data loss.

---

## 4. The brief's ten core screens → what shipped

`docs/README.md` lists ten conceptual screens. Here is how they map:

| Brief | Shipped |
| --- | --- |
| 1. Home / Dashboard | §3.1 Home |
| 2. New Decision | §3.2 `#/new` |
| 3. Clarifying Questions | Not a screen. Delivered as the AI panel's *Clarifying questions* capability (§3.3c) |
| 4. Criteria & Weights | §3.3b |
| 5. Options | §3.2 (option editor) + §3.3d (scored) |
| 6. Decision Result | §3.4 |
| 7. Decision History | §3.6 |
| 8. Decision Detail | §3.3 workspace (draft) / §3.4 + §3.5 (committed) |
| 9. Patterns / Insights | §3.7 |
| 10. Settings | Not a screen. The only settings that exist are AI provider settings, in a drawer inside §3.3c |

The product loop (Dump → Clarify → Weigh → Compare → Decide → Explain → Track
→ Learn) is intact; several brief screens collapsed into fewer, deeper
surfaces.

---

## 5. State matrix

| Screen | Empty | Partial | Error |
| --- | --- | --- | --- |
| Home | `EmptyState` "No decisions yet" | Cards with `—` tiles, no scores | Storage failure → toast |
| Define | Blank title `Option 1` / `Option 2` rows | Draft restore of every field | Field-level `role="alert"` errors |
| Weigh | Prompt + dashed add button | Unnamed criterion placeholder | — |
| Compare | "Add at least one option and one criterion…" | `n / m scored`, no `✓ complete` | — |
| Result | "Nothing to recommend yet" + back | One-sided scoring → `Only one option scored`; close call vs clear lead | — |
| Review | Form with neutral defaults | Divergence note when actual ≠ committed | — |
| History | "No decisions yet" | "Nothing matches those filters" | — |
| Patterns | "No patterns yet" | Metric cards showing `—`; criteria sentence | — |
| Any | — | — | Crash screen (boundary) or toast (storage) |

Loading states are limited to the AI panel's `Thinking…` and its `role="status"`
note; there is no skeleton system yet (item A8).

---

## 6. Shared primitives

| Primitive | File | Notes |
| --- | --- | --- |
| `Button` | `ui/Button.tsx` | `primary` (violet fill + halo), `secondary` (hairline + raised surface), `ghost`. Shared focus ring, `active:scale-[0.98]`, disabled at 50 % |
| `TextLink` | `ui/Button.tsx` | Anchor twin of `Button`, keeping focus/active parity |
| `Kbd` | `ui/Button.tsx` | Keycap styling. **Exported but not yet used by any screen** — no keyboard shortcuts have shipped (Part C) |
| `SectionLabel` | `ui/Button.tsx` | Mono caps eyebrow, `muted` or `accent` tone — the workhorse of the new hierarchy |
| `TextInput` / `TextArea` / `Select` | `ui/inputs.tsx` | Inset surface, hairline border, violet focus border |
| `Card` | `ui/inputs.tsx` | Bordered surface wrapper. **Exported but not used by any screen** — screens compose inline bordered surfaces instead |
| `EmptyState` | `ui/inputs.tsx` | Dashed container, tinted glyph tile, title + guidance |
| `Field` | `ui/Field.tsx` | Label + control + hint/error; error takes the slot over the hint |
| `ScoreRing` | `features/history/HistoryScreen.tsx` | 36 px clarity ring (local) |
| Fit dial | `features/decisions/ResultScreen.tsx` | 68-radius SVG ring (local) |

Repeated visual motifs to preserve when touching anything: mono caps eyebrows,
`N/5` weight chips, leader dots with an accent glow, hairline-ruled section
breaks, and the `01 / 03` step counters.

---

## 7. Responsive rules

Tailwind defaults: `sm` 640 px, `md` 768 px.

- **768 px is the structural breakpoint.** Sidebar ⇄ bottom nav, desktop top
  bar ⇄ mobile top bar, footer visible ⇄ hidden, `max-w-3xl` ⇄ `md:max-w-4xl`.
- **640 px** switches: option/step action buttons go full-width → inline,
  review dimensions stack → 2-up, Patterns 2-up → 4-up, kicker rows wrap.
- **Touch:** mobile content keeps `pb-28` to clear the bottom bar; the bottom
  bar respects `safe-area-inset-bottom`; the Decide target is 44 px.
- **Known gap:** below ~640 px the Compare matrix keeps its desktop table and
  scrolls horizontally (`overflow-x-auto` + `min-w-max`). A dedicated stacked
  mobile composition is item A2 — the largest open responsiveness issue.
- **No print stylesheet** (item A7).

---

## 8. Accessibility surface

Shipped and worth preserving:

- Semantic landmarks: `<aside>`, `<header>`, `<nav aria-label="Primary">`,
  `<main id="main-content" tabIndex={-1}>`; the matrix is a real `<table>` with
  a screen-reader `<caption>` and `scope`d headers.
- Skip link; focus moves to `<main>` on navigation; a global `:focus-visible`
  outline on every interactive element.
- State exposed through `aria-pressed` (weight ticks, score cells,
  satisfaction segments, Yes/No), `aria-current="page"` (nav), `aria-live`
  (scored counter, toasts) and `role="alert"` (field errors, AI errors).
- Charts and bars carry `role="img"` with descriptive `aria-label`s rather than
  relying on colour.
- `prefers-reduced-motion` collapses all animation and transition durations
  globally in `src/index.css`.
- Decorative layers (ambient glow, marker dots, dial arcs) are `aria-hidden`.

Not yet done: axe checks in CI, focus trapping for the AI settings panel when
it becomes a mobile sheet, and live-region announcements for
"recommendation updated" (Part G).

---

## 9. Data dependencies

Screens read only pure modules — no screen computes a score of its own:

| Screen | Engines / modules read |
| --- | --- |
| Home | `summarizeScoring`, `formatTotal`, `DecisionStore` |
| Define | `DecisionStore` (`createDecision`, `updateDecision`) |
| Workspace | `DecisionStore`, `pruneScores`, `summarizeScoring`, `lib/ai/*` |
| Compare | `summary` passed down from the workspace (never recomputed) |
| Result | `buildRecommendation`, `formatTotal`, `DecisionStore.commitDecision` |
| Review | `DecisionStore.reviewOutcome`, `SATISFACTION_MIN/MAX` |
| History | `summarizeScoring`, `formatTotal` |
| Patterns | `buildPatternsReport`, `averageOptionsPerDecision`, `formatTotal` |

If a new view needs a number that doesn't exist yet, add it to a pure module
and test it there — never inline the maths in a component (guardrail 2 in
`docs/UI-IMPROVEMENTS.md`).

---

## 10. Known gaps

Cross-referenced rather than duplicated:

1. **Mobile Compare** still scrolls a desktop table — A2.
2. **The Result screen says its headline sentence twice** and styles
   trade-offs as errors — see the note in `docs/UI-IMPROVEMENTS.md`; the
   reasoning block needs a hierarchy pass.
3. ~~Two off-system colours survive outside `src/index.css`~~ — **done.** Every
   literal `rgba(…)`, `amber-*` and `#8b5cf6` in a component was replaced by a
   token (`--color-accent-bright`, nine `--shadow-*` values, a `--bloom` var for
   the dial). No colour value now lives outside `src/index.css`, which is what
   let light mode restyle the glows at all.
4. **Webfonts aren't loaded**, so the tokens name Geist / Newsreader /
   JetBrains Mono while the app paints in system fallbacks — A1.
5. **Nav says "New decision"** on the workspace and result — A4.
6. **No settings screen** beyond AI provider configuration.
