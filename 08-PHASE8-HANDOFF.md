# MK English Pro — Phase 8 Handoff

## Status

**Phase 8 — Auth + Creator Mode + Audio Import production-ready foundation: COMPLETE.**

Current roadmap position: **8 / 10 milestones**.

Do not redesign the project. Continue from this repository and preserve the existing learning architecture.

## What Phase 8 added

### Authentication
- `/auth` magic-link login using Supabase Auth.
- Session persistence and automatic token refresh remain enabled in the Supabase client.
- `AuthGuard` protects all application routes except `/auth`.
- Signed-out users are redirected to `/auth` and their intended path is retained.
- Profile sign-out remains available.

### Creator Mode
- New `/creator` route.
- Profile → Creator Mode entry point.
- Creator can create the existing hierarchy without changing the architecture:
  `Package → Level → Season → Chapter → Lesson`.
- Creator can create a Lesson as Draft, edit its title, and toggle Draft/Published status.
- PDF upload goes directly to private `lesson-pdfs` storage under `{user_id}/{lesson_id}/...`.
- Google Drive audio link creates an `audio_sources` record and invokes the existing `import-drive-audio` Edge Function.
- Existing RLS ownership model remains the source of truth.

### Private file access
- Added `src/lib/storage.ts` with a single `getSignedUrl()` helper.
- Listen now requests a short-lived signed URL before playing private lesson audio.
- No public Storage bucket or service-role key is used by the frontend.

### Audio import hardening
`03-edge-functions/import-drive-audio/index.ts` now:
- authenticates the caller;
- verifies the requested `audio_sources` row belongs to the caller;
- verifies the source belongs to the requested Lesson;
- verifies `source_type = google_drive_import`;
- validates supported audio content types;
- enforces the 200MB application limit;
- records processing/error states;
- writes only to `{user_id}/{lesson_id}/...`.

## Supabase setup required for this phase

1. Enable Email / Magic Link provider in Supabase Auth.
2. Set the production Site URL to the deployed PWA URL.
3. Add the deployed PWA URL to Auth Redirect URLs, including `/auth` if required by the project configuration.
4. Deploy the Edge Function:

```bash
supabase functions deploy import-drive-audio
```

The function runtime must have the standard Supabase Edge environment and a valid `SUPABASE_SERVICE_ROLE_KEY` configured server-side. Never put that key in the PWA `.env`.

## What is intentionally NOT claimed complete

- Drill-aware audio pause/resume is not implemented yet.
- Voice recording/upload is not implemented yet.
- Transcript/STT/AI extraction pipeline is not implemented yet.
- Dedicated large-audio offline cache is not implemented yet.
- PWA icon artwork is still placeholder.
- Actual production deployment cannot be verified from this archive without the user's Supabase project credentials/deployment target.

## Roadmap

Completed:
`1 → 2 → 3 → 4 → 5 → 6 → 7A → 7B → 7C → 7D → 8`

Remaining:
- **Phase 9 — Transcript + AI Extraction**
- **Phase 10 — Continuous Audio Drill + Smart Pause + Voice**

## Next phase

**Phase 9 — Transcript + AI Extraction.**

The next implementation should begin by reading:
1. `00-COMPLETE-CONTINUATION-CONTEXT.md`
2. `00-HANDOFF-SUMMARY.md`
3. `08-PHASE8-HANDOFF.md`
4. `01-architecture-docs/MK_English_Pro_Architecture.md`

Then implement the ingestion pipeline around the existing `audio_sources`, `transcript_turns`, `patterns`, `drill_items`, `vocabulary`, and `extracted_insights` tables. Do not replace the current hierarchy or Mastery system.
