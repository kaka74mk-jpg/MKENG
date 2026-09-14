# MK English Pro — Phase 7D Handoff

## Status

**Phase 7D — Mastery Dashboard is complete.**

Current roadmap position: **7 / 10 milestones**.

The project must continue from this repository. Do not redesign the architecture from zero.

## What Phase 7D adds

The user can now see the learning state that previously existed only in Supabase:

- Overall average mastery across mastered Patterns.
- Number of tracked Patterns.
- Number of reviews due now.
- Mastery bands:
  - 0–29: Needs work
  - 30–59: Developing
  - 60–79: Solid
  - 80–100: Strong
- Last-7-day recall attempts and accuracy.
- Pattern-by-pattern mastery list.
- Filters for all patterns, patterns needing attention, and currently due patterns.
- Correct/incorrect recall totals and exposure count per Pattern.
- Direct navigation to Review and AI Coach.

## Files added/changed in Phase 7D

### Added

`04-pwa-app/src/lib/masteryDashboard.ts`

Loads the dashboard from real Supabase data:
- `learner_mastery`
- `patterns`
- `practice_attempts`
- `get_due_reviews()` RPC

### Added

`04-pwa-app/src/pages/MasteryDashboard.tsx`

The actual `/mastery` UI.

### Changed

`04-pwa-app/src/App.tsx`

Added:

`/mastery → MasteryDashboard`

### Changed

`04-pwa-app/src/pages/Profile.tsx`

Added navigation to the Mastery Dashboard.

### Changed

`06-PROGRESS-STATUS.md`

Updated to show Phase 7D complete and the complete current state.

## Existing learning system that must be preserved

### Phase 7A

`practice_attempts` stores raw recall attempts.

`record_learning_event()` updates `learner_mastery` and creates/updates `review_queue`.

### Phase 7B

Review Queue items open into real exercises and their results return through the same Practice → Mastery path.

### Phase 7C

`Coach.tsx` and `aiCoach.ts` use due reviews and weak patterns as AI Coach context.

### Phase 7D

The dashboard does **not** create a second mastery system. It only visualizes the existing source of truth.

## Important architecture constraints

- Keep Supabase as the source of truth.
- Keep RLS and `user_id` ownership.
- Keep Storage buckets private.
- Never expose `service_role` in frontend code.
- Keep `Package → Level → Season → Chapter → Lesson → Pattern → Drill Item`.
- Keep Audio as the classroom experience; do not replace the project with a generic flashcard app.
- Keep the existing classroom-tape visual direction.

## Known limitations before the next phase

1. Auth UI is not yet a proper production login flow.
2. Google Drive import Edge Function has not been production-deployed/tested.
3. Audio playback with automatic drill pauses is not yet implemented.
4. Voice recording/upload is not yet implemented.
5. Dedicated audio caching strategy is not yet implemented.
6. Creator Mode is not yet implemented.
7. Transcript/AI extraction pipeline is not yet implemented.
8. PWA icons are still placeholders.
9. Build requires dependencies to be installed; this archive intentionally does not contain `node_modules`.

## Next phase

**Phase 8 — Auth + Creator Mode + Audio Import production-ready.**

Recommended order inside Phase 8:

1. Implement the real Auth screen and session guard.
2. Protect application routes based on Supabase session.
3. Deploy/test `import-drive-audio` with authenticated requests.
4. Build Creator Mode for creating/editing Lesson structure.
5. Add PDF upload and Google Drive audio import UI.
6. Generate/use signed URLs for private audio/PDF access.
7. Add robust processing/error states.
8. Re-test the complete content ingestion path without changing the core learning architecture.

## If work is interrupted

Read these in this order:

1. `00-COMPLETE-CONTINUATION-CONTEXT.md`
2. `00-HANDOFF-SUMMARY.md`
3. `07-PHASE7D-HANDOFF.md`
4. `06-PROGRESS-STATUS.md`
5. `01-architecture-docs/MK_English_Pro_Architecture.md`

Then inspect the current source instead of rebuilding anything.
