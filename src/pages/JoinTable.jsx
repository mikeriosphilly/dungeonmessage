import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
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
  const [authReady, setAuthReady] = useState(false);

  // ✅ Last-session recovery
  const [lastSession, setLastSession] = useState(null);
  const [lastTableName, setLastTableName] = useState("");

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const popoverRef = useRef(null);
  const buttonRef = useRef(null);

  const canJoin =
    code.trim().length >= 4 && name.trim().length > 0 && !busy && tableOk;

  const keys = useMemo(() => {
    return Array.isArray(AVATAR_KEYS) && AVATAR_KEYS.length
      ? AVATAR_KEYS
      : ["01", "02", "03", "04", "05", "06", "07"];
  }, []);

  // Prefill code from /join?code=XXXX
  useEffect(() => {
    const fromUrl = (searchParams.get("code") || "").trim().toUpperCase();
    if (fromUrl && fromUrl !== code) setCode(fromUrl);
  }, [searchParams]);

  // Ensure anon auth once
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
    return () => {
      alive = false;
    };
  }, []);

  // Restore last session (device-level)
  useEffect(() => {
    const raw = localStorage.getItem("tw_last_session");
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      if (!parsed?.tableCode) return;

      setLastSession(parsed);

      (async () => {
        const { data } = await supabase.rpc("get_table_public", {
          p_code: parsed.tableCode,
        });

        const row = Array.isArray(data) ? data[0] : data;
        const table = row?.table ?? row ?? null;

        if (table?.name) {
          setLastTableName(table.name);
        }
      })();
    } catch {
      localStorage.removeItem("tw_last_session");
    }
  }, []);

  // Close avatar picker on outside click
  useEffect(() => {
    function onDown(e) {
      if (!pickerOpen) return;
      if (
        popoverRef.current?.contains(e.target) ||
        buttonRef.current?.contains(e.target)
      )
        return;

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

  // Validate table code
  useEffect(() => {
    const trimmed = code.trim().toUpperCase();
    setTableOk(false);

    if (!authReady || trimmed.length < 4) {
      setError("");
      return;
    }

    let cancelled = false;

    const t = setTimeout(async () => {
      try {
        await ensureAnonAuth();

        const { data } = await supabase.rpc("get_table_public", {
          p_code: trimmed,
        });

        if (cancelled) return;

        const row = Array.isArray(data) ? data[0] : data;
        const table = row?.table ?? row ?? null;

        if (!table) {
          setError("That table code does not exist.");
          return;
        }

        if (table.status !== "active") {
          setError("That session is not active.");
          return;
        }

        const last = table.last_gm_activity_at
          ? new Date(table.last_gm_activity_at).getTime()
          : 0;

        // keeping the constant in case you use it later
        void last;
        void GM_INACTIVITY_HOURS;

        setTableOk(true);
        setError("");
      } catch (e) {
        if (!cancelled) setError("Could not validate table.");
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [code, authReady]);

  async function onJoin() {
    setBusy(true);
    setError("");

    try {
      await ensureAnonAuth();
      const { table, player } = await joinTable(code, name, avatarKey);

      localStorage.setItem(
        "tw_last_session",
        JSON.stringify({
          tableCode: table.code,
          displayName: name,
          avatarKey,
        }),
      );

      navigate(`/table/${table.code}?playerId=${player.id}`);
    } catch (e) {
      setError(e?.message || "Could not join table.");
    } finally {
      setBusy(false);
    }
  }

  const [hovered, setHovered] = useState(null);

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <Link to="/" style={styles.back}>
          ← Back
        </Link>

        <h1 style={styles.title}>Join a table</h1>

        {lastSession && lastTableName && (
          <div style={styles.resumeBox}>
            <div style={{ flex: 1, minWidth: 0 }}>
              You were previously in “{lastTableName}” as{" "}
              <strong>{lastSession.displayName}</strong>.
            </div>
            <button
              style={{
                ...styles.resumeBtn,
                ...(hovered === "resume" ? styles.primaryBtnHover : {}),
                ...(busy ? styles.btnDisabled : {}),
              }}
              disabled={busy}
              onMouseEnter={() => setHovered("resume")}
              onMouseLeave={() => setHovered(null)}
              onClick={async () => {
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

                  navigate(`/table/${table.code}?playerId=${player.id}`);
                } catch (e) {
                  setError(
                    e?.message ||
                      "Could not rejoin that table. It may have expired.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Rejoining..." : "Jump back in"}
            </button>
          </div>
        )}

        <label style={styles.label}>Table code</label>
        <input
          style={{
            ...styles.input,
            ...(code.trim().length >= 4 && !tableOk && error
              ? styles.inputError
              : {}),
          }}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="K7F9Q"
        />

        <div style={styles.avatarBlock}>
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
                <div style={styles.grid}>
                  {keys.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        setAvatarKey(k);
                        setPickerOpen(false);
                      }}
                      style={{
                        ...styles.thumbBtn,
                        ...(k === avatarKey ? styles.thumbBtnSelected : {}),
                      }}
                    >
                      <img
                        src={avatarSrcFromKey(k)}
                        alt=""
                        style={styles.thumbImg}
                      />
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
            style={{
              ...styles.chooseBtn,
              ...(hovered === "choose" ? styles.ghostBtnHover : {}),
            }}
            onMouseEnter={() => setHovered("choose")}
            onMouseLeave={() => setHovered(null)}
          >
            Change avatar
          </button>
        </div>

        <label style={styles.label}>Your name</label>
        <input
          style={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
        />

        <button
          style={{
            ...styles.primaryBtn,
            ...(hovered === "join" ? styles.primaryBtnHover : {}),
            ...(!canJoin ? styles.btnDisabled : {}),
          }}
          disabled={!canJoin}
          onMouseEnter={() => setHovered("join")}
          onMouseLeave={() => setHovered(null)}
          onClick={onJoin}
        >
          {busy ? "Joining..." : "Join table"}
        </button>

        {error && <p style={styles.error}>{error}</p>}
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
    background: "var(--tw-bg)",
    color: "var(--tw-text)",
  },

  card: {
    width: "min(560px,100%)",
    borderRadius: 22,
    padding: 26,
    background: "linear-gradient(90deg, var(--tw-card-a), var(--tw-card-b))",
    border: "1px solid var(--tw-border)",
    boxShadow: "var(--tw-shadow)",
  },

  back: {
    textDecoration: "none",
    color: "var(--tw-text-muted)",
    display: "inline-block",
    marginBottom: 10,
  },

  title: {
    marginTop: 2,
    marginBottom: 14,
    fontSize: 44,
    fontFamily: "var(--tw-font-heading)",
    color: "var(--tw-text)",
    letterSpacing: "0.01em",
  },

  label: {
    display: "block",
    marginTop: 12,
    marginBottom: 8,
    fontWeight: 800,
    color: "var(--tw-text)",
  },

  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 16,
    border: "1px solid var(--tw-border)",
    background: "rgba(255,255,255,0.04)",
    color: "var(--tw-text)",
    outline: "none",
    fontSize: 16,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
  },

  inputError: {
    border: "1px solid rgba(194,3,3,0.8)",
    boxShadow: "0 0 0 3px rgba(194,3,3,0.18)",
  },

  primaryBtn: {
    marginTop: 16,
    padding: "14px 16px",
    borderRadius: 16,
    background:
      "linear-gradient(135deg, var(--tw-accent-1), var(--tw-accent-2))",
    color: "var(--tw-button-text)",
    fontWeight: 900,
    border: "none",
    width: "100%",
    cursor: "pointer",
    letterSpacing: "0.02em",
    boxShadow: "var(--tw-shadow)",
    transition:
      "transform 120ms ease, filter 120ms ease, box-shadow 120ms ease",
  },

  primaryBtnHover: {
    transform: "translateY(-1px)",
    filter: "brightness(1.08)",
    boxShadow: "0 12px 36px rgba(0,0,0,0.55)",
  },

  btnDisabled: {
    opacity: 0.55,
    cursor: "not-allowed",
    transform: "none",
    filter: "none",
  },

  error: {
    marginTop: 14,
    color: "var(--tw-accent-2)",
    fontWeight: 700,
  },

  resumeBox: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    marginBottom: 14,
    border: "1px solid var(--tw-border)",
    background: "rgba(255,255,255,0.04)",
    color: "var(--tw-text-muted)",
  },

  resumeBtn: {
    border: "none",
    padding: "10px 12px",
    borderRadius: 14,
    background:
      "linear-gradient(135deg, var(--tw-accent-1), var(--tw-accent-2))",
    color: "var(--tw-button-text)",
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap",
    boxShadow: "var(--tw-shadow)",
    transition:
      "transform 120ms ease, filter 120ms ease, box-shadow 120ms ease",
  },

  avatarBlock: {
    marginTop: 18,
    display: "grid",
    placeItems: "center",
    gap: 10,
  },

  avatarPreviewWrap: { position: "relative", width: 122, height: 122 },

  avatarPreviewBtn: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    border: "1px solid var(--tw-border)",
    background: "rgba(255,255,255,0.04)",
    padding: 6,
    cursor: "pointer",
    boxShadow: "var(--tw-shadow)",
  },

  avatarPreviewImg: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    display: "block",
    objectFit: "cover",
  },

  chooseBtn: {
    borderRadius: 14,
    padding: "10px 12px",
    fontWeight: 900,
    cursor: "pointer",
    border: "1px solid var(--tw-border)",
    background: "rgba(255,255,255,0.04)",
    color: "var(--tw-text)",
    transition: "transform 120ms ease, background 120ms ease",
  },

  ghostBtnHover: {
    transform: "translateY(-1px)",
    background: "rgba(255,255,255,0.07)",
  },

  popover: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 9999,
    width: "min(520px, calc(100vw - 32px))",
    maxWidth: 520,
    background: "linear-gradient(90deg, var(--tw-card-a), var(--tw-card-b))",
    border: "1px solid var(--tw-border)",
    boxShadow: "0 18px 44px rgba(0,0,0,0.75)",
    padding: 14,
    borderRadius: 22,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: 10,
  },

  thumbBtn: {
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.02)",
    cursor: "pointer",
    padding: 6,
    borderRadius: 16,
    transition: "transform 120ms ease, background 120ms ease",
  },

  thumbBtnSelected: {
    border: "1px solid rgba(112,66,249,0.9)",
    background: "rgba(112,66,249,0.18)",
    transform: "translateY(-1px)",
  },

  thumbImg: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    display: "block",
    objectFit: "cover",
  },
};
