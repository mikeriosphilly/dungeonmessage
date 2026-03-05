import { Link } from "react-router-dom";
import AppHeader from "../components/AppHeader";

export default function Landing() {
  return (
    <div style={styles.page}>
      <AppHeader />
      <div style={styles.wrap}>
      <div style={styles.inner}>
        {/* Logo — drops in with warm glow */}
        <img
          src="/Logo_TableWhisper.png"
          alt="TableWhisper"
          style={styles.logo}
          className="landing-logo"
        />

        {/* Title — uses global metallic h1 CSS */}
        <h1
          className="landing-fade-up"
          style={{
            fontSize: "clamp(52px, 10vw, 80px)",
            margin: "12px 0 0",
            animationDelay: "0.2s",
          }}
        >
          TableWhisper
        </h1>

        {/* Ornamental divider */}
        <div
          className="landing-fade-up landing-divider"
          style={{ animationDelay: "0.38s" }}
        >
          <span className="landing-divider-line" />
          <span className="landing-divider-gem">◆</span>
          <span className="landing-divider-line" />
        </div>

        {/* Subtitle */}
        <p
          className="landing-fade-up"
          style={{ ...styles.subtitle, animationDelay: "0.5s" }}
        >
          Private messages for your table.
        </p>

        {/* CTAs */}
        <div
          className="landing-fade-up"
          style={{ ...styles.actions, animationDelay: "0.68s" }}
        >
          <Link
            to="/start"
            className="landing-btn landing-btn-start"
            style={styles.startBtn}
          >
            <span style={styles.btnLabel}>Start a Table</span>
            <span style={styles.btnRole}>Game Master</span>
          </Link>

          <Link
            to="/join"
            className="landing-btn landing-btn-join"
            style={styles.joinBtn}
          >
            <span style={styles.btnLabel}>Join a Table</span>
            <span style={styles.btnRole}>Adventurer</span>
          </Link>
        </div>
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
    width: "min(640px, 100%)",
  },

  logo: {
    width: 200,
    height: 200,
    objectFit: "contain",
    display: "block",
  },

  subtitle: {
    fontFamily: "var(--tw-font-message)",
    fontStyle: "italic",
    fontSize: "1.15rem",
    lineHeight: 1.7,
    color: "var(--tw-text-muted)",
    margin: "0 0 40px",
  },

  actions: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    justifyContent: "center",
  },

  startBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 5,
    padding: "20px 40px",
    background: "#434135",
    border: "1px solid #978262",
    boxShadow:
      "inset 0 0 18px 2px rgba(155, 127, 63, 0.8), 0 12px 36px rgba(0,0,0,0.55)",
    color: "#F5ECCD",
    textDecoration: "none",
  },

  joinBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 5,
    padding: "20px 40px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(245, 236, 205, 0.2)",
    boxShadow: "0 12px 36px rgba(0,0,0,0.45)",
    color: "#D5CDBE",
    textDecoration: "none",
  },

  btnLabel: {
    fontFamily: "var(--tw-font-heading)",
    fontSize: "1.45rem",
    letterSpacing: "0.03em",
  },

  btnRole: {
    fontFamily: "var(--tw-font-message)",
    fontSize: "0.75rem",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    opacity: 0.6,
  },
};
