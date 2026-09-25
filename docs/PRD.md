# Product Requirements Document

## 1. Product Overview

Decision Fatigue Killer is a decision-support application designed to reduce unnecessary mental friction. Users enter a decision, identify the available options, clarify what matters, assign importance to criteria, and receive a transparent recommendation.

The product should feel like a calm, sharp thinking partner—not a generic chatbot.

## 2. Problem

People often get stuck because:

- the decision is poorly defined
- too many factors are mixed together
- everything feels equally important
- low-stakes decisions receive too much attention
- high-stakes decisions receive too little structure
- users revisit the same decision repeatedly
- people lack feedback about their own decision-making habits

DFK turns an ambiguous decision into a small, visible decision process.

## 3. Target Users

### Primary

People who frequently overthink everyday or personal decisions.

### Secondary

Students, professionals, founders, freelancers, and anyone comparing multiple options.

## 4. Product Goals

### MVP Goals

- Create a decision in under 60 seconds
- Make the user articulate the actual decision
- Support 2–6 options
- Identify 2–8 decision criteria
- Allow importance weighting
- Produce an explainable recommendation
- Save completed decisions locally
- Show a readable history timeline
- Detect basic decision-making patterns
- Make the experience pleasant enough to use repeatedly

### Success Signals

- User completes decisions rather than abandoning them
- Average decision session remains short
- Users return to review previous decisions
- Users can understand why a recommendation was produced
- Users report reduced uncertainty

## 5. Core User Journey

### Step 1 — Dump

Prompt:

> What are you stuck deciding?

Examples:

- Should I take this job?
- Which laptop should I buy?
- What should I eat?
- Should I build this product?
- Which project should I work on tonight?

### Step 2 — Clarify

Ask a small number of focused questions:

- What exactly are you deciding?
- What are the realistic options?
- Is there a deadline?
- What happens if you choose incorrectly?
- Is this reversible?

The system should avoid unnecessary questioning.

### Step 3 — Identify Criteria

Suggested criteria may include:

- Cost
- Time
- Convenience
- Growth
- Risk
- Enjoyment
- Long-term value
- Relationships
- Energy

Users can edit, delete, or add criteria.

### Step 4 — Weight Criteria

Use a simple 1–5 importance scale.

Example:

| Criterion | Importance |
|---|---:|
| Income | 5 |
| Growth | 4 |
| Commute | 2 |
| Flexibility | 5 |

### Step 5 — Score Options

Each option receives a 1–10 score against each criterion.

Weighted score:

`Option Score = Σ(Criterion Weight × Option Score)`

Scores should be visible and editable.

### Step 6 — Decision Result

Show:

- Recommended option
- Confidence / clarity indicator
- Score breakdown
- Top reasons
- Biggest trade-off
- What could change the result
- A reminder that the recommendation is decision support, not an instruction

Example:

> **Option A comes out ahead.**
>
> Its biggest advantage is flexibility, which you marked as highly important.
>
> The main trade-off is lower short-term income.

### Step 7 — Commit

The user can record:

- Chosen option
- Decision date
- Optional reason
- Optional confidence level
- Optional expected outcome

### Step 8 — Review Later

History should allow users to revisit:

- What they decided
- Why
- What they expected
- What actually happened
- Whether the decision still feels good

## 6. Decision Types

MVP supports:

- Personal
- Work
- Money
- Purchases
- Food
- Relationships
- Projects
- Other

The category is metadata, not a restriction.

## 7. Decision Stakes

Allow:

- Tiny
- Normal
- Important
- Major

Stake level should influence the amount of guidance.

A tiny decision should not become a 20-question interview.

## 8. Pattern Detection

The app should eventually surface observations such as:

- You spend disproportionately long on low-stakes decisions.
- You frequently choose options with high convenience scores.
- You tend to prioritise short-term gains.
- Your predicted confidence differs from your later satisfaction.

MVP pattern detection should be descriptive, not diagnostic.

## 9. History

History view should support:

- chronological timeline
- category filter
- stake filter
- search
- decision detail
- outcome review

## 10. Patterns Dashboard

Initial metrics:

- Decisions completed
- Average decision time
- Decisions by category
- Average confidence
- Most-used criteria
- Most common decision stake
- Reconsidered decisions
- Outcome satisfaction, when available

## 11. AI Integration

AI is optional.

The architecture must allow:

`DecisionEngine -> AIProvider`

Possible providers:

- Local/mock engine
- OpenAI-compatible API
- Other provider later

AI should assist with:

- extracting the actual decision
- suggesting criteria
- generating clarifying questions
- summarising trade-offs
- explaining the recommendation

AI should NOT silently choose for the user.

## 12. Privacy

MVP should store decision data locally.

No data should leave the device unless the user explicitly enables an AI provider or export/sync feature.

## 13. Accessibility

- Keyboard navigable
- Visible focus states
- Sufficient contrast
- Semantic controls
- Screen-reader labels
- Avoid colour-only meaning
- Respect reduced motion where possible

## 14. MVP Out of Scope

- Accounts
- Cloud sync
- Social feeds
- Public profiles
- Advertising
- Automated life decisions
- Medical/legal/financial professional advice
- Predicting future outcomes
