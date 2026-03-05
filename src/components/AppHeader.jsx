import { Link } from "react-router-dom";

/**
 * AppHeader — sticky site-wide header.
 *
 * Props:
 *   avatarSrc  – optional image URL for the player/GM avatar (right slot)
 *   connected  – boolean; shows green dot when true, red when false (default true)
 *
 * paddingTop: env(safe-area-inset-top) makes the header background fill the iOS
 * status-bar region, replacing the plain dark canvas strip with the header chrome.
 */
export default function AppHeader({ avatarSrc = null, connected = true }) {
  return (
    <header style={s.root}>
      <div style={s.row}>

        {/* Left: seal logo + wordmark */}
        <Link to="/" style={s.brand}>
          <img src="/Logo_TableWhisper.png" alt="" style={s.logo} />
          <span style={s.wordmark}>TableWhisper</span>
        </Link>

        {/* Right: avatar + status dot */}
        {avatarSrc && (
          <div style={s.avatarWrap}>
            <img src={avatarSrc} alt="Your avatar" style={s.avatarImg} />
            <span
              style={{
                ...s.dot,
                background: connected ? "#4ade80" : "#f87171",
                boxShadow: connected
                  ? "0 0 0 2px #0a0907, 0 0 6px rgba(74,222,128,0.45)"
                  : "0 0 0 2px #0a0907",
              }}
              className={connected ? "tw-dot-pulse" : undefined}
            />
          </div>
        )}
      </div>
    </header>
  );
}

const s = {
  root: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    width: "100%",
    paddingTop: "env(safe-area-inset-top, 0px)",
    background: "#0a0907",
    backdropFilter: "blur(14px) saturate(140%)",
    WebkitBackdropFilter: "blur(14px) saturate(140%)",
    borderBottom: "1px solid rgba(151, 130, 98, 0.28)",
    boxShadow: "0 2px 16px rgba(0,0,0,0.45)",
  },

  row: {
    height: 58,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    textDecoration: "none",
    color: "inherit",
    userSelect: "none",
  },

  logo: {
    width: 36,
    height: 36,
    objectFit: "contain",
    flexShrink: 0,
    filter: "drop-shadow(0 1px 5px rgba(245,220,140,0.25))",
  },

  wordmark: {
    fontFamily: "var(--tw-font-heading)",
    fontSize: "1.45rem",
    color: "#F5ECCD",
    letterSpacing: "0.04em",
    lineHeight: 1,
    textShadow: "0 1px 10px rgba(245,220,140,0.14)",
  },

  avatarWrap: {
    position: "relative",
    width: 42,
    height: 42,
    flexShrink: 0,
  },

  avatarImg: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid rgba(151, 130, 98, 0.6)",
    display: "block",
  },

  dot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: "50%",
    display: "block",
  },
};
