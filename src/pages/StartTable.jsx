import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { startTable } from "../services/backend";

export default function StartTable() {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const canStart = name.trim().length > 0 && !busy;

  async function onStart() {
    setBusy(true);
    setError("");

    try {
      const table = await startTable(name.trim());
      navigate(`/gm/${table.gm_secret}`);
    } catch (e) {
      setError(e?.message || "Something went wrong starting the table.");
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

        <h1 style={styles.title}>Start a table</h1>

        <p style={styles.subtitle}>
          Create a new session and receive a secret link for the Game Master.
          Your players will join with a short code.
        </p>

        <label style={styles.label}>Table name</label>
        <input
          style={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="The Gilded Goose Tavern"
          autoFocus
        />

        <button
          style={{
            ...styles.primaryBtn,
            ...(canStart ? {} : styles.primaryBtnDisabled),
          }}
          disabled={!canStart}
          onClick={onStart}
        >
          {busy ? "Starting..." : "Start session"}
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
    width: "min(560px, 100%)",
    padding: 32,
    borderRadius: 18,
    background: "transparent",
    textAlign: "center",
  },

  back: {
    display: "inline-block",
    marginBottom: 14,
    textDecoration: "none",
    color: "var(--tw-text-muted)",
  },

  title: {
    margin: 0,
    marginBottom: 10,
    fontSize: 42,
    fontFamily: "var(--tw-font-heading)",
    color: "var(--tw-text)",
  },

  subtitle: {
    marginBottom: 22,
    lineHeight: 1.55,
    fontSize: "1.05rem",
    color: "var(--tw-text-muted)",
  },

  label: {
    display: "block",
    textAlign: "left",
    marginBottom: 6,
    fontWeight: 700,
    color: "var(--tw-text)",
  },

  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid var(--tw-border)",
    background: "rgba(255,255,255,0.05)",
    color: "var(--tw-text)",
    fontSize: "1rem",
    marginBottom: 18,
    outline: "none",
  },

  primaryBtn: {
    width: "100%",
    padding: "14px 18px",
    borderRadius: 16,
    background:
      "linear-gradient(135deg, var(--tw-accent-1), var(--tw-accent-2))",
    color: "var(--tw-button-text)",
    fontWeight: 800,
    fontSize: "1.05rem",
    border: "none",
    cursor: "pointer",
    boxShadow: "var(--tw-shadow)",
    transition:
      "transform 140ms ease, box-shadow 140ms ease, filter 140ms ease",
  },

  primaryBtnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
    filter: "grayscale(0.4)",
  },

  error: {
    marginTop: 14,
    color: "var(--tw-accent-2)",
  },
};
