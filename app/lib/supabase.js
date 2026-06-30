import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Null-safe: if env vars are missing, supabase stays null and the app
// falls back to local-only mode instead of crashing.
export const supabase = url && key ? createClient(url, key) : null;
export const hasSupabase = !!(url && key);