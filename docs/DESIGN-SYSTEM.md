# Design System

## Design Direction

Decision Fatigue Killer should look like a focused thinking tool rather than a generic productivity app.

Reference feeling:

> premium notes app + thoughtful coach + lightweight analytical dashboard

## Visual Principles

- Strong hierarchy
- Generous whitespace
- Short copy
- One primary action per screen
- Minimal decoration
- Clear progress
- Calm visual feedback

## Suggested Palette

Use a restrained neutral base.

Primary accent may be an electric indigo/violet.

Semantic colours:

- success: muted green
- warning: amber
- danger: muted red
- information: blue

Do not make the interface dependent on colour alone.

## Typography

Use a modern sans-serif.

Recommended:

- Inter
- Geist
- system sans

Large headings should be confident but compact.

## Components

Core components:

- DecisionInput
- ProgressIndicator
- QuestionCard
- OptionCard
- CriterionRow
- WeightSlider
- ScoreMatrix
- RecommendationCard
- TradeoffCard
- DecisionTimeline
- PatternCard
- EmptyState
- ConfirmDialog

## Motion

Motion should communicate state.

Use:

- subtle page transitions
- progress transitions
- score changes
- success confirmation

Avoid:

- perpetual animation
- distracting bouncing
- decorative motion

Respect prefers-reduced-motion.

## Responsive

Desktop:

- centred content
- comfortable reading width
- optional side summary

Mobile:

- single-column
- large touch targets
- sticky primary action when useful

## Result Screen

The recommendation should be visually dominant.

Hierarchy:

1. Recommendation
2. Why
3. Trade-off
4. Score breakdown
5. What could change it
6. Commit decision
