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

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <Link to="/" style={styles.back}>
          ← Back
        </Link>

        <h1 style={styles.title}>Join a table</h1>

        {lastSession && lastTableName && (
          <div style={styles.resumeBox}>
            You were previously in “{lastTableName}” as{" "}
            <strong>{lastSession.displayName}</strong>.
            <button
              style={styles.resumeBtn}
              disabled={busy}
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
                  // optional: clear bad saved session if table is gone
                  // localStorage.removeItem("tw_last_session");
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
          style={styles.input}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="K7F9Q"
        />

        <div style={styles.avatarBlock}>
          <div style={styles.avatarPreviewWrap}>
            <img
              src={avatarSrcFromKey(avatarKey)}
              alt="Your avatar"
              style={styles.avatarPreviewImg}
            />

            {pickerOpen && (
              <div ref={popoverRef} style={styles.popover}>
                <div style={styles.grid}>
                  {keys.map((k) => (
                    <button
                      key={k}
                      onClick={() => {
                        setAvatarKey(k);
                        setPickerOpen(false);
                      }}
                      style={styles.thumbBtn}
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
            onClick={() => setPickerOpen((v) => !v)}
            style={styles.chooseBtn}
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

        <button style={styles.primaryBtn} disabled={!canJoin} onClick={onJoin}>
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
  },
  card: {
    width: "min(560px,100%)",
    border: "1px solid #ddd",
    borderRadius: 16,
    padding: 24,
    background: "white",
  },
  back: { textDecoration: "none", opacity: 0.8 },
  title: { marginBottom: 12, fontSize: 28 },
  label: { fontWeight: 600, marginTop: 10 },
  input: {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    border: "1px solid #ccc",
  },
  primaryBtn: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    background: "black",
    color: "white",
    fontWeight: 700,
    border: "none",
    width: "100%",
  },
  error: { marginTop: 12, color: "crimson" },

  resumeBox: {
    background: "#f6f6f6",
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  resumeBtn: {
    marginLeft: 10,
    border: "none",
    background: "black",
    fontWeight: 700,
    cursor: "pointer",
  },

  avatarBlock: {
    marginTop: 14,
    display: "grid",
    placeItems: "center",
    gap: 10,
  },
  avatarPreviewWrap: { position: "relative", width: 110, height: 110 },
  avatarPreviewImg: { width: "100%", height: "100%", borderRadius: "50%" },
  chooseBtn: { borderRadius: 12, padding: "8px 12px", fontWeight: 700 },

  popover: {
    position: "absolute",
    top: "110%",
    background: "white",
    padding: 10,
    borderRadius: 12,
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 },
  thumbBtn: { border: "none", background: "none", cursor: "pointer" },
  thumbImg: { width: 48, height: 48, borderRadius: "50%" },
};
