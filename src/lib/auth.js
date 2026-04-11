import { supabase } from "./supabaseClient";

export async function ensureAnonAuth() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  if (!data?.session) {
    const { error: signErr } = await supabase.auth.signInAnonymously();
    if (signErr) throw signErr;
  }
}
