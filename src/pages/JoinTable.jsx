import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { joinTable } from "../services/backend";
import { avatarSrcFromKey, randomAvatarKey, AVATAR_KEYS } from "../lib/avatars";

export default function JoinTable() {
  const [avatarKey, setAvatarKey] = useState(() => randomAvatarKey());
  const [pickerOpen, setPickerOpen] = useState(false);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const canJoin = code.trim().length >= 4 && name.trim().length > 0 && !busy;

  const popoverRef = useRef(null);
  const buttonRef = useRef(null);

  // Close avatar picker when clicking outside
  useEffect(() => {
    function onDown(e) {
      if (!pickerOpen) return;

      const pop = popoverRef.current;
      const btn = buttonRef.current;
      const target = e.target;

      if (pop && pop.contains(target)) return;
      if (btn && btn.contains(target)) return;

      setPickerOpen(false);
    }

    function onKey(e) {
      if (!pickerOpen) return;
      if (e.key === "Escape") setPickerOpen(false);
    }

    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [pickerOpen]);

  async function onJoin() {
    setBusy(true);
    setError("");
    try {
      const { table, player } = await joinTable(code, name, avatarKey);
      navigate(`/table/${table.code}?playerId=${player.id}`);
    } catch (e) {
      setError(
        e.message || "Could not join table. Check the code and try again."
      );
    } finally {
      setBusy(false);
    }
  }

  const keys = useMemo(() => {
    // Prefer explicit exported list if you made one, else fallback to 01..07
    return Array.isArray(AVATAR_KEYS) && AVATAR_KEYS.length
      ? AVATAR_KEYS
      : ["01", "02", "03", "04", "05", "06", "07"];
  }, []);

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <Link to="/" style={styles.back}>
          ← Back
        </Link>

        <h1 style={styles.title}>Join a table</h1>

        <label style={styles.label}>Table code</label>
        <input
          style={styles.input}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="K7F9Q"
          autoCapitalize="characters"
        />

        {/* Avatar preview + picker */}
        <div style={styles.avatarBlock}>
          <div style={styles.avatarPreviewWrap}>
            <img
              src={avatarSrcFromKey(avatarKey)}
              alt="Your avatar"
              style={styles.avatarPreviewImg}
            />

            {/* Popover */}
            {pickerOpen && (
              <div ref={popoverRef} style={styles.popover}>
                <div style={styles.popoverTitle}>Choose your avatar</div>
                <div style={styles.grid}>
                  {keys.map((k) => {
                    const selected = k === avatarKey;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => {
                          setAvatarKey(k);
                          setPickerOpen(false);
                        }}
                        style={{
                          ...styles.thumbBtn,
                          ...(selected ? styles.thumbBtnSelected : null),
                        }}
                        title={`Avatar ${k}`}
                      >
                        <img
                          src={avatarSrcFromKey(k)}
                          alt={`Avatar option ${k}`}
                          style={styles.thumbImg}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            ref={buttonRef}
            type="button"
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
    width: "min(560px, 100%)",
    border: "1px solid rgba(0,0,0,0.15)",
    borderRadius: 16,
    padding: 24,
    background: "white",
  },
  back: { textDecoration: "none", opacity: 0.8 },
  title: { marginTop: 12, marginBottom: 12, fontSize: 28 },
  label: { display: "block", marginTop: 10, marginBottom: 6, fontWeight: 600 },
  input: {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.2)",
  },
  primaryBtn: {
    marginTop: 14,
    padding: "10px 14px",
    borderRadius: 12,
    background: "black",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
    width: "100%",
    opacity: 1,
  },
  error: { marginTop: 12, color: "crimson" },

  avatarBlock: {
    marginTop: 14,
    display: "grid",
    placeItems: "center",
    gap: 10,
  },
  avatarPreviewWrap: {
    position: "relative",
    width: 110,
    height: 110,
  },
  avatarPreviewImg: {
    width: "100%",
    height: "100%",
    borderRadius: "999px",
    objectFit: "cover",
    border: "2px solid rgba(0,0,0,0.12)",
    background: "#fff",
    display: "block",
  },

  chooseBtn: {
    border: "1px solid rgba(0,0,0,0.18)",
    background: "#fafafa",
    color: "#111",
    borderRadius: 12,
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 700,
  },

  popover: {
    position: "absolute",
    top: "calc(100% + 10px)",
    left: "50%",
    transform: "translateX(-50%)",
    width: 280,
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.15)",
    background: "white",
    padding: 12,
    boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
    zIndex: 50,
  },
  popoverTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: "#111",
    marginBottom: 10,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 10,
  },
  thumbBtn: {
    border: "1px solid rgba(0,0,0,0.12)",
    background: "#fff",
    borderRadius: 14,
    padding: 6,
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
  },
  thumbBtnSelected: {
    border: "2px solid rgba(0,0,0,0.85)",
  },
  thumbImg: {
    width: 48,
    height: 48,
    borderRadius: 999,
    objectFit: "cover",
    display: "block",
  },
};
