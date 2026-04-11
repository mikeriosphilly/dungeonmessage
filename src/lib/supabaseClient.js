import { createClient } from "@supabase/supabase-js";
import { cookieGet, cookieSet, cookieRemove } from "./cookies";

// Hybrid storage: write to both cookies and localStorage; read cookies first.
// iOS Safari aggressively evicts localStorage for inactive tabs (e.g. after the
// screen locks for an extended period), which drops the Supabase auth token and
// creates a new anonymous user on resume — breaking RLS access to existing
// player rows. Cookies are not subject to the same eviction policy.
const hybridStorage = {
  getItem(key) {
    return cookieGet(key) ?? (typeof localStorage !== "undefined" ? localStorage.getItem(key) : null);
  },
  setItem(key, value) {
    cookieSet(key, value);
    try { localStorage.setItem(key, value); } catch {}
  },
  removeItem(key) {
    cookieRemove(key);
    try { localStorage.removeItem(key); } catch {}
  },
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { storage: hybridStorage },
});

if (import.meta.env.DEV) {
  window.supabase = supabase;
}
