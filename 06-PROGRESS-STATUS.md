# MK English Pro — Progress Status

## Current milestone

**Phase 9 / 10 — COMPLETE**

```text
[█████████░] 9 / 10 milestones
```

This is a roadmap milestone count, not a literal percentage of implementation effort.

## Completed

- Phase 1 — Foundation
- Phase 2 — Database / RLS / Storage
- Phase 3 — PWA foundation
- Phase 4 — AI/content architecture
- Phase 5 — learning/mastery model
- Phase 6 — Practice/Mastery/Review architecture
- Phase 7A — Practice → Attempt → Mastery → Review Queue
- Phase 7B — Review Queue → real Exercise → Attempt
- Phase 7C — AI Coach using due/weak learning context
- Phase 7D — Mastery Dashboard
- Phase 8 — Auth + Creator Mode + private file access + hardened Drive import foundation
- Phase 9 — Transcript Intelligence & Study Material Generation

## Phase 9 delivered

- `lesson_transcripts` database layer
- `ai_content_drafts` database layer
- RLS for both new tables
- `transcript_ai` pattern source
- `ai-study-material` Supabase Edge Function
- server-side OpenAI integration contract
- Creator → Study Lab flow
- transcript save/edit UI
- AI Draft generation
- Human Approve / Reject workflow
- approved Pattern → canonical `patterns`
- approved Vocabulary → canonical `vocabulary`
- approved Insight → canonical `extracted_insights`
- approved Exercise → canonical `drill_items`
- Phase 9 handoff document

## Critical audio rule
The classroom audio remains **continuous and authentic**. Phase 9 does not add automatic pauses and does not let AI control playback.

The correct architecture is:

`Audio → continuous classroom playback`

`Transcript → AI study material → human review → canonical content → practice/mastery`

## Known limitations

- Speech-to-Text ingestion is not automated yet.
- PDF-aware extraction is not automated yet.
- AI Edge Function needs deployment and a real `OPENAI_API_KEY` in Supabase.
- Dependency installation/build could not be completed in the sandbox because `npm install` timed out.
- Voice recording and pronunciation evaluation are not implemented.
- Dedicated offline audio caching is not implemented.
- PWA icon artwork remains placeholder.

## Next

**Phase 10 — Continuous Audio + Optional Active Practice**

Default audio must stay uninterrupted. Add optional speaking/recording/shadowing and explicitly activated smart-pause drills without changing the default classroom experience.

## Phase 10 — Continuous Audio + Optional Active Practice
Status: IMPLEMENTED

- Original classroom audio remains continuous and is never force-paused.
- Added resumable lesson listening progress with Supabase persistence.
- Added realtime progress updates so another connected device can receive the latest saved position.
- Added reusable ContinuousAudioPlayer with signed URLs, seeking, resume, periodic save, completion state.
- Added optional speaking recorder for selected Drill Items; recording is independent from classroom playback.
- Voice recordings upload to private `voice-recordings/{user_id}/{drill_item_id}/...` and create `voice_recordings` rows.
- No pronunciation/grammar score is fabricated; score columns remain null until a real evaluator exists.
