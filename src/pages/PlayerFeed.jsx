import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  useParams,
  useSearchParams,
  useNavigate,
  Link,
} from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { avatarSrcFromKey } from "../lib/avatars";
import { ensureAnonAuth } from "../lib/auth";
import envelopeImg from "../assets/envelope.png";
import bgPaper from "../assets/bg_paper.jpg";
import bgWood from "../assets/bg_wood.jpg";
import AppHeader from "../components/AppHeader";

function MagicText({ text }) {
  const chars = useMemo(() => {
    const total = text.length;
    return text.split("").map((char, i) => ({
      char,
      delay: (i / total) * 1.8,
    }));
  }, [text]);

  return (
    <>
      {chars.map(({ char, delay }, i) =>
        char === "\n" ? (
          <br key={i} />
        ) : (
          <span
            key={i}
            className="tw-magic-char"
            style={{ animationDelay: `${delay.toFixed(3)}s` }}
          >
            {char}
          </span>
        )
      )}
    </>
  );
}

export default function PlayerFeed() {
  useEffect(() => {
    document.body.style.backgroundImage = `url(${bgPaper})`;
    document.body.style.backgroundSize = "420px 420px";
    return () => {
      document.body.style.backgroundImage = `url(${bgWood})`;
      document.body.style.backgroundSize = "960px auto";
    };
  }, []);

  const { code } = useParams();
  const [params] = useSearchParams();

  const tableCode = useMemo(() => (code || "").trim().toUpperCase(), [code]);
  const urlPlayerId = params.get("playerId");

  const storageKey = useMemo(() => `tw_playerId:${tableCode}`, [tableCode]);
  const openedStorageKey = useMemo(() => `tw_opened:${tableCode}`, [tableCode]);

  const getOpenedIds = useCallback(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(openedStorageKey) || "[]"));
    } catch {
      return new Set();
    }
  }, [openedStorageKey]);

  const persistOpenedId = useCallback((id) => {
    try {
      const opened = getOpenedIds();
      opened.add(id);
      localStorage.setItem(openedStorageKey, JSON.stringify([...opened]));
    } catch {}
  }, [openedStorageKey, getOpenedIds]);

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

  const [expired, setExpired] = useState(false);
  const navigate = useNavigate();

  const prevMessageIds = useRef(new Set());
  const initialLoadDone = useRef(false);

  // envelope animation state
  const [sealedIds, setSealedIds] = useState(() => new Set());
  const [openingIds, setOpeningIds] = useState(() => new Set());
  const [justOpenedIds, setJustOpenedIds] = useState(() => new Set());

  // Redirect to home if table is expired
  useEffect(() => {
    if (!expired) return;

    const t = setTimeout(() => {
      navigate("/", { replace: true });
    }, 3000);

    return () => clearTimeout(t);
  }, [expired, navigate]);

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
      const msg = (error.message || "").toLowerCase();

      // When the table is purged, player_get_inbox often ends up as "not allowed"
      if (msg.includes("not allowed")) {
        setExpired(true);
        return;
      }

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

  // Refresh inbox when user returns to the tab (mobile lock/unlock, app switching, etc.)
  useEffect(() => {
    if (!storedPlayerId) return;

    function onResume() {
      // Only refresh when we're actually visible/active
      if (document.visibilityState === "visible") {
        refreshInbox(storedPlayerId);
      }
    }

    document.addEventListener("visibilitychange", onResume);
    window.addEventListener("focus", onResume);
    window.addEventListener("pageshow", onResume); // Safari bfcache restore

    return () => {
      document.removeEventListener("visibilitychange", onResume);
      window.removeEventListener("focus", onResume);
      window.removeEventListener("pageshow", onResume);
    };
  }, [storedPlayerId, refreshInbox]);

  // Track message IDs; seal unread messages (skip already-opened ones)
  useEffect(() => {
    const currentIds = new Set(messages.map((m) => m.id));
    const openedIds = getOpenedIds();

    if (initialLoadDone.current) {
      // Realtime arrivals: new messages not previously seen or opened
      const newIds = messages
        .map((m) => m.id)
        .filter((id) => !prevMessageIds.current.has(id) && !openedIds.has(id));
      if (newIds.length > 0) {
        setSealedIds((prev) => new Set([...prev, ...newIds]));
      }
    } else {
      // Initial load: seal messages the player hasn't opened yet
      const unsealed = messages.map((m) => m.id).filter((id) => !openedIds.has(id));
      if (unsealed.length > 0) setSealedIds(new Set(unsealed));
      initialLoadDone.current = true;
    }

    prevMessageIds.current = currentIds;
  }, [messages, getOpenedIds]);

  const openEnvelope = useCallback((id) => {
    persistOpenedId(id);
    setOpeningIds((prev) => new Set([...prev, id]));
    setTimeout(() => {
      setSealedIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
      setOpeningIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
      setJustOpenedIds((prev) => new Set([...prev, id]));
    }, 450);
  }, [persistOpenedId]);

  // Realtime: when a message is inserted or updated for this table, refresh inbox
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
        (payload) => {
          const nextStatus = payload?.new?.status;
          if (nextStatus !== "sent") return;

          setTimeout(() => {
            if (!alive) return;
            refreshInbox(storedPlayerId);
          }, 150);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
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

  const isConnected = !!player && !error;

  return (
    <div style={styles.page}>
      <AppHeader
        avatarSrc={player ? avatarSrcFromKey(player.avatar_key) : null}
        connected={isConnected}
      />
      <div style={styles.wrap}>
      {expired && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: "rgba(0,0,0,0.75)" }}
        >
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/70 p-6 text-center shadow-2xl">
            <div className="text-xl font-extrabold text-white">
              This table has expired
            </div>
            <div className="mt-2 text-sm text-white/80">
              Redirecting you to the home page...
            </div>
          </div>
        </div>
      )}
      {/* Page header card */}
      <div style={styles.card}>
        <h1 style={styles.title}>{titleText}</h1>

        {player && (
          <p style={styles.playingAs}>
            Playing as <strong style={{ color: "var(--tw-text)" }}>{player.display_name}</strong>
          </p>
        )}

        {(loadingTable || loadingPlayer) && (
          <p style={styles.muted}>Loading...</p>
        )}

        {error && !expired && <p style={styles.error}>{error}</p>}

        {!storedPlayerId && (
          <p style={styles.muted}>
            Missing player session. Go back and join the table again.
          </p>
        )}

        {/* Decorative divider */}
        <div style={styles.headerDivider}>
          <div style={styles.headerDividerLine} />
          <span style={styles.headerDividerGem}>✦</span>
          <div style={styles.headerDividerLine} />
        </div>
      </div>

      {/* Messages live OUTSIDE the gradient card */}
      <div style={styles.msgList}>
        {messages.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyStateOrb} />
            <p style={styles.emptyStateText}>Awaiting word from your GM...</p>
            <p style={styles.emptyStateSub}>Messages will appear here as they are sent</p>
          </div>
        ) : (
          messages.map((m) => {
            const isSealed = sealedIds.has(m.id);
            const isOpening = openingIds.has(m.id);
            const justOpened = justOpenedIds.has(m.id);

            if (isSealed) {
              return (
                <div
                  key={m.id}
                  className={isOpening ? "tw-envelope-exit" : "tw-envelope-enter"}
                  style={styles.envelopeWrap}
                  onClick={isOpening ? undefined : () => openEnvelope(m.id)}
                >
                  <img
                    src={envelopeImg}
                    alt="New message — tap to open"
                    style={styles.envelopeImg}
                  />
                  <div className="tw-envelope-label" style={styles.envelopeLabel}>
                    Tap to reveal<br />secret message
                  </div>
                </div>
              );
            }

            return (
              <div
                key={m.id}
                className={`tw-parchment-card${justOpened ? " tw-msg-enter" : ""}`}
                style={styles.msgCard}
              >
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
                  <div style={styles.msgBody}>
                    {justOpened ? <MagicText text={m.body} /> : m.body}
                  </div>
                ) : (
                  !m.image_url && (
                    <div style={{ color: "rgba(0,0,0,0.65)" }}>
                      (No message text)
                    </div>
                  )
                )}
              </div>
            );
          })
        )}
      </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 60px)",
  },

  wrap: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "20px 16px",
    color: "var(--tw-text)",
  },

  card: {
    width: "min(680px, 100%)",
    borderRadius: 0,
    padding: 0,
    background: "transparent",
    border: "none",
    boxShadow: "none",
  },

  headerDivider: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginTop: 20,
    marginBottom: 4,
  },

  headerDividerLine: {
    flex: 1,
    height: 1,
    background: "linear-gradient(to right, transparent, rgba(151,130,98,0.35), transparent)",
  },

  headerDividerGem: {
    fontSize: 9,
    color: "rgba(181,160,120,0.6)",
    lineHeight: 1,
    userSelect: "none",
  },

  back: {
    textDecoration: "none",
    color: "var(--tw-text-muted)",
  },

  title: {
    marginTop: 16,
    marginBottom: 6,
    fontSize: 44,
    fontFamily: "var(--tw-font-heading)",
    color: "var(--tw-text)",
    lineHeight: 1.1,
  },

  playerHeader: {
    marginTop: 10,
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    border: "1px solid var(--tw-border)",
    background: "rgba(255,255,255,0.04)",
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 999,
    objectFit: "cover",
    border: "1px solid var(--tw-border)",
    background: "rgba(255,255,255,0.06)",
    display: "block",
  },

  playerName: {
    fontSize: 18,
    fontWeight: 800,
    color: "var(--tw-text)",
  },

  playingAs: {
    margin: "6px 0 0",
    fontFamily: "Lato, sans-serif",
    fontSize: "0.85rem",
    color: "var(--tw-text-muted)",
  },

  muted: { margin: 0, color: "var(--tw-text-muted)" },
  error: { marginTop: 12, color: "var(--tw-accent-2)" },

  msgList: {
    width: "min(680px, 100%)",
    display: "grid",
    gap: 12,
    marginTop: 24,
  },

  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 24px",
    textAlign: "center",
    position: "relative",
  },

  emptyStateOrb: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    border: "1px solid rgba(181,160,120,0.25)",
    background: "radial-gradient(circle at 40% 35%, rgba(181,160,120,0.12) 0%, rgba(0,0,0,0) 70%)",
    marginBottom: 20,
    boxShadow: "0 0 24px rgba(181,160,120,0.08)",
  },

  emptyStateText: {
    margin: 0,
    fontFamily: "var(--tw-font-heading)",
    fontSize: "1.3rem",
    color: "var(--tw-text-muted)",
    letterSpacing: "0.03em",
  },

  emptyStateSub: {
    margin: "8px 0 0",
    fontSize: "0.78rem",
    color: "rgba(184,173,150,0.5)",
    fontStyle: "italic",
  },

  msgCard: {},

  envelopeWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 170,
    cursor: "pointer",
  },

  envelopeImg: {
    width: 220,
    height: "auto",
    filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.5))",
    display: "block",
  },

  envelopeLabel: {
    position: "absolute",
    top: "calc(10% + 5px)",
    left: "50%",
    transform: "translateX(-50%)",
    width: "70%",
    textAlign: "center",
    fontFamily: "var(--tw-font-message)",
    fontSize: "0.9rem",
    lineHeight: 1.4,
    color: "rgba(20, 12, 5, 0.88)",
    userSelect: "none",
    pointerEvents: "none",
  },

  msgMeta: { fontSize: 12, color: "rgba(0,0,0,0.65)", marginBottom: 6 },

  msgImage: {
    width: "100%",
    maxHeight: 360,
    objectFit: "contain",
    borderRadius: 12,
    marginBottom: 10,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "#000",
  },

  msgBody: {
    fontFamily: "var(--tw-font-message)",
    fontSize: "1.05rem",
    color: "rgba(0,0,0,0.85)",
    whiteSpace: "pre-wrap",
    overflowWrap: "break-word",
    lineHeight: 1.45,
  },
};
