# Acceptance Criteria

## General

- [ ] App starts without console errors
- [ ] App works without a backend
- [ ] Data survives page refresh
- [ ] UI works on desktop and mobile
- [ ] Keyboard navigation works
- [ ] No critical accessibility violations

## Decision Creation

- [ ] User can create a decision
- [ ] User can edit decision information
- [ ] User can add/remove options
- [ ] User can select category
- [ ] User can select stake level
- [ ] Draft decisions do not disappear accidentally

## Criteria

- [ ] User can add criteria
- [ ] User can remove criteria
- [ ] User can assign weights
- [ ] Weight range is validated
- [ ] User can score options
- [ ] Score range is validated

## Recommendation

- [ ] Weighted scores are mathematically correct
- [ ] Highest score is identified
- [ ] Close results are identified
- [ ] Explanation is visible
- [ ] Trade-off is visible
- [ ] Recommendation is not presented as certainty

## History

- [ ] Completed decisions appear in history
- [ ] History survives refresh
- [ ] User can open a decision
- [ ] User can filter/search
- [ ] Empty history has a useful empty state

## Patterns

- [ ] Aggregates use actual stored decisions
- [ ] No fabricated statistics
- [ ] Insufficient data produces an honest empty state
- [ ] Insights are descriptive rather than diagnostic

## AI

- [ ] App works when AI is unavailable
- [ ] API keys are never committed
- [ ] AI output is treated as untrusted input
- [ ] AI cannot silently modify final user decisions
