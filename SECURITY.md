# Security Policy

## Supported versions

Decision Desk is developed on the `main` branch. Only the latest release /
`main` receives security fixes; there are no maintained back-releases.

| Version | Supported |
| ------- | --------- |
| `main` (0.1.x) | Yes |
| Anything older | No |

## Reporting a vulnerability

Please **do not open a public issue** for a security problem. Instead use
GitHub's private reporting flow:

1. Go to the repository's **Security** tab.
2. Choose **Report a vulnerability** (GitHub private security advisory).
3. Describe the issue, the impact, and the steps to reproduce.

You can expect an acknowledgement within a few days. If the report is valid we
will agree on a disclosure timeline with you and credit you in the advisory
unless you prefer otherwise.

## What is in scope

Decision Desk is a static client-side app with no backend of its own, so the
interesting surface is small and specific:

- **Data handling.** All decisions, criteria, scores and reviews live in the
  browser's `localStorage` and never leave the device. Anything that leaks,
  mutates or unboundedly grows that data is in scope.
- **AI provider configuration.** When you select the OpenAI-compatible
  provider, *you* supply the base URL, model and API key, and the browser
  sends the decision context directly to that endpoint. Risks worth reporting
  include: a key being sent somewhere other than the configured base URL, a key
  appearing in a log, toast, error message, URL or committed file, or an
  endpoint receiving more of your data than the request requires.
- **Untrusted content.** Content returned by an AI provider is rendered as
  text. An injection that turns provider output into executable code or a
  navigation is in scope.
- **Supply chain.** A dependency that is unnecessary, unmaintained, or pulls in
  more privilege than the app needs.

## What is out of scope

- The security of the third-party AI endpoint you configure — that is between
  you and your provider (see that provider's policy).
- Anyone with access to your unlocked browser profile or your machine being
  able to read `localStorage`. That is inherent to local-only storage, and the
  app deliberately has no server-side component to defend.
- The demo data in `scripts/seed-demo-data.mjs` (fabricated fixtures).

## Good practice for contributors

- Never commit a real API key, token or `.env` file. `.env*` is git-ignored;
  keep it that way.
- Keep `localStorage` writes defensive: the store already validates anything it
  reads back, and that behaviour should not regress.
