import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Head } from "vite-react-ssg";
import logoVertical from "../assets/Logo-vertical.png";


const STEPS = [
  {
    n: "I",
    title: "Open a Table",
    desc: "The GM starts a session and receives a short code to share with the party.",
  },
  {
    n: "II",
    title: "Players Join",
    desc: "Each player joins on their own device — no account or app required.",
  },
  {
    n: "III",
    title: "Send in Secret",
    desc: "Pass notes, clues, and images to any player. Only they will ever see it.",
  },
];

export default function Landing() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 700);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const [openItems, setOpenItems] = useState(new Set());
  const toggleItem = (i) => setOpenItems((prev) => {
    const next = new Set(prev);
    next.has(i) ? next.delete(i) : next.add(i);
    return next;
  });

  const [whisperVisible, setWhisperVisible] = useState(false);
  const [visibleItems, setVisibleItems] = useState(() => Array(5).fill(false));
  const whisperRef = useRef(null);
  const itemRefs = useRef([]);

  useEffect(() => {
    // Header: fire when section first peeks into view
    const headerEl = whisperRef.current;
    if (!headerEl) return;
    const headerObs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setWhisperVisible(true); headerObs.disconnect(); } },
      { threshold: 0.06 }
    );
    headerObs.observe(headerEl);

    // Each item: fire individually as user scrolls to it
    const itemObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const i = Number(entry.target.dataset.whisperIdx);
            setVisibleItems((prev) => {
              if (prev[i]) return prev;
              const next = [...prev];
              next[i] = true;
              return next;
            });
            itemObs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );
    itemRefs.current.forEach((el) => el && itemObs.observe(el));

    return () => { headerObs.disconnect(); itemObs.disconnect(); };
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
            <div
              style={{
                ...styles.stepRight,
                paddingBottom: i < arr.length - 1 ? 20 : 0,
              }}
            >
              <span style={styles.stepTitle}>{title}</span>
              <span style={styles.stepDesc}>{desc}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={styles.featureCallout}>
        <div style={styles.featureDivider} />
        <p style={styles.featureTitle}>Works on any device</p>
        <p style={styles.featureDesc}>
          You'll receive a link to your GM dashboard that can be used on any
          device, even if you switch to a different device mid-session.
        </p>
      </div>
    </div>
  );

  const collapseStyle = (i) => ({
    maxHeight: openItems.has(i) ? 600 : "2.5rem",
    overflow: "hidden",
    transition: "max-height 0.4s cubic-bezier(0.22,1,0.36,1)",
    maskImage: openItems.has(i) ? "none" : "linear-gradient(to bottom, black 30%, transparent 100%)",
    WebkitMaskImage: openItems.has(i) ? "none" : "linear-gradient(to bottom, black 30%, transparent 100%)",
  });

  return (
    <div style={styles.page}>
      <Head>
        <title>DungeonMessage - Private GM-to-Player Messaging for D&amp;D and TTRPGs</title>
        <meta name="description" content="Skip Discord. Send secret messages, clues, and images to one player or everyone at your table, no player registration needed. Built for GMs and DMs." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dungeonmessage.com/" />
        <meta property="og:title" content="DungeonMessage - Private GM-to-Player Messaging for D&amp;D and TTRPGs" />
        <meta property="og:description" content="Skip Discord. Send secret messages, clues, and images to one player or everyone at your table, no player registration needed. Built for GMs and DMs." />
        <meta property="og:image" content="https://dungeonmessage.com/OG_Image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="DungeonMessage - Private GM-to-Player Messaging for D&amp;D and TTRPGs" />
        <meta name="twitter:description" content="Skip Discord. Send secret messages, clues, and images to one player or everyone at your table, no player registration needed. Built for GMs and DMs." />
        <meta name="twitter:image" content="https://dungeonmessage.com/OG_Image.jpg" />
      </Head>
      {/* ── Hero stage ── */}
      <div style={heroShell}>
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
                Send private messages to players at your table..
              </p>
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
              Send private messages to players at your table.
            </p>
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
            <div
              className="landing-fade-up"
              style={{ animationDelay: "0.9s", width: "100%" }}
            >
              {howItWorks}
            </div>
          </div>
        )}
      </div>
      </div>{/* /heroShell */}

      {/* ── FAQ Section ── */}
      <section id="faq" aria-label="Frequently Asked Questions" ref={whisperRef} style={whisper.section}>
        <style>{`
          @keyframes whisperFadeUp {
            from { opacity: 0; transform: translateY(32px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        {/* Header */}
        <div
          style={{
            ...whisper.header,
            ...(whisperVisible
              ? { animation: "whisperFadeUp 0.9s 0.05s cubic-bezier(0.22,1,0.36,1) both" }
              : { opacity: 0 }),
          }}
        >
          <h2 style={whisper.heading}>I need to whisper something to you...</h2>
        </div>

        {/* FAQ items */}
        <dl style={whisper.items}>

          {/* Q1 — What is DungeonMessage? */}
          <div
            ref={(el) => { itemRefs.current[0] = el; }}
            data-whisper-idx={0}
            style={{
              ...whisper.item,
              ...(visibleItems[0]
                ? { animation: "whisperFadeUp 0.85s cubic-bezier(0.22,1,0.36,1) both" }
                : { opacity: 0 }),
            }}
          >
            <div style={whisper.itemAccent} />
            <div style={whisper.itemBody}>
              <div
                style={whisper.itemHeadRow}
                onClick={() => toggleItem(0)}
                role="button" tabIndex={0} aria-expanded={openItems.has(0)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleItem(0); } }}
              >
                <dt style={whisper.itemHeading}>What is DungeonMessage?</dt>
                <span style={{ ...whisper.chevron, transform: openItems.has(0) ? "rotate(45deg)" : "rotate(0deg)" }}>+</span>
              </div>
              <div style={collapseStyle(0)}>
                <dd style={{ ...whisper.itemText, marginLeft: 0, marginBottom: 0 }}>
                  DungeonMessage is a free web-based messaging tool built for Dungeon Masters
                  and Game Masters running tabletop RPG sessions. It lets GMs send private
                  one-way messages, including text notes, clues, and images, directly to
                  individual players or the entire table during a session, without other
                  players seeing. It works with any tabletop RPG system, including Dungeons
                  and Dragons, Pathfinder, Call of Cthulhu, Blades in the Dark, and any
                  other game where a GM needs to pass private information to players.
                </dd>
              </div>
            </div>
          </div>

          {/* Q2 — How is DungeonMessage different from Discord? */}
          <div
            ref={(el) => { itemRefs.current[1] = el; }}
            data-whisper-idx={1}
            style={{
              ...whisper.item,
              ...(visibleItems[1]
                ? { animation: "whisperFadeUp 0.85s cubic-bezier(0.22,1,0.36,1) both" }
                : { opacity: 0 }),
            }}
          >
            <div style={whisper.itemAccent} />
            <div style={whisper.itemBody}>
              <div
                style={whisper.itemHeadRow}
                onClick={() => toggleItem(1)}
                role="button" tabIndex={0} aria-expanded={openItems.has(1)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleItem(1); } }}
              >
                <dt style={whisper.itemHeading}>How is DungeonMessage different from Discord or a group chat app?</dt>
                <span style={{ ...whisper.chevron, transform: openItems.has(1) ? "rotate(45deg)" : "rotate(0deg)" }}>+</span>
              </div>
              <div style={collapseStyle(1)}>
                <dd style={{ ...whisper.itemText, marginLeft: 0 }}>
                  Group chat apps like Discord require all players to create accounts and
                  join a server before a session. DungeonMessage requires nothing from
                  players. The GM creates a session, shares a simple link, and players can
                  receive private messages instantly in their browser with no signup, no
                  registration, and no app to download. It is also purpose-built for
                  one-way GM-to-player communication, so there is no risk of players
                  accidentally seeing messages meant for someone else.
                </dd>
                <video src="/howto/howto-share.webm" autoPlay loop muted playsInline style={whisper.video} />
              </div>
            </div>
          </div>

          {/* Q3 — What kind of content can a GM send? */}
          <div
            ref={(el) => { itemRefs.current[2] = el; }}
            data-whisper-idx={2}
            style={{
              ...whisper.item,
              ...(visibleItems[2]
                ? { animation: "whisperFadeUp 0.85s cubic-bezier(0.22,1,0.36,1) both" }
                : { opacity: 0 }),
            }}
          >
            <div style={whisper.itemAccent} />
            <div style={whisper.itemBody}>
              <div
                style={whisper.itemHeadRow}
                onClick={() => toggleItem(2)}
                role="button" tabIndex={0} aria-expanded={openItems.has(2)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleItem(2); } }}
              >
                <dt style={whisper.itemHeading}>What kind of content can a GM send through DungeonMessage?</dt>
                <span style={{ ...whisper.chevron, transform: openItems.has(2) ? "rotate(45deg)" : "rotate(0deg)" }}>+</span>
              </div>
              <div style={collapseStyle(2)}>
                <dd style={{ ...whisper.itemText, marginLeft: 0 }}>
                  GMs can send text notes, secret clues, lore drops, in-character whispers,
                  images, and map fragments. Messages can go to a single player privately or
                  be broadcast to everyone at the table at once.
                </dd>
                <video src="/howto/howto-send.webm" autoPlay loop muted playsInline style={whisper.video} />
              </div>
            </div>
          </div>

          {/* Q4 — Does DungeonMessage work for online games? */}
          <div
            ref={(el) => { itemRefs.current[3] = el; }}
            data-whisper-idx={3}
            style={{
              ...whisper.item,
              ...(visibleItems[3]
                ? { animation: "whisperFadeUp 0.85s cubic-bezier(0.22,1,0.36,1) both" }
                : { opacity: 0 }),
            }}
          >
            <div style={whisper.itemAccent} />
            <div style={whisper.itemBody}>
              <div
                style={whisper.itemHeadRow}
                onClick={() => toggleItem(3)}
                role="button" tabIndex={0} aria-expanded={openItems.has(3)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleItem(3); } }}
              >
                <dt style={whisper.itemHeading}>Does DungeonMessage work for online games?</dt>
                <span style={{ ...whisper.chevron, transform: openItems.has(3) ? "rotate(45deg)" : "rotate(0deg)" }}>+</span>
              </div>
              <div style={collapseStyle(3)}>
                <dd style={{ ...whisper.itemText, marginLeft: 0, marginBottom: 0 }}>
                  Yes. Players receive messages through a browser link on their own devices,
                  making DungeonMessage a great companion tool for both in-person sessions
                  and online play via platforms like Roll20, Foundry VTT, or any video call
                  setup.
                </dd>
              </div>
            </div>
          </div>

          {/* Q5 — Is DungeonMessage free? */}
          <div
            ref={(el) => { itemRefs.current[4] = el; }}
            data-whisper-idx={4}
            style={{
              ...whisper.item,
              ...(visibleItems[4]
                ? { animation: "whisperFadeUp 0.85s cubic-bezier(0.22,1,0.36,1) both" }
                : { opacity: 0 }),
            }}
          >
            <div style={whisper.itemAccent} />
            <div style={whisper.itemBody}>
              <div
                style={whisper.itemHeadRow}
                onClick={() => toggleItem(4)}
                role="button" tabIndex={0} aria-expanded={openItems.has(4)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleItem(4); } }}
              >
                <dt style={whisper.itemHeading}>Is DungeonMessage free?</dt>
                <span style={{ ...whisper.chevron, transform: openItems.has(4) ? "rotate(45deg)" : "rotate(0deg)" }}>+</span>
              </div>
              <div style={collapseStyle(4)}>
                <dd style={{ ...whisper.itemText, marginLeft: 0, marginBottom: 0 }}>
                  Yes. DungeonMessage is free to use and the core features will always
                  remain free. A premium subscription with additional features is planned
                  for the future, but everything available today will stay free permanently.
                </dd>
              </div>
            </div>
          </div>

        </dl>
      </section>
    </div>
  );
}

/* ── Hero stage ── */
const heroShell = {
  width: "100%",
  background: "radial-gradient(at 50% 0%, rgb(33, 36, 39) 0%, rgb(20, 23, 27) 55%, rgb(11, 12, 14) 100%)",
};

/* ── Desktop-only layout styles ── */
const desktop = {
  wrap: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "100px 48px",
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
    background:
      "linear-gradient(to bottom, transparent, rgba(151,130,98,0.4) 20%, rgba(151,130,98,0.4) 80%, transparent)",
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
    padding: "56px 24px",
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
    background:
      "linear-gradient(to right, transparent, rgba(151,130,98,0.3), transparent)",
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
    fontFamily: "Lato, sans-serif",
    fontSize: "0.875rem",
    lineHeight: 1.6,
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
    background:
      "linear-gradient(to right, transparent, rgba(151,130,98,0.3), transparent)",
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
    background:
      "linear-gradient(to bottom, rgba(151,130,98,0.35), rgba(151,130,98,0.08))",
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

/* ── Whisper / How-To section styles ── */
const whisper = {
  section: {
    width: "100%",
    padding: "68px 24px 80px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },

  header: {
    textAlign: "center",
    marginBottom: 64,
    width: "min(640px, 100%)",
  },

  heading: {
    fontFamily: "var(--tw-font-heading)",
    fontSize: "clamp(1.9rem, 4.5vw, 2.9rem)",
    color: "#F5ECCD",
    margin: "0 0 14px",
    lineHeight: 1.15,
    letterSpacing: "0.02em",
    textShadow: "0 0 40px rgba(245,200,100,0.18), 0 4px 16px rgba(0,0,0,0.7)",
  },

  intro: {
    fontFamily: "var(--tw-font-message)",
    fontStyle: "italic",
    fontSize: "1.1rem",
    color: "var(--tw-text-muted)",
    margin: 0,
    lineHeight: 1.65,
  },

  items: {
    display: "flex",
    flexDirection: "column",
    gap: 48,
    width: "min(720px, 100%)",
  },

  item: {
    display: "flex",
    flexDirection: "row",
    gap: 0,
    borderTop: "1px solid rgba(151,130,98,0.15)",
    paddingTop: 36,
  },

  itemAccent: {
    width: 2,
    flexShrink: 0,
    background: "linear-gradient(to bottom, rgba(151,130,98,0.7), rgba(151,130,98,0.08))",
    marginRight: 24,
    borderRadius: 1,
    alignSelf: "stretch",
  },

  itemBody: {
    flex: 1,
    minWidth: 0,
  },

  itemHeadRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    marginBottom: 10,
    cursor: "pointer",
    userSelect: "none",
  },

  chevron: {
    fontFamily: "Lato, sans-serif",
    fontSize: "1.1rem",
    color: "#978262",
    flexShrink: 0,
    display: "inline-block",
    transition: "transform 0.3s ease",
    lineHeight: 1,
  },

  itemNumeral: {
    fontFamily: "var(--tw-font-heading)",
    fontSize: "1.15rem",
    color: "rgba(151,130,98,0.6)",
    letterSpacing: "0.05em",
    lineHeight: 1,
    flexShrink: 0,
  },

  itemHeading: {
    fontFamily: "Lato, sans-serif",
    fontWeight: 700,
    fontSize: "0.8rem",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "#C4AC84",
    margin: 0,
    lineHeight: 1.3,
  },

  itemText: {
    fontFamily: "Lato, sans-serif",
    fontSize: "0.9rem",
    lineHeight: 1.7,
    color: "#8a7f6e",
    margin: "0 0 24px",
    maxWidth: 580,
  },

  video: {
    display: "block",
    width: "100%",
    borderRadius: 5,
    border: "1px solid rgba(151,130,98,0.22)",
    boxShadow: "0 12px 48px rgba(0,0,0,0.65)",
  },

};
