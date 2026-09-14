import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Add them to your local .env or Cloudflare Pages environment variables."
  );
}

// Keep the client un-generic here. The hand-maintained Database shape in
// src/types/database.ts is used by the UI as domain types, but older versions
// of @supabase/supabase-js can infer `never` for queries when a partial generic
// schema is supplied. A runtime client avoids that build-time failure while
// preserving the same Supabase API and RLS behavior.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
