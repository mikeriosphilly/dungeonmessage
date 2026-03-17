import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { startTable } from "../services/backend";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function StartTable() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lastGmSession, setLastGmSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const raw = localStorage.getItem("tw_gm_session");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.gmSecret) setLastGmSession(parsed);
    } catch {
      localStorage.removeItem("tw_gm_session");
    }
  }, []);

  const canStart = name.trim().length > 0 && EMAIL_RE.test(email) && !busy;

  async function onStart() {
    setBusy(true);
    setError("");
    try {
      const table = await startTable(name.trim());
      const tableUrl = `${window.location.origin}/gm/${table.gm_secret}`;
      localStorage.setItem("tw_gm_session", JSON.stringify({
        gmSecret: table.gm_secret,
        tableName: name.trim(),
      }));

      // Fire-and-forget — don't block navigation if email fails
      fetch("/api/send-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          tableName: name.trim(),
          tableUrl,
          gmSecret: table.gm_secret,
          marketingOptIn,
        }),
      }).catch(() => {});

      navigate(`/gm/${table.gm_secret}`, { state: { justCreated: true } });
    } catch (e) {
      setError(e?.message || "Something went wrong starting the table.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <div style={styles.inner}>
          <h1
            className="landing-fade-up"
            style={{
              fontSize: "clamp(42px, 8vw, 64px)",
              margin: "4px 0 0",
              animationDelay: "0.1s",
            }}
          >
            Start a Table
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
            Name your session. You'll receive a secret link
            <br />
            for your table, and a code for your players.
          </p>

          {/* Resume GM session */}
          {lastGmSession && (
            <div
              className="landing-fade-up"
              style={{ ...styles.resumeBox, animationDelay: "0.38s" }}
            >
              <div style={styles.resumeText}>
                <span style={styles.resumeLabel}>Your last table</span>
                <span style={styles.resumeDetail}>
                  <strong style={{ color: "#D5CDBE" }}>{lastGmSession.tableName}</strong>
                </span>
              </div>
              <Link
                to={`/gm/${lastGmSession.gmSecret}`}
                style={styles.rejoinBtn}
                className="landing-btn-start"
              >
                Return to dashboard
              </Link>
            </div>
          )}

          {/* Form */}
          <div
            className="landing-fade-up"
            style={{ ...styles.form, animationDelay: "0.44s" }}
          >
            <label style={styles.label}>Table name</label>
            <input
              style={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && canStart && onStart()}
              placeholder="The Gilded Goose Tavern"
              autoFocus
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <label style={{ ...styles.label, marginBottom: 0 }}>Your email</label>
              <span style={styles.fieldHint}>We'll send your table link here for safekeeping</span>
            </div>
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && canStart && onStart()}
              placeholder="gm@example.com"
            />

            <p style={styles.privacyNote}>
              See our{" "}
              <Link to="/privacy" target="_blank" style={styles.privacyLink}>
                Privacy Policy
              </Link>
            </p>

            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={marketingOptIn}
                onChange={(e) => setMarketingOptIn(e.target.checked)}
                style={styles.checkbox}
              />
              Keep me posted on DungeonMessage updates
            </label>

            <button
              style={{
                ...styles.submitBtn,
                ...(!canStart ? styles.submitBtnDisabled : {}),
              }}
              disabled={!canStart}
              onClick={onStart}
              className={canStart ? "landing-btn-start" : ""}
            >
              {busy ? "Opening the session..." : "Start session"}
            </button>

            {error && <p style={styles.error}>{error}</p>}
          </div>

          <Link
            to="/"
            style={styles.backLink}
            className="landing-fade-up"
            tabIndex={0}
          >
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
    margin: "0 0 32px",
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
    marginBottom: 16,
    boxSizing: "border-box",
    transition: "border-color 0.15s ease",
  },

  submitBtn: {
    width: "100%",
    padding: "16px 20px",
    background: "#434135",
    border: "1px solid #978262",
    boxShadow:
      "inset 0 0 18px 2px rgba(155, 127, 63, 0.8), 0 12px 36px rgba(0,0,0,0.55)",
    color: "#F5ECCD",
    fontFamily: "var(--tw-font-heading)",
    fontSize: "1.3rem",
    letterSpacing: "0.04em",
    cursor: "pointer",
    transition:
      "transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease",
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
    transition: "opacity 0.15s",
  },

  fieldHint: {
    fontFamily: "Lato, sans-serif",
    fontSize: "0.75rem",
    fontStyle: "italic",
    color: "var(--tw-text-muted)",
    opacity: 0.6,
  },

  resumeBox: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    padding: "14px 18px",
    border: "1px solid rgba(151, 130, 98, 0.45)",
    background: "rgba(255,255,255,0.03)",
    marginBottom: 24,
    textAlign: "left",
    boxSizing: "border-box",
    boxShadow: "0 0 18px rgba(151, 130, 98, 0.18), inset 0 0 12px rgba(151, 130, 98, 0.06)",
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
    textDecoration: "none",
    transition: "transform 0.15s ease, filter 0.15s ease",
  },

  privacyNote: {
    fontFamily: "Lato, sans-serif",
    fontSize: "0.78rem",
    color: "var(--tw-text-muted)",
    margin: "-8px 0 14px",
    opacity: 0.7,
  },

  privacyLink: {
    color: "#978262",
    textDecoration: "none",
  },

  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontFamily: "Lato, sans-serif",
    fontSize: "0.85rem",
    color: "var(--tw-text-muted)",
    marginBottom: 20,
    cursor: "pointer",
    userSelect: "none",
  },

  checkbox: {
    accentColor: "#978262",
    width: 15,
    height: 15,
    flexShrink: 0,
    cursor: "pointer",
  },
};
