# Cloudflare Pages

- Root directory: `04-pwa-app`
- Build command: `npm install && npm run build`
- Output directory: `dist`
- Node.js: 20+
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

Cloudflare Pages handles the Vite SPA deployment from GitHub. Supabase Edge Functions and SQL migrations are separate and are not deployed by Cloudflare Pages.
