# Phase 10 final hardening

Implemented in this package:

- Removed the broken root `package-lock.json` so Cloudflare uses the app's real `package.json` and runs a normal install.
- Listening progress is now keyed by `(user, lesson, audio source)` so multiple audio sources in one lesson cannot overwrite each other.
- Listening-progress writes are serialized in the browser and RPC errors are surfaced.
- The listening RPC verifies that the authenticated user owns the lesson/audio source.
- Study Lab approval is atomic through `publish_ai_content_draft`.
- Draft publishing validates levels/categories and assigns deterministic order indexes.
- Exercise-to-pattern matching is normalized and remains gated behind an approved pattern.
- AI study-material JSON now uses JSON mode plus strict runtime validation and bounded transcript size.
- Google Drive import remains user-authenticated and server-side for Storage operations.
- Cloudflare Pages SPA fallback and immutable asset headers are included.

## Important deployment boundary

Cloudflare Pages deploys the Vite PWA. Supabase database migrations and Edge Functions are separate. Apply the migration and deploy the Edge Functions to Supabase before relying on the hardened database/AI flows.
