import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const TALLY_SCRIPT = "https://tally.so/widgets/embed.js";

export default function Footer() {
  const [modalOpen, setModalOpen] = useState(false);

  // Escape key closes modal
  useEffect(() => {
    if (!modalOpen) return;
    function onKey(e) { if (e.key === "Escape") setModalOpen(false); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  // Load Tally embed script when modal opens
  useEffect(() => {
    if (!modalOpen) return;
    if (typeof window.Tally !== "undefined") {
      window.Tally.loadEmbeds();
    } else if (!document.querySelector(`script[src="${TALLY_SCRIPT}"]`)) {
      const s = document.createElement("script");
      s.src = TALLY_SCRIPT;
      s.onload = () => window.Tally?.loadEmbeds();
      s.onerror = () => window.Tally?.loadEmbeds();
      document.body.appendChild(s);
    }
  }, [modalOpen]);

  return (
    <>
      <footer style={s.footer}>
        <style>{`
          .dm-footer-link:hover { color: rgba(184,173,150,0.7) !important; }
          .dm-modal-close:hover { color: rgba(213,205,190,0.8) !important; }
          @keyframes dmModalIn {
            from { opacity: 0; transform: scale(0.93); }
            to   { opacity: 1; transform: scale(1); }
          }
        `}</style>

        <span style={s.copy}>
          © {new Date().getFullYear()} Starfire Labs LLC. All rights reserved.
        </span>

        <div style={s.links}>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            style={s.link}
            className="dm-footer-link"
          >
            Send feedback
          </button>
          <span style={s.sep}>·</span>
          <Link to="/privacy" style={s.link} className="dm-footer-link">
            Privacy Policy
          </Link>
        </div>
      </footer>

      {/* ── Feedback modal ── */}
      {modalOpen && (
        <div
          style={s.backdrop}
          onClick={() => setModalOpen(false)}
          aria-modal="true"
          role="dialog"
        >
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            {/* Corner filigrees */}
            <span style={{ ...s.orn, top: 5, left: 6 }}>✦</span>
            <span style={{ ...s.orn, top: 5, right: 6 }}>✦</span>
            <span style={{ ...s.orn, bottom: 5, left: 6 }}>✦</span>
            <span style={{ ...s.orn, bottom: 5, right: 6 }}>✦</span>

            {/* Close button */}
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              style={s.closeBtn}
              className="dm-modal-close"
              aria-label="Close"
            >
              ✕
            </button>

            {/* Tally embed */}
            <iframe
              data-tally-src="https://tally.so/embed/1AM8Ab?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
              loading="lazy"
              width="100%"
              height="886"
              frameBorder="0"
              marginHeight="0"
              marginWidth="0"
              title="DungeonMessage Feedback"
              style={s.iframe}
            />
          </div>
        </div>
      )}
    </>
  );
}

const s = {
  footer: {
    width: "100%",
    borderTop: "1px solid rgba(151,130,98,0.16)",
    background: "transparent",
    padding: "0 20px",
    minHeight: 46,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "6px 12px",
    paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 6px)",
    paddingTop: 6,
  },

  copy: {
    fontFamily: "Lato, sans-serif",
    fontSize: "0.68rem",
    color: "rgba(151,130,98,0.4)",
    letterSpacing: "0.02em",
    whiteSpace: "nowrap",
  },

  links: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  link: {
    fontFamily: "Lato, sans-serif",
    fontSize: "0.68rem",
    color: "rgba(151,130,98,0.4)",
    letterSpacing: "0.02em",
    cursor: "pointer",
    background: "none",
    border: "none",
    padding: 0,
    textDecoration: "none",
    transition: "color 0.15s",
  },

  sep: {
    fontFamily: "Lato, sans-serif",
    fontSize: "0.68rem",
    color: "rgba(151,130,98,0.22)",
    userSelect: "none",
  },

  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 200,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    background: "rgba(8,5,3,0.85)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
  },

  modal: {
    position: "relative",
    width: "min(520px, 100%)",
    maxHeight: "calc(100vh - 48px)",
    overflowY: "auto",
    padding: "28px 24px 20px",
    border: "1px solid rgba(151,130,98,0.55)",
    background: "linear-gradient(160deg, rgba(28,22,14,0.99) 0%, rgba(18,14,9,1) 100%)",
    boxShadow: "0 0 0 1px rgba(151,130,98,0.08) inset, 0 24px 64px rgba(0,0,0,0.85)",
    animation: "dmModalIn 0.2s cubic-bezier(0.22,1,0.36,1) both",
  },

  orn: {
    position: "absolute",
    fontSize: 9,
    color: "rgba(151,130,98,0.45)",
    lineHeight: 1,
    userSelect: "none",
  },

  closeBtn: {
    position: "absolute",
    top: 10,
    right: 12,
    background: "none",
    border: "none",
    color: "rgba(184,173,150,0.38)",
    cursor: "pointer",
    fontSize: "0.95rem",
    lineHeight: 1,
    padding: "2px 4px",
    transition: "color 0.15s",
    zIndex: 1,
  },

  iframe: {
    display: "block",
    border: "none",
  },
};
