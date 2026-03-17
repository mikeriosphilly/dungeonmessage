import { Link } from "react-router-dom";
import AppHeader from "../components/AppHeader";

export default function Privacy() {
  return (
    <div style={s.page}>
      <AppHeader />

      <div style={s.outer}>
        <article style={s.content} className="landing-fade-up">

          {/* Header block */}
          <div style={s.docHeader}>
            <p style={s.siteLabel}>DungeonMessage</p>
            <h1 style={s.title}>Privacy Policy</h1>
            <p style={s.effectiveDate}>Effective date: March 2026</p>
          </div>

          <hr style={s.rule} />

          {/* Intro callout */}
          <div style={s.callout}>
            <p style={s.body}>
              DungeonMessage is a product of{" "}
              <a href="https://starfirelabs.co/" style={s.link} target="_blank" rel="noopener noreferrer">
                Starfire Labs LLC
              </a>
              , a Pennsylvania limited liability company. We built it as a tool
              for Game Masters to send secret messages to players at the table.
              We collect as little data as possible, and messages are never
              stored permanently.
            </p>
          </div>

          {/* What we collect */}
          <section style={s.section}>
            <h2 style={s.sectionTitle}>What we collect</h2>
            <p style={s.body}>When a GM creates a table, we collect:</p>
            <ul style={s.list}>
              <li style={s.listItem}>
                <strong style={s.strong}>Email address</strong> — so we can
                send the GM their table link, and optionally notify them of app
                updates.
              </li>
              <li style={s.listItem}>
                <strong style={s.strong}>Table name</strong> — used to identify
                the session.
              </li>
              <li style={s.listItem}>
                <strong style={s.strong}>Anonymous session stats</strong> —
                player count, message count, and timestamps. No names, no
                message content.
              </li>
            </ul>
          </section>

          <hr style={s.sectionRule} />

          {/* What we do NOT collect */}
          <section style={s.section}>
            <h2 style={s.sectionTitle}>What we do NOT collect</h2>
            <ul style={s.list}>
              <li style={s.listItem}>
                The content of any messages sent between the GM and players
              </li>
              <li style={s.listItem}>Player names or identities</li>
              <li style={s.listItem}>
                Passwords (we have no account system)
              </li>
              <li style={s.listItem}>Payment information of any kind</li>
            </ul>
          </section>

          <hr style={s.sectionRule} />

          {/* Data retention */}
          <section style={s.section}>
            <h2 style={s.sectionTitle}>Data retention &amp; purging</h2>
            <p style={s.body}>
              Messages and player session data are{" "}
              <strong style={s.strong}>
                automatically purged within 24 hours
              </strong>{" "}
              of a session ending. What remains afterward is only anonymized
              metadata (table ID, creation date, player count, message count)
              used for internal analytics. No message content is ever retained.
            </p>
          </section>

          <hr style={s.sectionRule} />

          {/* How we use your email */}
          <section style={s.section}>
            <h2 style={s.sectionTitle}>How we use your email</h2>
            <p style={s.body}>Your email is used to:</p>
            <ul style={s.list}>
              <li style={s.listItem}>
                Send you your table link at the time of creation
              </li>
              <li style={s.listItem}>
                Notify you of significant DungeonMessage updates or new
                features, if you opted in
              </li>
            </ul>
            <p style={{ ...s.body, marginTop: 14 }}>
              We will never sell or share your email with third parties. Every
              email we send includes an unsubscribe link.
            </p>
          </section>

          <hr style={s.sectionRule} />

          {/* Third-party services */}
          <section style={s.section}>
            <h2 style={s.sectionTitle}>Third-party services</h2>
            <p style={s.body}>
              DungeonMessage uses the following services to operate:
            </p>
            <ul style={s.list}>
              <li style={s.listItem}>
                <strong style={s.strong}>Supabase</strong> — database and
                backend infrastructure
              </li>
              <li style={s.listItem}>
                <strong style={s.strong}>Resend</strong> — transactional email
                delivery
              </li>
              <li style={s.listItem}>
                <strong style={s.strong}>Vercel</strong> — hosting and
                deployment
              </li>
            </ul>
            <p style={{ ...s.body, marginTop: 14 }}>
              Each of these services has their own privacy policy governing how
              they handle data.
            </p>
          </section>

          <hr style={s.sectionRule} />

          {/* Your rights */}
          <section style={s.section}>
            <h2 style={s.sectionTitle}>Your rights</h2>
            <p style={s.body}>
              You may request deletion of your email from our records at any
              time by contacting us at{" "}
              <a href="mailto:gm@dungeonmessage.com" style={s.link}>
                gm@dungeonmessage.com
              </a>
              . We'll take care of it promptly.
            </p>
          </section>

          <hr style={s.sectionRule} />

          {/* Changes */}
          <section style={s.section}>
            <h2 style={s.sectionTitle}>Changes to this policy</h2>
            <p style={s.body}>
              If we make meaningful changes to this policy, we'll update the
              effective date above. We won't retroactively change how we use
              data already collected.
            </p>
          </section>

          {/* Footer bar */}
          <div style={s.footer}>
            <p style={s.footerText}>
              &copy; 2026{" "}
              <a href="https://starfirelabs.co/" style={s.footerLink} target="_blank" rel="noopener noreferrer">
                Starfire Labs LLC
              </a>
              . All rights reserved.
            </p>
            <p style={s.footerText}>
              Questions?{" "}
              <a href="mailto:gm@dungeonmessage.com" style={s.footerLink}>
                gm@dungeonmessage.com
              </a>
            </p>
          </div>

          <Link to="/" style={s.backLink}>
            ← Back to home
          </Link>
        </article>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "#0a0907",
    display: "flex",
    flexDirection: "column",
  },

  outer: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    padding: "48px 24px",
  },

  content: {
    width: "100%",
    maxWidth: 680,
  },

  docHeader: {
    marginBottom: 24,
  },

  siteLabel: {
    fontFamily: "Lato, sans-serif",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#8A9BA8",
    margin: "0 0 10px",
  },

  title: {
    fontFamily: "var(--tw-font-heading)",
    fontSize: 32,
    fontWeight: 500,
    color: "#F5ECCD",
    margin: "0 0 8px",
    letterSpacing: "0.02em",
  },

  effectiveDate: {
    fontFamily: "Lato, sans-serif",
    fontSize: 13,
    color: "#8A9BA8",
    margin: 0,
  },

  rule: {
    border: "none",
    borderTop: "1px solid rgba(151, 130, 98, 0.28)",
    margin: "24px 0",
  },

  callout: {
    background: "rgba(255,255,255,0.03)",
    borderLeft: "3px solid rgba(151, 130, 98, 0.5)",
    padding: "16px 20px",
    marginBottom: 32,
  },

  section: {
    marginBottom: 28,
  },

  sectionTitle: {
    fontFamily: "Lato, sans-serif",
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#978262",
    margin: "0 0 10px",
  },

  sectionRule: {
    border: "none",
    borderTop: "1px solid rgba(151, 130, 98, 0.15)",
    margin: "28px 0",
  },

  body: {
    fontFamily: "Lato, sans-serif",
    fontSize: 15,
    lineHeight: 1.8,
    color: "#8A9BA8",
    margin: "0 0 0",
  },

  strong: {
    color: "#D5CDBE",
    fontWeight: 600,
  },

  list: {
    fontFamily: "Lato, sans-serif",
    fontSize: 15,
    lineHeight: 1.8,
    color: "#8A9BA8",
    margin: "8px 0 0",
    paddingLeft: "1.25rem",
  },

  listItem: {
    marginBottom: "0.4rem",
  },

  link: {
    color: "#978262",
    textDecoration: "none",
  },

  footer: {
    borderTop: "1px solid rgba(151, 130, 98, 0.28)",
    paddingTop: 20,
    marginTop: 32,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },

  footerText: {
    fontFamily: "Lato, sans-serif",
    fontSize: 12,
    color: "rgba(138, 155, 168, 0.5)",
    margin: 0,
  },

  footerLink: {
    color: "rgba(138, 155, 168, 0.5)",
    textDecoration: "none",
  },

  backLink: {
    display: "inline-block",
    marginTop: 28,
    fontFamily: "Lato, sans-serif",
    fontSize: "0.85rem",
    color: "#8A9BA8",
    textDecoration: "none",
    letterSpacing: "0.04em",
    opacity: 0.7,
    transition: "opacity 0.15s",
  },
};
