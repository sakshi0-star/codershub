# Part Six: Product Challenge

Three recommendations from the point of view of someone who owns the creator experience. Recommendation 2 is something the brief did not ask for.

## 1. Background uploads that survive navigation and tab close (Priority: High)

**What:** Move uploading out of the form and into a persistent upload manager (a small tray at the bottom of the screen). The creator fills in details while the file uploads, can navigate anywhere, and the upload resumes automatically after a refresh, a dropped connection, or reopening the app on the same device.

**Why:** The upload is the slowest and most failure-prone step in the whole product: multi-GB files on mobile connections. Today (and in the brief) the form and the upload are one blocking action, so a flaky connection costs the creator their whole session. Resumable multipart uploads (see `docs/ARCHITECTURE.md`) make this technically cheap.

**How it improves the experience:** Creators stop babysitting a progress bar, never lose work to a dropped connection, and can add metadata while the video transfers, so time-to-publish drops. It is also the biggest lever on creator drop-off, because every creator who gives up at upload is a creator who never earns.

## 2. "Ready to publish" checklist and verification at the moment of intent (Priority: High, not in the brief)

**What:** Replace the single hard stop with a checklist on each draft: title, description, price, thumbnail, video processed, **identity verified**. Each item links to its fix. When a draft is otherwise complete and the only blocker is verification, the dashboard surfaces *"Your video is ready. Verify your identity to publish it"* with one tap into the flow, and returns the creator to that draft when verification is approved (with a notification or email).

**Why:** Verification is the biggest conversion cliff in the product, because it turns "I'm excited to publish" into paperwork. Asking for it up front, before the creator has made anything, is the worst time. Asking when they have a finished video waiting is the best time: motivation is at its peak and the reward is concrete. A checklist also removes guesswork about *why* the Publish button doesn't work.

**How it improves the experience:** Fewer abandoned drafts, fewer support tickets ("why can't I publish?"), and faster verification. The demo already implements the first step of this: when an unverified creator tries to publish, they get an explanation, a **Save draft & verify** path that preserves their work, and a clear "in review" state. The checklist and return-to-draft behaviour would be the next step.

## 3. Per-video performance insight: conversion and net earnings (Priority: Medium)

**What:** Add views-to-purchase **conversion rate**, a **net earnings** figure (after platform fees and refunds) and **pending vs paid out** to each content row and detail page, plus a simple "what changed" note (e.g. "Revenue is up 22% vs the prior 7 days, mostly from India").

**Why:** The dashboard currently answers "how much did I make?" but not "what should I do next?" A video with 50,000 views and 0.1% conversion probably has a price or thumbnail problem; one with 500 views and 12% conversion deserves promotion. Showing *gross* revenue alone can also mislead creators about what they will actually receive.

**How it improves the experience:** It turns a reporting screen into a decision tool: creators can tune prices and thumbnails, trust the numbers (net matches payout), and see which content is worth making more of. Priority is Medium because it matters most once real money flows and there is enough data to be meaningful.

## What I implemented

None of these in full. The closest is the *Save draft & verify* flow in the publish gate, which covers the first half of recommendation 2. Everything else is documented as a recommendation, not built, in the interest of time.
