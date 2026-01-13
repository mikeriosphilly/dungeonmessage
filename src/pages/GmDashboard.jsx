import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { gmStyles as styles } from "../styles/gmStyles";

import GmHeader from "../components/gm/GmHeader";
import PlayerGrid from "../components/gm/PlayerGrid";
import MessageLog from "../components/gm/MessageLog";

export default function GmDashboard() {
  const { code } = useParams();
  const tableCode = useMemo(() => (code || "").toUpperCase(), [code]);

  const [table, setTable] = useState(null);
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState("");

  // composer state
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendToEveryone, setSendToEveryone] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  // message log state
  const [logItems, setLogItems] = useState([]);

  function toggleRecipient(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  // When "send to everyone" is checked, clear specific selections
  useEffect(() => {
    if (sendToEveryone) setSelectedIds([]);
  }, [sendToEveryone]);

  // If players change, remove any selectedIds that no longer exist
  useEffect(() => {
    setSelectedIds((prev) =>
      prev.filter((id) => players.some((p) => p.id === id))
    );
  }, [players]);

  // 1) Load table by code
  useEffect(() => {
    let ignore = false;

    async function loadTable() {
      setError("");

      const { data, error } = await supabase
        .from("tables")
        .select("*")
        .eq("code", tableCode)
        .eq("status", "active")
        .single();

      if (ignore) return;

      if (error) setError(error.message);
      else setTable(data);
    }

    if (tableCode) loadTable();

    return () => {
      ignore = true;
    };
  }, [tableCode]);

  // 2) Load current players (initial)
  useEffect(() => {
    if (!table?.id) return;

    let ignore = false;

    async function loadPlayers() {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("table_id", table.id)
        .order("created_at", { ascending: true });

      if (ignore) return;

      if (error) setError(error.message);
      else setPlayers(data || []);
    }

    loadPlayers();

    return () => {
      ignore = true;
    };
  }, [table?.id]);

  // 3) Realtime: players join (INSERT) and updates (UPDATE)
  useEffect(() => {
    if (!table?.id) return;

    const channel = supabase
      .channel(`players:${table.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "players",
          filter: `table_id=eq.${table.id}`,
        },
        (payload) => {
          const newPlayer = payload.new;
          setPlayers((prev) => {
            if (prev.some((p) => p.id === newPlayer.id)) return prev;
            return [...prev, newPlayer];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "players",
          filter: `table_id=eq.${table.id}`,
        },
        (payload) => {
          const updated = payload.new;
          setPlayers((prev) =>
            prev.map((p) => (p.id === updated.id ? updated : p))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table?.id]);

  // Helper: refresh the log (messages + recipients)
  async function refreshLog(tableId) {
    // Pull recent messages
    const { data: msgs, error: msgErr } = await supabase
      .from("messages")
      .select("id, body, created_at")
      .eq("table_id", tableId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (msgErr) {
      setError(msgErr.message);
      return;
    }

    const messageIds = (msgs || []).map((m) => m.id);
    if (!messageIds.length) {
      setLogItems([]);
      return;
    }

    // Pull recipients and join player names
    const { data: recs, error: recErr } = await supabase
      .from("message_recipients")
      .select("message_id, players ( id, display_name )")
      .in("message_id", messageIds);

    if (recErr) {
      setError(recErr.message);
      return;
    }

    const byMsg = new Map();
    (recs || []).forEach((r) => {
      const arr = byMsg.get(r.message_id) || [];
      const p = r.players;
      if (p?.id) arr.push({ id: p.id, display_name: p.display_name });
      byMsg.set(r.message_id, arr);
    });

    const merged = (msgs || []).map((m) => ({
      ...m,
      recipients: byMsg.get(m.id) || [],
    }));

    setLogItems(merged);
  }

  // 4) Load message log (initial)
  useEffect(() => {
    if (!table?.id) return;

    let ignore = false;

    async function loadLog() {
      setError("");
      await refreshLog(table.id);
    }

    loadLog();

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table?.id]);

  // 5) Realtime: when a message is inserted, refresh log (avoids recipient race)
  useEffect(() => {
    if (!table?.id) return;

    let alive = true;

    const channel = supabase
      .channel(`messages:${table.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `table_id=eq.${table.id}`,
        },
        async () => {
          // Give message_recipients a moment to insert
          setTimeout(async () => {
            if (!alive) return;
            await refreshLog(table.id);
          }, 150);
        }
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table?.id]);

  async function sendMessage() {
    if (!table?.id) return;
    if (!draft.trim()) return;

    setSending(true);
    setError("");

    try {
      // Decide recipients
      const recipientPlayers = sendToEveryone
        ? players
        : players.filter((p) => selectedIds.includes(p.id));

      if (!recipientPlayers.length) {
        throw new Error("No recipients selected.");
      }

      // 1) Create message
      const { data: msg, error: msgErr } = await supabase
        .from("messages")
        .insert({
          table_id: table.id,
          kind: "text",
          body: draft.trim(),
        })
        .select("*")
        .single();

      if (msgErr) throw msgErr;

      // 2) Create recipient rows
      const rows = recipientPlayers.map((p) => ({
        message_id: msg.id,
        player_id: p.id,
      }));

      const { error: recErr } = await supabase
        .from("message_recipients")
        .insert(rows);
      if (recErr) throw recErr;

      setDraft("");
      if (!sendToEveryone) setSelectedIds([]);
    } catch (e) {
      setError(e.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  const sendDisabled =
    sending ||
    !draft.trim() ||
    !players.length ||
    (!sendToEveryone && selectedIds.length === 0);

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <GmHeader tableName={table?.name} tableCode={tableCode} />

        {error && <p style={styles.error}>{error}</p>}

        {/* Send Message */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Send message</h2>

          <label style={localStyles.checkboxRow}>
            <input
              type="checkbox"
              checked={sendToEveryone}
              onChange={(e) => setSendToEveryone(e.target.checked)}
            />
            <span style={localStyles.checkboxLabel}>Send to everyone</span>
          </label>

          {!sendToEveryone && (
            <div style={{ marginTop: 10 }}>
              <div style={localStyles.pickLabel}>Pick recipients</div>

              {players.length === 0 ? (
                <p style={styles.muted}>No players yet.</p>
              ) : (
                <div style={localStyles.pillWrap}>
                  {players.map((p) => {
                    const selected = selectedIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleRecipient(p.id)}
                        style={{
                          ...localStyles.pill,
                          ...(selected ? localStyles.pillSelected : null),
                        }}
                      >
                        {p.display_name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a secret note..."
            style={styles.textarea}
            rows={4}
          />

          <button
            onClick={sendMessage}
            disabled={sendDisabled}
            style={{
              ...styles.button,
              marginTop: 12,
              width: "100%",
              opacity: sendDisabled ? 0.6 : 1,
              cursor: sendDisabled ? "not-allowed" : "pointer",
            }}
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </div>

        <PlayerGrid tableLoaded={!!table} players={players} error={error} />

        <MessageLog items={logItems} />
      </div>
    </div>
  );
}

const localStyles = {
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    userSelect: "none",
  },
  checkboxLabel: {
    color: "#111",
    fontWeight: 600,
  },
  pickLabel: {
    fontSize: 12,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  pillWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    border: "1px solid rgba(0,0,0,0.18)",
    background: "#fff",
    color: "#111",
    padding: "8px 10px",
    borderRadius: 999,
    cursor: "pointer",
    fontWeight: 600,
  },
  pillSelected: {
    background: "#111",
    color: "#fff",
    border: "1px solid rgba(0,0,0,0.18)",
  },
};
