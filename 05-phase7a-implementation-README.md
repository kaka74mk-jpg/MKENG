# Phase 7A — Practice Attempt → Mastery → Review Queue

This phase connects the existing Practice surface to the cross-session learning model.

## Apply SQL

Run:

`02-database/07_phase7a_practice_attempt_mastery.sql`

The same migration is mirrored under:

`04-pwa-app/supabase/sql/07_phase7a_practice_attempt_mastery.sql`

## What is now wired

1. A Practice answer creates a `practice_attempts` row.
2. The same action calls `record_learning_event()` for the Pattern.
3. `learner_mastery` is created/updated with exposure, recall counts and mastery score.
4. `next_review_at` is calculated using the current MVP intervals:
   - weak: 1 day
   - developing: 3 days
   - solid: 7 days
   - strong: 21 days
5. `review_queue` is updated automatically.
6. `get_due_reviews()` exposes due work to the PWA.
7. `complete_review_item()` is ready for Phase 7B.

## Important

This phase deliberately uses self-reported `Correct / Incorrect` results. AI grammar/pronunciation scoring is not fabricated; those fields are present on `practice_attempts` for later integration.

Authentication must be working before Practice submissions can be persisted.
