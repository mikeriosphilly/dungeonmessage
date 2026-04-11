import { createClient } from "@supabase/supabase-js";
import { cookieGet, cookieSet, cookieRemove } from "./cookies";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Keep a cookie backup of the auth tokens, updated on every auth state change.
// iOS Safari aggressively evicts localStorage for inactive tabs (e.g. after the
// screen locks), which drops the Supabase auth token. The cookie backup lets
// ensureAnonAuth restore the existing anonymous session rather than creating a
// new one (which would break RLS access to existing player rows).
// Cookies survive localStorage eviction on iOS Safari.
if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event, session) => {
    if (session?.access_token && session?.refresh_token) {
      cookieSet("tw_auth_backup", JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      }));
    } else if (event === "SIGNED_OUT") {
      cookieRemove("tw_auth_backup");
    }
  });
}

if (import.meta.env.DEV) {
  window.supabase = supabase;
}
