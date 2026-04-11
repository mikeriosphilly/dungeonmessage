import { supabase } from "./supabaseClient";
import { cookieGet } from "./cookies";

export async function ensureAnonAuth() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  if (!data?.session) {
    // localStorage was likely evicted by iOS Safari. Try to restore the existing
    // anonymous session from the cookie backup before creating a new user.
    // Creating a new user would break RLS access to the player's existing rows.
    const backup = cookieGet("tw_auth_backup");
    if (backup) {
      try {
        const { access_token, refresh_token } = JSON.parse(backup);
        if (access_token && refresh_token) {
          const { error: setErr } = await supabase.auth.setSession({ access_token, refresh_token });
          if (!setErr) return; // session restored — same anonymous user as before
        }
      } catch {}
    }

    const { error: signErr } = await supabase.auth.signInAnonymously();
    if (signErr) throw signErr;
  }
}
