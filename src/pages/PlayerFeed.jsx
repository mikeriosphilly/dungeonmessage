import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { avatarSrcFromKey } from "../lib/avatars";
import { ensureAnonAuth } from "../lib/auth";

export default function PlayerFeed() {
  const { code } = useParams();
  const [params] = useSearchParams();

  const tableCode = useMemo(() => (code || "").trim().toUpperCase(), [code]);
  const urlPlayerId = params.get("playerId");

  const storageKey = useMemo(() => `tw_playerId:${tableCode}`, [tableCode]);

  const storedPlayerId = useMemo(() => {
    return urlPlayerId || localStorage.getItem(storageKey);
  }, [urlPlayerId, storageKey]);

  const [table, setTable] = useState(null);
  const [player, setPlayer] = useState(null);

  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");

  const [loadingTable, setLoadingTable] = useState(true);
  const [loadingPlayer, setLoadingPlayer] = useState(true);

  const tableId = table?.id || null;

  // Persist playerId per table
  useEffect(() => {
    if (urlPlayerId) localStorage.setItem(storageKey, urlPlayerId);
  }, [urlPlayerId, storageKey]);

  // Ensure anon auth
  useEffect(() => {
    ensureAnonAuth().catch(() => {
      // Later calls will show a readable error
    });
  }, []);

  // Load table (via get_table_public so this matches Join logic + avoids RLS surprises)
  useEffect(() => {
    let ignore = false;

    async function loadTable() {
      setLoadingTable(true);
      setError("");

      const { data: tableRes, error: tableErr } = await supabase.rpc(
        "get_table_public",
        { p_code: tableCode },
      );

      if (ignore) return;

      if (tableErr) {
        setError(tableErr.message || "Could not load table.");
        setTable(null);
        setLoadingTable(false);
        return;
      }

      const row = Array.isArray(tableRes) ? tableRes[0] : tableRes;
      const t = row?.table ?? row ?? null;

      if (!t) {
        setError("Table not found.");
        setTable(null);
      } else {
        setTable(t);
      }

      setLoadingTable(false);
    }

    if (tableCode.length >= 4) loadTable();
    else {
      setTable(null);
      setLoadingTable(false);
    }

    return () => {
      ignore = true;
    };
  }, [tableCode]);

  // Load player profile
  useEffect(() => {
    if (!storedPlayerId) {
      setLoadingPlayer(false);
      return;
    }

    let ignore = false;

    async function loadPlayer() {
      setLoadingPlayer(true);
      setError("");

      const { data, error } = await supabase.rpc("player_get_profile", {
        p_player_id: storedPlayerId,
      });

      if (ignore) return;

      if (error) {
        setError(error.message);
        setPlayer(null);
        setLoadingPlayer(false);
        return;
      }

      setPlayer(data?.player || null);
      setLoadingPlayer(false);
    }

    loadPlayer();

    return () => {
      ignore = true;
    };
  }, [storedPlayerId]);

  // Inbox refresh
  const refreshInbox = useCallback(async (playerId) => {
    if (!playerId) return;

    setError("");

    const { data, error } = await supabase.rpc("player_get_inbox", {
      p_player_id: playerId,
      p_limit: 50,
    });

    if (error) {
      setError(error.message);
      return;
    }

    setMessages(data?.messages || []);
  }, []);

  // Initial inbox load
  useEffect(() => {
    if (!storedPlayerId) return;
    refreshInbox(storedPlayerId);
  }, [storedPlayerId, refreshInbox]);

  // Realtime: when a message is inserted for this table, refresh inbox
  useEffect(() => {
    if (!tableId || !storedPlayerId) return;

    let alive = true;

    const channel = supabase
      .channel(`playerfeed:${tableId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `table_id=eq.${tableId}`,
        },
        () => {
          setTimeout(() => {
            if (!alive) return;
            refreshInbox(storedPlayerId);
          }, 150);
        },
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, [tableId, storedPlayerId, refreshInbox]);

  const titleText = table?.name || "Player Feed";

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <Link to="/" style={styles.back}>
          ← Home
        </Link>

        <div
          style={{ display: "flex", justifyContent: "space-between", gap: 12 }}
        >
          <h1 style={styles.title}>{titleText}</h1>
          <div style={styles.pill}>Table: {tableCode}</div>
        </div>

        {(loadingTable || loadingPlayer) && (
          <p style={styles.muted}>Loading...</p>
        )}

        {player && (
          <div style={styles.playerHeader}>
            <img
              src={avatarSrcFromKey(player.avatar_key)}
              alt=""
              style={styles.avatar}
            />
            <div>
              <div style={styles.playerName}>{player.display_name}</div>
              <div style={styles.muted}>You are connected.</div>
            </div>
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
                  {new Date(m.sent_at || m.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>

                {m.image_url && (
                  <img
                    src={m.image_url}
                    alt="GM sent image"
                    style={styles.msgImage}
                    loading="lazy"
                  />
                )}

                {m.body ? (
                  <div style={styles.msgBody}>{m.body}</div>
                ) : (
                  !m.image_url && (
                    <div style={{ color: "#666" }}>(No message text)</div>
                  )
                )}
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
  title: { marginTop: 12, marginBottom: 10, fontSize: 40, color: "#111" },
  pill: {
    alignSelf: "center",
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.06)",
    color: "#111",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 999,
    objectFit: "cover",
    border: "1px solid rgba(0,0,0,0.12)",
    background: "#fff",
    display: "block",
  },
  playerName: { fontSize: 18, color: "#111", fontWeight: 800 },

  muted: { margin: 0, color: "#666" },
  error: { marginTop: 12, color: "crimson" },

  msgCard: {
    padding: 14,
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "#fff",
  },
  msgMeta: { fontSize: 12, color: "#666", marginBottom: 6 },
  msgImage: {
    width: "100%",
    maxHeight: 360,
    objectFit: "contain",
    borderRadius: 12,
    marginBottom: 10,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "#000",
  },
  msgBody: { color: "#111", whiteSpace: "pre-wrap", lineHeight: 1.45 },
};
