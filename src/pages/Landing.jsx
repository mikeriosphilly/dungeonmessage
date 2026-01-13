import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h1 style={styles.title}>TableWhisper</h1>
        <p style={styles.subtitle}>
          Private notes, secret quests, and dramatic reveals. No passing paper
          like it’s 2004.
        </p>

        <div style={styles.actions}>
          <Link to="/start" style={styles.primaryBtn}>
            Start a table
          </Link>
          <Link to="/join" style={styles.secondaryBtn}>
            Join a table
          </Link>
        </div>
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
  title: { margin: 0, fontSize: 36 },
  subtitle: { marginTop: 8, lineHeight: 1.5, opacity: 0.85 },
  actions: { display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" },
  primaryBtn: {
    padding: "10px 14px",
    borderRadius: 12,
    background: "black",
    color: "white",
    textDecoration: "none",
  },
  secondaryBtn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.2)",
    color: "black",
    textDecoration: "none",
  },
};
