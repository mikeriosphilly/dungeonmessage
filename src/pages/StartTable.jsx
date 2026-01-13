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
      navigate(`/gm/${table.code}`);
    } catch (e) {
      setError(e.message || "Something went wrong starting the table.");
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

        <label style={styles.label}>Table name</label>
        <input
          style={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="The Gilded Goose Tavern"
          autoFocus
        />

        <button
          style={styles.primaryBtn}
          disabled={!canStart}
          onClick={onStart}
        >
          {busy ? "Starting..." : "Start session"}
        </button>

        <p style={styles.helper}>
          Give your table a name worthy of legend. The realm will forge a short
          code for your players.
        </p>

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
  label: { display: "block", marginTop: 8, marginBottom: 6, fontWeight: 600 },
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
  },
  helper: { marginTop: 14, lineHeight: 1.5, opacity: 0.8 },
  error: { marginTop: 12, color: "crimson" },
};
