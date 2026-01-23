import { Link } from "react-router-dom";
import { useState } from "react";

export default function Landing() {
  const [hovered, setHovered] = useState(null);

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        {/* Logo */}
        <img
          src="/Logo_TableWhisper.png"
          alt="TableWhisper logo"
          style={styles.logo}
        />

        {/* Title */}
        <h1 style={styles.title}>TableWhisper</h1>

        {/* Subtitle */}
        <p style={styles.subtitle}>
          Private notes, secret quests, and dramatic reveals. No passing paper
          like it’s 2004.
        </p>

        {/* Actions */}
        <div style={styles.actions}>
          <Link
            to="/start"
            style={{
              ...styles.primaryBtn,
              ...(hovered === "start" ? styles.primaryBtnHover : {}),
            }}
            onMouseEnter={() => setHovered("start")}
            onMouseLeave={() => setHovered(null)}
          >
            Start a table
          </Link>

          <Link
            to="/join"
            style={{
              ...styles.primaryBtn,
              ...(hovered === "join" ? styles.primaryBtnHover : {}),
            }}
            onMouseEnter={() => setHovered("join")}
            onMouseLeave={() => setHovered(null)}
          >
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
    background: "var(--tw-bg)",
    color: "var(--tw-text)",
  },

  card: {
    width: "min(560px, 100%)",
    padding: 32,
    textAlign: "center",
    background: "transparent",
  },

  // 🔮 Big, dramatic logo
  logo: {
    width: 240,
    height: 240,
    margin: "0 auto 22px",
    display: "block",
    borderRadius: 40,
    boxShadow: "var(--tw-shadow)",
  },

  title: {
    margin: 0,
    fontSize: 48,
    fontFamily: "var(--tw-font-heading)",
    color: "var(--tw-text)",
  },

  subtitle: {
    marginTop: 12,
    fontSize: "1.1rem",
    lineHeight: 1.55,
    color: "var(--tw-text-muted)",
  },

  actions: {
    display: "flex",
    justifyContent: "center",
    gap: 16,
    marginTop: 30,
    flexWrap: "wrap",
  },

  // ✨ Primary-style buttons for both actions
  primaryBtn: {
    padding: "14px 22px",
    borderRadius: 16,
    background:
      "linear-gradient(135deg, var(--tw-accent-1), var(--tw-accent-2))",
    color: "var(--tw-button-text)",
    textDecoration: "none",
    fontWeight: 800,
    letterSpacing: "0.02em",
    boxShadow: "var(--tw-shadow)",
    cursor: "pointer",
    border: "none",
    transition:
      "transform 120ms ease, box-shadow 120ms ease, filter 120ms ease",
  },

  primaryBtnHover: {
    transform: "translateY(-1px)",
    boxShadow: "0 12px 36px rgba(0,0,0,0.55)",
    filter: "brightness(1.1)",
  },
};
