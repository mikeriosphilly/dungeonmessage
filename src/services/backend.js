import { supabase } from "../lib/supabaseClient";

export function getDmSessionId() {
  let id = localStorage.getItem("tw_dm_session_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("tw_dm_session_id", id);
  }
  return id;
}

export async function startTable(tableName) {
  const dmSessionId = getDmSessionId();

  const { data, error } = await supabase.rpc("start_table", {
    table_name: tableName,
    dm_session_id: dmSessionId,
  });

  if (error) throw error;
  return data; // returns the new table row with code
}

export async function joinTable(code, displayName, avatarKey) {
  const tableCode = code.trim().toUpperCase();

  const { data: table, error: tableErr } = await supabase
    .from("tables")
    .select("*")
    .eq("code", tableCode)
    .eq("status", "active")
    .single();

  if (tableErr) throw tableErr;

  const { data: player, error: playerErr } = await supabase
    .from("players")
    .insert({
      table_id: table.id,
      display_name: displayName.trim(),
      avatar_key: avatarKey,
      avatar_seed: crypto.randomUUID(),
    })
    .select("*")
    .single();

  if (playerErr) throw playerErr;

  return { table, player };
}
