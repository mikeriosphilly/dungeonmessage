import { supabase } from "../lib/supabaseClient";
import { ensureAnonAuth } from "../lib/auth";

const GM_INACTIVITY_HOURS = 6;

export function getDmSessionId() {
  let id = localStorage.getItem("tw_dm_session_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("tw_dm_session_id", id);
  }
  return id;
}

export async function startTable(tableName) {
  await ensureAnonAuth();

  const dmSessionId = getDmSessionId();

  const { data, error } = await supabase.rpc("start_table", {
    table_name: (tableName || "").trim(),
    dm_session_id: dmSessionId,
  });

  if (error) throw error;
  return data; // should include code + gm_secret
}

export async function joinTable(code, displayName, avatarKey) {
  await ensureAnonAuth();

  const tableCode = (code || "").trim().toUpperCase();
  if (!tableCode) throw new Error("Please enter a table code.");

  const { data: tableRes, error: tableErr } = await supabase.rpc(
    "get_table_public",
    { p_code: tableCode },
  );

  if (tableErr) throw tableErr;

  // handle { table: ... } OR direct row OR array
  const row = Array.isArray(tableRes) ? tableRes[0] : tableRes;
  const table = row?.table ?? row ?? null;

  if (!table) throw new Error("That table code does not exist.");

  if (table.status !== "active") throw new Error("That session is not active.");

  const last = table.last_gm_activity_at
    ? new Date(table.last_gm_activity_at).getTime()
    : 0;

  const now = Date.now();
  const maxAgeMs = GM_INACTIVITY_HOURS * 60 * 60 * 1000;

  if (!last || now - last > maxAgeMs) {
    throw new Error("That session looks inactive. Ask your GM to reopen it.");
  }

  const cleanedName = (displayName || "").trim();
  if (!cleanedName) throw new Error("Please enter a name.");

  // IMPORTANT: joining should be via RPC (RLS-safe)
  const { data: sess } = await supabase.auth.getSession();
  console.log("joinTable auth check:", {
    hasSession: !!sess.session,
    userId: sess.session?.user?.id ?? null,
  });

  const { data, error } = await supabase.rpc("player_join_table", {
    p_code: tableCode,
    p_display_name: cleanedName,
    p_avatar_key: avatarKey || "01",
  });
  console.log("player_join_table raw:", { data, error });

  if (error) throw error;

  const joinedRow = Array.isArray(data) ? data[0] : data;
  const player = joinedRow?.player ?? joinedRow ?? null;

  if (!player) throw new Error("Could not join table.");

  return { table, player };
}
