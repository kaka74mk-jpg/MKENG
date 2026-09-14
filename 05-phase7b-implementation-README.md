# Phase 7B — Review Queue → Real Exercise

## Status
**Complete**

This phase turns the Phase 7A review queue into an actual practice loop.

## Flow

`Due Review → Pattern + Drill Item → Recall → Reveal → Correct/Incorrect → Practice Attempt → Mastery → Rescheduled Review`

## Added

- `src/pages/Review.tsx`
- `/review` route
- Practice → Review navigation
- Due pattern hydration from `review_queue`, `patterns`, and `drill_items`
- Real result submission through the existing `recordPracticeResult()` path
- Review items disappear from the active queue after a successful answer
- The existing Phase 7A RPC automatically reschedules the answered pattern according to mastery

## Scope deliberately not included yet

- AI scoring
- speech recording
- pronunciation/grammar automatic assessment
- audio pause/response playback
- vocabulary/insight review cards

Those belong to later phases and are not fabricated here.
