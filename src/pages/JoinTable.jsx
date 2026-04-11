import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Head } from "vite-react-ssg";
import { joinTable } from "../services/backend";
import { avatarSrcFromKey, randomAvatarKey, AVATAR_KEYS } from "../lib/avatars";
import { ensureAnonAuth } from "../lib/auth";
import { supabase } from "../lib/supabaseClient";

const GM_INACTIVITY_HOURS = 6;

export default function JoinTable() {
  const [avatarKey, setAvatarKey] = useState(() => randomAvatarKey());
  const [pickerOpen, setPickerOpen] = useState(false);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [tableOk, setTableOk] = useState(false);
  const [tableName, setTableName] = useState("");
  const [authReady, setAuthReady] = useState(false);

  const [lastSession, setLastSession] = useState(null);
  const [lastTableName, setLastTableName] = useState("");

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const popoverRef = useRef(null);
  const buttonRef = useRef(null);
  const nameRef = useRef(null);

  const canJoin =
    code.trim().length >= 4 && name.trim().length > 0 && !busy && tableOk;

  const keys = useMemo(() => {
    return Array.isArray(AVATAR_KEYS) && AVATAR_KEYS.length
      ? AVATAR_KEYS
      : ["01", "02", "03", "04", "05", "06", "08"];
  }, []);

  useEffect(() => {
    const fromUrl = (searchParams.get("code") || "").trim().toUpperCase();
    if (fromUrl && fromUrl !== code) {
      setCode(fromUrl);
      setTimeout(() => nameRef.current?.focus(), 0);
    }
  }, [searchParams]);

  useEffect(() => {
    let alive = true;
    async function boot() {
      try {
        setError("");
        await ensureAnonAuth();
        const { data } = await supabase.auth.getSession();
        if (!alive) return;
        setAuthReady(!!data?.session);
      } catch (e) {
        if (!alive) return;
        setAuthReady(false);
        setError(e?.message || "Auth failed. Please refresh.");
      }
    }
    boot();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("tw_last_session");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed?.tableCode) return;
      (async () => {
        const { data } = await supabase.rpc("get_table_public", { p_code: parsed.tableCode });
        const row = Array.isArray(data) ? data[0] : data;
        const table = row?.table ?? row ?? null;
        if (!table?.name) return;
        setLastSession(parsed);
        setLastTableName(table.name);
      })();
    } catch {
      localStorage.removeItem("tw_last_session");
    }
  }, []);

  useEffect(() => {
    function onDown(e) {
      if (!pickerOpen) return;
      if (popoverRef.current?.contains(e.target) || buttonRef.current?.contains(e.target)) return;
      setPickerOpen(false);
    }
    function onKey(e) {
      if (pickerOpen && e.key === "Escape") setPickerOpen(false);
    }
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [pickerOpen]);

  useEffect(() => {
    const trimmed = code.trim().toUpperCase();
    setTableOk(false);
    setTableName("");
    if (!authReady || trimmed.length < 4) { setError(""); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        await ensureAnonAuth();
        const { data } = await supabase.rpc("get_table_public", { p_code: trimmed });
        if (cancelled) return;
        const row = Array.isArray(data) ? data[0] : data;
        const table = row?.table ?? row ?? null;
        if (!table) { setError("That table code does not exist."); return; }
        if (table.status !== "active") { setError("That session is not active."); return; }
        const last = table.last_gm_activity_at ? new Date(table.last_gm_activity_at).getTime() : 0;
        void last; void GM_INACTIVITY_HOURS;
        setTableOk(true);
        setTableName(table.name || "");
        setError("");
      } catch (e) {
        if (!cancelled) setError("Could not validate table.");
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [code, authReady]);

  async function onJoin() {
    setBusy(true);
    setError("");
    try {
      await ensureAnonAuth();
      const { table, player } = await joinTable(code, name, avatarKey);
      localStorage.setItem("tw_last_session", JSON.stringify({
        tableCode: table.code,
        displayName: name,
        avatarKey,
      }));
      navigate(`/table/${table.code}?playerId=${player.id}&avatarKey=${avatarKey}`);
    } catch (e) {
      setError(e?.message || "Could not join table.");
    } finally {
      setBusy(false);
    }
  }

  async function onRejoin() {
    if (!lastSession) return;
    setBusy(true);
    setError("");
    try {
      await ensureAnonAuth();
      const { table, player } = await joinTable(
        lastSession.tableCode,
        lastSession.displayName,
        lastSession.avatarKey,
      );
      navigate(`/table/${table.code}?playerId=${player.id}&avatarKey=${lastSession.avatarKey}`);
    } catch (e) {
      setError(e?.message || "Could not rejoin that table. It may have expired.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.page}>
      <Head>
        <title>You've been invited to the table — DungeonMessage</title>
        <meta name="description" content="Your Game Master is waiting. Join the table to receive secret messages, clues, and notes during your session." />
        <meta property="og:title" content="You've been invited to the table" />
        <meta property="og:description" content="Your Game Master is waiting. Join the table to receive secret messages, clues, and notes during your session." />
        <meta property="og:url" content="https://dungeonmessage.com/join" />
        <meta name="twitter:title" content="You've been invited to the table" />
        <meta name="twitter:description" content="Your Game Master is waiting. Join the table to receive secret messages, clues, and notes during your session." />
      </Head>
      <div style={styles.wrap}>
      <div style={styles.inner}>

        <h1
          className="landing-fade-up"
          style={{ fontSize: "clamp(42px, 8vw, 64px)", margin: "4px 0 0", animationDelay: "0.1s" }}
        >
          Join a Table
        </h1>

        <div
          className="landing-fade-up landing-divider"
          style={{ animationDelay: "0.22s" }}
        >
          <span className="landing-divider-line" />
          <span className="landing-divider-gem">◆</span>
          <span className="landing-divider-line" />
        </div>

        <p
          className="landing-fade-up"
          style={{ ...styles.subtitle, animationDelay: "0.32s" }}
        >
          Enter the code your Game Master shared<br />
          and choose your adventurer identity.
        </p>

        {/* Resume session */}
        {lastSession && lastTableName && (
          <div
            className="landing-fade-up"
            style={{ ...styles.resumeBox, animationDelay: "0.38s" }}
          >
            <div style={styles.resumeText}>
              <span style={styles.resumeLabel}>Last session</span>
              <span style={styles.resumeDetail}>
                "{lastTableName}" as <strong style={{ color: "#D5CDBE" }}>{lastSession.displayName}</strong>
              </span>
            </div>
            <button
              style={{ ...styles.rejoinBtn, ...(busy ? styles.btnDisabled : {}) }}
              disabled={busy}
              onClick={onRejoin}
              className="landing-btn-start"
            >
              {busy ? "Rejoining..." : "Jump back in"}
            </button>
          </div>
        )}

        {/* Form */}
        <div
          className="landing-fade-up"
          style={{ ...styles.form, animationDelay: "0.44s" }}
        >
          {/* Table code */}
          <label style={styles.label}>Table code</label>
          <input
            style={{
              ...styles.input,
              ...(code.trim().length >= 4 && !tableOk && error ? styles.inputError : {}),
              ...(tableOk ? styles.inputOk : {}),
            }}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="K7F9Q"
          />

          {tableOk && tableName && (
            <div style={styles.tableNameHint}>
              ✦ {tableName}
            </div>
          )}

          {/* Avatar */}
          <label style={styles.label}>Your avatar</label>
          <div style={styles.avatarRow}>
            <div style={styles.avatarPreviewWrap}>
              <button
                type="button"
                onClick={() => setPickerOpen((v) => !v)}
                style={styles.avatarPreviewBtn}
                aria-label="Open avatar picker"
              >
                <img
                  src={avatarSrcFromKey(avatarKey)}
                  alt="Your avatar"
                  style={styles.avatarPreviewImg}
                />
              </button>

              {pickerOpen && (
                <div ref={popoverRef} style={styles.popover}>
                  <div style={styles.popoverTitle}>Choose your avatar</div>
                  <div style={styles.grid}>
                    {keys.map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => { setAvatarKey(k); setPickerOpen(false); }}
                        className="avatar-thumb"
                        style={{
                          ...styles.thumbBtn,
                          ...(k === avatarKey ? styles.thumbBtnSelected : {}),
                        }}
                      >
                        <img src={avatarSrcFromKey(k)} alt="" style={styles.thumbImg} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              ref={buttonRef}
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              style={styles.changeAvatarBtn}
            >
              Change avatar
            </button>
          </div>

          {/* Name */}
          <label style={styles.label}>Your name</label>
          <input
            ref={nameRef}
            style={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && canJoin && onJoin()}
            placeholder="Ser Aldric of the Mist"
          />

          {/* Submit */}
          <button
            style={{
              ...styles.submitBtn,
              ...(!canJoin ? styles.submitBtnDisabled : {}),
            }}
            disabled={!canJoin}
            onClick={onJoin}
            className={canJoin ? "landing-btn-start" : ""}
          >
            {busy ? "Entering the session..." : "Join table"}
          </button>

          {error && <p style={styles.error}>{error}</p>}
        </div>

        <Link to="/" style={styles.backLink} className="landing-fade-up">
          ← Back to home
        </Link>

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
  },

  wrap: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 24px",
  },

  inner: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    width: "min(520px, 100%)",
  },

  logo: {
    width: 88,
    height: 88,
    objectFit: "contain",
    display: "block",
    margin: "0 auto",
    filter: "drop-shadow(0 4px 16px rgba(245, 220, 140, 0.2))",
  },

  subtitle: {
    fontFamily: "var(--tw-font-message)",
    fontStyle: "italic",
    fontSize: "1.15rem",
    lineHeight: 1.7,
    color: "var(--tw-text-muted)",
    margin: "0 0 24px",
  },

  resumeBox: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    padding: "14px 18px",
    border: "1px solid rgba(245, 236, 205, 0.15)",
    background: "rgba(255,255,255,0.03)",
    marginBottom: 24,
    textAlign: "left",
  },

  resumeText: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    minWidth: 0,
  },

  resumeLabel: {
    fontFamily: "Lato, sans-serif",
    fontSize: "0.7rem",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--tw-text-muted)",
  },

  resumeDetail: {
    fontFamily: "Lato, sans-serif",
    fontSize: "0.9rem",
    color: "var(--tw-text-muted)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  rejoinBtn: {
    flexShrink: 0,
    padding: "10px 16px",
    background: "#434135",
    border: "1px solid #978262",
    boxShadow: "inset 0 0 12px 1px rgba(155, 127, 63, 0.7)",
    color: "#F5ECCD",
    fontFamily: "var(--tw-font-heading)",
    fontSize: "1rem",
    letterSpacing: "0.03em",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "transform 0.15s ease, filter 0.15s ease",
  },

  btnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },

  form: {
    width: "100%",
    textAlign: "left",
  },

  label: {
    display: "block",
    fontFamily: "Lato, sans-serif",
    fontWeight: 700,
    fontSize: "0.8rem",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--tw-text-muted)",
    marginBottom: 8,
    marginTop: 20,
  },

  input: {
    width: "100%",
    padding: "14px 16px",
    background: "#0D1013",
    border: "1px solid #6A7984",
    color: "#D5CDBE",
    fontSize: 16,
    fontFamily: "Lato, sans-serif",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s ease",
  },

  inputError: {
    borderColor: "rgba(194, 3, 3, 0.8)",
    boxShadow: "0 0 0 2px rgba(194, 3, 3, 0.18)",
  },

  inputOk: {
    borderColor: "rgba(155, 127, 63, 0.7)",
  },

  tableNameHint: {
    marginTop: 7,
    fontFamily: "var(--tw-font-heading)",
    fontSize: "0.95rem",
    letterSpacing: "0.06em",
    color: "#B79E81",
    textAlign: "center",
  },

  avatarRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginTop: 4,
  },

  avatarPreviewWrap: {
    position: "relative",
    flexShrink: 0,
  },

  avatarPreviewBtn: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    border: "2px solid #6A7984",
    background: "transparent",
    padding: 0,
    cursor: "pointer",
    display: "block",
    overflow: "hidden",
    transition: "border-color 0.15s ease",
  },

  avatarPreviewImg: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    objectFit: "cover",
    display: "block",
  },

  changeAvatarBtn: {
    padding: "10px 16px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(245, 236, 205, 0.2)",
    color: "var(--tw-text-muted)",
    fontFamily: "Lato, sans-serif",
    fontWeight: 700,
    fontSize: "0.85rem",
    cursor: "pointer",
    transition: "background 0.15s ease, border-color 0.15s ease",
  },

  popover: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 9999,
    width: "min(480px, calc(100vw - 32px))",
    background: "#14181B",
    border: "1px solid rgba(245, 236, 205, 0.18)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.85)",
    padding: 20,
  },

  popoverTitle: {
    fontFamily: "var(--tw-font-heading)",
    fontSize: "1.2rem",
    color: "#F5ECCD",
    marginBottom: 16,
    textAlign: "center",
    letterSpacing: "0.04em",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 10,
  },

  thumbBtn: {
    width: 64,
    height: 64,
    padding: 0,
    border: "none",
    background: "rgba(255,255,255,0.02)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  thumbBtnSelected: {
    boxShadow: "0 0 0 3px #978262, 0 0 16px rgba(151, 127, 63, 0.4)",
    transform: "scale(1.06)",
  },

  thumbImg: {
    width: "100%",
    height: "100%",
    display: "block",
    objectFit: "cover",
  },

  submitBtn: {
    marginTop: 20,
    width: "100%",
    padding: "16px 20px",
    background: "#434135",
    border: "1px solid #978262",
    boxShadow: "inset 0 0 18px 2px rgba(155, 127, 63, 0.8), 0 12px 36px rgba(0,0,0,0.55)",
    color: "#F5ECCD",
    fontFamily: "var(--tw-font-heading)",
    fontSize: "1.3rem",
    letterSpacing: "0.04em",
    cursor: "pointer",
    transition: "transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease",
  },

  submitBtnDisabled: {
    opacity: 0.45,
    cursor: "not-allowed",
    boxShadow: "none",
  },

  error: {
    marginTop: 12,
    fontFamily: "Lato, sans-serif",
    fontSize: "0.9rem",
    color: "var(--tw-accent-2)",
  },

  backLink: {
    marginTop: 28,
    fontFamily: "Lato, sans-serif",
    fontSize: "0.85rem",
    color: "var(--tw-text-muted)",
    textDecoration: "none",
    letterSpacing: "0.04em",
    opacity: 0.7,
  },
};
