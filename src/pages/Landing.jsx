import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import logoVertical from "../assets/Logo-vertical.png";

const STEPS = [
  { n: "I",   title: "Open a Table",   desc: "The GM starts a session and receives a short code to share with the party." },
  { n: "II",  title: "Players Join",   desc: "Each player joins on their own device — no account or app required." },
  { n: "III", title: "Send in Secret", desc: "Pass notes, clues, and images to any player. Only they will ever see it." },
];

export default function Landing() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 700);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 700);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const howItWorks = (
    <div style={{ ...styles.howItWorks, marginTop: isDesktop ? 0 : 48 }}>
      <div style={styles.howDivider}>
        <span style={styles.howDividerLine} />
        <span style={styles.howDividerLabel}>How it works</span>
        <span style={styles.howDividerLine} />
      </div>
      <div style={styles.steps}>
        {STEPS.map(({ n, title, desc }, i, arr) => (
          <div key={n} style={styles.step}>
            <div style={styles.stepLeft}>
              <div style={styles.stepNumeralWrap}>
                <span style={styles.stepNumeral}>{n}</span>
              </div>
              {i < arr.length - 1 && <div style={styles.stepConnector} />}
            </div>
            <div style={{ ...styles.stepRight, paddingBottom: i < arr.length - 1 ? 20 : 0 }}>
              <span style={styles.stepTitle}>{title}</span>
              <span style={styles.stepDesc}>{desc}</span>
            </div>
          </div>
        ))}
      <div style={styles.featureCallout}>
        <div style={styles.featureDivider} />
        <p style={styles.featureTitle}>Works on any device</p>
        <p style={styles.featureDesc}>
          Start on laptop, switch to phone mid-session — your GM dashboard link goes wherever you do, no app or account required.
        </p>
      </div>
    </div>
  );

  return (
    <div style={styles.page}>
      <div style={isDesktop ? desktop.wrap : styles.wrap}>

        {isDesktop ? (
          /* ── Desktop: 2-column ── */
          <div style={desktop.inner}>

            {/* Left: logo + subtitle + CTAs */}
            <div style={desktop.leftCol}>
              <img
                src={logoVertical}
                alt="DungeonMessage"
                style={desktop.logo}
                className="landing-logo"
              />
              <div
                className="landing-fade-up landing-divider"
                style={{ animationDelay: "0.38s", width: "100%" }}
              >
                <span className="landing-divider-line" />
                <span className="landing-divider-gem">◆</span>
                <span className="landing-divider-line" />
              </div>
              <p
                className="landing-fade-up"
                style={{ ...styles.subtitle, animationDelay: "0.5s" }}
              >
                Private messages for your table.
              </p>
              <div
                className="landing-fade-up"
                style={{ ...styles.actions, animationDelay: "0.68s" }}
              >
                <Link to="/start" className="landing-btn landing-btn-start" style={styles.startBtn}>
                  <span style={styles.btnLabel}>Start a Table</span>
                  <span style={styles.btnRole}>Game Master</span>
                </Link>
                <Link to="/join" className="landing-btn landing-btn-join" style={styles.joinBtn}>
                  <span style={styles.btnLabel}>Join a Table</span>
                  <span style={styles.btnRole}>Adventurer</span>
                </Link>
              </div>
            </div>

            {/* Vertical gold rule */}
            <div style={desktop.colDivider} />

            {/* Right: How it works */}
            <div
              className="landing-fade-up"
              style={{ ...desktop.rightCol, animationDelay: "0.75s" }}
            >
              {howItWorks}
            </div>

          </div>
        ) : (
          /* ── Mobile: single column ── */
          <div style={styles.inner}>
            <img
              src={logoVertical}
              alt="DungeonMessage"
              style={styles.logo}
              className="landing-logo"
            />
            <div
              className="landing-fade-up landing-divider"
              style={{ animationDelay: "0.38s" }}
            >
              <span className="landing-divider-line" />
              <span className="landing-divider-gem">◆</span>
              <span className="landing-divider-line" />
            </div>
            <p
              className="landing-fade-up"
              style={{ ...styles.subtitle, animationDelay: "0.5s" }}
            >
              Private messages for your table.
            </p>
            <div
              className="landing-fade-up"
              style={{ ...styles.actions, animationDelay: "0.68s" }}
            >
              <Link to="/start" className="landing-btn landing-btn-start" style={styles.startBtn}>
                <span style={styles.btnLabel}>Start a Table</span>
                <span style={styles.btnRole}>Game Master</span>
              </Link>
              <Link to="/join" className="landing-btn landing-btn-join" style={styles.joinBtn}>
                <span style={styles.btnLabel}>Join a Table</span>
                <span style={styles.btnRole}>Adventurer</span>
              </Link>
            </div>
            <div
              className="landing-fade-up"
              style={{ animationDelay: "0.9s", width: "100%" }}
            >
              {howItWorks}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

/* ── Desktop-only layout styles ── */
const desktop = {
  wrap: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 48px",
  },

  inner: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
    width: "min(960px, 100%)",
  },

  leftCol: {
    flex: "1 1 0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    paddingRight: 48,
  },

  colDivider: {
    width: 1,
    alignSelf: "stretch",
    background: "linear-gradient(to bottom, transparent, rgba(151,130,98,0.4) 20%, rgba(151,130,98,0.4) 80%, transparent)",
    flexShrink: 0,
  },

  rightCol: {
    flex: "1 1 0",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    paddingLeft: 48,
  },

  logo: {
    width: "min(280px, 100%)",
    height: "auto",
    objectFit: "contain",
    display: "block",
    marginBottom: 8,
  },
};

/* ── Shared / mobile styles ── */
const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
  },

  wrap: {
    flex: 1,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "80px 24px",
  },

  inner: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    width: "min(640px, 100%)",
  },

  logo: {
    width: "min(448px, 54vw)",
    height: "auto",
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
    boxShadow: "inset 0 0 18px 2px rgba(155, 127, 63, 0.8), 0 12px 36px rgba(0,0,0,0.55)",
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

  howItWorks: {
    width: "100%",
  },

  featureCallout: {
    marginTop: 28,
    width: "100%",
    textAlign: "left",
  },

  featureDivider: {
    height: 1,
    background: "linear-gradient(to right, transparent, rgba(151,130,98,0.3), transparent)",
    marginBottom: 20,
  },

  featureTitle: {
    fontFamily: "Lato, sans-serif",
    fontWeight: 700,
    fontSize: "0.875rem",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#F5ECCD",
    margin: "0 0 6px",
  },

  featureDesc: {
    fontFamily: "var(--tw-font-message)",
    fontStyle: "italic",
    fontSize: "0.875rem",
    lineHeight: 1.7,
    color: "#8a7f6e",
    margin: 0,
  },

  howDivider: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 28,
  },

  howDividerLine: {
    flex: 1,
    height: 1,
    background: "linear-gradient(to right, transparent, rgba(151,130,98,0.3), transparent)",
  },

  howDividerLabel: {
    fontFamily: "Lato, sans-serif",
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "#978262",
    whiteSpace: "nowrap",
  },

  steps: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    textAlign: "left",
  },

  step: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },

  stepLeft: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flexShrink: 0,
    width: 44,
  },

  stepNumeralWrap: {
    width: 44,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(151,130,98,0.35)",
    background: "rgba(151,130,98,0.07)",
    flexShrink: 0,
  },

  stepNumeral: {
    fontFamily: "var(--tw-font-heading)",
    fontSize: "1.3rem",
    color: "#978262",
    lineHeight: 1,
    letterSpacing: "0.04em",
  },

  stepConnector: {
    width: 1,
    flex: 1,
    minHeight: 20,
    background: "linear-gradient(to bottom, rgba(151,130,98,0.35), rgba(151,130,98,0.08))",
  },

  stepRight: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    paddingTop: 10,
  },

  stepTitle: {
    fontFamily: "Lato, sans-serif",
    fontWeight: 700,
    fontSize: "0.875rem",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#F5ECCD",
  },

  stepDesc: {
    fontFamily: "Lato, sans-serif",
    fontSize: "0.875rem",
    lineHeight: 1.6,
    color: "#8a7f6e",
  },
};
