# AI Usage

> **Before submitting:** this file was drafted alongside the code. Sections marked **EDIT** need your own, truthful answers. You are responsible for understanding everything in this repo, so read the code and be ready to explain it. Delete this note when done.

## Which AI tools did you use?

Claude (Anthropic), via claude.ai: for planning the work, writing most of the code and docs, and running builds, tests and API checks in a sandbox. **EDIT:** add any other tools you used (Cursor, Copilot, ChatGPT, etc.).

## What did you use them for?

- Reading the brief and turning it into a prioritised build plan.
- Scaffolding the Next.js / TypeScript / Tailwind project and writing the API routes, UI components, upload simulation and verification wizard.
- Writing the unit tests, the seed-data generator, and the architecture, cost and product documents.
- Running `tsc`, `next build`, the unit tests, and `curl` checks against the running server to exercise the publishing rule and error paths.

## Where did AI save you the most time?

Boilerplate-heavy, well-understood work: typed API routes with a consistent error envelope, the responsive dashboard (table on desktop / cards on mobile), form validation and states, and the first draft of the architecture and cost document. **EDIT:** adjust to your experience.

## One example where AI output was rejected, corrected or significantly changed

**EDIT: replace with one from your own review.** Candidates from this build, if they match what you saw:

- The first batch of API route files was **silently not written** because a shell command used brace expansion under `/bin/sh`. The unit tests still passed (they don't touch routes), so it only surfaced when the directory listing was inspected and the files were recreated. This is a reminder that passing tests don't prove the thing you care about exists.
- A label in the upload-failed alert was left with a trailing fragment (`"Connection lost at "`); it was caught on review and fixed.
- Design choices worth saying you pushed on: *scheduling* also counts as publishing under the verification rule, drafts need only a title, and the "Save draft & verify" path exists so the creator never loses their work.

## How did you verify AI-generated code?

- `npm run typecheck` (strict TypeScript) and `npm run build` pass.
- `npm test` unit tests cover the publishing rule, validation, stats and seed minimums.
- End-to-end `curl` checks against a production build: 403 for unverified/in-review publish and schedule, 201 for drafts and for verified publish, 422 with field errors, 503 failure injection, 404, persistence to disk, reset.
- Not done: browser-level E2E tests, real-device testing, screen-reader audit. **EDIT:** add anything you personally ran or clicked through (especially on a phone-sized viewport).

## What did you deliberately do yourself rather than delegate, and why?

**EDIT with your own answer.** Reasonable things to own personally: the product recommendations and priorities (Part Six), the cost-estimate assumptions and the "5 views vs 500,000 views" reasoning, the decision to enforce the rule on the server, and the final read-through of every file before submitting. These are judgment calls the assessment is explicitly trying to evaluate, so they should be yours.
