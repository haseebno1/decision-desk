/**
 * Demo-data generator — produces a spread of realistic decisions for seeding
 * the app's localStorage.
 *
 *   npm run seed:demo        # prints a paste-ready snippet (see below)
 *   node scripts/seed-demo-data.mjs             # the raw JSON array
 *   node scripts/seed-demo-data.mjs --console   # same snippet, explicitly
 *
 * Records live in the browser, so the terminal can only *produce* the data: the
 * default output is a self-contained expression to paste into the DevTools
 * console while the app is open. It merges rather than replaces — existing demo
 * records are dropped and rewritten, and any records you created yourself are
 * left exactly as they are.
 *
 * Scores are hand-authored, not recomputed here: the app's scoring engine owns
 * that maths, and these fixtures are written to agree with it (e.g. a committed
 * choice always matches the option the engine ranks first, except the one entry
 * that diverges on purpose).
 *
 * Every id starts with `demo-`, so removing them later is one filter:
 *
 *   decisions.filter((d) => !d.id.startsWith('demo-'))
 *
 * Covers: drafts at three stages (unscored / no criteria / partly scored),
 * committed-with-review, a diverged review, an unreviewed commit, a close
 * call, and a months-old entry so the journal has several month groups.
 */

const KEY = 'decision-desk.decisions.v1'

const daysAgo = (days) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

const opt = (slug, letter, label) => ({ id: `demo-${slug}-opt-${letter}`, label })
const crit = (slug, key, label, weight) => ({
  id: `demo-${slug}-crit-${key}`,
  label,
  weight,
})

/** scores[optionId][criterionId] = 1–5; omitted cells stay unscored. */
function scoreMatrix(slug, options, rows) {
  const matrix = {}
  for (const option of options) {
    matrix[option.id] = {}
    for (const [criterion, perOption] of Object.entries(rows)) {
      const value = perOption[option.id]
      if (value !== undefined) {
        matrix[option.id][`demo-${slug}-crit-${criterion}`] = value
      }
    }
  }
  return matrix
}

function build(slug, spec) {
  const options = spec.options
  const criteria = spec.criteria
  const decision = {
    id: `demo-${slug}`,
    title: spec.title,
    category: spec.category,
    stake: spec.stake,
    options,
    criteria,
    status: spec.status,
    createdAt: spec.createdAt,
    updatedAt: spec.updatedAt,
  }
  if (spec.description) decision.description = spec.description
  if (spec.scores) decision.scores = scoreMatrix(slug, options, spec.scores)
  if (spec.outcome) decision.outcome = spec.outcome
  return decision
}

// ── Drafts ─────────────────────────────────────────────────────────────────

const berlin = build('berlin-role', {
  title: 'Should I take the Berlin role?',
  description:
    'A step up in scope, but it means relocating and a slower path back to the product track I actually want.',
  category: 'career',
  stake: 'high',
  status: 'draft',
  createdAt: daysAgo(3),
  updatedAt: daysAgo(1),
  options: [
    opt('berlin-role', 'a', 'Take the Berlin role'),
    opt('berlin-role', 'b', 'Stay and push for the lead role'),
    opt('berlin-role', 'c', 'Negotiate a remote-first version'),
  ],
  criteria: [
    crit('berlin-role', 'growth', 'Growth', 5),
    crit('berlin-role', 'comp', 'Compensation', 4),
    crit('berlin-role', 'location', 'Location', 4),
    crit('berlin-role', 'team', 'Team', 3),
  ],
  // Deliberately partial: exercises the "n/m scored" counter.
  scores: {
    growth: {
      'demo-berlin-role-opt-a': 5,
      'demo-berlin-role-opt-b': 3,
      'demo-berlin-role-opt-c': 4,
    },
    comp: { 'demo-berlin-role-opt-a': 4, 'demo-berlin-role-opt-b': 4 },
    location: {
      'demo-berlin-role-opt-a': 2,
      'demo-berlin-role-opt-b': 5,
      'demo-berlin-role-opt-c': 5,
    },
  },
})

const crm = build('crm', {
  title: 'Which CRM for the team?',
  category: 'other',
  stake: 'low',
  status: 'draft',
  createdAt: daysAgo(6),
  updatedAt: daysAgo(6),
  options: [
    opt('crm', 'a', 'Keep the spreadsheet'),
    opt('crm', 'b', 'Move to a light CRM'),
  ],
  criteria: [], // exercises the empty criteria / empty matrix states
})

const moveIn = build('move-in', {
  title: 'Move in together this year?',
  description: 'Both of us want it; the question is timing against the lease.',
  category: 'relationships',
  stake: 'high',
  status: 'draft',
  createdAt: daysAgo(0),
  updatedAt: daysAgo(0),
  options: [
    opt('move-in', 'a', 'Sign a lease together'),
    opt('move-in', 'b', 'Wait until spring'),
  ],
  criteria: [
    crit('move-in', 'readiness', 'Readiness', 5),
    crit('move-in', 'cost', 'Cost', 3),
    crit('move-in', 'timing', 'Timing', 4),
  ],
  // No scores at all: the journal should read "Not scored yet".
})

// ── Committed, reviewed well ───────────────────────────────────────────────

const insurance = build('insurance', {
  title: 'Which health insurance plan?',
  category: 'finance',
  stake: 'high',
  status: 'committed',
  createdAt: daysAgo(30),
  updatedAt: daysAgo(8),
  options: [
    opt('insurance', 'a', 'Bronze HSA'),
    opt('insurance', 'b', 'Silver PPO'),
    opt('insurance', 'c', 'Gold PPO'),
  ],
  criteria: [
    crit('insurance', 'cost', 'Monthly cost', 5),
    crit('insurance', 'coverage', 'Coverage breadth', 4),
    crit('insurance', 'network', 'Network', 3),
    crit('insurance', 'flex', 'Flexibility', 2),
  ],
  scores: {
    // Silver ends up the winner (8.8) ahead of Gold (7.3) and Bronze (6.3),
    // so the committed choice matches the recommendation.
    cost: {
      'demo-insurance-opt-a': 5,
      'demo-insurance-opt-b': 4,
      'demo-insurance-opt-c': 2,
    },
    coverage: {
      'demo-insurance-opt-a': 3,
      'demo-insurance-opt-b': 5,
      'demo-insurance-opt-c': 5,
    },
    network: {
      'demo-insurance-opt-a': 2,
      'demo-insurance-opt-b': 5,
      'demo-insurance-opt-c': 5,
    },
    flex: {
      'demo-insurance-opt-a': 3,
      'demo-insurance-opt-b': 4,
      'demo-insurance-opt-c': 5,
    },
  },
  outcome: {
    chosenOptionId: 'demo-insurance-opt-b',
    committedAt: daysAgo(22),
    review: {
      actualOptionId: 'demo-insurance-opt-b',
      satisfaction: 5,
      wouldChooseAgain: true,
      notes:
        'Two claims so far, both approved in a day. The network breadth was the right thing to weight hardest.',
      reviewedAt: daysAgo(8),
    },
  },
})

// ── Committed, review diverged (chose differently than the model) ──────────

const designer = build('designer-hire', {
  title: 'Hire the senior designer or the generalist?',
  description: 'One role, two strong candidates, very different shapes.',
  category: 'career',
  stake: 'high',
  status: 'committed',
  createdAt: daysAgo(55),
  updatedAt: daysAgo(20),
  options: [
    opt('designer-hire', 'a', 'Senior specialist'),
    opt('designer-hire', 'b', 'Versatile generalist'),
  ],
  criteria: [
    crit('designer-hire', 'craft', 'Craft', 5),
    crit('designer-hire', 'range', 'Range', 3),
    crit('designer-hire', 'cost', 'Cost', 4),
    crit('designer-hire', 'avail', 'Availability', 2),
  ],
  scores: {
    craft: { 'demo-designer-hire-opt-a': 5, 'demo-designer-hire-opt-b': 3 },
    range: { 'demo-designer-hire-opt-a': 2, 'demo-designer-hire-opt-b': 4 },
    cost: { 'demo-designer-hire-opt-a': 2, 'demo-designer-hire-opt-b': 5 },
    avail: { 'demo-designer-hire-opt-a': 4, 'demo-designer-hire-opt-b': 3 },
  },
  outcome: {
    chosenOptionId: 'demo-designer-hire-opt-b',
    committedAt: daysAgo(48),
    review: {
      // Diverged on purpose: shows the Expected/Actual split and "Differs".
      actualOptionId: 'demo-designer-hire-opt-a',
      satisfaction: 2,
      wouldChooseAgain: false,
      notes:
        'Craft was weighted 5 for a reason. The generalist shipped breadth but the visual work needed redoing.',
      reviewedAt: daysAgo(20),
    },
  },
})

// ── Committed, no review yet (shows the empty review form) ─────────────────

const apartment = build('apartment', {
  title: 'Which apartment should we rent?',
  category: 'lifestyle',
  stake: 'high',
  status: 'committed',
  createdAt: daysAgo(20),
  updatedAt: daysAgo(12),
  options: [
    opt('apartment', 'a', 'Riverside 2-bed'),
    opt('apartment', 'b', 'Old town walk-up'),
    opt('apartment', 'c', 'Suburb house share'),
  ],
  criteria: [
    crit('apartment', 'rent', 'Rent', 5),
    crit('apartment', 'commute', 'Commute', 4),
    crit('apartment', 'space', 'Space', 3),
    crit('apartment', 'light', 'Light', 3),
  ],
  scores: {
    // Riverside must be the leader (7.8 vs Suburb 7.1) because it is the
    // committed choice — otherwise the app correctly reports a divergence.
    rent: {
      'demo-apartment-opt-a': 3,
      'demo-apartment-opt-b': 4,
      'demo-apartment-opt-c': 5,
    },
    commute: {
      'demo-apartment-opt-a': 5,
      'demo-apartment-opt-b': 4,
      'demo-apartment-opt-c': 2,
    },
    space: {
      'demo-apartment-opt-a': 4,
      'demo-apartment-opt-b': 2,
      'demo-apartment-opt-c': 4,
    },
    light: {
      'demo-apartment-opt-a': 5,
      'demo-apartment-opt-b': 3,
      'demo-apartment-opt-c': 5,
    },
  },
  outcome: {
    chosenOptionId: 'demo-apartment-opt-a',
    committedAt: daysAgo(12),
  },
})

// ── Committed, deliberately close (gap ≈ 0.1) ──────────────────────────────

const car = build('ev-or-petrol', {
  title: 'Replace the car with an EV?',
  category: 'purchase',
  stake: 'high',
  status: 'committed',
  createdAt: daysAgo(75),
  updatedAt: daysAgo(40),
  options: [
    opt('ev-or-petrol', 'a', 'Keep the petrol car'),
    opt('ev-or-petrol', 'b', 'Lease an EV'),
  ],
  criteria: [
    crit('ev-or-petrol', 'running', 'Running cost', 5),
    crit('ev-or-petrol', 'upfront', 'Upfront cost', 4),
    crit('ev-or-petrol', 'convenience', 'Convenience', 3),
    crit('ev-or-petrol', 'environment', 'Environment', 2),
  ],
  scores: {
    // Weighted sums land one point apart over a weight total of 14, which the
    // engine rescales to a 0.2 gap → the "close call" badge.
    running: { 'demo-ev-or-petrol-opt-a': 4, 'demo-ev-or-petrol-opt-b': 5 },
    upfront: { 'demo-ev-or-petrol-opt-a': 5, 'demo-ev-or-petrol-opt-b': 2 },
    convenience: { 'demo-ev-or-petrol-opt-a': 5, 'demo-ev-or-petrol-opt-b': 5 },
    environment: { 'demo-ev-or-petrol-opt-a': 2, 'demo-ev-or-petrol-opt-b': 5 },
  },
  outcome: {
    chosenOptionId: 'demo-ev-or-petrol-opt-a',
    committedAt: daysAgo(68),
    review: {
      actualOptionId: 'demo-ev-or-petrol-opt-a',
      satisfaction: 3,
      wouldChooseAgain: true,
      notes: 'Still the cheaper option while charging near the flat is scarce.',
      reviewedAt: daysAgo(40),
    },
  },
})

// ── Older, so the journal spans several months ─────────────────────────────

const desk = build('standing-desk', {
  title: 'Switch to a standing desk?',
  category: 'lifestyle',
  stake: 'low',
  status: 'committed',
  createdAt: daysAgo(160),
  updatedAt: daysAgo(120),
  options: [
    opt('standing-desk', 'a', 'Full sit-stand desk'),
    opt('standing-desk', 'b', 'Cheap riser on the current desk'),
  ],
  criteria: [
    crit('standing-desk', 'cost', 'Cost', 4),
    crit('standing-desk', 'ergonomics', 'Ergonomics', 5),
    crit('standing-desk', 'space', 'Space', 2),
  ],
  scores: {
    cost: { 'demo-standing-desk-opt-a': 2, 'demo-standing-desk-opt-b': 5 },
    ergonomics: { 'demo-standing-desk-opt-a': 5, 'demo-standing-desk-opt-b': 3 },
    space: { 'demo-standing-desk-opt-a': 2, 'demo-standing-desk-opt-b': 4 },
  },
  outcome: {
    chosenOptionId: 'demo-standing-desk-opt-b',
    committedAt: daysAgo(152),
    review: {
      actualOptionId: 'demo-standing-desk-opt-b',
      satisfaction: 4,
      wouldChooseAgain: true,
      notes: 'Good enough for the money. Upgrading when the desk dies anyway.',
      reviewedAt: daysAgo(120),
    },
  },
})

const decisions = [
  moveIn,
  berlin,
  crm,
  insurance,
  apartment,
  designer,
  car,
  desk,
]

const asConsoleSnippet = (data) =>
  `(() => { const k = '${KEY}'; const demo = ${JSON.stringify(data)}; ` +
  `const cur = JSON.parse(localStorage.getItem(k) ?? '[]'); ` +
  `const kept = (Array.isArray(cur) ? cur : []).filter((d) => !String(d.id).startsWith('demo-')); ` +
  `localStorage.setItem(k, JSON.stringify([...demo, ...kept])); location.reload(); })()`

process.stdout.write(
  process.argv.includes('--console')
    ? `${asConsoleSnippet(decisions)}\n`
    : JSON.stringify(decisions, null, 2),
)
