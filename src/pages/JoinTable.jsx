import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { joinTable } from "../services/backend";

export default function JoinTable() {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const canJoin = code.trim().length >= 4 && name.trim().length > 0 && !busy;

  async function onJoin() {
    setBusy(true);
    setError("");
    try {
      const { table, player } = await joinTable(code, name);
      navigate(`/table/${table.code}?playerId=${player.id}`);
    } catch (e) {
      setError(
        e.message || "Could not join table. Check the code and try again."
      );
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

        <label style={styles.label}>Table code</label>
        <input
          style={styles.input}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="K7F9Q"
          autoCapitalize="characters"
        />

        <label style={styles.label}>Your name</label>
        <input
          style={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Mikey the Magnificent"
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
  },
  error: { marginTop: 12, color: "crimson" },
};
