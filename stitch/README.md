# Stitch — DFK Shadcn UI Redesign

Fetched artifacts for Stitch project `2842323800619420280` (13 screens).

- `screenshots/` — rendered PNG per screen (thumbnails as served by Stitch)
- `html/` — full HTML implementation per screen (SVG for the logo)
- `fetch.sh` — re-download everything (`bash stitch/fetch.sh`); URLs are
  signed and may expire, so re-run `list_screens` via the Stitch MCP tools
  to refresh them if needed
- `design-system.md` — the "Calm Intelligence" design system extracted from
  the project theme (colors, type scale, spacing, elevation, components)

## Screen index

| File | Screen | Device |
| --- | --- | --- |
| `logo` | DFK Calm Intelligence Logo | 512×512 asset |
| `home-desktop` | Home — Decision Command Surface | Desktop |
| `flow-clarify-mobile` | Decision Flow — Clarify | Mobile |
| `flow-weigh` | Decision Flow — Weigh Priorities | Desktop |
| `compare-matrix` | Decision Flow — Compare Options (Matrix) | Desktop |
| `flow-verdict` | Decision Flow — Step 05: Final Synthesis & Verdict | Desktop |
| `result-desktop` | Decision Result — Take the New Job | Desktop |
| `review-desktop` | Outcome Review — Take the New Job | Desktop |
| `timeline-patterns` | Decisions Timeline & Patterns | Desktop |
| `home-mobile` | Home (Mobile) | Mobile |
| `compare-mobile` | Compare Options (Mobile) | Mobile |
| `result-mobile` | Decision Result (Mobile) | Mobile |
| `review-mobile` | Outcome Review (Mobile) | Mobile |
