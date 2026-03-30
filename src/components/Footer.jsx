import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const messageRef = useRef(null);

  // Escape key closes modal
  useEffect(() => {
    if (!modalOpen) return;
    function onKey(e) { if (e.key === "Escape") closeModal(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  // Focus textarea on open
  useEffect(() => {
    if (modalOpen) setTimeout(() => messageRef.current?.focus(), 50);
  }, [modalOpen]);

  // Auto-close 3s after success
  useEffect(() => {
    if (status !== "success") return;
    const t = setTimeout(closeModal, 3000);
    return () => clearTimeout(t);
  }, [status]);

  function openModal() {
    setStatus("idle");
    setMessage("");
    setEmail("");
    setErrorMsg("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    // Reset form after exit animation would finish
    setTimeout(() => {
      setStatus("idle");
      setMessage("");
      setEmail("");
      setErrorMsg("");
    }, 250);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim(), email: email.trim() }),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
  }

  return (
    <>
      <footer style={s.footer}>
        <style>{`
          .dm-footer-link:hover { color: rgba(184,173,150,0.7) !important; }
          .dm-modal-close:hover { color: rgba(213,205,190,0.8) !important; }
          .dm-submit-btn:hover:not(:disabled) { filter: brightness(1.12); transform: translateY(-1px); }
          @keyframes dmModalIn {
            from { opacity: 0; transform: scale(0.93); }
            to   { opacity: 1; transform: scale(1); }
          }
          @keyframes dmSuccessIn {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        <span style={s.copy}>
          © {new Date().getFullYear()} Starfire Labs LLC. All rights reserved.
        </span>

        <div style={s.links}>
          <button
            type="button"
            onClick={openModal}
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
        <div style={s.backdrop} onClick={closeModal} aria-modal="true" role="dialog">
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            {/* Corner filigrees */}
            <span style={{ ...s.orn, top: 5, left: 6 }}>✦</span>
            <span style={{ ...s.orn, top: 5, right: 6 }}>✦</span>
            <span style={{ ...s.orn, bottom: 5, left: 6 }}>✦</span>
            <span style={{ ...s.orn, bottom: 5, right: 6 }}>✦</span>

            {/* Close button */}
            <button
              type="button"
              onClick={closeModal}
              style={s.closeBtn}
              className="dm-modal-close"
              aria-label="Close"
            >
              ✕
            </button>

            {status === "success" ? (
              <div style={s.successBlock}>
                <div style={s.successGem}>◆</div>
                <p style={s.successText}>Thanks! We read every message.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={s.form}>
                <h2 style={s.heading}>Send us feedback</h2>

                <div style={s.dividerRow}>
                  <span style={s.dividerLine} />
                  <span style={s.dividerGem}>◆</span>
                  <span style={s.dividerLine} />
                </div>

                <textarea
                  ref={messageRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What's on your mind? Bug reports, feature ideas, and kind words all welcome."
                  style={s.textarea}
                  rows={5}
                  required
                />

                <label style={s.label}>
                  Your email (optional) — if you'd like a reply
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={s.input}
                  placeholder="you@example.com"
                />

                {errorMsg && <p style={s.errorMsg}>{errorMsg}</p>}

                <button
                  type="submit"
                  disabled={status === "submitting" || !message.trim()}
                  style={{
                    ...s.submitBtn,
                    ...(status === "submitting" || !message.trim()
                      ? s.submitDisabled
                      : {}),
                  }}
                  className="dm-submit-btn"
                >
                  {status === "submitting" ? "Sending..." : "Send"}
                </button>
              </form>
            )}
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
    paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
    paddingTop: 12,
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

  // ── Modal ──
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
    width: "min(480px, 100%)",
    padding: "36px 32px 28px",
    border: "1px solid rgba(151,130,98,0.55)",
    background:
      "linear-gradient(160deg, rgba(28,22,14,0.99) 0%, rgba(18,14,9,1) 100%)",
    boxShadow:
      "0 0 0 1px rgba(151,130,98,0.08) inset, 0 24px 64px rgba(0,0,0,0.85)",
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
  },

  form: {
    display: "flex",
    flexDirection: "column",
  },

  heading: {
    fontFamily: "var(--tw-font-heading)",
    fontSize: "clamp(1.6rem, 4vw, 1.95rem)",
    color: "#F5ECCD",
    margin: "0 0 14px",
    letterSpacing: "0.02em",
    lineHeight: 1.1,
    textAlign: "center",
  },

  dividerRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 22,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    background:
      "linear-gradient(to right, transparent, rgba(151,130,98,0.3), transparent)",
  },

  dividerGem: {
    fontSize: "0.5rem",
    color: "rgba(151,130,98,0.45)",
    lineHeight: 1,
  },

  textarea: {
    width: "100%",
    padding: "12px 14px",
    background: "#0D1013",
    border: "1px solid rgba(106,121,132,0.55)",
    color: "#D5CDBE",
    fontFamily: "Lato, sans-serif",
    lineHeight: 1.6,
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
    minHeight: 110,
  },

  label: {
    display: "block",
    fontFamily: "Lato, sans-serif",
    fontWeight: 700,
    fontSize: "0.7rem",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "rgba(184,173,150,0.5)",
    marginTop: 16,
    marginBottom: 7,
  },

  input: {
    width: "100%",
    padding: "11px 14px",
    background: "#0D1013",
    border: "1px solid rgba(106,121,132,0.55)",
    color: "#D5CDBE",
    fontFamily: "Lato, sans-serif",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  },

  errorMsg: {
    fontFamily: "Lato, sans-serif",
    fontSize: "0.82rem",
    color: "#f5a0a0",
    margin: "10px 0 0",
  },

  submitBtn: {
    marginTop: 22,
    width: "100%",
    padding: "14px 20px",
    background: "#434135",
    border: "1px solid #978262",
    boxShadow:
      "inset 0 0 14px 2px rgba(155,127,63,0.55), 0 8px 28px rgba(0,0,0,0.5)",
    color: "#F5ECCD",
    fontFamily: "var(--tw-font-heading)",
    fontSize: "1.25rem",
    letterSpacing: "0.04em",
    cursor: "pointer",
    transition: "transform 0.15s ease, filter 0.15s ease",
  },

  submitDisabled: {
    opacity: 0.38,
    cursor: "not-allowed",
    boxShadow: "none",
  },

  successBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "36px 0 28px",
    gap: 18,
    animation: "dmSuccessIn 0.5s cubic-bezier(0.22,1,0.36,1) both",
  },

  successGem: {
    fontFamily: "var(--tw-font-heading)",
    fontSize: "2.2rem",
    color: "#978262",
    textShadow: "0 0 24px rgba(151,130,98,0.5)",
  },

  successText: {
    fontFamily: "var(--tw-font-message)",
    fontStyle: "italic",
    fontSize: "1.2rem",
    color: "#B79E81",
    textAlign: "center",
    margin: 0,
    letterSpacing: "0.02em",
  },
};
