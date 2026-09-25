# Calm Intelligence — Design System (Stitch project theme)

Source: Stitch project `2842323800619420280` (TEXT_TO_UI_PRO, dark, Geist).

An ultra-editorial, cognitive-relief environment for eliminating decision
fatigue: Linear/Raycast-style command-driven utility merged with boutique
editorial publishing.

## Colors

Canvas and surface tiers:

| Token | Hex |
| --- | --- |
| Obsidian canvas (base) | `#09080d` |
| Surface / surface-dim / background | `#141318` |
| Surface container lowest | `#0f0d13` |
| Surface container low | `#1c1b20` |
| Surface container | `#201f24` |
| Surface container high | `#2b292f` |
| Surface container highest | `#36343a` |
| Surface variant | `#36343a` |
| Surface bright | `#3a383e` |

Text and borders:

| Token | Hex |
| --- | --- |
| On-surface / on-background | `#e6e1e9` |
| On-surface variant | `#cbc3d7` |
| Outline | `#958ea0` |
| Outline variant (hairlines) | `#494454` |
| Secondary | `#cac4d1` |
| Tertiary | `#ccc2de` |

Accent (single accent of momentum — recommendations, commit buttons, active
states, progress rings):

| Token | Hex |
| --- | --- |
| Primary | `#d0bcff` |
| Primary container | `#a078ff` |
| Override primary (Electric Violet) | `#8b5cf6` |
| On-primary | `#3c0091` |
| On-primary container | `#340080` |
| Inverse primary | `#6d3bd7` |
| Primary fixed | `#e9ddff` / dim `#d0bcff` |

Error:

| Token | Hex |
| --- | --- |
| Error | `#ffb4ab` |
| On-error | `#690005` |
| Error container | `#93000a` |
| On-error container | `#ffdad6` |

Narrative palette from the brand spec (referenced by component copy):
tonal layers `#111018`, `#15131c`, `#191720`, `#211b30`; hairline boundary
`#292532`; typographic cast `#f5f3fa` (foreground) / `#8f899b` (muted).

## Typography

| Style | Font | Size/Line | Weight | Tracking |
| --- | --- | --- | --- | --- |
| Display hero | Geist | 56/64 | 600 | -0.04em |
| Display hero mobile | Geist | 36/44 | 600 | -0.03em |
| Headline lg | Geist | 32/40 | 600 | -0.03em |
| Headline md | Geist | 24/32 | 500 | -0.02em |
| Editorial quote | Newsreader | 22/34 | 400 | -0.01em |
| Body lg | Geist | 16/26 | 400 | -0.01em |
| Body sm | Geist | 14/22 | 400 | 0 |
| Label code | JetBrains Mono | 12/16 | 500 | 0.02em |
| Label key | JetBrains Mono | 11/14 | 600 | 0.04em |

Geist is the workhorse; Newsreader is deployed selectively for editorial
deliberation (synthetic briefings, contemplative prompts); JetBrains Mono is
for data tags, kbd badges, step counters, and decision IDs.

## Layout & Spacing

- Max content width 1180px (standard) / 760px (focused decision runs)
- Desktop 1024px+: 12 columns, 3rem margins, 1.5rem gutters; 8:4 splits with
  a passive context rail
- Tablet 768–1023px: 8 columns, rails collapse into drawers/sheets
- Mobile <768px: 4 columns, 1.25rem margins, edge-to-edge cards
- Spacing tokens: xs 0.25, sm 0.5, md 1, lg 1.5, xl 2.5rem; gutter 1.5rem
  (mobile 1rem); margin 3rem (mobile 1.25rem)

## Elevation & Depth

No heavy drop shadows. Depth = luminous surface layering + hairline borders.

1. Base canvas `#09080d`
2. Tier 1 cards: `#111018` with 1px border `#292532`
3. Tier 2 floating modals/command palette: `#15131c`, `backdrop-filter:
   blur(16px)`, ambient shadow `0 20px 50px rgba(0,0,0,0.65)`
4. Active luminescence (decision anchors only): tight inner stroke + violet
   halo `0 0 28px -4px rgba(139,92,246,0.28)`

## Shapes

- Unified curvature rooted at 14px (`0.85rem`) for cards/panels/modals
- Inputs and buttons match parent curvature (nested radii)
- Badges and kbd: 6px
- Progress indicators: circular strokes with rounded endpoints

## Components

- **Primary button ("Decision Trigger")**: bg `#8b5cf6`, fg `#ffffff`; hover
  aura `0 0 24px rgba(139,92,246,0.4)`
- **Secondary/ghost**: bg `#191720`, 1px border `#292532`, fg `#f5f3fa`;
  hover bg `#211b30`, border `#3b3548`
- **Decision cards**: `#111018` + 1px `#292532`; selection transitions border
  to `#8b5cf6` with subtle inset violet wash
- **Kbd badges**: JetBrains Mono 11px, `#191720` surface, `#292532` border,
  `#8f899b` text
- **Inputs/palette**: transparent or `#111018` bg, inset `#292532` border;
  active border `#8b5cf6`; placeholder `#8f899b` at 60%
- **Checkboxes**: 18px inset square, 4px corners; checked = full `#8b5cf6`
  fill, off-white icon
- **Focus rings**: 2px ring, 2px offset of canvas black, Electric Violet
