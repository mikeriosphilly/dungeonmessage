import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function PlayerFeed() {
  const { code } = useParams();
  const [params] = useSearchParams();

  const tableCode = useMemo(() => (code || "").toUpperCase(), [code]);

  const urlPlayerId = params.get("playerId");

  // Store player id PER TABLE so multiple tables don't collide
  const storageKey = useMemo(() => `tw_playerId:${tableCode}`, [tableCode]);

  const storedPlayerId = useMemo(() => {
    return urlPlayerId || localStorage.getItem(storageKey);
  }, [urlPlayerId, storageKey]);

  const [table, setTable] = useState(null);
  const [player, setPlayer] = useState(null);

  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");

  // Save playerId locally so we can hide it from UI
  useEffect(() => {
    if (urlPlayerId) localStorage.setItem(storageKey, urlPlayerId);
  }, [urlPlayerId, storageKey]);

  // Load table info (for table name)
  useEffect(() => {
    let ignore = false;

    async function loadTable() {
      const { data, error } = await supabase
        .from("tables")
        .select("id, name, status")
        .eq("code", tableCode)
        .single();

      if (!ignore) {
        if (error) setError(error.message);
        else setTable(data);
      }
    }

    loadTable();
    return () => {
      ignore = true;
    };
  }, [tableCode]);

  // Load player info
  useEffect(() => {
    if (!storedPlayerId) return;

    let ignore = false;

    async function loadPlayer() {
      const { data, error } = await supabase
        .from("players")
        .select("id, display_name")
        .eq("id", storedPlayerId)
        .single();

      if (!ignore) {
        if (!error) setPlayer(data);
      }
    }

    loadPlayer();
    return () => {
      ignore = true;
    };
  }, [storedPlayerId]);

  // Initial load of messages for this player (KEEPING YOUR WORKING VERSION)
  useEffect(() => {
    if (!storedPlayerId) return;

    let ignore = false;

    async function loadMessages() {
      setError("");

      const { data: recs, error: recErr } = await supabase
        .from("message_recipients")
        .select("message_id, opened_at, created_at")
        .eq("player_id", storedPlayerId)
        .order("created_at", { ascending: false });

      if (recErr) {
        if (!ignore) setError(recErr.message);
        return;
      }

      const ids = (recs || []).map((r) => r.message_id);
      if (!ids.length) {
        if (!ignore) setMessages([]);
        return;
      }

      const { data: msgs, error: msgErr } = await supabase
        .from("messages")
        .select("id, body, created_at, deleted_at")
        .in("id", ids)
        .is("deleted_at", null);

      if (msgErr) {
        if (!ignore) setError(msgErr.message);
        return;
      }

      const byId = new Map((msgs || []).map((m) => [m.id, m]));
      const merged = (recs || [])
        .map((r) => {
          const m = byId.get(r.message_id);
          if (!m) return null;
          return {
            ...m,
            opened_at: r.opened_at,
            recipient_created_at: r.created_at,
          };
        })
        .filter(Boolean)
        .sort(
          (a, b) =>
            new Date(b.recipient_created_at) - new Date(a.recipient_created_at)
        );

      if (!ignore) setMessages(merged);
    }

    loadMessages();
    return () => {
      ignore = true;
    };
  }, [storedPlayerId]);

  // Realtime: new recipient rows for this player (KEEPING YOUR WORKING VERSION)
  useEffect(() => {
    if (!storedPlayerId) return;

    const channel = supabase
      .channel(`mr:${storedPlayerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "message_recipients",
          filter: `player_id=eq.${storedPlayerId}`,
        },
        async (payload) => {
          const rec = payload.new;

          const { data: msg } = await supabase
            .from("messages")
            .select("id, body, created_at, deleted_at")
            .eq("id", rec.message_id)
            .single();

          if (!msg || msg.deleted_at) return;

          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [
              {
                ...msg,
                opened_at: rec.opened_at,
                recipient_created_at: rec.created_at,
              },
              ...prev,
            ];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storedPlayerId]);

  const titleText =
    table?.name || (table?.status === "active" ? "Table" : "Session");

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <Link to="/" style={styles.back}>
          ← Home
        </Link>

        {/* Table name as title */}
        <h1 style={styles.title}>{titleText}</h1>

        {/* Player identity, no "You are" label */}
        {player && (
          <div style={styles.playerHeader}>
            <div style={styles.playerAvatar} aria-hidden="true">
              {player.display_name?.trim()?.[0]?.toUpperCase() || "?"}
            </div>
            <div style={styles.playerName}>{player.display_name}</div>
          </div>
        )}

        {error && <p style={styles.error}>{error}</p>}

        <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
          {messages.length === 0 ? (
            <p style={styles.muted}>Waiting for messages...</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} style={styles.msgCard}>
                <div style={styles.msgMeta}>
                  {new Date(m.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div style={styles.msgBody}>{m.body}</div>
              </div>
            ))
          )}
        </div>

        {!storedPlayerId && (
          <p style={styles.muted}>
            Missing player session. Go back and join the table again.
          </p>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 24,
    background: "#1f1f1f",
  },
  card: {
    width: "min(900px, 100%)",
    borderRadius: 18,
    padding: 24,
    background: "white",
    border: "1px solid rgba(0,0,0,0.12)",
  },
  back: { textDecoration: "none", color: "#444" },

  title: { marginTop: 12, marginBottom: 10, fontSize: 32, color: "#111" },

  playerHeader: {
    marginTop: 10,
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "#fff",
  },
  playerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    background: "#111",
    color: "#fff",
    fontWeight: 800,
  },
  playerName: { fontSize: 18, color: "#111", fontWeight: 700 },

  muted: { margin: 0, color: "#666" },
  error: { marginTop: 12, color: "crimson" },

  msgCard: {
    padding: 14,
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "#fff",
  },
  msgMeta: { fontSize: 12, color: "#666", marginBottom: 6 },
  msgBody: { color: "#111", whiteSpace: "pre-wrap", lineHeight: 1.45 },
};
